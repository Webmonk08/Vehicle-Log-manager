from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.core.supabase_client import get_supabase
from app.schemas.entities import (
    Product, ProductChargeOption, ProductChargeOptionBatchCreate,
    ProductChargeOptionCreate, ProductCreate,
)

router = APIRouter()


# ---------- Product (name only — every rate now lives in product_charge_options) ----------

@router.get("/", response_model=list[Product])
def list_products(db: Client = Depends(get_supabase)):
    res = db.table("products").select("*").order("created_at", desc=True).execute()
    return res.data or []


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: UUID, db: Client = Depends(get_supabase)):
    res = db.table("products").select("*").eq("id", str(product_id)).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return res.data[0]


@router.post("/", response_model=Product, status_code=201)
def create_product(payload: ProductCreate, db: Client = Depends(get_supabase)):
    res = db.table("products").insert(payload.model_dump(mode="json")).execute()
    return res.data[0]


@router.patch("/{product_id}", response_model=Product)
def update_product(product_id: UUID, payload: ProductCreate, db: Client = Depends(get_supabase)):
    res = db.table("products").update(payload.model_dump(mode="json")).eq("id", str(product_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return res.data[0]


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: UUID, db: Client = Depends(get_supabase)):
    """Cascades to product_charge_options (FK on delete cascade) — confirm in the UI before calling this."""
    db.table("products").delete().eq("id", str(product_id)).execute()
    return None


# ---------- Charge options sub-resource ----------
# Lets the "New Product" form submit Quantity + 25kg + 50kg + 100kg + Bulk +
# Custom all in one batch, instead of the user re-opening the form per type.

@router.get("/{product_id}/charge-options", response_model=list[ProductChargeOption])
def list_product_charge_options(product_id: UUID, db: Client = Depends(get_supabase)):
    res = (
        db.table("product_charge_options").select("*").eq("product_id", str(product_id))
        .order("created_at").execute()
    )
    return res.data or []


@router.post("/{product_id}/charge-options/batch", response_model=list[ProductChargeOption], status_code=201)
def batch_create_charge_options(
    product_id: UUID, payload: ProductChargeOptionBatchCreate, db: Client = Depends(get_supabase)
):
    if not payload.options:
        raise HTTPException(status_code=400, detail="No charge options supplied")
    for opt in payload.options:
        if opt.charge_type == "kg" and opt.kg_variant is None:
            raise HTTPException(status_code=400, detail="kg_variant (e.g. 25/50/100) is required for a KG charge option")
    rows = [
        {
            "product_id": str(product_id),
            "charge_type": o.charge_type.value,
            "kg_variant": o.kg_variant,
            "rate": o.rate,
        }
        for o in payload.options
    ]
    res = db.table("product_charge_options").insert(rows).execute()
    return res.data


@router.patch("/charge-options/{option_id}", response_model=ProductChargeOption)
def update_charge_option(option_id: UUID, payload: ProductChargeOptionCreate, db: Client = Depends(get_supabase)):
    data = {"charge_type": payload.charge_type.value, "kg_variant": payload.kg_variant, "rate": payload.rate}
    res = db.table("product_charge_options").update(data).eq("id", str(option_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Charge option not found")
    return res.data[0]


@router.delete("/charge-options/{option_id}", status_code=204)
def delete_charge_option(option_id: UUID, db: Client = Depends(get_supabase)):
    db.table("product_charge_options").delete().eq("id", str(option_id)).execute()
    return None