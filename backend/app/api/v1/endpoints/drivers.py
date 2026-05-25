from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient
from typing import List
from app.core.database import get_supabase
from app.schemas.schemas import DriverCreate, DriverUpdate, DriverResponse, LedgerResponse, LoadResponse
from app.repositories import repo

router = APIRouter(prefix="/drivers", tags=["Drivers"])

def prepare_load_response(load: dict) -> dict:
    """Inject convenience fields for the frontend."""
    if not load:
        return load
    
    if "customer" in load and load["customer"]:
        load["customer_name"] = load["customer"].get("name")
        load["customer_id"] = load["customer"].get("id")
        
    return load

@router.get("", response_model=List[DriverResponse])
async def list_drivers(client: AsyncClient = Depends(get_supabase)):
    drivers_data = await repo.get_drivers(client, status=True)
    return [DriverResponse.model_validate(driver) for driver in drivers_data]


@router.post("", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(data: DriverCreate, client: AsyncClient = Depends(get_supabase)):
    driver = await repo.create_driver(client, name=data.name, contact=data.contact)
    return DriverResponse.model_validate(driver)


@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: str, client: AsyncClient = Depends(get_supabase)):
    driver = await repo.get_driver(client, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return DriverResponse.model_validate(driver)


@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: str, data: DriverUpdate, client: AsyncClient = Depends(get_supabase)):
    driver = await repo.get_driver(client, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    updated_driver = await repo.update_driver(client, driver["id"], **data.model_dump(exclude_unset=True))
    return DriverResponse.model_validate(updated_driver)


@router.get("/{driver_id}/ledger", response_model=List[LedgerResponse])
async def get_driver_ledger(driver_id: str, client: AsyncClient = Depends(get_supabase)):
    ledger_data = await repo.get_ledger_for_driver(client, driver_id)
    return [LedgerResponse.model_validate(entry) for entry in ledger_data]


@router.get("/{driver_id}/uncollected", response_model=List[LoadResponse])
async def get_driver_uncollected_loads(driver_id: str, client: AsyncClient = Depends(get_supabase)):
    loads = await repo.get_uncollected_loads_for_driver(client, driver_id)
    return [LoadResponse.model_validate(prepare_load_response(load)) for load in loads]

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(driver_id: str, client: AsyncClient = Depends(get_supabase)):
    driver = await repo.get_driver(client, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    await repo.delete_driver(client, driver_id)
