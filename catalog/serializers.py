"""Product serializers for the catalog API."""

from rest_framework import serializers

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
