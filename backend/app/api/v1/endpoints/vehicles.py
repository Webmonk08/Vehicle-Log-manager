from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import AsyncClient

from app.core.database import get_supabase
from app.models.models import ExpenseType
from app.schemas import (
    VehicleCreate, VehicleUpdate, VehicleResponse,
    VehicleExpenseCreate, VehicleExpenseResponse,
)
from app.repositories import repo

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(client: AsyncClient = Depends(get_supabase)):
    return await repo.get_vehicles(client, status=True)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(data: VehicleCreate, client: AsyncClient = Depends(get_supabase)):
    return await repo.create_vehicle(client, **data.model_dump())


@router.get("/tax-reminders", response_model=list[VehicleResponse])
async def get_tax_reminders(client: AsyncClient = Depends(get_supabase)):
    return await repo.get_vehicles_tax_due(client)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, client: AsyncClient = Depends(get_supabase)):
    vehicle = await repo.get_vehicle(client, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(vehicle_id: str, data: VehicleUpdate, client: AsyncClient = Depends(get_supabase)):
    vehicle = await repo.get_vehicle(client, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return await repo.update_vehicle(client, vehicle["id"], **data.model_dump(exclude_unset=True))


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(vehicle_id: str, client: AsyncClient = Depends(get_supabase)):
    vehicle = await repo.get_vehicle(client, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    await repo.delete_vehicle(client, vehicle_id)


@router.get("/{vehicle_id}/expenses", response_model=list[VehicleExpenseResponse])
async def get_vehicle_expenses(
    vehicle_id: str,
    expense_type: ExpenseType | None = Query(None),
    client: AsyncClient = Depends(get_supabase),
):
    return await repo.get_vehicle_expenses(client, vehicle_id, expense_type)


@router.post("/expenses", response_model=VehicleExpenseResponse, status_code=status.HTTP_201_CREATED)
async def add_vehicle_expense(data: VehicleExpenseCreate, client: AsyncClient = Depends(get_supabase)):
    vehicle = await repo.get_vehicle(client, data.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return await repo.create_vehicle_expense(client, **data.model_dump())


@router.put("/expenses/{expense_id}", response_model=VehicleExpenseResponse)
async def update_vehicle_expense(
    expense_id: str,
    data: VehicleExpenseCreate,
    client: AsyncClient = Depends(get_supabase),
):
    # Re-use Create schema for simple update or create a new one if needed
    return await repo.update_vehicle_expense(client, expense_id, **data.model_dump())


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle_expense(expense_id: str, client: AsyncClient = Depends(get_supabase)):
    await repo.delete_vehicle_expense(client, expense_id)
    return None
