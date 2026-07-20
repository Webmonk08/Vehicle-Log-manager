from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.core.supabase_client import get_supabase
from app.schemas.entities import TripExpense, TripExpenseCreate

router = APIRouter()


@router.get("/", response_model=list[TripExpense])
def list_trip_expenses(trip_id: UUID, db: Client = Depends(get_supabase)):
    res = db.table("trip_expenses").select("*").eq("trip_id", str(trip_id)).order("date").execute()
    return res.data or []


@router.post("/", response_model=TripExpense, status_code=201)
def create_trip_expense(payload: TripExpenseCreate, db: Client = Depends(get_supabase)):
    """Fuel / Toll / Driver Wage / Other tiles all post here — reduces driver debt live, regardless of trip/load status."""
    res = db.table("trip_expenses").insert(payload.model_dump(mode="json", exclude_none=True)).execute()
    return res.data[0]


@router.patch("/{expense_id}", response_model=TripExpense)
def update_trip_expense(expense_id: UUID, payload: TripExpenseCreate, db: Client = Depends(get_supabase)):
    res = db.table("trip_expenses").update(payload.model_dump(mode="json", exclude_none=True)).eq(
        "id", str(expense_id)
    ).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Trip expense not found")
    return res.data[0]


@router.delete("/{expense_id}", status_code=204)
def delete_trip_expense(expense_id: UUID, db: Client = Depends(get_supabase)):
    db.table("trip_expenses").delete().eq("id", str(expense_id)).execute()
    return None
