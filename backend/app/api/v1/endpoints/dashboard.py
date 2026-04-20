from fastapi import APIRouter, Depends, Query
from supabase import AsyncClient

from app.core.database import get_supabase
from app.schemas import DashboardResponse
from app.services.analytics import get_dashboard

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/analytics", response_model=DashboardResponse)
async def get_analytics(
    period: str = Query("monthly", regex="^(weekly|monthly|yearly)$"),
    client: AsyncClient = Depends(get_supabase),
):
    return await get_dashboard(client, period)
