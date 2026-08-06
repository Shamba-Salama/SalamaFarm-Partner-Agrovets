"""Serializers for the current vendor's agrovet store."""

from rest_framework import serializers

from .models import AgrovetStore


class AgrovetStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgrovetStore
        fields = (
            "id",
            "name",
            "town",
            "county",
            "till",
            "attendant_phone",
            "paystack_subaccount_code",
            "open",
            "onboarded",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "paystack_subaccount_code",
            "created_at",
            "updated_at",
        )


class CreateSubaccountSerializer(serializers.Serializer):
    """
    Optional overrides for Paystack Create Subaccount.

    Defaults (when omitted):
    - settlement_bank: settings.PAYSTACK_DEFAULT_SETTLEMENT_BANK (MPESA)
    - account_number: store.till
    - percentage_charge: settings.PAYSTACK_DEFAULT_PERCENTAGE_CHARGE
    """

    settlement_bank = serializers.CharField(required=False, allow_blank=False, max_length=32)
    account_number = serializers.CharField(required=False, allow_blank=False, max_length=64)
    percentage_charge = serializers.FloatField(required=False, min_value=0.0, max_value=100.0)
