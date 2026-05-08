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

-- 2. Add product_id and amount_collected to loads table
ALTER TABLE loads ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS amount_collected NUMERIC(12, 2) DEFAULT 0;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_products_customer ON products(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_product ON loads(product_id);

-- 4. Grant permissions
GRANT ALL ON TABLE products TO anon, authenticated, service_role;

-- 5. Update Settle Function
CREATE OR REPLACE FUNCTION settle_uncollected_load_rpc(
    p_load_id UUID,
    p_amount_received NUMERIC,
    p_loading_chg NUMERIC,
    p_unloading_chg NUMERIC,
    p_loading_comm NUMERIC,
    p_unloading_comm NUMERIC,
    p_broker_comm NUMERIC
)
RETURNS void AS $$
DECLARE
    v_trip_id UUID;
    v_driver_id UUID;
    v_gross_rent NUMERIC;
    v_total_net_rent NUMERIC;
    v_new_amount_collected NUMERIC;
    v_product_name TEXT;
    v_collected_status BOOLEAN;
BEGIN
    SELECT trip_id, gross_rent, product_name, collected_status, COALESCE(amount_collected, 0)
    INTO v_trip_id, v_gross_rent, v_product_name, v_collected_status, v_new_amount_collected
    FROM loads
    WHERE id = p_load_id
    FOR UPDATE;

    IF v_collected_status = true THEN
        RETURN;
    END IF;

    SELECT driver_id INTO v_driver_id FROM trips WHERE id = v_trip_id;

    -- Update total collected
    v_new_amount_collected := v_new_amount_collected + p_amount_received;

    -- Calculate current Net Rent target
    v_total_net_rent := v_gross_rent - p_loading_chg - p_unloading_chg - p_loading_comm - p_unloading_comm - p_broker_comm;

    -- Mark as collected only if full amount is reached
    UPDATE loads SET
        amount_collected = v_new_amount_collected,
        collected_status = (v_new_amount_collected >= v_total_net_rent),
        loading_chg = p_loading_chg,
        unloading_chg = p_unloading_chg,
        loading_comm = p_loading_comm,
        unloading_comm = p_unloading_comm,
        broker_comm = p_broker_comm
    WHERE id = p_load_id;

    -- Create Ledger Entry for the received amount
    IF p_amount_received > 0 THEN
        INSERT INTO ledger (driver_id, amount, type, trip_id, description)
        VALUES (
            v_driver_id, 
            p_amount_received, 
            'Credit', 
            v_trip_id, 
            'Partial Settlement: ' || v_product_name || ' cash handover'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
