# SalamaFarm Partner Agrovets

Vendor portal for registered SalamaFarm agrovet partners: store onboarding, inventory, M-Pesa (Paystack Kenya) counter sales, farmer messaging, and post-purchase follow-ups.

**Stack**

- **Backend** — Django REST API (JWT, multi-tenant store scoping) under `backend/`
- **Frontend** — React + TanStack Start / Vite under the repo root
- **Payments** — Paystack Kenya (subaccounts, M-Pesa charge, webhooks)

## Quick Start with Docker (Recommended)

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

```bash
# Clone and setup
git clone <repository-url>
cd SalamaFarm-Partner-Agrovets

# Copy and configure environment
cp .env.docker.example .env
# Edit .env with your SECRET_KEY, POSTGRES_PASSWORD, and Paystack keys

# Build and run all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# PostgreSQL: localhost:5432
```

**Development mode** (with hot-reload):
```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
# Frontend dev server: http://localhost:5173
# Backend with runserver: http://localhost:8000
```

## Manual Setup (Alternative)

**Prerequisites:**
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

Open the URL Vite prints (often `http://localhost:8080`).

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite / TanStack Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

The frontend talks to `http://127.0.0.1:8000/api/v1` by default (`VITE_API_BASE_URL` can override).

## Features

**Agrovet onboarding & verification** — 2-step registration (store details, then license/permit upload) with a Verified Merchant / Pending Verification status banner.

**Dashboard & analytics** — revenue, active product count, follow-up counts, and a weekly sales chart by category (Fertilizer, Seeds, Vet Supplies, Pesticides), computed from real order data.

**Inventory management** — full product CRUD with search/filter/sort, CSV bulk import, low-stock and near-expiry badges.

**Customer care / CRM** — post-purchase follow-up tracking (Pending / Contacted / Satisfied), one-tap WhatsApp follow-up messages, direct-call shortcuts.

**M-Pesa transaction reconciliation** — Paystack-mediated counter charges, with M-Pesa confirmation codes matched against orders for fraud prevention at pickup.

**Messaging** — store ↔ farmer chat threads (REST-backed, polling; real-time is a future enhancement).

UI is modular and responsive for desktop monitors and store-counter tablets.

## License / ownership

Application code in this repository is owned by the SalamaFarm project maintainers.
