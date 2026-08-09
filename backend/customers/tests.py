"""Tests for the customers phone-auth flow and vendor/customer token separation."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import VendorUser

from .models import CustomerAccount, OTPVerification
from .tokens import issue_customer_tokens


class OTPAuthFlowTests(APITestCase):
    def setUp(self):
        # Throttles are keyed in a shared local-memory cache; isolate each test.
        cache.clear()
        self.request_url = reverse("customer-request-otp")
        self.verify_url = reverse("customer-verify-otp")
        self.me_url = reverse("customer-me")

    # -- request-otp --------------------------------------------------------

    def test_request_otp_stores_hashed_code_not_plaintext(self):
        resp = self.client.post(self.request_url, {"phone": "0712345678"}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["phone"], "+254712345678")
        otp = OTPVerification.objects.get(phone_number="+254712345678")
        self.assertNotIn("123456", otp.otp_code_hash)  # hashed, not the code
        self.assertNotEqual(otp.otp_code_hash, "")
        self.assertFalse(otp.is_used)
        self.assertGreater(otp.expires_at, timezone.now())

    def test_request_otp_invalid_phone_400_and_no_row(self):
        resp = self.client.post(self.request_url, {"phone": "not-a-phone"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(OTPVerification.objects.count(), 0)

    def test_resend_supersedes_previous_code(self):
        phone = "0712000001"
        with patch("customers.views._generate_code", side_effect=["111111", "222222"]):
            self.client.post(self.request_url, {"phone": phone}, format="json")
            self.client.post(self.request_url, {"phone": phone}, format="json")
        norm = "+254712000001"
        # Old code no longer verifies (its row was marked used on resend).
        old = self.client.post(self.verify_url, {"phone": phone, "code": "111111"}, format="json")
        self.assertEqual(old.status_code, 400, old.data)
        # New code works.
        new = self.client.post(self.verify_url, {"phone": phone, "code": "222222"}, format="json")
        self.assertEqual(new.status_code, 200, new.data)
        self.assertEqual(OTPVerification.objects.filter(phone_number=norm, is_used=True).count(), 2)

    # -- verify-otp: happy path --------------------------------------------

    def test_verify_success_creates_account_and_returns_tokens(self):
        phone = "0712000002"
        with patch("customers.views._generate_code", return_value="123456"):
            self.client.post(self.request_url, {"phone": phone}, format="json")
        resp = self.client.post(self.verify_url, {"phone": phone, "code": "123456"}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertTrue(resp.data["is_new"])
        self.assertEqual(resp.data["customer"]["phone"], "+254712000002")
        self.assertTrue(CustomerAccount.objects.filter(phone="+254712000002").exists())

    def test_verify_existing_account_is_new_false(self):
        phone = "0712000003"
        CustomerAccount.objects.create(phone="+254712000003", full_name="Existing")
        OTPVerification.issue("+254712000003", "654321")
        resp = self.client.post(self.verify_url, {"phone": phone, "code": "654321"}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertFalse(resp.data["is_new"])
        self.assertEqual(CustomerAccount.objects.filter(phone="+254712000003").count(), 1)

    # -- verify-otp: failure / lockout / recovery --------------------------

    def test_wrong_code_increments_attempts(self):
        phone = "0712000004"
        OTPVerification.issue("+254712000004", "111111")
        resp = self.client.post(self.verify_url, {"phone": phone, "code": "000000"}, format="json")
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(resp.data["code"], "incorrect")
        self.assertEqual(resp.data["attempts_remaining"], 4)
        otp = OTPVerification.objects.get(phone_number="+254712000004")
        self.assertEqual(otp.attempts_count, 1)

    def test_expired_code_rejected(self):
        phone = "0712000005"
        otp = OTPVerification.issue("+254712000005", "111111")
        otp.expires_at = timezone.now() - timedelta(seconds=1)
        otp.save(update_fields=["expires_at"])
        resp = self.client.post(self.verify_url, {"phone": phone, "code": "111111"}, format="json")
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(resp.data["code"], "expired")

    def test_lockout_after_max_attempts(self):
        phone = "0712000006"
        OTPVerification.issue("+254712000006", "111111")
        last = None
        for _ in range(5):  # OTP_MAX_ATTEMPTS
            last = self.client.post(self.verify_url, {"phone": phone, "code": "000000"}, format="json")
        self.assertEqual(last.status_code, 429, last.data)
        self.assertEqual(last.data["code"], "locked")
        # Even the correct code is now refused — the code is dead.
        good = self.client.post(self.verify_url, {"phone": phone, "code": "111111"}, format="json")
        self.assertEqual(good.status_code, 429, good.data)
        self.assertEqual(good.data["code"], "locked")

    def test_locked_out_user_recovers_by_requesting_new_code(self):
        """A genuinely locked-out phone must have a real way back in."""
        phone = "0712000007"
        OTPVerification.issue("+254712000007", "111111")
        for _ in range(5):
            self.client.post(self.verify_url, {"phone": phone, "code": "000000"}, format="json")
        # Recovery: request a fresh OTP (new row, attempts reset to 0).
        with patch("customers.views._generate_code", return_value="222222"):
            r = self.client.post(self.request_url, {"phone": phone}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        ok = self.client.post(self.verify_url, {"phone": phone, "code": "222222"}, format="json")
        self.assertEqual(ok.status_code, 200, ok.data)
        self.assertIn("access", ok.data)

    # -- me/ ---------------------------------------------------------------

    def _login(self, phone="0712000010", code="123456"):
        with patch("customers.views._generate_code", return_value=code):
            self.client.post(self.request_url, {"phone": phone}, format="json")
        resp = self.client.post(self.verify_url, {"phone": phone, "code": code}, format="json")
        return resp.data["access"], resp.data["refresh"]

    def test_me_requires_authentication(self):
        resp = self.client.get(self.me_url)
        self.assertIn(resp.status_code, (401, 403), resp.data)

    def test_me_returns_and_updates_profile(self):
        access, _ = self._login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        got = self.client.get(self.me_url)
        self.assertEqual(got.status_code, 200, got.data)
        self.assertEqual(got.data["phone"], "+254712000010")

        patched = self.client.patch(
            self.me_url,
            {"full_name": "Jane Farmer", "farm_name": "Green Acres", "farm_type": "dairy",
             "location": "Nakuru", "latitude": -0.3, "longitude": 36.07, "phone": "+254799999999"},
            format="json",
        )
        self.assertEqual(patched.status_code, 200, patched.data)
        self.assertEqual(patched.data["full_name"], "Jane Farmer")
        self.assertEqual(patched.data["latitude"], -0.3)
        # phone is read-only — the attempt to change it is ignored.
        self.assertEqual(patched.data["phone"], "+254712000010")

    def test_token_refresh_returns_working_access(self):
        _, refresh = self._login(phone="0712000011")
        r = self.client.post(reverse("customer-token-refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        self.assertEqual(self.client.get(self.me_url).status_code, 200)


class AudienceSeparationTests(APITestCase):
    """The two directions of vendor/customer JWT isolation."""

    def setUp(self):
        cache.clear()
        self.vendor = VendorUser.objects.create_user(email="v@example.com", password="pass12345")
        self.customer = CustomerAccount.objects.create(phone="+254700000000", full_name="Cust")
        self.vendor_access = str(RefreshToken.for_user(self.vendor).access_token)
        self.customer_access = issue_customer_tokens(self.customer)["access"]
        self.customer_me = reverse("customer-me")
        self.vendor_me = reverse("auth-me")

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_vendor_token_rejected_by_customer_endpoint(self):
        self._auth(self.vendor_access)
        resp = self.client.get(self.customer_me)
        self.assertIn(resp.status_code, (401, 403), getattr(resp, "data", resp))

    def test_customer_token_rejected_by_vendor_endpoint(self):
        self._auth(self.customer_access)
        resp = self.client.get(self.vendor_me)
        self.assertIn(resp.status_code, (401, 403), getattr(resp, "data", resp))

    def test_customer_token_authorizes_customer_endpoint(self):
        self._auth(self.customer_access)
        resp = self.client.get(self.customer_me)
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["phone"], "+254700000000")

    def test_vendor_token_authorizes_vendor_endpoint(self):
        self._auth(self.vendor_access)
        resp = self.client.get(self.vendor_me)
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["email"], "v@example.com")

    def test_customer_refresh_token_not_usable_as_access(self):
        refresh = issue_customer_tokens(self.customer)["refresh"]
        self._auth(refresh)  # refresh token presented as a Bearer access token
        self.assertIn(self.client.get(self.customer_me).status_code, (401, 403))
