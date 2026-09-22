from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.core.supabase_client import get_supabase
from app.schemas.entities import (
    DebtSummary, Driver, DriverCreate, DriverLedgerEntry,
    DriverSettlement, DriverSettlementCreate,
)
from app.services.debt_calculator import get_driver_debt_summary, get_driver_ledger

router = APIRouter()


@router.get("/", response_model=list[Driver])
def list_drivers(db: Client = Depends(get_supabase)):
    res = db.table("drivers").select("*").execute()
    drivers = res.data or []
    
    # Fetch all driver debts in one go to avoid N+1 queries
    debt_res = db.table("driver_debt").select("driver_id, net_debt").execute()
    debt_map = {d["driver_id"]: d["net_debt"] for d in (debt_res.data or [])}
    
    for d in drivers:
        d["debt"] = debt_map.get(d["id"], 0.0)
    return drivers


@router.get("/{driver_id}", response_model=Driver)
def get_driver(driver_id: UUID, db: Client = Depends(get_supabase)):
    res = db.table("drivers").select("*").eq("id", str(driver_id)).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    driver = res.data[0]
    driver["debt"] = get_driver_debt_summary(db, driver_id).net_debt
    return driver


@router.post("/", response_model=Driver, status_code=201)
def create_driver(payload: DriverCreate, db: Client = Depends(get_supabase)):
    res = db.table("drivers").insert(payload.model_dump(mode="json", exclude_none=True)).execute()
    driver = res.data[0]
    driver["debt"] = 0.0
    return driver


@router.patch("/{driver_id}", response_model=Driver)
def update_driver(driver_id: UUID, payload: DriverCreate, db: Client = Depends(get_supabase)):
    res = db.table("drivers").update(payload.model_dump(mode="json", exclude_none=True)).eq(
        "id", str(driver_id)
    ).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    driver = res.data[0]
    driver["debt"] = get_driver_debt_summary(db, driver_id).net_debt
    return driver


@router.get("/{driver_id}/debt-summary", response_model=DebtSummary)
def driver_debt_summary(driver_id: UUID, db: Client = Depends(get_supabase)):
    return get_driver_debt_summary(db, driver_id)


@router.get("/{driver_id}/ledger", response_model=list[DriverLedgerEntry])
def driver_ledger(driver_id: UUID, db: Client = Depends(get_supabase)):
    return get_driver_ledger(db, driver_id)


@router.delete("/{driver_id}", status_code=204)
def delete_driver(driver_id: UUID, db: Client = Depends(get_supabase)):
    res = db.table("drivers").delete().eq("id", str(driver_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    return None


@router.post("/{driver_id}/settlements", response_model=DriverSettlement, status_code=201)
def record_settlement(driver_id: UUID, payload: DriverSettlementCreate, db: Client = Depends(get_supabase)):
    """Owner logs a cash handover from the driver — reduces debt immediately."""
    if payload.driver_id != driver_id:
        raise HTTPException(status_code=400, detail="driver_id mismatch between path and body")
    res = db.table("driver_settlements").insert(payload.model_dump(mode="json", exclude_none=True)).execute()
    return res.data[0]
