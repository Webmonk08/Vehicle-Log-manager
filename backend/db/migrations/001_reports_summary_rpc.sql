CREATE OR REPLACE FUNCTION get_reports_summary(
    p_date_from DATE,
    p_date_to DATE,
    p_driver_id UUID DEFAULT NULL,
    p_vehicle_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL
) RETURNS TABLE (
    revenue NUMERIC,
    expenses NUMERIC,
    outstanding_debt NUMERIC,
    trip_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_trips AS (
        SELECT id FROM trips
        WHERE start_date >= p_date_from 
          AND start_date <= p_date_to
          AND (p_driver_id IS NULL OR driver_id = p_driver_id)
          AND (p_vehicle_id IS NULL OR vehicle_id = p_vehicle_id)
    ),
    filtered_loads AS (
        SELECT 
            status,
            COALESCE(charge, 0) - COALESCE(discount, 0) - COALESCE(wages, 0) - COALESCE(commission_loading, 0) - COALESCE(commission_unloading, 0) AS net
        FROM loads
        WHERE trip_id IN (SELECT id FROM filtered_trips)
          AND (p_customer_id IS NULL OR customer_id = p_customer_id)
    )
    SELECT
        COALESCE(SUM(net) FILTER (WHERE status = 'collected'), 0) AS revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM trip_expenses WHERE trip_id IN (SELECT id FROM filtered_trips)) AS expenses,
        COALESCE(SUM(net) FILTER (WHERE status != 'collected'), 0) AS outstanding_debt,
        (SELECT COUNT(*) FROM filtered_trips) AS trip_count
    FROM filtered_loads;
END;
$$ LANGUAGE plpgsql STABLE;
