"""Serializers for vendor auth and registration."""

import logging

from django.db import transaction
from rest_framework import serializers

from stores.models import AgrovetStore
from stores.paystack_subaccount import ensure_paystack_subaccount

from .models import VendorUser

logger = logging.getLogger(__name__)


class StoreSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = AgrovetStore
        fields = (
            "id",
            "name",
            "town",
            "county",
            "till",
            "attendant_phone",
            "open",
            "onboarded",
        )


class VendorMeSerializer(serializers.ModelSerializer):
    store = StoreSummarySerializer(read_only=True)

    class Meta:
        model = VendorUser
        fields = ("id", "email", "phone", "created_at", "store")
        read_only_fields = fields


class RegisterStoreSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")
    town = serializers.CharField(max_length=80, required=False, allow_blank=True, default="")
    county = serializers.CharField(max_length=80, required=False, allow_blank=True, default="")
    till = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    attendant_phone = serializers.CharField(
        max_length=20, required=False, allow_blank=True, default=""
    )


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    store = RegisterStoreSerializer(required=False)

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if VendorUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A vendor with this email already exists.")
        return email

    def create(self, validated_data: dict) -> VendorUser:
        store_data = validated_data.pop("store", None) or {}
        password = validated_data.pop("password")
        with transaction.atomic():
            user = VendorUser.objects.create_user(password=password, **validated_data)
            store = AgrovetStore.objects.create(
                owner=user,
                name=store_data.get("name", ""),
                town=store_data.get("town", ""),
                county=store_data.get("county", ""),
                till=store_data.get("till", ""),
                attendant_phone=store_data.get("attendant_phone", "") or user.phone,
                open=True,
                onboarded=False,
            )
        # Best-effort Paystack subaccount — never fail registration on Paystack errors.
        result = ensure_paystack_subaccount(store)
        if not result.ok:
            logger.warning(
                "Paystack subaccount not created during registration for "
                "store_id=%s email=%s: %s",
                store.pk,
                user.email,
                result.error,
            )
        return user

    def to_representation(self, instance: VendorUser) -> dict:
        return VendorMeSerializer(instance, context=self.context).data
