"""Customer auth + profile API views (/api/v1/customer-auth/)."""

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
from .google_auth import GoogleTokenError, verify_google_id_token
from .models import CustomerAccount, OTPVerification, PasswordResetToken
from .permissions import IsAuthenticatedCustomer
from .serializers import (
    CustomerLoginSerializer,
    CustomerProfileSerializer,
    CustomerRegisterSerializer,
    GoogleAuthSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RequestOTPSerializer,
    VerifyOTPSerializer,
)
from .sms import deliver_otp
from .throttles import (
    CustomerGoogleThrottle,
    CustomerLoginThrottle,
    CustomerRegisterThrottle,
    OTPRequestThrottle,
    OTPVerifyThrottle,
    PasswordResetThrottle,
)
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


def _ttl() -> int:
    from django.conf import settings

    return int(getattr(settings, "OTP_TTL_SECONDS", 300))


def _password_reset_ttl() -> int:
    from django.conf import settings

    return int(getattr(settings, "PASSWORD_RESET_TTL_SECONDS", 900))


def _auth_response(account: CustomerAccount, *, is_new: bool) -> Response:
    tokens = issue_customer_tokens(account)
    return Response(
        {
            **tokens,
            "is_new": is_new,
            "customer": CustomerProfileSerializer(account).data,
        },
        status=status.HTTP_200_OK,
    )


def _deliver_reset_code(email: str, code: str) -> bool:
    """Log reset codes in DEV; wire real email later when SMTP is configured."""
    from django.conf import settings

    logger.warning(
        "Password reset code for %s: %s (ttl=%ss). Configure email delivery for production.",
        email,
        code,
        _password_reset_ttl(),
    )
    # Always treat as delivered in API response; never echo the code to clients.
    return bool(getattr(settings, "PASSWORD_RESET_DEV_MODE", True) or True)


# ---------------------------------------------------------------------------
# Email / password / Google
# ---------------------------------------------------------------------------


class CustomerRegisterView(APIView):
    """POST /customer-auth/register/ — create email account + issue JWTs."""

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []
    throttle_classes = [CustomerRegisterThrottle]

    def post(self, request, *args, **kwargs):
        serializer = CustomerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        account = CustomerAccount(
            email=data["email"],
            full_name=data["full_name"].strip(),
            phone=data.get("phone"),
            location=data["location"].strip(),
            farm_type=data["farm_type"],
            farm_name=(data.get("farm_name") or "").strip(),
            auth_provider=CustomerAccount.AuthProvider.EMAIL,
        )
        account.set_password(data["password"])
        account.save()
        return _auth_response(account, is_new=True)


class CustomerLoginView(APIView):
    """POST /customer-auth/login/ — email + password → JWTs."""

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []
    throttle_classes = [CustomerLoginThrottle]

    def post(self, request, *args, **kwargs):
        serializer = CustomerLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        try:
            account = CustomerAccount.objects.get(email__iexact=email)
        except CustomerAccount.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password.", "code": "invalid_credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not account.check_password(password):
            return Response(
                {"detail": "Invalid email or password.", "code": "invalid_credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return _auth_response(account, is_new=False)


class CustomerGoogleAuthView(APIView):
    """POST /customer-auth/google/ — verify Google ID token → upsert → JWTs."""

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []
    throttle_classes = [CustomerGoogleThrottle]

    def post(self, request, *args, **kwargs):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            claims = verify_google_id_token(data["id_token"])
        except GoogleTokenError as exc:
            return Response(
                {"detail": str(exc), "code": "invalid_google_token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub = claims["sub"]
        email = claims["email"]
        name_from_google = claims.get("name") or ""

        with transaction.atomic():
            account = (
                CustomerAccount.objects.filter(google_sub=sub).first()
                or CustomerAccount.objects.filter(email__iexact=email).first()
            )
            is_new = account is None
            if is_new:
                phone = data.get("phone")
                if phone and CustomerAccount.objects.filter(phone=phone).exists():
                    return Response(
                        {
                            "detail": "An account with this phone already exists.",
                            "code": "phone_taken",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                account = CustomerAccount(
                    email=email,
                    google_sub=sub,
                    full_name=(data.get("full_name") or name_from_google).strip(),
                    phone=phone,
                    location=(data.get("location") or "").strip(),
                    farm_type=data.get("farm_type") or "",
                    farm_name=(data.get("farm_name") or "").strip(),
                    auth_provider=CustomerAccount.AuthProvider.GOOGLE,
                )
                account.save()
            else:
                update_fields: list[str] = []
                if not account.google_sub:
                    account.google_sub = sub
                    update_fields.append("google_sub")
                if not account.email:
                    account.email = email
                    update_fields.append("email")
                if account.auth_provider == CustomerAccount.AuthProvider.PHONE_LEGACY:
                    account.auth_provider = CustomerAccount.AuthProvider.GOOGLE
                    update_fields.append("auth_provider")
                if not account.full_name and (data.get("full_name") or name_from_google):
                    account.full_name = (data.get("full_name") or name_from_google).strip()
                    update_fields.append("full_name")
                if update_fields:
                    account.save(update_fields=update_fields)

        return _auth_response(account, is_new=is_new)


class PasswordResetRequestView(APIView):
    """POST /customer-auth/password-reset/request/ — issue a 6-digit reset code."""

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []
    throttle_classes = [PasswordResetThrottle]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # Always return the same shape (no account enumeration).
        account = CustomerAccount.objects.filter(email__iexact=email).first()
        if account is not None and account.has_usable_password():
            code = _generate_code()
            PasswordResetToken.issue(email, code)
            _deliver_reset_code(email, code)

        return Response(
            {
                "detail": "If an account exists for that email, a reset code was sent.",
                "expires_in": _password_reset_ttl(),
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """POST /customer-auth/password-reset/confirm/ — set a new password with code."""

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []
    throttle_classes = [PasswordResetThrottle]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        password = serializer.validated_data["password"]

        token = (
            PasswordResetToken.objects.filter(email=email, is_used=False)
            .order_by("-created_at")
            .first()
        )
        if token is None:
            return Response(
                {"detail": "No active reset code. Request a new one.", "code": "missing"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if token.is_expired:
            return Response(
                {"detail": "Code expired. Request a new one.", "code": "expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if token.is_locked:
            return Response(
                {"detail": "Too many attempts. Request a new code.", "code": "locked"},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        if not check_password(code, token.code_hash):
            token.attempts_count += 1
            token.save(update_fields=["attempts_count"])
            remaining = token.attempts_remaining
            if remaining <= 0:
                return Response(
                    {"detail": "Too many attempts. Request a new code.", "code": "locked"},
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

        try:
            account = CustomerAccount.objects.get(email__iexact=email)
        except CustomerAccount.DoesNotExist:
            return Response(
                {"detail": "Account not found.", "code": "missing"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            token.is_used = True
            token.save(update_fields=["is_used"])
            account.set_password(password)
            if account.auth_provider == CustomerAccount.AuthProvider.PHONE_LEGACY:
                account.auth_provider = CustomerAccount.AuthProvider.EMAIL
                account.save(update_fields=["password", "auth_provider", "updated_at"])
            else:
                account.save(update_fields=["password", "updated_at"])

        return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Legacy phone OTP
# ---------------------------------------------------------------------------


class RequestOTPView(APIView):
    """POST /customer-auth/request-otp/ — issue + send an OTP for a phone."""

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


class VerifyOTPView(APIView):
    """POST /customer-auth/verify-otp/ — verify a code, upsert account, issue JWTs."""

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

        with transaction.atomic():
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            account, is_new = CustomerAccount.objects.get_or_create(
                phone=phone,
                defaults={"auth_provider": CustomerAccount.AuthProvider.PHONE_LEGACY},
            )

        return _auth_response(account, is_new=is_new)


class CustomerMeView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /customer-auth/me/ — the authenticated customer's profile."""

    serializer_class = CustomerProfileSerializer
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticatedCustomer]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self) -> CustomerAccount:
        return self.request.user


class CustomerTokenRefreshView(APIView):
    """POST /customer-auth/token/refresh/ — refresh a customer access token."""

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

            refresh = CustomerRefreshToken(raw)
        except TokenError as exc:
            raise InvalidToken(str(exc)) from exc

        if refresh.get(ACCOUNT_TYPE_CLAIM) != CUSTOMER_ACCOUNT_TYPE or CUSTOMER_ID_CLAIM not in refresh:
            raise InvalidToken("Not a customer refresh token.")

        access = refresh.access_token
        return Response({"access": str(access)}, status=status.HTTP_200_OK)
