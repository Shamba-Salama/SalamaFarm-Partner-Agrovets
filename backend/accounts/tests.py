"""Vendor login throttle and password reset."""

from __future__ import annotations

from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import VendorUser
from .throttles import VendorLoginThrottle
from .views import EmailTokenObtainPairView


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    PORTAL_ORIGIN="http://localhost:8080",
)
class VendorPasswordResetTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = VendorUser.objects.create_user(
            email="vendor@example.com",
            password="old-password-1",
        )

    def test_login_view_is_rate_limited(self):
        self.assertIn(VendorLoginThrottle, EmailTokenObtainPairView.throttle_classes)
        with patch.object(VendorLoginThrottle, "get_rate", return_value="2/hour"):
            cache.clear()
            for _ in range(2):
                response = self.client.post(
                    "/api/v1/auth/token/",
                    {"email": "vendor@example.com", "password": "wrong-password"},
                    format="json",
                )
                self.assertEqual(response.status_code, 401, response.data)
            blocked = self.client.post(
                "/api/v1/auth/token/",
                {"email": "vendor@example.com", "password": "wrong-password"},
                format="json",
            )
            self.assertEqual(blocked.status_code, 429, blocked.data)

    def test_forgot_password_hides_unknown_emails(self):
        response = self.client.post(
            "/api/v1/auth/forgot-password/",
            {"email": "missing@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(mail.outbox), 0)

    def test_reset_link_sets_a_new_password(self):
        response = self.client.post(
            "/api/v1/auth/forgot-password/",
            {"email": "vendor@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertNotIn("old-password-1", mail.outbox[0].body)

        link = next(line for line in mail.outbox[0].body.splitlines() if line.startswith("http"))
        query = parse_qs(urlparse(link).query)
        uid = query["uid"][0]
        token = query["token"][0]

        check = self.client.post(
            "/api/v1/auth/recover-session/",
            {"uid": uid, "token": token},
            format="json",
        )
        self.assertEqual(check.status_code, 200, check.data)

        reset = self.client.post(
            "/api/v1/auth/reset-password/",
            {"uid": uid, "token": token, "password": "new-password-9"},
            format="json",
        )
        self.assertEqual(reset.status_code, 200, reset.data)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-password-9"))

        reused = self.client.post(
            "/api/v1/auth/recover-session/",
            {"uid": uid, "token": token},
            format="json",
        )
        self.assertEqual(reused.status_code, 400, reused.data)

        login = self.client.post(
            "/api/v1/auth/token/",
            {"email": "vendor@example.com", "password": "new-password-9"},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.assertIn("access", login.data)
