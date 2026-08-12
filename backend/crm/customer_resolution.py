"""Resolve a store-scoped crm.Customer for a global CustomerAccount."""

from __future__ import annotations

from crm.models import Customer
from stores.models import AgrovetStore


def resolve_marketplace_customer(store: AgrovetStore, account) -> Customer:
    """Match this store's crm.Customer for the account: by link first, then
    by phone (adopting an existing vendor-created row), else create fresh.

    Shared by marketplace orders and marketplace messaging.
    """
    customer = Customer.objects.filter(store=store, account=account).first()
    if customer is not None:
        return customer

    customer = Customer.objects.filter(store=store, phone=account.phone).first()
    if customer is not None:
        if customer.account_id is None:
            customer.account = account
            customer.save(update_fields=["account", "updated_at"])
        return customer

    return Customer.objects.create(
        store=store,
        account=account,
        phone=account.phone,
        name=(account.full_name or "").strip() or "Customer",
    )
