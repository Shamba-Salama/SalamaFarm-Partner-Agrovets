"""Product serializers for the catalog API."""

from rest_framework import serializers

from stores.models import AgrovetStore

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "category",
            "description",
            "price",
            "stock",
            "expiry",
            "image_emoji",
            "image",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
        # store is never accepted from the client — set in the viewset


class PublicStoreSerializer(serializers.ModelSerializer):
    """Nested store card for the public marketplace — no vendor-private fields."""

    class Meta:
        model = AgrovetStore
        fields = ("id", "name", "town", "county", "attendant_phone")


class PublicProductSerializer(serializers.ModelSerializer):
    """Customer-facing product row for cross-store browse."""

    store = PublicStoreSerializer(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "category",
            "description",
            "price",
            "image_emoji",
            "image",
            "store",
        )
        read_only_fields = fields
