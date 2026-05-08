
-- ── TRIP SETTLEMENT RPC ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION complete_trip_settlement(
    p_trip_id UUID,
    p_fuel_cost NUMERIC,
    p_other_expenses NUMERIC,
    p_driver_charge NUMERIC,
    p_loading_comm NUMERIC,
    p_unloading_comm NUMERIC,
    p_loading_chg NUMERIC,
    p_unloading_chg NUMERIC
)
RETURNS void AS $$
DECLARE
    v_driver_id UUID;
    v_trip_status TEXT;
BEGIN
    -- 1. Get trip details
    SELECT driver_id, status INTO v_driver_id, v_trip_status
    FROM trips
    WHERE id = p_trip_id
    FOR UPDATE;

    IF v_trip_status = 'completed' THEN
        RETURN;
    END IF;

    -- 2. Record Trip Expenses as Credits to Driver in Ledger (for history/stats)
    
    -- Fuel
    IF p_fuel_cost > 0 THEN
        INSERT INTO ledger (driver_id, amount, type, trip_id, description)
        VALUES (v_driver_id, p_fuel_cost, 'Credit', p_trip_id, 'Fuel reimbursement');
    END IF;

    -- Driver Charge & Commissions (Driver's earnings)
    IF (p_driver_charge + p_loading_comm + p_unloading_comm) > 0 THEN
        INSERT INTO ledger (driver_id, amount, type, trip_id, description)
        VALUES (
            v_driver_id, 
            (p_driver_charge + p_loading_comm + p_unloading_comm), 
            'Credit', 
            p_trip_id, 
            'Driver earnings (Charge + Comms)'
        );
    END IF;

    -- Other Expenses & Trip Charges
    IF (p_other_expenses + p_loading_chg + p_unloading_chg) > 0 THEN
        INSERT INTO ledger (driver_id, amount, type, trip_id, description)
        VALUES (
            v_driver_id, 
            (p_other_expenses + p_loading_chg + p_unloading_chg), 
            'Credit', 
            p_trip_id, 
            'Trip-level charges/expenses'
        );
    END IF;

    -- 3. Update Trip Status and Costs
    UPDATE trips SET
        fuel_cost = p_fuel_cost,
        other_expenses = p_other_expenses,
        driver_charge = p_driver_charge,
        loading_comm = p_loading_comm,
        unloading_comm = p_unloading_comm,
        loading_chg = p_loading_chg,
        unloading_chg = p_unloading_chg,
        status = 'completed',
        completed_at = NOW()
    WHERE id = p_trip_id;

END;
$$ LANGUAGE plpgsql;


-- ── CANCEL TRIP SETTLEMENT RPC ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cancel_trip_settlement_rpc(p_trip_id UUID)
RETURNS void AS $$
DECLARE
    v_driver_id UUID;
    v_trip_status TEXT;
BEGIN
    SELECT driver_id, status INTO v_driver_id, v_trip_status
    FROM trips
    WHERE id = p_trip_id
    FOR UPDATE;

    IF v_trip_status != 'completed' THEN
        RETURN;
    END IF;

    -- Remove all automatic ledger entries for this trip
    DELETE FROM ledger WHERE trip_id = p_trip_id;

    -- Reset trip status to active
    UPDATE trips SET 
        status = 'active',
        completed_at = NULL
    WHERE id = p_trip_id;
END;
$$ LANGUAGE plpgsql;


-- ── SETTLE LOAD RPC ──────────────────────────────────────────────────────────

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


-- ── ADJUST LEDGER AND BALANCE RPC ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION adjust_ledger_and_balance(
    p_driver_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_trip_id UUID,
    p_description TEXT
)
RETURNS void AS $$
BEGIN
    INSERT INTO ledger (driver_id, amount, type, trip_id, description)
    VALUES (p_driver_id, p_amount, p_type, p_trip_id, p_description);
END;
$$ LANGUAGE plpgsql;
