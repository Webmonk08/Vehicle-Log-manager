CREATE OR REPLACE FUNCTION delete_driver(driver_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE drivers SET status = FALSE WHERE id = driver_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_vehicle(vehicle_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE vehicles SET status = FALSE WHERE id = vehicle_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_customer(customer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE customers SET status = FALSE WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql;