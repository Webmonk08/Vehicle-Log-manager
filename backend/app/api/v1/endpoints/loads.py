from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.core.database import get_supabase
from app.schemas import (
    LoadCreate, LoadUpdate, LoadResponse,
    LoadSettleRequest, RentCalculationRequest, RentCalculationResponse,
)
from app.repositories import repo
from app.services.pricing import calculate_rent
from app.services.settlement import settle_load

router = APIRouter(prefix="/loads", tags=["Loads"])


@router.post("", response_model=LoadResponse, status_code=status.HTTP_201_CREATED)
async def create_load(data: LoadCreate, client: AsyncClient = Depends(get_supabase)):
    # Validate trip exists and is active
    trip = await repo.get_trip(client, data.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status.value == "completed":
        raise HTTPException(status_code=400, detail="Cannot add loads to a completed trip")

    # Get customer for pricing
    customer = await repo.get_customer(client, data.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Calculate rent using pricing engine
    try:
        gross_rent = calculate_rent(
            rent_type=data.rent_type,
            quantity=data.quantity,
            customer=customer,
            manual_gross_rent=data.gross_rent,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    load_data = data.model_dump()
    load_data["gross_rent"] = gross_rent

    load = await repo.create_load(client, **load_data)
    load_resp = LoadResponse.model_validate(load)
    load_resp.customer_name = customer.name
    return load_resp


@router.get("/{load_id}", response_model=LoadResponse)
async def get_load(load_id: str, client: AsyncClient = Depends(get_supabase)):
    load = await repo.get_load(client, load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    load_resp = LoadResponse.model_validate(load)
    if load.customer:
        load_resp.customer_name = load.customer.name
    return load_resp


@router.put("/{load_id}", response_model=LoadResponse)
async def update_load(load_id: str, data: LoadUpdate, client: AsyncClient = Depends(get_supabase)):
    load = await repo.get_load(client, load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    updated = await repo.update_load(client, load, **data.model_dump(exclude_unset=True))
    return LoadResponse.model_validate(updated)


@router.post("/{load_id}/settle", response_model=LoadResponse)
async def settle_load_endpoint(
    load_id: str,
    data: LoadSettleRequest,
    client: AsyncClient = Depends(get_supabase),
):
    load = await repo.get_load(client, load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    try:
        settled = await settle_load(
            db, load,
            loading_chg=data.loading_chg,
            unloading_chg=data.unloading_chg,
            loading_comm=data.loading_comm,
            unloading_comm=data.unloading_comm,
            broker_comm=data.broker_comm,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    load_resp = LoadResponse.model_validate(settled)
    if settled.customer:
        load_resp.customer_name = settled.customer.name
    return load_resp


@router.post("/calculate-rent", response_model=RentCalculationResponse)
async def calculate_rent_preview(
    data: RentCalculationRequest,
    client: AsyncClient = Depends(get_supabase),
):
    customer = await repo.get_customer(client, data.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        rent = calculate_rent(
            rent_type=data.rent_type,
            quantity=data.quantity,
            customer=customer,
            manual_gross_rent=data.gross_rent,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return RentCalculationResponse(calculated_rent=rent, rent_type=data.rent_type)
