"""Shared Paystack charge initiation for vendor and customer endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.db import transaction
from rest_framework import status

from crm.models import CustomerOrder

from .charge_outcome import apply_charge_failed, apply_charge_success
from .models import MpesaTransaction
from .paystack_client import PaystackClient, PaystackError
from .utils import kes_to_cents, normalize_kenya_msisdn


class ChargeError(Exception):
    """Domain error for charge initiation — map to an HTTP response."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        extra: dict[str, Any] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.extra = extra or {}


@dataclass(frozen=True)
class ChargeResult:
    txn: MpesaTransaction
    amount_cents: int
    phone: str
    subaccount_code: str
    paystack_data: dict[str, Any]
    display_text: str
    paystack_status: Any


def initiate_paystack_charge(
    *,
    order: CustomerOrder,
    phone_raw: str,
    paystack_email: str,
) -> ChargeResult:
    """
    Initiate a Paystack M-Pesa STK charge for ``order`` and record a pending
    ``MpesaTransaction``. Caller must already have tenancy-checked the order.

    Raises ``ChargeError`` for client/server-rejectable conditions.
    """
    if order.paid_at is not None:
        raise ChargeError("Order already paid")

    store = order.store

    charge_txns = MpesaTransaction.objects.filter(
        order=order,
        kind=MpesaTransaction.Kind.CHARGE,
    )
    if charge_txns.filter(status=MpesaTransaction.Status.SUCCESS).exists():
        raise ChargeError("Order already paid")
    if charge_txns.filter(status=MpesaTransaction.Status.PENDING).exists():
        raise ChargeError("A charge is already in progress for this order")

    subaccount_code = (store.paystack_subaccount_code or "").strip()
    if not subaccount_code:
        raise ChargeError(
            "This store has no Paystack subaccount and cannot accept online payments yet."
        )

    try:
        phone = normalize_kenya_msisdn(phone_raw)
    except ValueError as exc:
        raise ChargeError(str(exc), extra={"phone": phone_raw}) from exc

    amount_cents = kes_to_cents(order.amount)
    if amount_cents <= 0:
        raise ChargeError("Order amount must be greater than zero.")

    email = (paystack_email or "").strip()
    if not email:
        # Paystack requires an email; synthesize a stable address for customers.
        # Avoid reserved TLDs (.local) — Paystack rejects them as invalid.
        email = f"customer+{order.customer_id}@customers.salamafarm.com"

    try:
        client = PaystackClient()
        payload = client.charge_mobile_money(
            email=email,
            amount_kobo=amount_cents,
            phone=phone,
            subaccount_code=subaccount_code,
            bearer="subaccount",
            metadata={"order_id": order.id, "store_id": store.id},
        )
    except PaystackError as exc:
        raise ChargeError(
            str(exc),
            status_code=status.HTTP_502_BAD_GATEWAY,
            extra={
                "paystack_status": exc.status_code,
                "paystack_payload": exc.payload,
            },
        ) from exc

    data = payload.get("data") or {}
    reference = (data.get("reference") or "").strip()
    if not reference:
        raise ChargeError(
            "Paystack charge response missing reference.",
            status_code=status.HTTP_502_BAD_GATEWAY,
            extra={"paystack_payload": payload},
        )

    display_text = data.get("display_text") or data.get("status") or ""

    paystack_status = data.get("status") if isinstance(data, dict) else None

    with transaction.atomic():
        txn = MpesaTransaction.objects.create(
            store=store,
            order=order,
            customer=order.customer,
            phone=phone,
            amount=order.amount,
            reference=reference,
            subaccount_code=subaccount_code,
            kind=MpesaTransaction.Kind.CHARGE,
            status=MpesaTransaction.Status.PENDING,
            result_desc=str(display_text),
            raw_webhook={},
        )

    # Test mode (and some live edge cases) resolve STK synchronously. Apply the
    # same paid/failed transition the webhook would, so local polling works
    # without a public callback URL. Webhook re-delivery remains idempotent.
    if isinstance(data, dict) and str(paystack_status).lower() == "success":
        apply_charge_success(txn, data, raw_payload=payload if isinstance(payload, dict) else None)
        txn.refresh_from_db()
    elif isinstance(data, dict) and str(paystack_status).lower() == "failed":
        apply_charge_failed(txn, data, raw_payload=payload if isinstance(payload, dict) else None)
        txn.refresh_from_db()

    return ChargeResult(
        txn=txn,
        amount_cents=amount_cents,
        phone=phone,
        subaccount_code=subaccount_code,
        paystack_data=data if isinstance(data, dict) else {},
        display_text=str(display_text),
        paystack_status=paystack_status,
    )


def charge_result_to_response_body(result: ChargeResult) -> dict[str, Any]:
    return {
        "transaction_id": result.txn.id,
        "reference": result.txn.reference,
        "status": result.txn.status,
        "display_text": result.display_text,
        "amount": str(result.txn.amount),
        "amount_cents": result.amount_cents,
        "phone": result.phone,
        "subaccount_code": result.subaccount_code,
        "order_id": result.txn.order_id,
        "paystack": result.paystack_data,
    }
