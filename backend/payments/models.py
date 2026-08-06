"""Payment models — Paystack Kenya (split payments to agrovet subaccounts)."""

from django.db import models

from core.models import BaseStoreOwnedModel


class MpesaTransaction(BaseStoreOwnedModel):
    """
    Paystack-backed payment attempt for a store (optionally linked to an order).

    Named historically for M-Pesa receipts; charges go through Paystack Kenya.
    """

    class Kind(models.TextChoices):
        CHARGE = "charge", "Charge"
        TRANSFER = "transfer", "Transfer"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        ABANDONED = "abandoned", "Abandoned"

    order = models.ForeignKey(
        "crm.CustomerOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_transactions",
    )
    customer = models.ForeignKey(
        "crm.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_transactions",
    )
    reference = models.CharField(
        max_length=100,
        blank=True,
        unique=True,
        help_text="Paystack transaction reference",
    )
    subaccount_code = models.CharField(
        max_length=64,
        blank=True,
        help_text="Paystack subaccount code snapshotted at charge time",
    )
    phone = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mpesa_receipt = models.CharField(max_length=64, blank=True)
    kind = models.CharField(max_length=16, choices=Kind.choices)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )
    result_desc = models.TextField(blank=True)
    raw_webhook = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "payment transaction"
        verbose_name_plural = "payment transactions"

    def __str__(self) -> str:
        label = self.reference or self.mpesa_receipt or f"#{self.pk}"
        return f"{self.kind} {label} — {self.status}"
