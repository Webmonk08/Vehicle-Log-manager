"""
Dashboard analytics service — aggregates income, expenses, and stats.
"""
from supabase import AsyncClient
from app.schemas import DashboardResponse


async def get_dashboard(client: AsyncClient, period: str = "monthly") -> DashboardResponse:
    """
    Build dashboard data with income vs expenses over the requested period.
    Uses a PostgreSQL RPC for high performance.
    period: "weekly" | "monthly" | "yearly"
    """
    # Call the optimized RPC function
    response = await client.rpc("get_dashboard_analytics", {"p_period": period}).execute()
    
    data = response.data
    
    # The RPC returns a single JSON object
    return DashboardResponse(**data)
