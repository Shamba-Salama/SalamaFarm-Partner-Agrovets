"""Serializers for marketplace store-visit create / arrive."""

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from catalog.models import Product
from stores.models import AgrovetStore

from .models import StoreVisit


class StoreVisitSerializer(serializers.ModelSerializer):
    store_latitude = serializers.FloatField(source="store.latitude", read_only=True)
    store_longitude = serializers.FloatField(source="store.longitude", read_only=True)
    store_name = serializers.CharField(source="store.name", read_only=True)

    class Meta:
        model = StoreVisit
        fields = (
            "id",
            "store",
            "store_name",
            "store_latitude",
            "store_longitude",
            "product",
            "status",
            "started_at",
            "arrived_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class StoreVisitStartSerializer(serializers.Serializer):
    store_id = serializers.IntegerField()
    product_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_store_id(self, value: int) -> int:
        if not AgrovetStore.objects.filter(pk=value, open=True).exists():
            raise serializers.ValidationError("Store not found or not available.")
        return value

    def validate(self, attrs):
        product_id = attrs.get("product_id")
        if product_id is None:
            return attrs
        store_id = attrs["store_id"]
        product = Product.objects.filter(pk=product_id, active=True).first()
        if product is None:
            raise serializers.ValidationError({"product_id": "Product not found."})
        if product.store_id != store_id:
            raise serializers.ValidationError(
                {"product_id": "Product does not belong to this store."}
            )
        attrs["product"] = product
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        account = self.context["account"]
        store = AgrovetStore.objects.get(pk=validated_data["store_id"])
        product = validated_data.get("product")

        existing = (
            StoreVisit.objects.select_for_update()
            .filter(
                account=account,
                store=store,
                status=StoreVisit.Status.STARTED,
            )
            .first()
        )
        if existing is not None:
            # Reuse open visit; refresh optional product prompt if provided.
            if product is not None and existing.product_id != product.id:
                existing.product = product
                existing.save(update_fields=["product", "updated_at"])
            self.context["reused"] = True
            return existing

        now = timezone.now()
        self.context["reused"] = False
        return StoreVisit.objects.create(
            store=store,
            account=account,
            product=product,
            status=StoreVisit.Status.STARTED,
            started_at=now,
        )


class StoreVisitArriveSerializer(serializers.Serializer):
    """Optional client coords for future server-side distance checks."""

    lat = serializers.FloatField(required=False, allow_null=True)
    lng = serializers.FloatField(required=False, allow_null=True)

    @transaction.atomic
    def save(self, **kwargs):
        visit: StoreVisit = self.context["visit"]
        if visit.status == StoreVisit.Status.ARRIVED:
            return visit
        visit.status = StoreVisit.Status.ARRIVED
        visit.arrived_at = timezone.now()
        visit.save(update_fields=["status", "arrived_at", "updated_at"])
        return visit
