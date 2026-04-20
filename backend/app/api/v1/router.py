from fastapi import APIRouter

from app.api.v1.endpoints import drivers, vehicles, customers, trips, loads, dashboard, auth

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(drivers.router)
api_router.include_router(vehicles.router)
api_router.include_router(customers.router)
api_router.include_router(trips.router)
api_router.include_router(loads.router)
api_router.include_router(dashboard.router)
