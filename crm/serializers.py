"""CRM serializers — customers, orders, line items."""

from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from catalog.models import Product

from .models import Customer, CustomerOrder, OrderItem


class OrderItemReadSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "product_id", "name", "qty", "price")


class OrderItemWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0"))


class CustomerNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ("id", "name", "phone")


class OrderSummarySerializer(serializers.ModelSerializer):
    """Lightweight order row for customer detail (recent orders)."""

    product = serializers.SerializerMethodField()

    class Meta:
        model = CustomerOrder
        fields = (
            "id",
            "amount",
            "status",
            "pickup",
            "channel",
            "mpesa_code",
            "product",
            "paid_at",
            "created_at",
        )

    def get_product(self, obj: CustomerOrder) -> str:
        return _display_product(obj)


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ("id", "name", "phone", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_phone(self, value: str) -> str:
        phone = (value or "").strip()
        if not phone:
            raise serializers.ValidationError("Phone number is required.")

        # POST create uses update_or_create (upsert-by-phone). Enforce uniqueness
        # only on update so a PATCH cannot steal another customer's phone.
        if self.instance is None:
            return phone

        store = self.context.get("store") or getattr(self.instance, "store", None)
        if store is None:
            return phone

        clash = (
            Customer.objects.filter(store=store, phone=phone)
            .exclude(pk=self.instance.pk)
            .exists()
        )
        if clash:
            raise serializers.ValidationError(
                "A customer with this phone already exists"
            )
        return phone


class CustomerDetailSerializer(CustomerSerializer):
    recent_orders = serializers.SerializerMethodField()

    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + ("recent_orders",)

    def get_recent_orders(self, obj: Customer):
        orders = (
            obj.orders.all()
            .prefetch_related("items__product")
            .order_by("-created_at")[:5]
        )
        return OrderSummarySerializer(orders, many=True).data


class CustomerUpsertSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=20)


class CustomerOrderSerializer(serializers.ModelSerializer):
    """UI-compatible order representation with nested customer + items."""

    customer = CustomerNestedSerializer(read_only=True)
    items = OrderItemReadSerializer(many=True, read_only=True)
    phone = serializers.CharField(source="customer.phone", read_only=True)
    product = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()

    class Meta:
        model = CustomerOrder
        fields = (
            "id",
            "customer",
            "phone",
            "product",
            "items",
            "date",
            "time",
            "status",
            "mpesa_code",
            "channel",
            "order_type",
            "pickup",
            "amount",
            "paid_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_product(self, obj: CustomerOrder) -> str:
        return _display_product(obj)

    def get_date(self, obj: CustomerOrder) -> str:
        dt = obj.paid_at or obj.created_at
        local = timezone.localtime(dt)
        return local.date().isoformat()

    def get_time(self, obj: CustomerOrder) -> str:
        dt = obj.paid_at or obj.created_at
        local = timezone.localtime(dt)
        return local.strftime("%H:%M")


class CustomerOrderCreateSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField(required=False)
    customer = CustomerUpsertSerializer(required=False)
    items = OrderItemWriteSerializer(many=True, allow_empty=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.ChoiceField(
        choices=CustomerOrder.Status.choices,
        default=CustomerOrder.Status.PENDING,
        required=False,
    )
    mpesa_code = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    channel = serializers.ChoiceField(choices=CustomerOrder.Channel.choices)
    order_type = serializers.ChoiceField(choices=CustomerOrder.OrderType.choices)
    pickup = serializers.ChoiceField(choices=CustomerOrder.Pickup.choices)
    paid_at = serializers.DateTimeField(required=False, allow_null=True, default=None)

    def validate(self, attrs):
        if not attrs.get("customer_id") and not attrs.get("customer"):
            raise serializers.ValidationError(
                "Provide either customer_id or customer {name, phone}."
            )
        if attrs.get("customer_id") and attrs.get("customer"):
            raise serializers.ValidationError(
                "Provide customer_id or customer, not both."
            )

        items = attrs["items"]
        computed = sum((i["qty"] * i["price"] for i in items), Decimal("0"))
        if computed != attrs["amount"]:
            raise serializers.ValidationError(
                {
                    "amount": (
                        f"amount {attrs['amount']} does not match sum of "
                        f"items (qty × price) = {computed}."
                    )
                }
            )
        return attrs

    def validate_items(self, items):
        store = self.context["store"]
        product_ids = [i["product_id"] for i in items]
        products = {
            p.id: p
            for p in Product.objects.for_store(store).filter(id__in=product_ids)
        }
        missing = sorted(set(product_ids) - set(products))
        if missing:
            raise serializers.ValidationError(
                f"Unknown or out-of-store product_id(s): {missing}."
            )
        self.context["products_by_id"] = products
        return items

    @transaction.atomic
    def create(self, validated_data):
        store = self.context["store"]
        products_by_id = self.context["products_by_id"]
        items_data = validated_data.pop("items")
        customer_id = validated_data.pop("customer_id", None)
        customer_data = validated_data.pop("customer", None)

        if customer_id is not None:
            try:
                customer = Customer.objects.for_store(store).get(pk=customer_id)
            except Customer.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"customer_id": "Customer not found for this store."}
                ) from exc
        else:
            assert customer_data is not None
            customer, _ = Customer.objects.update_or_create(
                store=store,
                phone=customer_data["phone"].strip(),
                defaults={"name": customer_data["name"].strip()},
            )

        order = CustomerOrder.objects.create(
            store=store,
            customer=customer,
            **validated_data,
        )
        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    product=products_by_id[row["product_id"]],
                    qty=row["qty"],
                    price=row["price"],
                )
                for row in items_data
            ]
        )
        return order


class CustomerOrderPatchSerializer(serializers.ModelSerializer):
    """Items are immutable after creation — only workflow fields here."""

    class Meta:
        model = CustomerOrder
        fields = ("status", "pickup", "order_type", "channel")


# --------------------------------------------------------------------------- #
# Customer-app (marketplace) order creation
#
# Distinct from the vendor CustomerOrderCreateSerializer above:
#   - the buyer is a global customers.CustomerAccount (request.user), not a
#     store owner; there is no client-supplied customer {name, phone}.
#   - the store is *resolved from the products*, not from the authenticated
#     user, and an order may span only one store.
#   - the amount is computed server-side from live Product prices — the client
#     never sends (and cannot influence) the charged amount.
# --------------------------------------------------------------------------- #


class MarketplaceOrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)


class MarketplaceOrderReadSerializer(serializers.ModelSerializer):
    """Created/poll payload — id, amount, paid_at, mpesa_code, payment_status."""

    items = OrderItemReadSerializer(many=True, read_only=True)
    store_id = serializers.IntegerField(read_only=True)
    store_name = serializers.CharField(source="store.name", read_only=True)
    customer = CustomerNestedSerializer(read_only=True)
    payment_status = serializers.SerializerMethodField()
    payment_reference = serializers.SerializerMethodField()
    payment_result_desc = serializers.SerializerMethodField()

    class Meta:
        model = CustomerOrder
        fields = (
            "id",
            "store_id",
            "store_name",
            "customer",
            "amount",
            "status",
            "order_type",
            "pickup",
            "channel",
            "paid_at",
            "mpesa_code",
            "payment_status",
            "payment_reference",
            "payment_result_desc",
            "items",
            "created_at",
        )
        read_only_fields = fields

    def _latest_charge(self, obj):
        from payments.models import MpesaTransaction

        # Prefer reverse relation if already prefetched.
        cache = getattr(obj, "_prefetched_objects_cache", {})
        if "mpesa_transactions" in cache:
            txns = [
                t
                for t in obj.mpesa_transactions.all()
                if t.kind == MpesaTransaction.Kind.CHARGE
            ]
            txns.sort(key=lambda t: t.id, reverse=True)
            return txns[0] if txns else None

        return (
            MpesaTransaction.objects.filter(
                order=obj, kind=MpesaTransaction.Kind.CHARGE
            )
            .order_by("-id")
            .first()
        )

    def get_payment_status(self, obj) -> str:
        """Client poll key — never invent success without paid_at."""
        if obj.paid_at is not None:
            return "success"
        txn = self._latest_charge(obj)
        if txn is None:
            return "unpaid"
        if txn.status == txn.Status.FAILED:
            return "failed"
        if txn.status == txn.Status.ABANDONED:
            return "abandoned"
        if txn.status == txn.Status.PENDING:
            return "pending"
        if txn.status == txn.Status.SUCCESS:
            # Webhook may still be writing paid_at; treat as pending until paid_at.
            return "pending"
        return "unpaid"

    def get_payment_reference(self, obj):
        txn = self._latest_charge(obj)
        return txn.reference if txn else None

    def get_payment_result_desc(self, obj):
        txn = self._latest_charge(obj)
        return (txn.result_desc or "") if txn else ""


class MarketplaceOrderCreateSerializer(serializers.Serializer):
    items = MarketplaceOrderItemSerializer(many=True, allow_empty=False)
    order_type = serializers.ChoiceField(
        choices=CustomerOrder.OrderType.choices,
        default=CustomerOrder.OrderType.COUNTER_PICKUP,
        required=False,
    )

    def validate_items(self, items):
        """Resolve every product, enforce a single store, and stash the
        products + store for create(). Only active products from open stores
        are purchasable (mirrors the marketplace/products visibility rules)."""
        product_ids = [i["product_id"] for i in items]
        products = {
            p.id: p
            for p in Product.objects.filter(
                id__in=product_ids, active=True, store__open=True
            ).select_related("store")
        }
        missing = sorted(set(product_ids) - set(products))
        if missing:
            raise serializers.ValidationError(
                f"Unknown or unavailable product_id(s): {missing}."
            )

        store_ids = {p.store_id for p in products.values()}
        if len(store_ids) > 1:
            raise serializers.ValidationError(
                "All items must belong to a single store; got products from "
                f"{len(store_ids)} stores (ids {sorted(store_ids)})."
            )

        self.context["products_by_id"] = products
        self.context["store"] = next(iter(products.values())).store
        return items

    def _resolve_customer(self, store, account) -> Customer:
        """Match this store's crm.Customer for the account: by link first, then
        by phone (adopting an existing vendor-created row), else create fresh."""
        # 1. Already linked to this account in this store.
        customer = Customer.objects.filter(store=store, account=account).first()
        if customer is not None:
            return customer

        # 2. A phone-matched row exists (e.g. the vendor added this buyer
        #    manually before they ever used the app) — adopt it.
        customer = Customer.objects.filter(store=store, phone=account.phone).first()
        if customer is not None:
            if customer.account_id is None:
                customer.account = account
                customer.save(update_fields=["account", "updated_at"])
            return customer

        # 3. First contact with this store — seed from the global account.
        return Customer.objects.create(
            store=store,
            account=account,
            phone=account.phone,
            name=(account.full_name or "").strip() or "Customer",
        )

    @transaction.atomic
    def create(self, validated_data):
        account = self.context["account"]
        store = self.context["store"]
        products_by_id = self.context["products_by_id"]
        items_data = validated_data["items"]

        customer = self._resolve_customer(store, account)

        # Server-authoritative amount: live Product.price × qty, summed.
        amount = sum(
            (
                products_by_id[row["product_id"]].price * row["qty"]
                for row in items_data
            ),
            Decimal("0"),
        )

        order = CustomerOrder.objects.create(
            store=store,
            customer=customer,
            channel=CustomerOrder.Channel.IN_APP,
            order_type=validated_data["order_type"],
            pickup=CustomerOrder.Pickup.AWAITING_PICKUP,
            status=CustomerOrder.Status.PENDING,
            amount=amount,
            paid_at=None,
        )
        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    product=products_by_id[row["product_id"]],
                    qty=row["qty"],
                    price=products_by_id[row["product_id"]].price,
                )
                for row in items_data
            ]
        )
        return order


def _display_product(order: CustomerOrder) -> str:
    items = list(order.items.all())
    if not items:
        return ""
    first_name = items[0].product.name
    if len(items) == 1:
        return first_name
    return f"{first_name} + {len(items) - 1} more"
