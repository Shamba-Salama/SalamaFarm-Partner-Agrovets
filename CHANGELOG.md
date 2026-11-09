# Changelog

All notable changes to **SalamaFarm Partner Agrovets** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Version **1.0.0** is the first consolidated release of the Django-backed vendor portal with production-oriented deploy paths.

---

## [1.0.0] — 2026-11-07

### What this release is

A single vendor portal that talks **only to the Django REST API**: real registration, JWT login, inventory, store profile, orders, messaging, analytics, and Paystack flows. Product photos use **direct upload to Cloudflare R2**; the public URL is saved on each product in Postgres.

**Typical local stack:** frontend on Vite (`http://127.0.0.1:8080`) → proxy → Django (`http://127.0.0.1:8000`) → database.  
**Typical production stack:** frontend (e.g. Vercel) proxies `/api` to `https://api.salamafarm.com`; API runs on **Hostinger VPS** (see `HOSTINGER_VPS_OPERATIONS.md`).

---

### Added

#### Backend (Django)

- **Vendor auth** — `POST /api/v1/auth/register/`, `POST /api/v1/auth/token/`, `GET /api/v1/auth/me/`; email-based `VendorUser` + linked `AgrovetStore`.
- **Customer mobile auth** — phone OTP (Africa’s Talking), email/password, Google ID token verification (`customers` app).
- **Catalog** — product CRUD, CSV import, publication status; `Product.image` stores a **public HTTPS URL** (R2).
- **Image uploads** — `POST /api/upload-url/` returns presigned PUT URL + `publicUrl` (boto3 → Cloudflare R2); file bytes never pass through Django.
- **R2 bucket CORS** — `python manage.py configure_r2_cors` applies browser CORS for direct PUT uploads; optional `R2_CORS_ORIGINS` in `.env`; example policy in `core/r2-cors-policy.example.json`.
- **Store, CRM, orders, messaging, payments, visits** — REST APIs scoped per agrovet store.
- **Salama product gallery (backend)** — catalog helpers and `apply_gallery_images` management command for one-time backfill when a product has no photo.
- **Health endpoints** — `/health/`, `/ready/` for probes.
- **Production settings** — `config.settings.prod` with Postgres via `DATABASE_URL`, WhiteNoise static files, Gunicorn.

#### Frontend (React + TanStack Start)

- **Onboarding & login** — `/onboarding`, `/login`; forms post to Django (no mock backend).
- **Inventory** — table CRUD, CSV import; **ImageUploader** (R2) plus **Salama gallery picker** (gallery PNG → upload to R2 → save URL on product).
- **Portal areas** — dashboard, settings, customers, messages, payments, etc. via shared `api-client` + JWT.
- **Vite proxy** — `/api/**` → Django in dev; Nitro **Vercel** route rules proxy `/api/**` when `VERCEL=1`.
- **SSR error wrapper** — `src/server.ts` for clearer failed-render handling.

#### Ops & deploy

- **GitHub Actions** — `deploy.yml` (SSH to VPS, Docker rebuild).
- **Docker** — root and `backend/Dockerfile`, `docker-compose` for local full stack.
- **Docs** — `HOSTINGER_VPS_OPERATIONS.md`, `backend/README-BACKEND.md`, env examples for frontend and backend.

---

### Fixed (errors and issues solved)

| Issue | Cause | Resolution |
|--------|--------|------------|
| **Merge conflicts** (`base.py`, `requirements.txt`, `inventory.tsx`, `vite.config.ts`, lockfile) | Parallel branches (R2 vs deploy/auth/gallery) | Merged: R2 + Gunicorn/WhiteNoise + gallery UI + proxy/Vercel config |
| **`ModuleNotFoundError: No module named 'google'`** | `google-auth` not installed in venv after pull | Install `google-auth==2.40.3` (listed in `requirements.txt`) |
| **`ModuleNotFoundError: No module named 'whitenoise'`** | Dependency missing in venv | Install `whitenoise`; middleware in `base.py` |
| **Unapplied `customers` migration** | New auth migration not run | `python manage.py migrate` (`0002_email_password_google_auth`) |
| **Vite: "Encountered diff marker"** | Unresolved `vite.config.ts` | Merged proxy + SSR comment; regenerated `package-lock.json` |
| **Invalid hook call / `HeadContent` / HMR WebSocket failed** | Windows + bind on `::`; duplicate React risk on SSR | Dev server/HMR on `127.0.0.1:8080`; `ssr.resolve.dedupe` for React; clear `node_modules/.vite` |
| **Registration not in local database** | `src/.env` ignored by Vite; proxy defaulted to **production API**; optional Supabase demo in `localStorage` | Root `.env` with `DJANGO_API_ORIGIN=http://127.0.0.1:8000`; dev proxy default to local Django |
| **WSGI / app failed to start** | Missing packages after merge | `pip install -r requirements.txt` |
| **Image upload CORS blocked** (`No 'Access-Control-Allow-Origin'` on `*.r2.cloudflarestorage.com`) | R2 bucket had no CORS for portal origin (`http://localhost:8080`); browser PUT after presign failed | `python manage.py configure_r2_cors` (or Cloudflare R2 → bucket → CORS); clearer message in `upload-image.ts` |

---

### Changed

- **`src/lib/api-client.ts`** — Django `fetch` only; removed Supabase adapter and browser demo store.
- **`vite.config.ts`** — Local API proxy; `127.0.0.1` for dev/HMR; Vercel Nitro preset when `VERCEL=1`.
- **`backend/config/settings/base.py`** — Combined **R2**, password reset, Google OAuth client IDs, org bootstrap env vars.
- **`backend/requirements.txt`** — `boto3`, `gunicorn`, `whitenoise`, `google-auth`, etc.
- **`backend/config/settings/prod.py`** — Hostinger-focused hosts (`api.salamafarm.com`, `api-next.salamafarm.com`); simplified `DATABASE_URL` handling (no Render-specific checks).
- **`.env.example`** — Documents `VITE_API_BASE_URL`, `DJANGO_API_ORIGIN`; removed `VITE_USE_SUPABASE`.
- **`src/lib/upload-image.ts`** — Explains R2 CORS failures instead of a generic network error.
- **`backend/README-BACKEND.md`** — R2 CORS setup steps for dev and production origins.

---

### Removed

- **Supabase** — CLI folder, schema SQL, `@supabase/supabase-js`, `supabase-client`, `supabase-adapter`, `supabase-demo`, `VITE_USE_SUPABASE`.
- **Render** — `render.yaml` (root and backend), `.renderenv.example`, Render-only logic in `prod.py` and deploy docs.
- **Accidental repo file** — stray `h origin main --force`.

---

### Working now (verified flows)

- **Register agrovet** — Form → `POST /auth/register/` → login → JWT; user and store rows in Django DB (when root `.env` points at local API).
- **Login / session** — JWT access + refresh; `GET /auth/me/`; 401 clears session and redirects to login.
- **Store profile** — `GET/PATCH /store/`; onboarding sets `onboarded`.
- **Products** — List/create/edit/delete; PATCH can set `image` URL after R2 upload; CSV import.
- **Product images** — Authenticated presign → browser PUT to R2 → save `publicUrl` on product (needs `R2_*` in `backend/.env`).
- **Salama gallery in UI** — Pick stock photo → upload to R2 → same URL field as manual upload.
- **Customer auth API** — Endpoints under `/api/v1/customer-auth/` (OTP, email, Google) when backend env is set.
- **Local dev** — `runserver` + `npm run dev`; console log: `[api] Using Django at …`.
- **Production build** — `npm run build` succeeds with merged Vite/TanStack config.

---

### Configuration checklist

#### Frontend (repo root `.env`)

```env
VITE_API_BASE_URL=/api/v1
DJANGO_API_ORIGIN=http://127.0.0.1:8000   # local
# DJANGO_API_ORIGIN=https://api.salamafarm.com   # production proxy target
```

Vite reads **project root** `.env`, not `src/.env`.

#### Backend (`backend/.env`)

- `SECRET_KEY`, `DATABASE_URL` (Postgres in prod)
- `PAYSTACK_*` for payments
- **`R2_*`** for image upload endpoint (optional for migrate/runserver; required for uploads)
- Customer SMS: `AFRICASTALKING_*`, `GOOGLE_OAUTH_CLIENT_IDS` as needed

#### Production deploy

- **API:** VPS + Docker (`deploy.yml`, `HOSTINGER_VPS_OPERATIONS.md`)
- **Frontend:** set `DJANGO_API_ORIGIN` at build time for Vercel; `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` on API for your portal URL
- **R2:** bucket public URL + CORS allowing browser PUT from your site origin

---

### Dependencies (pinned highlights)

| Area | Packages |
|------|-----------|
| Backend | Django 5.2 LTS, DRF, SimpleJWT, `psycopg2-binary`, `boto3`, `gunicorn`, `whitenoise`, `google-auth` |
| Frontend | React 19, TanStack Router/Start, Vite 8, `@lovable.dev/vite-tanstack-config` |

---

### Known limitations & follow-ups

- **R2 not configured** — `POST /api/upload-url/` returns **503**; products can still be saved without photos.
- **New production portal URL** — Re-run `configure_r2_cors` (or update bucket CORS) so that origin can PUT to R2.
- **Paystack / SMS / Google** — Require real secrets in production; sandbox/dev modes documented in `backend/.env.example`.
- **Browser extensions** — Can log harmless WebSocket/HMR noise; use `http://127.0.0.1:8080` for local dev.
- **Clear old demo data** — If you used Supabase demo before 1.0.0, clear site data / `localStorage` keys `salamafarm_demo_*`.

---

### Upgrade notes (from pre-1.0.0 branches)

1. `cp .env.example .env` at repo root; set `DJANGO_API_ORIGIN`.
2. `cd backend && pip install -r requirements.txt && python manage.py migrate`.
3. `npm install` at repo root (Supabase removed).
4. Restart `npm run dev` and `runserver`.
5. For inventory photos: set `R2_*` in `backend/.env`, then `python manage.py configure_r2_cors`.

---

[1.0.0]: https://github.com/Shamba-Salama/SalamaFarm-Partner-Agrovets/releases/tag/v1.0.0
