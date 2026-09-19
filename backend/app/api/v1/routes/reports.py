from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.core.supabase_client import get_supabase
from app.services.debt_calculator import compute_load_net

router = APIRouter()


@router.get("/summary")
def reports_summary(
    date_from: date = Query(...),
    date_to: date = Query(...),
    driver_id: UUID | None = None,
    vehicle_id: UUID | None = None,
    customer_id: UUID | None = None,
    db: Client = Depends(get_supabase),
):
    """
    Revenue / expenses / outstanding debt / trip count for the Reports screen.
    Filters are applied at the trip level (driver/vehicle) or load level (customer).
    Uses the get_reports_summary RPC function to execute calculations on the DB.
    """
    params = {
        "p_date_from": date_from.isoformat(),
        "p_date_to": date_to.isoformat(),
        "p_driver_id": str(driver_id) if driver_id else None,
        "p_vehicle_id": str(vehicle_id) if vehicle_id else None,
        "p_customer_id": str(customer_id) if customer_id else None,
    }
    
    # We call the RPC and expect a single row back
    res = db.rpc("get_reports_summary", params).execute()
    data = res.data[0] if res.data else {}

    return {
        "revenue": data.get("revenue") or 0.0,
        "expenses": data.get("expenses") or 0.0,
        "outstanding_debt": data.get("outstanding_debt") or 0.0,
        "trip_count": data.get("trip_count") or 0,
    }
