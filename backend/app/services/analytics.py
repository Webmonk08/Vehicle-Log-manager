"""
Dashboard analytics service — aggregates income, expenses, and stats.
"""
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
from supabase import AsyncClient

from app.repositories import repo
from app.schemas import DashboardResponse, PeriodAnalytics


async def get_dashboard(client: AsyncClient, period: str = "monthly") -> DashboardResponse:
    """
    Build dashboard data with income vs expenses over the requested period.
    period: "weekly" | "monthly" | "yearly"
    """
    now = datetime.now(timezone.utc)

    # Overall totals (all time)
    total_income = await repo.get_total_income(client)
    total_expenses = await repo.get_total_expenses(client)
    active_trips = await repo.get_active_trip_count(client)
    pending_settlements = await repo.get_pending_settlement_count(client)
    tax_reminders = await repo.get_tax_reminder_count(client)

    # Period breakdown
    period_data = []
    if period == "weekly":
        # Last 8 weeks
        for i in range(7, -1, -1):
            start = now - timedelta(weeks=i + 1)
            end = now - timedelta(weeks=i)
            income = await repo.get_total_income(client, start, end)
            expenses = await repo.get_total_expenses(client, start, end)
            period_data.append(PeriodAnalytics(
                label=f"W{8 - i}",
                income=income,
                expenses=expenses,
                net_profit=income - expenses,
            ))
    elif period == "monthly":
        # Last 6 months
        for i in range(5, -1, -1):
            month_start = (now - relativedelta(months=i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = month_start + relativedelta(months=1) - timedelta(seconds=1)
            
            income = await repo.get_total_income(client, month_start, month_end)
            expenses = await repo.get_total_expenses(client, month_start, month_end)
            period_data.append(PeriodAnalytics(
                label=month_start.strftime("%b"),
                income=income,
                expenses=expenses,
                net_profit=income - expenses,
            ))
    elif period == "yearly":
        # Last 3 years
        for i in range(2, -1, -1):
            year_start = now.replace(month=1, day=1, year=now.year - i)
            year_end = now.replace(month=12, day=31, year=now.year - i)
            income = await repo.get_total_income(client, year_start, year_end)
            expenses = await repo.get_total_expenses(client, year_start, year_end)
            period_data.append(PeriodAnalytics(
                label=str(now.year - i),
                income=income,
                expenses=expenses,
                net_profit=income - expenses,
            ))

    return DashboardResponse(
        total_income=total_income,
        total_expenses=total_expenses,
        net_profit=total_income - total_expenses,
        active_trips=active_trips,
        pending_settlements=pending_settlements,
        tax_reminders_count=tax_reminders,
        period_data=period_data,
    )
