"""Apply final charge success/failure to MpesaTransaction + CustomerOrder.

Used by the Paystack webhook and by synchronous charge responses (Paystack
test mode often returns status=success immediately, with no webhook to localhost).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from crm.models import CustomerOrder

from .models import MpesaTransaction


def parse_paystack_time(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if timezone.is_aware(value) else timezone.make_aware(value, timezone.utc)
    if isinstance(value, str):
        dt = parse_datetime(value.replace("Z", "+00:00"))
        if dt is None:
            return None
        if timezone.is_naive(dt):
            return timezone.make_aware(dt, timezone.utc)
        return dt
    return None


def apply_charge_success(
    txn: MpesaTransaction,
    data: dict[str, Any],
    *,
    raw_payload: dict[str, Any] | None = None,
) -> None:
    """Mark txn success and set order.paid_at / mpesa_code (idempotent)."""
    reference = (txn.reference or data.get("reference") or "").strip()
    paid_at = parse_paystack_time(data.get("paid_at") or data.get("paidAt")) or timezone.now()
    receipt = (data.get("receipt_number") or "").strip()
    gateway = data.get("gateway_response") or data.get("message") or "success"

    with transaction.atomic():
        txn = MpesaTransaction.objects.select_for_update().get(pk=txn.pk)
        if txn.status != MpesaTransaction.Status.SUCCESS:
            txn.status = MpesaTransaction.Status.SUCCESS
            if receipt:
                txn.mpesa_receipt = receipt
            txn.result_desc = str(gateway)
            if raw_payload is not None:
                txn.raw_webhook = raw_payload
            txn.save(
                update_fields=[
                    "status",
                    "mpesa_receipt",
                    "result_desc",
                    "raw_webhook",
                    "updated_at",
                ]
            )

        order = None
        if txn.order_id:
            order = (
                CustomerOrder.objects.select_for_update()
                .filter(pk=txn.order_id)
                .first()
            )
        if order is None:
            return
        if order.paid_at is not None and order.mpesa_code:
            return

        order.paid_at = order.paid_at or paid_at
        update_fields = ["paid_at", "updated_at"]
        code = (receipt or reference or "").strip()
        if code and not order.mpesa_code:
            order.mpesa_code = code[:20]
            update_fields.append("mpesa_code")
        if order.pickup == CustomerOrder.Pickup.UNMATCHED:
            order.pickup = CustomerOrder.Pickup.AWAITING_PICKUP
            update_fields.append("pickup")
        order.save(update_fields=update_fields)


def apply_charge_failed(
    txn: MpesaTransaction,
    data: dict[str, Any],
    *,
    raw_payload: dict[str, Any] | None = None,
) -> None:
    """Mark txn failed unless already successful (idempotent)."""
    reason = (
        data.get("gateway_response")
        or data.get("message")
        or data.get("display_text")
        or "failed"
    )
    with transaction.atomic():
        txn = MpesaTransaction.objects.select_for_update().get(pk=txn.pk)
        if txn.status == MpesaTransaction.Status.SUCCESS:
            return
        txn.status = MpesaTransaction.Status.FAILED
        txn.result_desc = str(reason)
        if raw_payload is not None:
            txn.raw_webhook = raw_payload
        txn.save(update_fields=["status", "result_desc", "raw_webhook", "updated_at"])
