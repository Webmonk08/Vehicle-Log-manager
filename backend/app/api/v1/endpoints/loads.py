from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient
import logging

from app.core.database import get_supabase
from app.schemas.schemas import (
    LoadCreate, LoadUpdate, LoadResponse,
    LoadSettleRequest, RentCalculationRequest, RentCalculationResponse,
)
from app.repositories import repo
from app.services.pricing import calculate_rent
from app.services.settlement import settle_load, handle_load_deletion, handle_load_update

router = APIRouter(prefix="/loads", tags=["Loads"])
logger = logging.getLogger(__name__)


def prepare_load_response(load: dict) -> dict:

    """Inject convenience fields for the frontend."""
    if not load:
        return load
    
    if "customer" in load and load["customer"]:
        load["customer_name"] = load["customer"].get("name")
        load["customer_id"] = load["customer"].get("id")
        
    return load

@router.post("", response_model=LoadResponse, status_code=status.HTTP_201_CREATED)
async def create_load(data: LoadCreate, client: AsyncClient = Depends(get_supabase)):
    # Validate trip exists and is active
    trip = await repo.get_trip(client, data.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Cannot add loads to a completed trip")

    # Get customer for pricing
    customer = await repo.get_customer(client, data.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Get product if provided
    product = None
    if data.product_id:
        product = await repo.get_product(client, data.product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

    # Calculate rent using pricing engine
    try:
        gross_rent = calculate_rent(
            rent_type=data.rent_type,
            quantity=data.quantity,
            customer=customer,
            manual_gross_rent=data.gross_rent,
            product=product
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    load_data = data.model_dump()
    load_data["gross_rent"] = gross_rent

    load = await repo.create_load(client, **load_data)
    return LoadResponse.model_validate(prepare_load_response(load))


@router.get("/{load_id}", response_model=LoadResponse)
async def get_load(load_id: str, client: AsyncClient = Depends(get_supabase)):
    load = await repo.get_load(client, load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return LoadResponse.model_validate(prepare_load_response(load))


@router.put("/{load_id}", response_model=LoadResponse)
async def update_load(load_id: str, data: LoadUpdate, client: AsyncClient = Depends(get_supabase)):
    load = await repo.get_load(client, load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    try:
        updated = await handle_load_update(client, load, data.model_dump(exclude_unset=True))
        return LoadResponse.model_validate(prepare_load_response(updated))
    except Exception as e:
        logger.error(f"Failed to update load: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update load: {str(e)}")


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
            client, load,
            amount_received=data.amount_received,
            loading_chg=data.loading_chg,
            unloading_chg=data.unloading_chg,
            loading_comm=data.loading_comm,
            unloading_comm=data.unloading_comm,
            broker_comm=data.broker_comm,
        )
        return LoadResponse.model_validate(prepare_load_response(settled))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to settle load: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to settle load: {str(e)}")


@router.delete("/{load_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_load(load_id: str, client: AsyncClient = Depends(get_supabase)):
    load = await repo.get_load(client, load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # If trip is completed, handle uncollected load deletion impacts
    try:
        await handle_load_deletion(client, load)
    except Exception as e:
        logger.error(f"Failed to handle load deletion impact: {str(e)}", exc_info=True)

    await repo.delete_load(client, load_id)
    return None


@router.post("/calculate-rent", response_model=RentCalculationResponse)
async def calculate_rent_preview(
    data: RentCalculationRequest,
    client: AsyncClient = Depends(get_supabase),
):
    customer = await repo.get_customer(client, data.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # For preview, we don't have product_id in RentCalculationRequest yet, 
    # but the frontend will usually just send the manual gross_rent if it wants to override.
    # If we wanted to support product_id in preview, we'd update RentCalculationRequest schema.
    
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
