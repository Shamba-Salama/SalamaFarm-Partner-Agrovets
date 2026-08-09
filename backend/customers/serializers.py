"""Serializers for customer phone-auth and profile."""

from __future__ import annotations

from rest_framework import serializers

from payments.utils import normalize_kenya_msisdn

from .models import CustomerAccount


class PhoneField(serializers.CharField):
    """CharField that normalizes a Kenyan number to +254… or 400s."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        try:
            return normalize_kenya_msisdn(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc


class RequestOTPSerializer(serializers.Serializer):
    phone = PhoneField()


class VerifyOTPSerializer(serializers.Serializer):
    phone = PhoneField()
    code = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "Enter the 6-digit code."})


class CustomerProfileSerializer(serializers.ModelSerializer):
    """GET/PATCH the authenticated customer's own profile."""

    class Meta:
        model = CustomerAccount
        fields = (
            "id",
            "phone",
            "full_name",
            "farm_name",
            "farm_type",
            "location",
            "latitude",
            "longitude",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "phone", "created_at", "updated_at")
