from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.core.supabase_client import get_supabase
from app.schemas.entities import ChargeOptionResult, Load, LoadCollectRequest, LoadCreate, LoadStatus
from app.services.charge_resolver import list_charge_options
from app.services.debt_calculator import compute_load_net

router = APIRouter()


def _with_net(load: dict) -> dict:
    load["net"] = compute_load_net(
        load["charge"], load.get("discount", 0.0), load["wages"],
        load.get("commission_loading", 0.0), load.get("commission_unloading", 0.0),
    )
    return load


@router.get("/", response_model=list[Load])
def list_loads(
    trip_id: UUID | None = None,
    unassigned_only: bool = Query(False, description="True = only loads with no trip_id (the pool)"),
    status: LoadStatus | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_supabase),
):
    query = db.table("loads").select("*").order("created_at", desc=True)
    if trip_id:
        query = query.eq("trip_id", str(trip_id))
    if unassigned_only:
        query = query.is_("trip_id", "null")
    if status:
        query = query.eq("status", status.value)
        
    query = query.range(offset, offset + limit - 1)
        
    res = query.execute()
    return [_with_net(l) for l in (res.data or [])]


@router.get("/charge-options", response_model=list[ChargeOptionResult])
def get_charge_options(
    product_id: UUID,
    customer_id: UUID | None = None,
    origin_place_id: UUID | None = None,
    destination_place_id: UUID | None = None,
    db: Client = Depends(get_supabase),
):
    """
    Every charge option that applies once a product (and optionally customer /
    route) is selected on the load-creation screen — e.g. a customer rate,
    a route rate, and every product default (Quantity, each KG bracket,
    Bulk, Custom) — so the user picks explicitly instead of the server
    silently resolving one via priority order.
    """
    return list_charge_options(
        db, product_id=product_id, customer_id=customer_id,
        origin_place_id=origin_place_id, destination_place_id=destination_place_id,
    )


@router.get("/{load_id}", response_model=Load)
def get_load(load_id: UUID, db: Client = Depends(get_supabase)):
    res = db.table("loads").select("*").eq("id", str(load_id)).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Load not found")
    return _with_net(res.data[0])


@router.post("/", response_model=Load, status_code=201)
def create_load(payload: LoadCreate, db: Client = Depends(get_supabase)):
    """
    Trusts the charge/charge_type/kg_variant/charge_rule_used the client
    submits — the client is expected to have called GET /loads/charge-options
    and let the user pick one (or entered a Custom amount) before this call.
    """
    data = payload.model_dump(mode="json", exclude_none=True)
    res = db.table("loads").insert(data).execute()
    return _with_net(res.data[0])


@router.patch("/{load_id}", response_model=Load)
def update_load(load_id: UUID, payload: LoadCreate, db: Client = Depends(get_supabase)):
    """Generic cell-edit endpoint for the inline-editable loads table."""
    data = payload.model_dump(mode="json", exclude_none=True)
    if data.get("status") == LoadStatus.collected.value:
        raise HTTPException(
            status_code=400,
            detail="Use POST /loads/{id}/collect to mark a load Collected (it unlocks discount via the confirm step).",
        )
    res = db.table("loads").update(data).eq("id", str(load_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Load not found")
    return _with_net(res.data[0])


@router.patch("/{load_id}/attach-to-trip", response_model=Load)
def attach_to_trip(load_id: UUID, trip_id: UUID, db: Client = Depends(get_supabase)):
    """Used by the 'Start with Loads' flow: batch-assign pooled loads into a newly created trip."""
    res = db.table("loads").update({"trip_id": str(trip_id)}).eq("id", str(load_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Load not found")
    return _with_net(res.data[0])


@router.post("/{load_id}/collect", response_model=Load)
def collect_load(load_id: UUID, payload: LoadCollectRequest, db: Client = Depends(get_supabase)):
    """
    The "Complete Load" step: discount, wages, and commission are all only
    ever set here, at the moment the load flips to 'collected' — the owner
    only knows these real amounts once the load is actually finished, not
    when it was first created.
    """
    data: dict = {"status": LoadStatus.collected.value, "discount": payload.discount}
    if payload.wages is not None:
        data["wages"] = payload.wages
    if payload.commission_loading is not None:
        data["commission_loading"] = payload.commission_loading
    if payload.commission_unloading is not None:
        data["commission_unloading"] = payload.commission_unloading

    res = db.table("loads").update(data).eq("id", str(load_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Load not found")
    return _with_net(res.data[0])


@router.post("/{load_id}/uncollect", response_model=Load)
def uncollect_load(load_id: UUID, db: Client = Depends(get_supabase)):
    """Reverts a collected load back to pending and zeroes out wages/commissions/discounts."""
    data = {
        "status": LoadStatus.pending.value,
        "discount": 0.0,
        "wages": 0.0,
        "commission_loading": 0.0,
        "commission_unloading": 0.0,
    }
    res = db.table("loads").update(data).eq("id", str(load_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Load not found")
    return _with_net(res.data[0])


@router.delete("/{load_id}", status_code=204)
def delete_load(load_id: UUID, db: Client = Depends(get_supabase)):
    db.table("loads").delete().eq("id", str(load_id)).execute()
    return None