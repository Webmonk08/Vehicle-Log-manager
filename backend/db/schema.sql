-- Vehicle Log Manager — Supabase (Postgres) schema
-- Run this in the Supabase SQL editor.

create extension if not exists "uuid-ossp";

-- ---------- Reference / master data ----------

create table places (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  region text,
  created_at timestamptz not null default now()
);

create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  number text not null unique,
  type text,
  capacity numeric,
  rc_expiry date,
  insurance_expiry date,
  permit_expiry date,
  created_at timestamptz not null default now()
);

create table drivers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  license_number text,
  license_expiry date,
  created_at timestamptz not null default now()
  -- NOTE: no debt column here on purpose — always computed live (see views below)
);

create table customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  place_id uuid references places(id) on delete set null,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  default_charge_type text not null check (default_charge_type in ('quantity', 'kg', 'bulk', 'custom')),
  default_rate numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Charge rules (priority: customer > route > product default) ----------

create table charge_rules (
  id uuid primary key default uuid_generate_v4(),
  scope text not null check (scope in ('customer', 'route', 'product_default')),
  product_id uuid references products(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  origin_place_id uuid references places(id) on delete cascade,
  destination_place_id uuid references places(id) on delete cascade,
  charge_type text not null check (charge_type in ('quantity', 'kg', 'bulk', 'custom')),
  rate numeric not null,
  created_at timestamptz not null default now()
);

create index idx_charge_rules_customer_product on charge_rules(customer_id, product_id) where scope = 'customer';
create index idx_charge_rules_route on charge_rules(origin_place_id, destination_place_id) where scope = 'route';

-- ---------- Trips & Loads ----------

create table trips (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete restrict,
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  start_date date not null,
  end_date date,
  status text not null default 'ongoing' check (status in ('ongoing', 'completed')),
  created_at timestamptz not null default now()
);

create index idx_trips_driver on trips(driver_id);
create index idx_trips_vehicle on trips(vehicle_id);
create index idx_trips_status on trips(status);

create table loads (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,  -- nullable: supports the "unassigned pool"
  product_id uuid not null references products(id) on delete restrict,
  customer_id uuid not null references customers(id) on delete restrict,
  origin_place_id uuid references places(id) on delete set null,
  destination_place_id uuid references places(id) on delete set null,
  quantity numeric,
  weight_kg numeric,
  charge_type text not null check (charge_type in ('quantity', 'kg', 'bulk', 'custom')),
  charge numeric not null default 0,
  charge_rule_used text,  -- 'customer' | 'route' | 'product_default' | 'custom' — for UI display only
  discount numeric not null default 0,  -- only meaningful once status = 'collected'
  wages numeric not null default 0,     -- mandatory
  commission_loading numeric not null default 0,
  commission_unloading numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'in_transit', 'delivered', 'collected')),
  created_at timestamptz not null default now()
);

create index idx_loads_trip on loads(trip_id);
create index idx_loads_status on loads(status);
create index idx_loads_unassigned on loads(trip_id) where trip_id is null;

-- ---------- Expenses & Settlements ----------

create table trip_expenses (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  category text not null check (category in ('fuel', 'toll', 'driver_wage', 'other')),
  custom_label text,
  amount numeric not null,
  note text,
  date date not null,
  created_at timestamptz not null default now()
);

create index idx_trip_expenses_trip on trip_expenses(trip_id);

create table vehicle_expenses (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  category text not null,
  amount numeric not null,
  is_recurring boolean not null default false,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_vehicle_expenses_vehicle on vehicle_expenses(vehicle_id);

create table driver_settlements (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,  -- open item: optionally linked to a trip
  amount numeric not null,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_driver_settlements_driver on driver_settlements(driver_id);

-- ---------- Live debt views ----------
-- Net per load = charge - discount - wages - commission_loading - commission_unloading
-- Driver debt (live) = sum(net of COLLECTED loads) - sum(trip expenses) - sum(settlements)

create or replace view load_net as
select
  l.*,
  (l.charge - l.discount - l.wages - l.commission_loading - l.commission_unloading) as net
from loads l;

create or replace view trip_debt as
select
  t.id as trip_id,
  coalesce(sum(ln.net) filter (where ln.status = 'collected'), 0) as collected,
  coalesce(sum(ln.net) filter (where ln.status != 'collected'), 0) as pending,
  coalesce((select sum(amount) from trip_expenses te where te.trip_id = t.id), 0) as expenses,
  coalesce((select sum(amount) from driver_settlements ds where ds.trip_id = t.id), 0) as settlements,
  coalesce(sum(ln.net) filter (where ln.status = 'collected'), 0)
    - coalesce((select sum(amount) from trip_expenses te where te.trip_id = t.id), 0)
    - coalesce((select sum(amount) from driver_settlements ds where ds.trip_id = t.id), 0) as net_debt
from trips t
left join load_net ln on ln.trip_id = t.id
group by t.id;

create or replace view driver_debt as
select
  d.id as driver_id,
  coalesce(sum(ln.net) filter (where ln.status = 'collected'), 0) as collected,
  coalesce(sum(ln.net) filter (where ln.status != 'collected'), 0) as pending,
  coalesce((select sum(te.amount) from trip_expenses te join trips t2 on t2.id = te.trip_id where t2.driver_id = d.id), 0) as expenses,
  coalesce((select sum(ds.amount) from driver_settlements ds where ds.driver_id = d.id), 0) as settlements,
  coalesce(sum(ln.net) filter (where ln.status = 'collected'), 0)
    - coalesce((select sum(te.amount) from trip_expenses te join trips t2 on t2.id = te.trip_id where t2.driver_id = d.id), 0)
    - coalesce((select sum(ds.amount) from driver_settlements ds where ds.driver_id = d.id), 0) as net_debt
from drivers d
left join trips t on t.driver_id = d.id
left join load_net ln on ln.trip_id = t.id
group by d.id;

-- The FastAPI service layer (app/services/debt_calculator.py) currently computes
-- these in Python for portability, but these views are ready to swap in for
-- performance once query volume grows (per plan section 2.2).

CREATE OR REPLACE FUNCTION get_debt_summary(p_driver_id UUID)
RETURNS TABLE (
    driver_id UUID,
    collected NUMERIC,
    pending NUMERIC,
    expenses NUMERIC,
    settlements NUMERIC,
    net_debt NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.driver_id,
        d.collected,
        d.pending,
        d.expenses,
        d.settlements,
        d.net_debt
    FROM driver_debt d
    WHERE d.driver_id = p_driver_id;
END;
$$ LANGUAGE plpgsql STABLE;
