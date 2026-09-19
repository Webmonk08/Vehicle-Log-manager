from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.core.supabase_client import get_supabase
from app.schemas.entities import LoadStatus, Trip, TripCreate, TripDebtSummary, TripStatus
from app.services.debt_calculator import get_trip_debt_summary

router = APIRouter()


@router.get("/", response_model=list[Trip])
def list_trips(
    status: TripStatus | None = None,
    driver_id: UUID | None = None,
    vehicle_id: UUID | None = None,
    date_from: str | None = Query(None, description="YYYY-MM-DD"),
    date_to: str | None = Query(None, description="YYYY-MM-DD"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_supabase),
):
    query = db.table("trips").select("*").order("start_date", desc=True).order("created_at", desc=True)
    if status:
        query = query.eq("status", status.value)
    if driver_id:
        query = query.eq("driver_id", str(driver_id))
    if vehicle_id:
        query = query.eq("vehicle_id", str(vehicle_id))
    if date_from:
        query = query.gte("start_date", date_from)
    if date_to:
        query = query.lte("start_date", date_to)
    
    # apply pagination
    query = query.range(offset, offset + limit - 1)
    
    res = query.execute()
    return res.data or []


@router.get("/{trip_id}", response_model=Trip)
def get_trip(trip_id: UUID, db: Client = Depends(get_supabase)):
    res = db.table("trips").select("*").eq("id", str(trip_id)).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    return res.data[0]


@router.post("/", response_model=Trip, status_code=201)
def create_trip(payload: TripCreate, db: Client = Depends(get_supabase)):
    """
    Covers both trip-creation flows from the plan:
    - "Start with Trip": call this first, then POST /loads with trip_id set.
    - "Start with Loads": loads are created earlier with trip_id=null, then
      the frontend calls this, followed by PATCH /loads/{id} to attach trip_id
      to each previously-unassigned load (see loads.attach_to_trip).
    """
    res = db.table("trips").insert(payload.model_dump(mode="json", exclude_none=True)).execute()
    return res.data[0]


@router.patch("/{trip_id}", response_model=Trip)
def update_trip(trip_id: UUID, payload: TripCreate, db: Client = Depends(get_supabase)):
    res = db.table("trips").update(payload.model_dump(mode="json", exclude_none=True)).eq(
        "id", str(trip_id)
    ).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    return res.data[0]


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: UUID, db: Client = Depends(get_supabase)):
    """Cascades to loads and trip_expenses (FK on delete cascade) — confirm in the UI before calling this."""
    db.table("trips").delete().eq("id", str(trip_id)).execute()
    return None


@router.get("/{trip_id}/debt-summary", response_model=TripDebtSummary)
def trip_debt_summary(trip_id: UUID, db: Client = Depends(get_supabase)):
    return get_trip_debt_summary(db, trip_id)


@router.post("/{trip_id}/complete", response_model=Trip)
def complete_trip(trip_id: UUID, db: Client = Depends(get_supabase)):
    """
    Guard for "Mark Trip Complete" (open item in the plan — condition decided
    here as: every load on the trip must be in 'collected' status). Adjust this
    single check if the rule changes; the button-disable logic on the frontend
    should mirror it via the same /debt-summary + loads fetch.
    """
    loads_res = db.table("loads").select("status").eq("trip_id", str(trip_id)).execute()
    loads = loads_res.data or []
    if not loads:
        raise HTTPException(status_code=400, detail="Trip has no loads")
    if any(l["status"] != LoadStatus.collected.value for l in loads):
        raise HTTPException(status_code=400, detail="All loads must be Collected before completing the trip")

    res = db.table("trips").update({"status": TripStatus.completed.value}).eq("id", str(trip_id)).execute()
    return res.data[0]