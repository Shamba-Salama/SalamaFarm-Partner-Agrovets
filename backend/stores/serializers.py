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
            "latitude",
            "longitude",
            "open",
            "onboarded",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )
