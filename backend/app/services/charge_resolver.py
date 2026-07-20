"""
Returns EVERY charge option that applies to a product (for a given customer
and/or route), so the load-creation UI can show the user a real choice —
e.g. "Customer rate: Bulk ₹500", "Route rate: 25kg ₹120/bag",
"Default: Quantity ₹50" — rather than the server silently picking one via
priority order. The old plan's priority order (customer > route > product
default) is preserved only as the *default selection* the frontend
highlights first; the user can still pick any listed option.
"""
from typing import Optional
from uuid import UUID

from supabase import Client

from app.schemas.entities import ChargeOptionResult


def list_charge_options(
    db: Client,
    *,
    product_id: UUID,
    customer_id: Optional[UUID] = None,
    origin_place_id: Optional[UUID] = None,
    destination_place_id: Optional[UUID] = None,
) -> list[ChargeOptionResult]:
    options: list[ChargeOptionResult] = []

    # Customer-specific rates for this product (every charge_type/KG bracket that customer has)
    if customer_id:
        res = (
            db.table("charge_rules")
            .select("*")
            .eq("scope", "customer")
            .eq("product_id", str(product_id))
            .eq("customer_id", str(customer_id))
            .execute()
        )
        for r in res.data or []:
            options.append(ChargeOptionResult(
                id=r["id"], source="customer", charge_type=r["charge_type"],
                kg_variant=r.get("kg_variant"), rate=r["rate"],
            ))

    # Route-specific rates for this product on this origin->destination pair
    if origin_place_id and destination_place_id:
        res = (
            db.table("charge_rules")
            .select("*")
            .eq("scope", "route")
            .eq("product_id", str(product_id))
            .eq("origin_place_id", str(origin_place_id))
            .eq("destination_place_id", str(destination_place_id))
            .execute()
        )
        for r in res.data or []:
            options.append(ChargeOptionResult(
                id=r["id"], source="route", charge_type=r["charge_type"],
                kg_variant=r.get("kg_variant"), rate=r["rate"],
            ))

    # Every default charge option this product has (Quantity, each KG bracket, Bulk, Custom)
    res = db.table("product_charge_options").select("*").eq("product_id", str(product_id)).execute()
    for r in res.data or []:
        options.append(ChargeOptionResult(
            id=r["id"], source="product_default", charge_type=r["charge_type"],
            kg_variant=r.get("kg_variant"), rate=r["rate"],
        ))

    return options