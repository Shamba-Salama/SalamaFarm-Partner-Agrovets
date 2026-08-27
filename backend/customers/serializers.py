"""Serializers for customer auth (email/password/Google + legacy OTP) and profile."""

from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from payments.utils import normalize_kenya_msisdn

from .models import CustomerAccount

FARM_TYPE_CHOICES = (
    ("crop", "Crop"),
    ("livestock", "Livestock"),
    ("mixed", "Mixed"),
    ("poultry", "Poultry"),
)


class PhoneField(serializers.CharField):
    """CharField that normalizes a Kenyan number to +254… or 400s."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        try:
            return normalize_kenya_msisdn(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc


class OptionalPhoneField(serializers.CharField):
    """Like PhoneField but blank/null is allowed."""

    def __init__(self, **kwargs):
        kwargs.setdefault("allow_blank", True)
        kwargs.setdefault("required", False)
        kwargs.setdefault("allow_null", True)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if data is None or (isinstance(data, str) and not data.strip()):
            return None
        return PhoneField().to_internal_value(data)


class RequestOTPSerializer(serializers.Serializer):
    phone = PhoneField()


class VerifyOTPSerializer(serializers.Serializer):
    phone = PhoneField()
    code = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "Enter the 6-digit code."})


class CustomerRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)
    phone = OptionalPhoneField()
    location = serializers.CharField(max_length=160)
    farm_type = serializers.ChoiceField(choices=FARM_TYPE_CHOICES)
    farm_name = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if CustomerAccount.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate_phone(self, value: str | None) -> str | None:
        if value and CustomerAccount.objects.filter(phone=value).exists():
            raise serializers.ValidationError("An account with this phone already exists.")
        return value

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value


class CustomerLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()
    # Optional profile completion on first Google sign-in
    full_name = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")
    phone = OptionalPhoneField()
    location = serializers.CharField(max_length=160, required=False, allow_blank=True, default="")
    farm_type = serializers.ChoiceField(
        choices=FARM_TYPE_CHOICES,
        required=False,
        allow_blank=True,
        default="",
    )
    farm_name = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "Enter the 6-digit code."})
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value


class CustomerProfileSerializer(serializers.ModelSerializer):
    """GET/PATCH the authenticated customer's own profile."""

    class Meta:
        model = CustomerAccount
        fields = (
            "id",
            "email",
            "phone",
            "full_name",
            "farm_name",
            "farm_type",
            "location",
            "latitude",
            "longitude",
            "auth_provider",
            "is_org_account",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "email",
            "auth_provider",
            "is_org_account",
            "created_at",
            "updated_at",
        )

    def validate_phone(self, value):
        if value in (None, ""):
            return None
        try:
            normalized = normalize_kenya_msisdn(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        qs = CustomerAccount.objects.filter(phone=normalized)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An account with this phone already exists.")
        return normalized
