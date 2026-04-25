
-- ── DRIVER BALANCE VIEW (DYNAMIC DEBT CALCULATION) ─────────────────────────
-- This view calculates the driver's debt dynamically from Trips and Loads.
-- 1. Uncollected Net Rent increases debt.
-- 2. Trip Earnings/Reimbursements (Fuel, etc.) decrease debt.
-- 3. Manual Ledger entries (Trip ID is NULL) decrease debt.

CREATE OR REPLACE VIEW drivers_with_balance AS
WITH load_debt AS (
    -- Net amount the driver is holding from loads (uncollected only)
    SELECT 
        t.driver_id,
        SUM(
            COALESCE(l.gross_rent, 0) 
            - COALESCE(l.loading_chg, 0) 
            - COALESCE(l.unloading_chg, 0) 
            - COALESCE(l.loading_comm, 0) 
            - COALESCE(l.unloading_comm, 0) 
            - COALESCE(l.broker_comm, 0)
        ) AS uncollected_net_rent
    FROM trips t
    JOIN loads l ON t.id = l.trip_id
    WHERE l.collected_status = false
    GROUP BY t.driver_id
),
trip_credits AS (
    -- Money the business owes the driver (from completed trips)
    SELECT 
        driver_id,
        SUM(
            COALESCE(fuel_cost, 0) + 
            COALESCE(other_expenses, 0) + 
            COALESCE(driver_charge, 0) +
            COALESCE(loading_comm, 0) +
            COALESCE(unloading_comm, 0) +
            COALESCE(loading_chg, 0) +
            COALESCE(unloading_chg, 0)
        ) AS total_trip_credits
    FROM trips
    WHERE status = 'completed'
    GROUP BY driver_id
),
manual_cash AS (
    -- Manual payments from ledger (Trip ID is NULL)
    -- This handles cash handovers not linked to a specific trip
    SELECT 
        driver_id,
        SUM(CASE WHEN type = 'Credit' THEN amount ELSE -amount END) AS total_manual_payments
    FROM ledger
    WHERE trip_id IS NULL
    GROUP BY driver_id
)
SELECT 
    d.id,
    d.name,
    d.contact,
    d.created_at,
    (
        COALESCE(ld.uncollected_net_rent, 0) 
        - COALESCE(tc.total_trip_credits, 0) 
        - COALESCE(mc.total_manual_payments, 0)
    ) AS total_pending_amount
FROM drivers d
LEFT JOIN load_debt ld ON d.id = ld.driver_id
LEFT JOIN trip_credits tc ON d.id = tc.driver_id
LEFT JOIN manual_cash mc ON d.id = mc.driver_id;

-- ── PERMISSIONS ─────────────────────────────────────────────────────────────
GRANT SELECT ON drivers_with_balance TO anon;
GRANT SELECT ON drivers_with_balance TO authenticated;
GRANT SELECT ON drivers_with_balance TO service_role;
