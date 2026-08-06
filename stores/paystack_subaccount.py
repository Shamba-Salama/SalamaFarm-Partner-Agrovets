"""Shared Paystack subaccount create/ensure logic for stores."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from django.conf import settings

from payments.paystack_client import PaystackClient, PaystackError

from .models import AgrovetStore

logger = logging.getLogger(__name__)


@dataclass
class SubaccountEnsureResult:
    """Outcome of ensure_paystack_subaccount."""

    ok: bool
    created: bool
    subaccount_code: str = ""
    paystack: dict[str, Any] | None = None
    error: str | None = None
    paystack_status: int | None = None
    paystack_payload: Any = None


def ensure_paystack_subaccount(
    store: AgrovetStore,
    *,
    settlement_bank: str | None = None,
    account_number: str | None = None,
    percentage_charge: float | None = None,
) -> SubaccountEnsureResult:
    """
    Ensure the store has a Paystack subaccount code.

    Idempotent: if paystack_subaccount_code is already set, returns it without
    calling Paystack. On failure returns ok=False (never raises) so callers like
    registration can log and continue.
    """
    existing = (store.paystack_subaccount_code or "").strip()
    if existing:
        return SubaccountEnsureResult(
            ok=True,
            created=False,
            subaccount_code=existing,
        )

    business_name = (store.name or "").strip()
    if not business_name:
        return SubaccountEnsureResult(
            ok=False,
            created=False,
            error="Store name is required before creating a Paystack subaccount.",
        )

    bank = settlement_bank or getattr(
        settings, "PAYSTACK_DEFAULT_SETTLEMENT_BANK", "MPTILL"
    )
    acct = (account_number or store.till or "").strip()
    if not acct:
        return SubaccountEnsureResult(
            ok=False,
            created=False,
            error=(
                "Store till (or account_number) is required "
                "for Paystack subaccount settlement."
            ),
        )

    if percentage_charge is None:
        percentage_charge = float(
            getattr(settings, "PAYSTACK_DEFAULT_PERCENTAGE_CHARGE", 0.0)
        )

    try:
        client = PaystackClient()
        extra: dict[str, Any] = {}
        if store.attendant_phone:
            extra["primary_contact_phone"] = store.attendant_phone
        payload = client.create_subaccount(
            business_name=business_name,
            settlement_bank=bank,
            account_number=acct,
            percentage_charge=percentage_charge,
            **extra,
        )
    except PaystackError as exc:
        logger.warning(
            "Paystack create_subaccount failed for store_id=%s: %s",
            store.pk,
            exc,
            exc_info=False,
        )
        return SubaccountEnsureResult(
            ok=False,
            created=False,
            error=str(exc),
            paystack_status=exc.status_code,
            paystack_payload=exc.payload,
        )

    sub_data = payload.get("data") or {}
    code = (sub_data.get("subaccount_code") or "").strip()
    if not code:
        logger.warning(
            "Paystack create_subaccount missing subaccount_code for store_id=%s payload=%s",
            store.pk,
            payload,
        )
        return SubaccountEnsureResult(
            ok=False,
            created=False,
            error="Paystack response missing subaccount_code.",
            paystack_payload=payload,
        )

    store.paystack_subaccount_code = code
    store.save(update_fields=["paystack_subaccount_code", "updated_at"])
    return SubaccountEnsureResult(
        ok=True,
        created=True,
        subaccount_code=code,
        paystack=sub_data if isinstance(sub_data, dict) else None,
    )
