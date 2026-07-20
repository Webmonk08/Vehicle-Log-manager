-- Migration: multi-charge-variant support (KG brackets, product-scoped route/customer
-- rules, batch charge entry). Run this AFTER the original schema.sql if your database
-- already has the old products.default_charge_type / default_rate columns.

-- 1. New table: one row per charge option a product supports.
create table if not exists product_charge_options (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  charge_type text not null check (charge_type in ('quantity', 'kg', 'bulk', 'custom')),
  kg_variant numeric,
  rate numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_charge_options_product on product_charge_options(product_id);

-- 2. Backfill: turn each product's old single default rate into its first
--    product_charge_options row, so existing data isn't silently dropped.
insert into product_charge_options (product_id, charge_type, rate)
select id, default_charge_type, default_rate
from products
where default_charge_type is not null
on conflict do nothing;

-- 3. Drop the now-unused columns on products.
alter table products drop column if exists default_charge_type;
alter table products drop column if exists default_rate;

-- 4. charge_rules: add kg_variant, make product_id required, drop the
--    'product_default' scope (that concept now lives entirely in
--    product_charge_options).
alter table charge_rules add column if not exists kg_variant numeric;

-- Any existing scope='product_default' rows are now redundant with
-- product_charge_options (step 2 already captured the base defaults) — remove them.
delete from charge_rules where scope = 'product_default';

alter table charge_rules drop constraint if exists charge_rules_scope_check;
alter table charge_rules add constraint charge_rules_scope_check check (scope in ('customer', 'route'));

-- If any existing rows have a null product_id, you'll need to assign one manually
-- before this will succeed — check with:
--   select id from charge_rules where product_id is null;
alter table charge_rules alter column product_id set not null;

-- 5. loads: track which KG bracket was selected for a 'kg' charge_type load.
alter table loads add column if not exists kg_variant numeric;