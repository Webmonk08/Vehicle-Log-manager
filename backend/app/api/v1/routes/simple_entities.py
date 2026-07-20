from app.api.v1.routes._crud_factory import make_crud_router
from app.schemas.entities import (
    Vehicle, VehicleCreate,
    Customer, CustomerCreate,
    Place, PlaceCreate,
    VehicleExpense, VehicleExpenseCreate,
)

vehicles_router = make_crud_router(table="vehicles", create_schema=VehicleCreate, read_schema=Vehicle)
customers_router = make_crud_router(table="customers", create_schema=CustomerCreate, read_schema=Customer)
places_router = make_crud_router(table="places", create_schema=PlaceCreate, read_schema=Place)
vehicle_expenses_router = make_crud_router(
    table="vehicle_expenses", create_schema=VehicleExpenseCreate, read_schema=VehicleExpense
)