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
    """
    trips_query = db.table("trips").select("id").gte("start_date", date_from.isoformat()).lte(
        "start_date", date_to.isoformat()
    )
    if driver_id:
        trips_query = trips_query.eq("driver_id", str(driver_id))
    if vehicle_id:
        trips_query = trips_query.eq("vehicle_id", str(vehicle_id))
    trips = trips_query.execute().data or []
    trip_ids = [t["id"] for t in trips]

    revenue = 0.0
    outstanding_debt = 0.0
    if trip_ids:
        loads_query = db.table("loads").select("*").in_("trip_id", trip_ids)
        if customer_id:
            loads_query = loads_query.eq("customer_id", str(customer_id))
        loads = loads_query.execute().data or []
        for load in loads:
            net = compute_load_net(
                load["charge"], load.get("discount", 0.0), load["wages"],
                load.get("commission_loading", 0.0), load.get("commission_unloading", 0.0),
            )
            if load["status"] == "collected":
                revenue += net
            else:
                outstanding_debt += net

    expenses = 0.0
    if trip_ids:
        expenses_rows = db.table("trip_expenses").select("amount").in_("trip_id", trip_ids).execute().data or []
        expenses = sum(e["amount"] for e in expenses_rows)

    return {
        "revenue": revenue,
        "expenses": expenses,
        "outstanding_debt": outstanding_debt,
        "trip_count": len(trip_ids),
    }
