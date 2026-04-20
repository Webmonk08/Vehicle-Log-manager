from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.core.database import get_supabase
from app.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from app.repositories import repo

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=list[CustomerResponse])
async def list_customers(client: AsyncClient = Depends(get_supabase)):
    return await repo.get_customers(client)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(data: CustomerCreate, client: AsyncClient = Depends(get_supabase)):
    return await repo.create_customer(
        db, name=data.name, default_rate_per_kg=data.default_rate_per_kg
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, client: AsyncClient = Depends(get_supabase)):
    customer = await repo.get_customer(client, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, data: CustomerUpdate, client: AsyncClient = Depends(get_supabase)):
    customer = await repo.get_customer(client, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return await repo.update_customer(client, customer, **data.model_dump(exclude_unset=True))
