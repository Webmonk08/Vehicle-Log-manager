-- Add indexes to improve lookup and filtering performance for Trips and Loads
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_loads_trip_id ON loads(trip_id);
CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON loads(customer_id);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
