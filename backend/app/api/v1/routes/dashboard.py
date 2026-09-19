from fastapi import APIRouter, Depends
from supabase import Client

from app.core.supabase_client import get_supabase

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(db: Client = Depends(get_supabase)):
    """
    Returns high-level stats for the home screen dashboard in one fast query.
    """
    # Count ongoing trips
    trips_res = db.table("trips").select("id", count="exact").eq("status", "ongoing").limit(1).execute()
    ongoing_trips = trips_res.count if trips_res.count is not None else 0

    # Count pending loads
    loads_res = db.table("loads").select("id", count="exact").eq("status", "pending").limit(1).execute()
    pending_loads = loads_res.count if loads_res.count is not None else 0

    drivers_res = db.table("drivers").select("debt").execute()
    drivers = drivers_res.data or []
    total_debt = sum(d.get("debt") or 0.0 for d in drivers)

    return {
        "ongoing_trips": ongoing_trips,
        "pending_loads": pending_loads,
        "total_debt": total_debt,
    }
