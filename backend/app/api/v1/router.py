from fastapi import APIRouter

from app.api.v1.routes import charge_rules, drivers, expenses, loads, products, reports, trips
from app.api.v1.routes.simple_entities import (
    customers_router,
    places_router,
    vehicle_expenses_router,
    vehicles_router,
)

api_router = APIRouter()

api_router.include_router(vehicles_router, prefix="/vehicles", tags=["vehicles"])
api_router.include_router(drivers.router, prefix="/drivers", tags=["drivers"])
api_router.include_router(customers_router, prefix="/customers", tags=["customers"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(places_router, prefix="/places", tags=["places"])
api_router.include_router(charge_rules.router, prefix="/charge-rules", tags=["charge-rules"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(loads.router, prefix="/loads", tags=["loads"])
api_router.include_router(expenses.router, prefix="/trip-expenses", tags=["trip-expenses"])
api_router.include_router(vehicle_expenses_router, prefix="/vehicle-expenses", tags=["vehicle-expenses"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])