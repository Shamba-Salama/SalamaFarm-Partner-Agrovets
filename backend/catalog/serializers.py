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
        extra_kwargs = {
            "image": {"required": False, "allow_null": True},
            "image_emoji": {"required": False, "allow_blank": True},
        }

    def validate_image(self, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        if not isinstance(value, str):
            raise serializers.ValidationError("Image must be a URL string.")
        url = value.strip()
        if not url.startswith(("http://", "https://")):
            raise serializers.ValidationError("Image URL must start with http:// or https://.")
        return url


class PublicStoreSerializer(serializers.ModelSerializer):
    """Nested store card for the public marketplace — no vendor-private fields."""

    class Meta:
        model = AgrovetStore
        fields = (
            "id",
            "name",
            "town",
            "county",
            "attendant_phone",
            "latitude",
            "longitude",
        )


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
