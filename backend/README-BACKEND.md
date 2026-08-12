# Backend — SalamaFarm Partner Agrovets API

Django REST API for the agrovet vendor portal (multi-tenant, JWT, Paystack Kenya).

## Requirements

- **Python 3.12.13** at `/usr/local/bin/python3.12` (do **not** use the macOS system `python3`, which is older)
- Virtualenv

> This project targets **Django 5.2 LTS** (`Django>=5.2,<5.3`). The venv must be created with `/usr/local/bin/python3.12`.

## Setup

```bash
cd backend

/usr/local/bin/python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env — at minimum set a SECRET_KEY; add Paystack keys when testing payments

python manage.py migrate
python manage.py runserver
```

API runs at [http://127.0.0.1:8000/](http://127.0.0.1:8000/). Admin: `/admin/` (create a superuser with `createsuperuser` when ready).

## Settings

| Module | Use |
|--------|-----|
| `config.settings.dev` | Local (`manage.py` default) |
| `config.settings.prod` | Production (WSGI/ASGI default) |

Override with:

```bash
export DJANGO_SETTINGS_MODULE=config.settings.prod
```

Environment variables are loaded from `.env` via **django-environ** (see `.env.example`).

## CORS (dev)

`config.settings.dev` allows:

- `http://localhost:5173` / `http://127.0.0.1:5173` (Vite default)
- `http://localhost:3000` / `http://127.0.0.1:3000` (common alternate local ports)
- `http://localhost:8080` / `http://127.0.0.1:8080` (Vite when another port is preferred)

## Apps

| App | Role |
|-----|------|
| `core` | Shared abstracts (`BaseStoreOwnedModel`, store-scoped queryset) |
| `accounts` | `VendorUser` (email login) |
| `stores` | `AgrovetStore` profiles |
| `catalog` | `Product` inventory |
| `crm` | `Customer`, `CustomerOrder`, `OrderItem` |
| `messaging` | `Thread`, `ChatMessage` |
| `payments` | `MpesaTransaction` (Paystack-backed charges / transfers) |

## Auth & store API (`/api/v1/`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/register/` | public |
| POST | `/api/v1/auth/token/` | public (email + password → JWT) |
| POST | `/api/v1/auth/token/refresh/` | public |
| GET | `/api/v1/auth/me/` | JWT |
| GET/PATCH | `/api/v1/store/` | JWT (always `request.user.store`) |
| POST | `/api/v1/store/create-subaccount/` | JWT — Paystack subaccount (idempotent) |

## Catalog API (`/api/v1/`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/products/` | JWT — filters: `category`, `active`, `search` |
| POST | `/api/v1/products/` | JWT — `store` set from user, never body |
| GET/PATCH/DELETE | `/api/v1/products/{id}/` | JWT — cross-store ids → 404 |
| POST | `/api/v1/products/{id}/toggle/` | JWT — flip `active` |
| POST | `/api/v1/products/import/` | JWT — multipart `file` CSV |

## CRM API (`/api/v1/`)

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/api/v1/customers/` | JWT — POST upserts by `(store, phone)` |
| GET/PATCH | `/api/v1/customers/{id}/` | JWT — detail includes last 5 orders |
| GET/POST | `/api/v1/orders/` | JWT — filters: `status`, `pickup`, `channel`, `created_after/before`, `paid_after/before` |
| GET/PATCH | `/api/v1/orders/{id}/` | JWT — PATCH status/pickup/order_type/channel only |
| GET | `/api/v1/analytics/weekly-sales/` | JWT — ISO week × category totals |

## Messaging API (`/api/v1/`)

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/api/v1/threads/` | JWT — list includes `unread` + `last_message` preview |
| GET | `/api/v1/threads/{id}/` | JWT — nested `messages` oldest-first; cross-store → 404 |
| POST | `/api/v1/threads/{id}/messages/` | JWT — store-sent only (`sender=store`, does not bump unread) |
| POST | `/api/v1/threads/{id}/mark-read/` | JWT — set `unread=0` |

## Payments (Paystack Kenya)

Settlements use **Paystack** subaccounts (`AgrovetStore.paystack_subaccount_code`).
`MpesaTransaction` stores Paystack `reference`, optional `subaccount_code` snapshot,
and webhook JSON (`raw_webhook`). Statuses: `pending` / `success` / `failed` / `abandoned`.
Kinds: `charge` / `transfer`. Finalization is via `POST /api/paystack/webhook/` (HMAC verified).

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/store/create-subaccount/` | JWT — creates Paystack subaccount or returns existing code |
| POST | `/api/v1/payments/charge/` | JWT (vendor) — body `{order_id, phone}`; M-Pesa STK via Charge API |
| POST | `/api/v1/payments/customer-charge/` | Customer JWT — same STK path; order must belong to the signed-in account |
| GET | `/api/v1/marketplace/orders/{id}/` | Customer JWT — poll `paid_at` / `payment_status` / `mpesa_code` |
| POST | `/api/paystack/webhook/` | Public — HMAC-SHA512 via `X-Paystack-Signature`; `charge.success` / `charge.failed` |

**Test mode tip:** Paystack Kenya sandbox M-Pesa number is `+254710000000` (not a real SIM).
Real numbers are declined with *Please use the test mobile money number…*. Sandbox often
returns `status=success` synchronously; the charge helper then sets `paid_at` immediately
(webhook still applies the same transition idempotently in staging/prod).

On `charge.success`: mark `MpesaTransaction` success, set `CustomerOrder.paid_at`, copy
receipt/reference onto `CustomerOrder.mpesa_code`, and if `pickup` was `Unmatched` move it
to `Awaiting Pickup`. On `charge.failed`: mark failed and
store gateway message. Unknown references are logged and still return 200 (avoid retry storms).

`POST /payments/charge/` looks up a store-scoped order, rejects with 400 if the order
already has a `pending` or `success` charge transaction (no second Paystack call), requires
`paystack_subaccount_code`,
converts `order.amount` to cents (`KES * 100`), normalizes phone to `+254…`, calls
`PaystackClient.charge_mobile_money` (`provider=mpesa`, `bearer=subaccount`), and creates a
`pending` `MpesaTransaction`. Response includes `reference`, `display_text`, and Paystack `data`.

`POST /auth/register/` best-effort creates a Paystack subaccount for the new store (same
defaults as create-subaccount). Paystack failures are logged and do not fail registration;
`paystack_subaccount_code` may remain blank until `POST /store/create-subaccount/`.

Defaults for create-subaccount: `settlement_bank=MPTILL`, `account_number=store.till`,
`percentage_charge` from `PAYSTACK_DEFAULT_PERCENTAGE_CHARGE` (default **5.0** — placeholder
marketplace commission: platform 5% / vendor ~95%). Optional body overrides:
`settlement_bank`, `account_number`, `percentage_charge`.

Client: `payments.paystack_client.PaystackClient` (raises `PaystackError` on non-2xx).

Env: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` (set locally in `.env`).

> Kenya List Banks confirms **M-PESA Till** code `MPTILL` (`type=mobile_money_business`).
> Personal M-Pesa MSISDN uses code `MPESA`. Charge STK uses `mobile_money.provider=mpesa`.

Activate the venv first (`source .venv/bin/activate`) or call `.venv/bin/python` /
`.venv/bin/python manage.py …`.

## Notes

- `AUTH_USER_MODEL = accounts.VendorUser` — email login (`USERNAME_FIELD = email`).
- Keep `.env` out of git (listed in `backend/.gitignore`).
