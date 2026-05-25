-- ============================================================================
-- Vehicle Log Manager — Database Schema
-- Run this in your Supabase SQL Editor to create all tables
-- ============================================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUM TYPES ──────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE trip_status AS ENUM ('active', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rent_type AS ENUM ('KG', 'Unit', 'Bulk');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_type AS ENUM ('Tax', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ledger_type AS ENUM ('Debit', 'Credit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── DRIVERS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drivers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    contact         VARCHAR(50),
    total_pending_amount NUMERIC(12, 2) DEFAULT 0,
    status          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── VEHICLES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number    VARCHAR(30) NOT NULL UNIQUE,
    model           VARCHAR(100),
    tax_due_date    DATE,
    last_service_date DATE,
    status          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CUSTOMERS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    default_rate_per_kg NUMERIC(10, 2),
    status          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRODUCTS (RATE CARD) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    default_rate    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_type       rent_type NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, name)
);

-- ── TRIPS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trips (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    fuel_cost       NUMERIC(10, 2) DEFAULT 0,
    fuel_description TEXT,
    other_expenses  NUMERIC(10, 2) DEFAULT 0,
    other_description TEXT,
    driver_charge   NUMERIC(10, 2) DEFAULT 0,
    driver_description TEXT,
    loading_comm    NUMERIC(10, 2) DEFAULT 0,
    unloading_comm  NUMERIC(10, 2) DEFAULT 0,
    loading_chg     NUMERIC(10, 2) DEFAULT 0,
    unloading_chg   NUMERIC(10, 2) DEFAULT 0,
    status          trip_status DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- ── LOADS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name    VARCHAR(255) NOT NULL,
    quantity        NUMERIC(10, 2) DEFAULT 0,
    rent_type       rent_type NOT NULL,
    gross_rent      NUMERIC(12, 2) DEFAULT 0,
    collected_status BOOLEAN DEFAULT FALSE,
    loading_chg     NUMERIC(10, 2) DEFAULT 0,
    unloading_chg   NUMERIC(10, 2) DEFAULT 0,
    loading_comm    NUMERIC(10, 2) DEFAULT 0,
    unloading_comm  NUMERIC(10, 2) DEFAULT 0,
    broker_comm     NUMERIC(10, 2) DEFAULT 0,
    amount_collected NUMERIC(12, 2) DEFAULT 0,
    description    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRIP EXPENSES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trip_expenses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    amount         NUMERIC(10, 2) NOT NULL,
    description    TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── VEHICLE EXPENSES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicle_expenses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    type            expense_type NOT NULL,
    amount          NUMERIC(10, 2) NOT NULL,
    due_date        DATE,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── LEDGER ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ledger (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    amount          NUMERIC(12, 2) NOT NULL,
    type            ledger_type NOT NULL,
    trip_id         UUID REFERENCES trips(id) ON DELETE SET NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_loading_comm ON trips(loading_comm);
CREATE INDEX IF NOT EXISTS idx_trips_unloading_comm ON trips(unloading_comm);
CREATE INDEX IF NOT EXISTS idx_trips_loading_chg ON trips(loading_chg);
CREATE INDEX IF NOT EXISTS idx_trips_unloading_chg ON trips(unloading_chg);
CREATE INDEX IF NOT EXISTS idx_loads_trip ON loads(trip_id);
CREATE INDEX IF NOT EXISTS idx_loads_customer ON loads(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_product ON loads(product_id);
CREATE INDEX IF NOT EXISTS idx_products_customer ON products(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_collected ON loads(collected_status);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vehicle ON vehicle_expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type ON vehicle_expenses(type);
CREATE INDEX IF NOT EXISTS idx_ledger_driver ON ledger(driver_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON ledger(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_tax_due ON vehicles(tax_due_date);

-- ── PERMISSIONS ─────────────────────────────────────────────────────────────

GRANT ALL ON TABLE public.drivers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.vehicles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.customers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.trips TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.loads TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.trip_expenses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.vehicle_expenses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ledger TO anon, authenticated, service_role;
