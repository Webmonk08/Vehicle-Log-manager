from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.core.database import get_supabase
from app.schemas import DriverCreate, DriverUpdate, DriverResponse, LedgerResponse, LoadResponse
from app.repositories import repo

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("", response_model=list[DriverResponse])
async def list_drivers(client: AsyncClient = Depends(get_supabase)):
    return await repo.get_drivers(client)


@router.post("", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(data: DriverCreate, client: AsyncClient = Depends(get_supabase)):
    return await repo.create_driver(client, name=data.name, contact=data.contact)


@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: str, client: AsyncClient = Depends(get_supabase)):
    driver = await repo.get_driver(client, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: str, data: DriverUpdate, client: AsyncClient = Depends(get_supabase)):
    driver = await repo.get_driver(client, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return await repo.update_driver(client, driver, **data.model_dump(exclude_unset=True))


@router.get("/{driver_id}/ledger", response_model=list[LedgerResponse])
async def get_driver_ledger(driver_id: str, client: AsyncClient = Depends(get_supabase)):
    return await repo.get_ledger_for_driver(client, driver_id)


@router.get("/{driver_id}/uncollected", response_model=list[LoadResponse])
async def get_driver_uncollected_loads(driver_id: str, client: AsyncClient = Depends(get_supabase)):
    loads = await repo.get_uncollected_loads_for_driver(client, driver_id)
    result = []
    for load in loads:
        load_dict = LoadResponse.model_validate(load)
        if load.customer:
            load_dict.customer_name = load.customer.name
        result.append(load_dict)
    return result
