from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient
from uuid import UUID
from typing import List

from app.core.database import get_supabase
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.repositories import repo

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[ProductResponse])
async def get_products(customer_id: UUID = None, client: AsyncClient = Depends(get_supabase)):
    if customer_id:
        return await repo.get_products_for_customer(client, customer_id)
    return await repo.get_products(client)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, client: AsyncClient = Depends(get_supabase)):
    product = await repo.get_product(client, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, client: AsyncClient = Depends(get_supabase)):
    try:
        return await repo.create_product(client, **data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: UUID, data: ProductUpdate, client: AsyncClient = Depends(get_supabase)):
    product = await repo.get_product(client, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return await repo.update_product(client, product_id, **data.model_dump(exclude_unset=True))

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: UUID, client: AsyncClient = Depends(get_supabase)):
    product = await repo.get_product(client, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await repo.delete_product(client, product_id)
    return None
