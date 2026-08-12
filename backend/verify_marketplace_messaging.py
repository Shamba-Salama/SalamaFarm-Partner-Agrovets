#!/usr/bin/env python
"""Curl-style verification for customer marketplace messaging."""

import json
import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django

django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from django.test.utils import setup_test_environment
from rest_framework_simplejwt.tokens import RefreshToken

from crm.models import Customer
from customers.models import CustomerAccount
from customers.tokens import issue_customer_tokens
from stores.models import AgrovetStore

User = get_user_model()


def bearer(token: str) -> dict:
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


def dump(title: str, method: str, path: str, body, resp):
    print(f"\n{'=' * 72}")
    print(title)
    print(f"{method} {path}")
    if body is not None:
        print("BODY:", json.dumps(body, indent=2) if isinstance(body, dict) else body)
    print(f"HTTP {resp.status_code}")
    try:
        print(json.dumps(resp.json(), indent=2, default=str))
    except Exception:
        print(resp.content.decode()[:2000])


def main() -> int:
    setup_test_environment()
    client = Client()

    store = AgrovetStore.objects.filter(open=True).first()
    if not store:
        print("No open store in DB — aborting.")
        return 1

    vendor = store.owner
    if vendor is None:
        vendor = User.objects.filter(is_staff=True).first()
    if vendor is None:
        print("No vendor user for store — aborting.")
        return 1

    acct, _ = CustomerAccount.objects.get_or_create(
        phone="+254743418889",
        defaults={"full_name": "Messaging Test"},
    )
    other, _ = CustomerAccount.objects.get_or_create(
        phone="+254700000099",
        defaults={"full_name": "Other Customer"},
    )

    customer_access = issue_customer_tokens(acct)["access"]
    other_access = issue_customer_tokens(other)["access"]
    vendor_access = str(RefreshToken.for_user(vendor).access_token)

    crm_before = Customer.objects.filter(store=store, account=acct).first()
    print(f"store_id={store.id} store_name={store.name!r}")
    print(f"vendor_user_id={vendor.id}")
    print(f"crm.Customer before thread: id={crm_before.id if crm_before else None}")

    # 1. CREATE THREAD
    body = {
        "store_id": store.id,
        "topic": "Product advice — DAP",
        "message": "Hello, can you advise on dosage for maize?",
    }
    r = client.post(
        "/api/v1/marketplace/threads/",
        data=json.dumps(body),
        content_type="application/json",
        **bearer(customer_access),
    )
    dump("1. CUSTOMER CREATE THREAD", "POST", "/api/v1/marketplace/threads/", body, r)
    if r.status_code != 201:
        return 1
    thread_id = r.json()["id"]
    unread_after_create = r.json()["unread"]

    crm_after = Customer.objects.filter(store=store, account=acct).first()
    print(
        f"\n   crm.Customer after thread: id={crm_after.id} account_id={crm_after.account_id}"
    )

    # 2. VENDOR LIST — expect unread >= 1
    r = client.get("/api/v1/threads/", **bearer(vendor_access))
    dump("2. VENDOR LIST THREADS", "GET", "/api/v1/threads/", None, r)
    vendor_threads = r.json() if isinstance(r.json(), list) else r.json().get("results", r.json())
    if isinstance(vendor_threads, dict):
        vendor_threads = [vendor_threads]
    match = next((t for t in vendor_threads if t["id"] == thread_id), None)
    print(f"\n   vendor thread match unread={match['unread'] if match else 'MISSING'} (expect 1)")

    # 3. CUSTOMER FOLLOW-UP MESSAGE
    body2 = {"text": "Also — is it safe near livestock?"}
    r = client.post(
        f"/api/v1/marketplace/threads/{thread_id}/messages/",
        data=json.dumps(body2),
        content_type="application/json",
        **bearer(customer_access),
    )
    dump(
        "3. CUSTOMER FOLLOW-UP MESSAGE",
        "POST",
        f"/api/v1/marketplace/threads/{thread_id}/messages/",
        body2,
        r,
    )
    unread_after_followup = r.json().get("thread", {}).get("unread")

    # 4. VENDOR LIST again — unread should be 2
    r = client.get("/api/v1/threads/", **bearer(vendor_access))
    vendor_threads = r.json() if isinstance(r.json(), list) else r.json()
    match = next((t for t in vendor_threads if t["id"] == thread_id), None)
    print(
        f"\n4. VENDOR LIST after follow-up: unread={match['unread'] if match else 'MISSING'} (expect 2)"
    )

    # 5. VENDOR REPLY — should NOT bump unread
    body3 = {"text": "Yes — apply 50kg/acre at planting. Keep animals off for 24h."}
    r = client.post(
        f"/api/v1/threads/{thread_id}/messages/",
        data=json.dumps(body3),
        content_type="application/json",
        **bearer(vendor_access),
    )
    dump(
        "5. VENDOR REPLY",
        "POST",
        f"/api/v1/threads/{thread_id}/messages/",
        body3,
        r,
    )
    unread_after_vendor = r.json().get("thread", {}).get("unread")

    r = client.get("/api/v1/threads/", **bearer(vendor_access))
    vendor_threads = r.json()
    match = next((t for t in vendor_threads if t["id"] == thread_id), None)
    print(
        f"\n   vendor list after store reply: unread={match['unread'] if match else 'MISSING'} "
        f"(expect still 2, not 3)"
    )

    # 6. CROSS-CUSTOMER 404 on retrieve and post
    r = client.get(
        f"/api/v1/marketplace/threads/{thread_id}/",
        **bearer(other_access),
    )
    dump(
        "6a. CROSS-CUSTOMER GET",
        "GET",
        f"/api/v1/marketplace/threads/{thread_id}/",
        None,
        r,
    )

    r = client.post(
        f"/api/v1/marketplace/threads/{thread_id}/messages/",
        data=json.dumps({"text": "hijack"}),
        content_type="application/json",
        **bearer(other_access),
    )
    dump(
        "6b. CROSS-CUSTOMER POST",
        "POST",
        f"/api/v1/marketplace/threads/{thread_id}/messages/",
        {"text": "hijack"},
        r,
    )

    # 7. CUSTOMER LIST + RETRIEVE
    r = client.get("/api/v1/marketplace/threads/", **bearer(customer_access))
    dump("7. CUSTOMER LIST THREADS", "GET", "/api/v1/marketplace/threads/", None, r)

    r = client.get(
        f"/api/v1/marketplace/threads/{thread_id}/",
        **bearer(customer_access),
    )
    dump(
        "8. CUSTOMER RETRIEVE THREAD",
        "GET",
        f"/api/v1/marketplace/threads/{thread_id}/",
        None,
        r,
    )
    msg_count = len(r.json().get("messages", []))
    print(f"\n   message count={msg_count} (expect 3: 2 farmer + 1 store)")

    # 9. Second thread same store — same crm.Customer
    body9 = {
        "store_id": store.id,
        "topic": "Second topic same store",
        "message": "Follow-up thread",
    }
    r = client.post(
        "/api/v1/marketplace/threads/",
        data=json.dumps(body9),
        content_type="application/json",
        **bearer(customer_access),
    )
    crm_final = Customer.objects.filter(store=store, account=acct)
    print(
        f"\n9. crm.Customer rows for (store, account): count={crm_final.count()} "
        f"ids={list(crm_final.values_list('id', flat=True))} (expect 1 row, reused)"
    )

    ok = (
        unread_after_create == 1
        and unread_after_followup == 2
        and unread_after_vendor == 2
        and match
        and match["unread"] == 2
        and crm_final.count() == 1
        and msg_count == 3
    )
    print(f"\n{'ALL CHECKS PASS' if ok else 'SOME CHECKS FAILED'}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
