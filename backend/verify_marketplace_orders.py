"""In-process verification of the customer-facing marketplace order endpoint.

Why in-process (not curl): the sandbox firewall blocks all localhost TCP
(Postgres :5432 and a runserver socket alike), so neither `migrate` against the
configured Postgres nor `curl` against a running server can execute here. Django's
test Client drives the *exact same* URLconf -> middleware -> authentication ->
permission -> serializer -> view -> ORM stack a real HTTP request would; the only
thing skipped is the TCP hop. It runs against a fresh on-disk SQLite database.

Run:  DATABASE_URL="sqlite:///$TMPDIR/verify_orders.sqlite3" \
      HOME="$TMPDIR" .venv/bin/python verify_marketplace_orders.py
"""

from __future__ import annotations

import json
import logging
import os
from decimal import Decimal

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.core.management import call_command
from django.test import Client
from django.test.utils import setup_test_environment
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import VendorUser  # AUTH_USER_MODEL
from catalog.models import Product
from crm.models import Customer, CustomerOrder
from customers.models import CustomerAccount
from stores.models import AgrovetStore

# --------------------------------------------------------------------------- #
# Capture the dev-mode OTP the way a developer reads it off the server log.
# --------------------------------------------------------------------------- #
_otp_box: dict[str, str] = {}


class _OTPCapture(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        msg = record.getMessage()
        if "[DEV OTP]" in msg:
            _otp_box["code"] = msg.strip().split()[-1]


logging.getLogger("customers.sms").addHandler(_OTPCapture())
logging.getLogger("customers.sms").setLevel(logging.WARNING)


def dump(title: str, method: str, path: str, req_body, resp) -> None:
    print(f"\n{'=' * 74}\n{title}\n{'=' * 74}")
    print(f"REQUEST:  {method} {path}")
    if req_body is not None:
        print(f"          body: {json.dumps(req_body)}")
    print(f"RESPONSE: HTTP {resp.status_code}")
    try:
        rendered = json.dumps(resp.json(), indent=2)
    except Exception:
        rendered = repr(resp.content)
    print("          " + rendered.replace("\n", "\n          "))


def bearer(token: str) -> dict:
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


def main() -> None:
    setup_test_environment()
    call_command("migrate", verbosity=1, interactive=False, run_syncdb=True)

    print("\n" + "#" * 74)
    print("# FIXTURES")
    print("#" * 74)

    # Two vendors / stores so we can build a genuine multi-store order.
    vA = VendorUser.objects.create_user(email="vendorA@example.com", password="x")
    vB = VendorUser.objects.create_user(email="vendorB@example.com", password="x")
    storeA = AgrovetStore.objects.create(
        owner=vA, name="Green Agrovet", town="Nakuru", county="Nakuru",
        till="111", attendant_phone="+254700000001", open=True,
    )
    storeB = AgrovetStore.objects.create(
        owner=vB, name="Rift Agrovet", town="Naivasha", county="Nakuru",
        till="222", attendant_phone="+254700000002", open=True,
    )

    pA1 = Product.objects.create(store=storeA, name="DAP Fertilizer 50kg", category="Fertilizer", price=Decimal("3200.00"), stock=40, active=True)
    pA2 = Product.objects.create(store=storeA, name="Maize Seed 2kg", category="Seeds", price=Decimal("650.00"), stock=100, active=True)
    pB1 = Product.objects.create(store=storeB, name="Dewormer 1L", category="Vet Supplies", price=Decimal("1800.00"), stock=25, active=True)

    print(f"storeA={storeA.id} ({storeA.name})  products: pA1={pA1.id}@{pA1.price}, pA2={pA2.id}@{pA2.price}")
    print(f"storeB={storeB.id} ({storeB.name})  products: pB1={pB1.id}@{pB1.price}")
    print(f"vendorA user_id={vA.id}")

    client = Client()
    PHONE = "0712345678"

    # ---- 1. request-otp ---------------------------------------------------- #
    r = client.post("/api/v1/customer-auth/request-otp/", data={"phone": PHONE}, content_type="application/json")
    dump("1. REQUEST OTP (public)", "POST", "/api/v1/customer-auth/request-otp/", {"phone": PHONE}, r)
    code = _otp_box.get("code")
    print(f"\n   [captured dev OTP from server log]: {code}")

    # ---- 2. verify-otp -> JWTs -------------------------------------------- #
    r = client.post("/api/v1/customer-auth/verify-otp/", data={"phone": PHONE, "code": code}, content_type="application/json")
    dump("2. VERIFY OTP -> customer JWT", "POST", "/api/v1/customer-auth/verify-otp/", {"phone": PHONE, "code": "<captured>"}, r)
    access = r.json()["access"]
    account = CustomerAccount.objects.get(phone="+254712345678")
    print(f"\n   customer account_id={account.id} phone={account.phone} is_new={r.json()['is_new']}")

    # ---- 3. create order (customer JWT, single store) --------------------- #
    body = {"items": [{"product_id": pA1.id, "qty": 2}, {"product_id": pA2.id, "qty": 3}], "order_type": "Delivery"}
    r = client.post("/api/v1/marketplace/orders/", data=body, content_type="application/json", **bearer(access))
    dump("3. CREATE ORDER (customer JWT) - success", "POST", "/api/v1/marketplace/orders/", body, r)
    expected = pA1.price * 2 + pA2.price * 3
    print(f"\n   server-computed amount should be 2x{pA1.price} + 3x{pA2.price} = {expected}")

    # crm.Customer created + linked?
    c = Customer.objects.get(store=storeA, phone=account.phone)
    print(f"   crm.Customer id={c.id} name={c.name!r} phone={c.phone} account_id={c.account_id} (== {account.id}?)")

    # ---- 4. second order, same customer -> row reused, not duplicated ----- #
    body2 = {"items": [{"product_id": pA1.id, "qty": 1}]}
    r = client.post("/api/v1/marketplace/orders/", data=body2, content_type="application/json", **bearer(access))
    dump("4. SECOND ORDER same customer - crm.Customer reused", "POST", "/api/v1/marketplace/orders/", body2, r)
    n_rows = Customer.objects.filter(store=storeA, account=account).count()
    print(f"\n   crm.Customer rows for (storeA, account)={n_rows} (expect 1 - reused, not duplicated)")
    print(f"   default order_type when omitted: {r.json()['order_type']!r} (expect 'Counter Pickup')")

    # ---- 5. adopt an existing vendor-created phone row -------------------- #
    #     Vendor B already has this buyer by phone, with NO account link.
    pre = Customer.objects.create(store=storeB, name="Walkin Buyer", phone=account.phone)
    print(f"\n   pre-existing storeB crm.Customer id={pre.id} account_id={pre.account_id} (None - vendor-created)")
    body3 = {"items": [{"product_id": pB1.id, "qty": 1}]}
    r = client.post("/api/v1/marketplace/orders/", data=body3, content_type="application/json", **bearer(access))
    dump("5. ORDER at storeB - adopt phone-matched row", "POST", "/api/v1/marketplace/orders/", body3, r)
    pre.refresh_from_db()
    print(f"\n   storeB crm.Customer id={pre.id} account_id now={pre.account_id} (== {account.id}? adopted, not duplicated)")
    print(f"   storeB rows for this phone: {Customer.objects.filter(store=storeB, phone=account.phone).count()} (expect 1)")

    # ---- 6. multi-store items rejected ------------------------------------ #
    body4 = {"items": [{"product_id": pA1.id, "qty": 1}, {"product_id": pB1.id, "qty": 1}]}
    r = client.post("/api/v1/marketplace/orders/", data=body4, content_type="application/json", **bearer(access))
    dump("6. MULTI-STORE items - rejected 400", "POST", "/api/v1/marketplace/orders/", body4, r)

    # ---- 7. vendor JWT rejected ------------------------------------------- #
    vendor_access = str(RefreshToken.for_user(vA).access_token)
    print(f"\n   minted vendor JWT for user_id={vA.id} (real SimpleJWT token: has user_id claim, no account_type)")
    r = client.post("/api/v1/marketplace/orders/", data=body2, content_type="application/json", **bearer(vendor_access))
    dump("7. VENDOR JWT on customer endpoint - rejected", "POST", "/api/v1/marketplace/orders/", body2, r)

    # ---- 8. no auth rejected ---------------------------------------------- #
    r = client.post("/api/v1/marketplace/orders/", data=body2, content_type="application/json")
    dump("8. NO AUTH - rejected 401", "POST", "/api/v1/marketplace/orders/", body2, r)

    # ---- summary ---------------------------------------------------------- #
    print("\n" + "#" * 74)
    print("# DB STATE")
    print("#" * 74)
    for o in CustomerOrder.objects.select_related("store", "customer").order_by("id"):
        print(
            f"  order #{o.id}: store={o.store.name!r} customer={o.customer.name!r}(id={o.customer_id}) "
            f"amount={o.amount} type={o.order_type!r} pickup={o.pickup!r} channel={o.channel!r} "
            f"status={o.status!r} paid_at={o.paid_at}"
        )
    print(f"\n  total CustomerOrder rows: {CustomerOrder.objects.count()}")
    print(f"  total crm.Customer rows:  {Customer.objects.count()}")


if __name__ == "__main__":
    main()
