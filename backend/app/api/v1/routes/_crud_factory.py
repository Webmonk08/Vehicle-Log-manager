"""
Generic CRUD router factory for simple entities (Vehicle, Customer, Product,
Place, ChargeRule, VehicleExpense) that don't need custom business logic.
Trip / Load / Driver / TripExpense / DriverSettlement get their own hand-written
routers because they hook into debt_calculator / charge_resolver.
"""
from typing import Type
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.core.supabase_client import get_supabase


def make_crud_router(*, table: str, create_schema: Type[BaseModel], read_schema: Type[BaseModel]) -> APIRouter:
    router = APIRouter()

    @router.get("/", response_model=list[read_schema])
    def list_items(db: Client = Depends(get_supabase)):
        res = db.table(table).select("*").order("created_at", desc=True).execute()
        return res.data or []

    @router.get("/{item_id}", response_model=read_schema)
    def get_item(item_id: UUID, db: Client = Depends(get_supabase)):
        res = db.table(table).select("*").eq("id", str(item_id)).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"{table[:-1]} not found")
        return res.data[0]

    @router.post("/", response_model=read_schema, status_code=201)
    def create_item(payload: create_schema, db: Client = Depends(get_supabase)):
        res = db.table(table).insert(payload.model_dump(mode="json", exclude_none=True)).execute()
        return res.data[0]

    @router.patch("/{item_id}", response_model=read_schema)
    def update_item(item_id: UUID, payload: create_schema, db: Client = Depends(get_supabase)):
        res = (
            db.table(table)
            .update(payload.model_dump(mode="json", exclude_none=True))
            .eq("id", str(item_id))
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail=f"{table[:-1]} not found")
        return res.data[0]

    @router.delete("/{item_id}", status_code=204)
    def delete_item(item_id: UUID, db: Client = Depends(get_supabase)):
        db.table(table).delete().eq("id", str(item_id)).execute()
        return None

    return router
