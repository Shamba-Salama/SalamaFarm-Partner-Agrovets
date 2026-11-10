# Backend — SalamaFarm Partner Agrovets API

Django REST API for the agrovet vendor portal (multi-tenant, JWT).

## Live Hostinger VPS operations

The Django API is served from the Hostinger VPS at `https://api-next.salamafarm.com`. See [`HOSTINGER_VPS_OPERATIONS.md`](../HOSTINGER_VPS_OPERATIONS.md) for topology, health checks, backups, and recovery.

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
# Edit .env — at minimum set a SECRET_KEY. Set SMTP vars to send password-reset email.

python manage.py migrate
python manage.py runserver
```

### Windows troubleshooting

- Use **Python 3.12+** in a project venv (see Requirements). If `py -3.12` reports no runtime, install 3.12 from [python.org](https://www.python.org/downloads/) or point `python` at that install when creating `.venv`.
- If `manage.py` raises **`Error loading psycopg2 or psycopg module`** and `.env` sets **`DATABASE_URL`** to PostgreSQL, either install a matching PostgreSQL/libpq stack so **`psycopg2-binary`** can load its DLLs, or set **`DATABASE_URL=sqlite:///db.sqlite3`** for local dev/tests.

### Cloudflare R2

Fill **`R2_*`** in `.env` when you use vendor portal image uploads (`POST /api/upload-url/`). **`migrate` and `runserver` do not require R2**; without it, that endpoint returns **503** with a clear message.

**Browser uploads need bucket CORS.** The portal PUTs files directly to `*.r2.cloudflarestorage.com`. If CORS is missing, the console shows *No Access-Control-Allow-Origin*.

1. Set optional **`R2_CORS_ORIGINS`** in `.env` (comma-separated portal URLs), **or** rely on the dev defaults.
2. Apply CORS on the bucket:

   ```bash
   python manage.py configure_r2_cors
   # or: python manage.py configure_r2_cors --origins "http://localhost:8080,https://your-portal.example.com"
   ```

   Or in **Cloudflare Dashboard** → R2 → your bucket → **Settings** → **CORS policy**, allow **PUT/GET/HEAD** from your portal origin(s), headers `*`.

   Example JSON is in [`core/r2-cors-policy.example.json`](core/r2-cors-policy.example.json).

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
| `payments` | Historical `MpesaTransaction` ledger |

## Auth & store API (`/api/v1/`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/register/` | public |
| POST | `/api/v1/auth/token/` | public (email + password → JWT) |
| POST | `/api/v1/auth/token/refresh/` | public |
| GET | `/api/v1/auth/me/` | JWT |
| GET/PATCH | `/api/v1/store/` | JWT (always `request.user.store`) |
| POST | `/api/v1/auth/forgot-password/` | public — emails a reset link |
| POST | `/api/v1/auth/recover-session/` | public — `{uid, token}` checks the link |
| POST | `/api/v1/auth/reset-password/` | public — `{uid, token, password}` sets the password |

## Catalog API (`/api/v1/`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/products/` | JWT — filters: `category`, `active`, `search`; includes publication `status` |
| POST | `/api/v1/products/` | JWT — creates a `draft`; `store` set from user, never body |
| GET/PATCH/DELETE | `/api/v1/products/{id}/` | JWT — cross-store ids → 404 |
| POST | `/api/v1/products/{id}/toggle/` | JWT — flip `active` |
| POST | `/api/v1/products/{id}/publish/` | JWT — submit draft for admin review (`pending`) |
| POST | `/api/v1/products/{id}/unpublish/` | JWT — return pending/published product to `draft` |
| POST | `/api/v1/products/{id}/archive/` | JWT — remove from publication workflow (`archived`) |
| POST | `/api/v1/products/import/` | JWT — multipart `file` CSV |

Publication statuses are `draft`, `pending`, `published`, and `archived`. Admins review
pending products in Django Admin by changing their status to `published`. The public
`GET /api/v1/marketplace/products/` endpoint returns only published products that are
also active and belong to open stores. Existing products are migrated as published so
they remain visible after the migration; new products and CSV imports start as drafts.

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

## Payments

M-Pesa confirmation codes are stored on `CustomerOrder.mpesa_code`. Sending a code on
create, or `PATCH /api/v1/orders/{id}/` with `mpesa_code`, sets `paid_at` and moves an
`Unmatched` pickup to `Awaiting Pickup`. There is no payment-gateway charge endpoint.

Vendor login (`POST /api/v1/auth/token/`) is limited to 20 attempts per email per hour.
Forgot-password and reset are limited to 10 per hour.

Activate the venv first (`source .venv/bin/activate`) or call `.venv/bin/python` /
`.venv/bin/python manage.py …`.

## Notes

- `AUTH_USER_MODEL = accounts.VendorUser` — email login (`USERNAME_FIELD = email`).
- Keep `.env` out of git (listed in `backend/.gitignore`).

## Production deploy

Use `backend/Dockerfile` and [`HOSTINGER_VPS_OPERATIONS.md`](../HOSTINGER_VPS_OPERATIONS.md). Set `DJANGO_SETTINGS_MODULE=config.settings.prod`, `DATABASE_URL`, `SECRET_KEY`, CORS/CSRF origins, SMTP (`EMAIL_*`, `PORTAL_ORIGIN`), and R2 vars (`backend/.env.example`).
