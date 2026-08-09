"""Customer phone-auth + profile API views (/api/v1/customer-auth/)."""

from __future__ import annotations

import logging
import secrets

from django.contrib.auth.hashers import check_password
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .authentication import CustomerJWTAuthentication
from .models import CustomerAccount, OTPVerification
from .permissions import IsAuthenticatedCustomer
from .serializers import (
    CustomerProfileSerializer,
    RequestOTPSerializer,
    VerifyOTPSerializer,
)
from .sms import deliver_otp
from .throttles import OTPRequestThrottle, OTPVerifyThrottle
from .tokens import (
    ACCOUNT_TYPE_CLAIM,
    CUSTOMER_ACCOUNT_TYPE,
    CUSTOMER_ID_CLAIM,
    issue_customer_tokens,
)

logger = logging.getLogger(__name__)


def _generate_code() -> str:
    """Cryptographically-random 6-digit code (000000–999999)."""
    return f"{secrets.randbelow(1_000_000):06d}"


class RequestOTPView(APIView):
    """POST /customer-auth/request-otp/ — issue + send an OTP for a phone.

    Public. Superseding prior unused OTPs here is also the lockout-recovery
    path: a locked-out phone just requests a new code and gets a fresh row.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []
    throttle_classes = [OTPRequestThrottle]

    def post(self, request, *args, **kwargs):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]

        code = _generate_code()
        OTPVerification.issue(phone, code)
        sent = deliver_otp(phone, code)

        return Response(
            {
                "detail": "OTP sent." if sent else "OTP generated (dev mode — check server logs).",
                "phone": phone,
                "expires_in": _ttl(),
            },
            status=status.HTTP_200_OK,
        )


def _ttl() -> int:
    from django.conf import settings

    return int(getattr(settings, "OTP_TTL_SECONDS", 300))


class VerifyOTPView(APIView):
    """POST /customer-auth/verify-otp/ — verify a code, upsert account, issue JWTs.

    Public. Returns {access, refresh, customer, is_new}. On success the account
    is created if this phone is logging in for the first time.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []
    throttle_classes = [OTPVerifyThrottle]

    def post(self, request, *args, **kwargs):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"]
        code = serializer.validated_data["code"]

        otp = (
            OTPVerification.objects.filter(phone_number=phone, is_used=False)
            .order_by("-created_at")
            .first()
        )
        if otp is None:
            return Response(
                {"detail": "No active code. Request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.is_expired:
            return Response(
                {"detail": "Code expired. Request a new one.", "code": "expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.is_locked:
            return Response(
                {
                    "detail": "Too many attempts. Request a new code.",
                    "code": "locked",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not check_password(code, otp.otp_code_hash):
            # Count the failed attempt atomically; lock when the ceiling is hit.
            otp.attempts_count += 1
            otp.save(update_fields=["attempts_count"])
            remaining = otp.attempts_remaining
            if remaining <= 0:
                return Response(
                    {
                        "detail": "Too many attempts. Request a new code.",
                        "code": "locked",
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response(
                {
                    "detail": "Incorrect code.",
                    "code": "incorrect",
                    "attempts_remaining": remaining,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Correct code — burn it, then upsert the account and mint tokens.
        with transaction.atomic():
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            account, is_new = CustomerAccount.objects.get_or_create(phone=phone)

        tokens = issue_customer_tokens(account)
        return Response(
            {
                **tokens,
                "is_new": is_new,
                "customer": CustomerProfileSerializer(account).data,
            },
            status=status.HTTP_200_OK,
        )


class CustomerMeView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /customer-auth/me/ — the authenticated customer's profile."""

    serializer_class = CustomerProfileSerializer
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticatedCustomer]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self) -> CustomerAccount:
        return self.request.user


class CustomerTokenRefreshView(APIView):
    """POST /customer-auth/token/refresh/ — refresh a customer access token.

    Custom (not SimpleJWT's TokenRefreshView) because the stock serializer looks
    the token's user up via AUTH_USER_MODEL (VendorUser); a customer refresh
    token has no user_id and must never touch that table. We only re-validate
    the refresh token and require the customer marker claim.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []

    def post(self, request, *args, **kwargs):
        raw = request.data.get("refresh")
        if not raw:
            return Response(
                {"detail": "refresh is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            from .tokens import CustomerRefreshToken

            refresh = CustomerRefreshToken(raw)  # validates signature + expiry
        except TokenError as exc:
            raise InvalidToken(str(exc)) from exc

        if refresh.get(ACCOUNT_TYPE_CLAIM) != CUSTOMER_ACCOUNT_TYPE or CUSTOMER_ID_CLAIM not in refresh:
            raise InvalidToken("Not a customer refresh token.")

        access = refresh.access_token  # copies account_type + customer_id claims
        return Response({"access": str(access)}, status=status.HTTP_200_OK)
