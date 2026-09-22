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
