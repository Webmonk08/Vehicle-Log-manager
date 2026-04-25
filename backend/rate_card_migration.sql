-- ============================================================================
-- Migration: Customer Rate Card System
-- ============================================================================

-- 1. Create products table
CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    default_rate    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_type       rent_type NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, name)
);

-- 2. Add product_id to loads table
ALTER TABLE loads ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_products_customer ON products(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_product ON loads(product_id);

-- 4. Grant permissions
GRANT ALL ON TABLE products TO anon, authenticated, service_role;
