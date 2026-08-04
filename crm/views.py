"""Store-scoped CRM API — customers, orders, weekly sales analytics."""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal

from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product
from core.tenancy import get_vendor_store

from .models import Customer, CustomerOrder, OrderItem
from .serializers import (
    CustomerDetailSerializer,
    CustomerOrderCreateSerializer,
    CustomerOrderPatchSerializer,
    CustomerOrderSerializer,
    CustomerSerializer,
)


class CustomerViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Customers for the authenticated vendor's store (upsert-by-phone on create)."""

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_store(self):
        return get_vendor_store(self.request.user)

    def get_queryset(self):
        return Customer.objects.for_store(self.get_store())

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CustomerDetailSerializer
        return CustomerSerializer

    def create(self, request, *args, **kwargs):
        store = self.get_store()
        serializer = CustomerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data["phone"].strip()
        name = serializer.validated_data["name"].strip()
        customer, created = Customer.objects.update_or_create(
            store=store,
            phone=phone,
            defaults={"name": name},
        )
        out = CustomerSerializer(customer, context={"request": request})
        return Response(
            out.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_update(self, serializer):
        serializer.save(store=self.get_store())


class CustomerOrderViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Orders scoped to the vendor store; items immutable after create."""

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_store(self):
        return get_vendor_store(self.request.user)

    def get_queryset(self):
        qs = (
            CustomerOrder.objects.for_store(self.get_store())
            .select_related("customer")
            .prefetch_related("items__product")
        )

        params = self.request.query_params
        if status_val := params.get("status"):
            qs = qs.filter(status=status_val)
        if pickup := params.get("pickup"):
            qs = qs.filter(pickup=pickup)
        if channel := params.get("channel"):
            qs = qs.filter(channel=channel)

        if created_after := _parse_day_bound(params.get("created_after"), end=False):
            qs = qs.filter(created_at__gte=created_after)
        if created_before := _parse_day_bound(params.get("created_before"), end=True):
            qs = qs.filter(created_at__lte=created_before)
        if paid_after := _parse_day_bound(params.get("paid_after"), end=False):
            qs = qs.filter(paid_at__gte=paid_after)
        if paid_before := _parse_day_bound(params.get("paid_before"), end=True):
            qs = qs.filter(paid_at__lte=paid_before)

        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return CustomerOrderCreateSerializer
        if self.action in ("partial_update", "update"):
            return CustomerOrderPatchSerializer
        return CustomerOrderSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["store"] = self.get_store()
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        order = (
            CustomerOrder.objects.select_related("customer")
            .prefetch_related("items__product")
            .get(pk=order.pk)
        )
        return Response(
            CustomerOrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        serializer = CustomerOrderPatchSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        order = (
            CustomerOrder.objects.select_related("customer")
            .prefetch_related("items__product")
            .get(pk=order.pk)
        )
        return Response(CustomerOrderSerializer(order, context={"request": request}).data)


class WeeklySalesView(APIView):
    """
    GET /analytics/weekly-sales/

    Aggregate OrderItem totals by ISO week × product category for the
    current vendor's store (replaces frontend seed weeklySales).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        store = get_vendor_store(request.user)
        items = (
            OrderItem.objects.filter(order__store=store)
            .select_related("order", "product")
            .only(
                "qty",
                "price",
                "product__category",
                "order__paid_at",
                "order__created_at",
            )
        )

        buckets: dict[tuple[int, int], dict[str, Decimal]] = defaultdict(
            lambda: {c.value: Decimal("0.00") for c in Product.Category}
        )

        for item in items:
            dt = item.order.paid_at or item.order.created_at
            iso = dt.isocalendar()
            year, week = int(iso.year), int(iso.week)
            buckets[(year, week)][item.product.category] += item.price * item.qty

        rows = []
        for (year, week), cats in sorted(buckets.items()):
            row = {
                "week": f"Wk {week}",
                "year": year,
                "iso_week": week,
            }
            for cat, total in cats.items():
                row[cat] = str(total.quantize(Decimal("0.01")))
            rows.append(row)

        return Response(rows)


def _parse_day_bound(raw: str | None, *, end: bool):
    """Parse an ISO date or datetime query param into a timezone-aware bound."""
    if not raw:
        return None
    dt = parse_datetime(raw)
    if dt is not None:
        if timezone_is_naive(dt):
            from django.utils import timezone as dj_tz

            return dj_tz.make_aware(dt, dj_tz.get_current_timezone())
        return dt
    day = parse_date(raw)
    if day is None:
        return None
    from datetime import datetime, time

    from django.utils import timezone as dj_tz

    clock = time.max if end else time.min
    return dj_tz.make_aware(datetime.combine(day, clock), dj_tz.get_current_timezone())


def timezone_is_naive(dt) -> bool:
    return dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None
