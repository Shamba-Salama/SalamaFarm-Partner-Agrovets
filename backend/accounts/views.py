"""Auth API views."""

import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import VendorUser
from .serializers import (
    ForgotPasswordSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    VendorMeSerializer,
)
from .throttles import VendorLoginThrottle, VendorPasswordResetThrottle

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    """POST /auth/register/ — create VendorUser + AgrovetStore."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            VendorMeSerializer(user, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveAPIView):
    """GET /auth/me/ — current vendor with nested store summary."""

    serializer_class = VendorMeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class EmailTokenObtainPairView(TokenObtainPairView):
    """POST /auth/token/ — JWT pair via email + password (USERNAME_FIELD)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [VendorLoginThrottle]


class EmailTokenRefreshView(TokenRefreshView):
    """POST /auth/token/refresh/."""

    permission_classes = [permissions.AllowAny]


def _vendor_from_uid(uid: str) -> VendorUser | None:
    try:
        pk = force_str(urlsafe_base64_decode(uid))
        return VendorUser.objects.get(pk=pk, is_active=True)
    except (VendorUser.DoesNotExist, ValueError, TypeError, OverflowError):
        return None


def _reset_link(user: VendorUser) -> str:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    origin = getattr(settings, "PORTAL_ORIGIN", "http://localhost:8080").rstrip("/")
    return f"{origin}/reset-password?uid={uid}&token={token}"


class ForgotPasswordView(APIView):
    """POST /auth/forgot-password/ — email a one-time reset link."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [VendorPasswordResetThrottle]

    def post(self, request, *args, **kwargs):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = VendorUser.objects.filter(email__iexact=email, is_active=True).first()
        if user is not None:
            link = _reset_link(user)
            try:
                send_mail(
                    subject="Reset your SalamaFarm password",
                    message=(
                        "Use this link to choose a new password for your agrovet account. "
                        "It expires after a short time and can only be used once.\n\n"
                        f"{link}\n\n"
                        "If you did not ask for this, you can ignore this email."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception("Vendor password reset email failed for %s", user.email)
                return Response(
                    {"detail": "Could not send the reset email. Try again shortly."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
        return Response(
            {"detail": "If an account exists for that email, a reset link was sent."},
            status=status.HTTP_200_OK,
        )


class RecoverSessionView(APIView):
    """POST /auth/recover-session/ — check a reset link before showing the form."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [VendorPasswordResetThrottle]

    def post(self, request, *args, **kwargs):
        uid = request.data.get("uid") if isinstance(request.data, dict) else None
        token = request.data.get("token") if isinstance(request.data, dict) else None
        if not uid or not token:
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = _vendor_from_uid(str(uid))
        if user is None or not default_token_generator.check_token(user, str(token)):
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"valid": True}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """POST /auth/reset-password/ — set a new password from a reset link."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [VendorPasswordResetThrottle]

    def post(self, request, *args, **kwargs):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]
        user = _vendor_from_uid(uid)
        if user is None or not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)
