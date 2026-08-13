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
        if value is None or value == "":
            return None
        content_type = getattr(value, "content_type", "") or ""
        if content_type and content_type not in ("image/jpeg", "image/png", "image/jpg"):
            raise serializers.ValidationError("Only JPG or PNG images are allowed.")
        # ~5 MB cap for mobile marketplace photos
        if getattr(value, "size", 0) > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image must be 5 MB or smaller.")
        return value


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
