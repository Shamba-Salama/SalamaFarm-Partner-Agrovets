# SalamaFarm Partner Agrovets

Vendor portal for registered SalamaFarm agrovet partners: store onboarding, inventory, M-Pesa (Paystack Kenya) counter sales, farmer messaging, and post-purchase follow-ups.

**Stack**

- **Backend** — Django REST API (JWT, multi-tenant store scoping) under `backend/`
- **Frontend** — React + TanStack Start / Vite under the repo root
- **Payments** — Paystack Kenya (subaccounts, M-Pesa charge, webhooks)

Product overview for the original portal goals lives in the sections below; day-to-day setup is here.

## Prerequisites

- **Node.js** 20+ and **npm** (frontend)
- **Python 3.12** for the backend (prefer `/usr/local/bin/python3.12` on macOS Homebrew; do not use an older system Python)
- Django targets **5.2 LTS** (`Django>=5.2,<5.3`)

## Backend setup

```bash
cd backend

/usr/local/bin/python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env — set SECRET_KEY; add PAYSTACK_SECRET_KEY / PAYSTACK_PUBLIC_KEY for payments

python manage.py migrate
python manage.py runserver
```

API: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)  
Admin: `/admin/` (`createsuperuser` when needed)

More detail: [`backend/README-BACKEND.md`](backend/README-BACKEND.md).

Default settings: `config.settings.dev`. CORS for local Vite origins (`5173`, `3000`, `8080`) is configured there.

## Frontend setup

From the repository root (with the API running on port 8000):

```bash
npm install
npm run dev
```

Open the URL Vite prints (often `http://127.0.0.1:5173` or `http://localhost:8080`).

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite / TanStack Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

The frontend talks to `http://127.0.0.1:8000/api/v1` by default (`VITE_API_BASE_URL` can override).

## Product areas

1. **Onboarding & auth** — store registration, JWT login, verified-merchant status  
2. **Dashboard** — revenue, stock alerts, weekly sales by category, pending follow-ups  
3. **Inventory** — product CRUD, CSV import, stock/expiry badges  
4. **Customer care** — orders follow-ups, templated messages into chat threads  
5. **Sales & M-Pesa log** — counter STK charge, payment status, pickup reconciliation  
6. **Messages** — store ↔ farmer threads (API-backed)

Ensure UI stays modular and responsive for desktop and counter tablets.

## License / ownership

Application code in this repository is owned by the SalamaFarm project maintainers.
