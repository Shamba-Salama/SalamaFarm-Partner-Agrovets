"""CRM models — customers, orders, and line items."""

from django.db import models

from core.models import BaseStoreOwnedModel


class Customer(BaseStoreOwnedModel):
    """Farmer / buyer contact for a single agrovet store."""

    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    account = models.ForeignKey(
        "customers.CustomerAccount",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="crm_rows",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "customer"
        verbose_name_plural = "customers"
        constraints = [
            models.UniqueConstraint(
                fields=["store", "phone"],
                name="crm_customer_unique_store_phone",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.phone})"


class CustomerOrder(BaseStoreOwnedModel):
    """Sale / follow-up record. Primary product comes from related OrderItems."""

    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        CONTACTED = "Contacted", "Contacted"
        SATISFIED = "Satisfied", "Satisfied"

    class Channel(models.TextChoices):
        IN_APP = "in-app", "in-app"
        OFFLINE_SMS = "offline-sms", "offline-sms"

    class OrderType(models.TextChoices):
        COUNTER_PICKUP = "Counter Pickup", "Counter Pickup"
        DELIVERY = "Delivery", "Delivery"

    class Pickup(models.TextChoices):
        COLLECTED = "Collected", "Collected"
        AWAITING_PICKUP = "Awaiting Pickup", "Awaiting Pickup"
        UNMATCHED = "Unmatched", "Unmatched"

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    mpesa_code = models.CharField(max_length=20, blank=True)
    channel = models.CharField(max_length=20, choices=Channel.choices)
    order_type = models.CharField(max_length=32, choices=OrderType.choices)
    pickup = models.CharField(max_length=32, choices=Pickup.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "customer order"
        verbose_name_plural = "customer orders"

    def __str__(self) -> str:
        code = self.mpesa_code or f"#{self.pk}"
        return f"{code} — {self.customer}"


class OrderItem(models.Model):
    """Line item with price/qty snapshot at sale time (scoped via order.store)."""

    order = models.ForeignKey(
        CustomerOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    qty = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "order item"
        verbose_name_plural = "order items"

    def __str__(self) -> str:
        return f"{self.qty}× {self.product} @ {self.price}"
