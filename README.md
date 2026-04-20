# Vehicle Log Manager

A full-stack fleet management application for tracking drivers, vehicles, loads, trips, and financial ledgers.

**Tech Stack:** React Native (Expo) · FastAPI (Python) · Supabase (PostgreSQL + Auth)

---

## 📁 Project Structure

```
vr-app/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/endpoints/   # Route handlers
│   │   ├── core/               # Config, DB, Security
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic validation
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Data access layer
│   │   └── main.py             # App entry point
│   ├── schema.sql              # Database DDL for Supabase
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                   # Expo React Native app
    ├── app/
    │   ├── (tabs)/             # Tab screens (Dashboard, Trips, Drivers, Vehicles)
    │   ├── trip/[id].tsx       # Trip detail
    │   ├── driver/[id].tsx     # Driver profile
    │   ├── vehicle/[id].tsx    # Vehicle detail
    │   └── create-trip.tsx     # New trip flow
    ├── components/             # Reusable UI components
    ├── hooks/                  # TanStack Query hooks
    ├── services/               # API client (Axios)
    ├── constants/              # Theme & design tokens
    └── types/                  # TypeScript interfaces
```

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `backend/schema.sql`
3. Copy your project URL, anon key, and database connection string

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your Supabase credentials

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs will be at: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Update API base URL
# Edit frontend/services/api.ts → change BASE_URL to your machine's IP

# Start Expo dev server
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `w` for web.

---

## 🔧 Key Features

| Feature | Description |
|---|---|
| **Dashboard** | Weekly/Monthly/Yearly income vs expenses charts, quick stats |
| **Trip Logger** | Create trips, add loads with auto-pricing, complete & settle |
| **Pricing Engine** | KG-based auto-calc from customer rates, or manual Bulk/Unit |
| **Settlement** | On trip completion: collected → income, uncollected → driver debit |
| **Retroactive Settle** | "Settle" button on uncollected loads reverses driver debt |
| **Driver Ledger** | Full debit/credit history with pending balance tracking |
| **Vehicle Log** | Expense history (Tax vs Other), tax reminder notifications |
| **Tax Reminders** | Auto-flags vehicles with tax due within 7 days |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login via Supabase |
| `GET/POST` | `/api/v1/drivers` | List / Create drivers |
| `GET` | `/api/v1/drivers/{id}/uncollected` | Uncollected loads |
| `GET` | `/api/v1/drivers/{id}/ledger` | Driver ledger history |
| `GET/POST` | `/api/v1/vehicles` | List / Create vehicles |
| `GET` | `/api/v1/vehicles/tax-reminders` | Tax due ≤ 7 days |
| `GET/POST` | `/api/v1/customers` | List / Create customers |
| `POST` | `/api/v1/trips` | Create trip |
| `POST` | `/api/v1/trips/{id}/complete` | Complete & settle trip |
| `POST` | `/api/v1/loads` | Add load (with pricing) |
| `POST` | `/api/v1/loads/{id}/settle` | Retroactive settlement |
| `GET` | `/api/v1/dashboard/analytics` | Dashboard data |
