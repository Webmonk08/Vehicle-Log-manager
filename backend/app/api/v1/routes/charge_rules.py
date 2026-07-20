from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.core.supabase_client import get_supabase
from app.schemas.entities import ChargeRule, ChargeRuleBatchCreate, ChargeRuleCreate

router = APIRouter()


@router.get("/", response_model=list[ChargeRule])
def list_charge_rules(
    product_id: UUID | None = None,
    customer_id: UUID | None = None,
    db: Client = Depends(get_supabase),
):
    query = db.table("charge_rules").select("*").order("created_at", desc=True)
    if product_id:
        query = query.eq("product_id", str(product_id))
    if customer_id:
        query = query.eq("customer_id", str(customer_id))
    res = query.execute()
    return res.data or []


@router.post("/batch", response_model=list[ChargeRule], status_code=201)
def batch_create_charge_rules(payload: ChargeRuleBatchCreate, db: Client = Depends(get_supabase)):
    """
    Lets the Charge Rules form submit several charge types (Quantity + every
    KG bracket + Bulk + Custom) for one customer/route + product combo in a
    single save, instead of re-opening "Add Rule" per charge type.
    """
    if payload.scope == "customer" and not payload.customer_id:
        raise HTTPException(status_code=400, detail="customer_id is required for a customer-scoped rule")
    if payload.scope == "route" and not (payload.origin_place_id and payload.destination_place_id):
        raise HTTPException(
            status_code=400, detail="origin_place_id and destination_place_id are required for a route-scoped rule"
        )
    if not payload.options:
        raise HTTPException(status_code=400, detail="No charge options supplied")
    for opt in payload.options:
        if opt.charge_type == "kg" and opt.kg_variant is None:
            raise HTTPException(status_code=400, detail="kg_variant (e.g. 25/50/100) is required for a KG charge option")

    rows = [
        {
            "scope": payload.scope.value,
            "product_id": str(payload.product_id),
            "customer_id": str(payload.customer_id) if payload.customer_id else None,
            "origin_place_id": str(payload.origin_place_id) if payload.origin_place_id else None,
            "destination_place_id": str(payload.destination_place_id) if payload.destination_place_id else None,
            "charge_type": o.charge_type.value,
            "kg_variant": o.kg_variant,
            "rate": o.rate,
        }
        for o in payload.options
    ]
    res = db.table("charge_rules").insert(rows).execute()
    return res.data


@router.patch("/{rule_id}", response_model=ChargeRule)
def update_charge_rule(rule_id: UUID, payload: ChargeRuleCreate, db: Client = Depends(get_supabase)):
    data = payload.model_dump(mode="json", exclude_none=True)
    res = db.table("charge_rules").update(data).eq("id", str(rule_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Charge rule not found")
    return res.data[0]


@router.delete("/{rule_id}", status_code=204)
def delete_charge_rule(rule_id: UUID, db: Client = Depends(get_supabase)):
    db.table("charge_rules").delete().eq("id", str(rule_id)).execute()
    return None