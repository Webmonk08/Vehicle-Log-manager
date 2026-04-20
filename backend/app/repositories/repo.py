"""
Repository layer — thin CRUD wrappers over Supabase REST client.
Each function takes a Supabase AsyncClient and returns dicts or lists of dicts.
"""
import uuid
import enum
from datetime import date, timedelta, datetime
from typing import Optional, Any
from supabase import AsyncClient

from app.models.models import TripStatus, RentType, ExpenseType, LedgerType

# Helper to convert UUIDs to strings for JSON serializability
def to_str(val: Any) -> Any:
    if isinstance(val, uuid.UUID):
        return str(val)
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    if isinstance(val, enum.Enum):
        return val.value
    return val


# ── Drivers ────────────────────────────────────────────────────────────────────

async def get_drivers(client: AsyncClient) -> list[dict]:
    response = await client.table("drivers").select("*").order("name").execute()
    return response.data

async def get_driver(client: AsyncClient, driver_id: str | uuid.UUID) -> dict | None:
    response = await client.table("drivers").select("*").eq("id", str(driver_id)).execute()
    return response.data[0] if response.data else None

async def create_driver(client: AsyncClient, name: str, contact: str | None = None) -> dict:
    data = {"name": name, "contact": contact}
    response = await client.table("drivers").insert(data).execute()
    return response.data[0]

async def update_driver(client: AsyncClient, driver_id: str | uuid.UUID, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("drivers").update(data).eq("id", str(driver_id)).execute()
    return response.data[0]


# ── Vehicles ───────────────────────────────────────────────────────────────────

async def get_vehicles(client: AsyncClient) -> list[dict]:
    response = await client.table("vehicles").select("*").order("plate_number").execute()
    return response.data

async def get_vehicle(client: AsyncClient, vehicle_id: str | uuid.UUID) -> dict | None:
    response = await client.table("vehicles").select("*").eq("id", str(vehicle_id)).execute()
    return response.data[0] if response.data else None

async def create_vehicle(client: AsyncClient, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("vehicles").insert(data).execute()
    return response.data[0]

async def update_vehicle(client: AsyncClient, vehicle_id: str | uuid.UUID, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("vehicles").update(data).eq("id", str(vehicle_id)).execute()
    return response.data[0]

async def get_vehicles_tax_due(client: AsyncClient, within_days: int = 7) -> list[dict]:
    cutoff = (date.today() + timedelta(days=within_days)).isoformat()
    response = await client.table("vehicles").select("*").not_.is_("tax_due_date", "null").lte("tax_due_date", cutoff).order("tax_due_date").execute()
    return response.data


# ── Customers ──────────────────────────────────────────────────────────────────

async def get_customers(client: AsyncClient) -> list[dict]:
    response = await client.table("customers").select("*").order("name").execute()
    return response.data

async def get_customer(client: AsyncClient, customer_id: str | uuid.UUID) -> dict | None:
    response = await client.table("customers").select("*").eq("id", str(customer_id)).execute()
    return response.data[0] if response.data else None

async def create_customer(client: AsyncClient, name: str, default_rate_per_kg: float | None = None) -> dict:
    data = {"name": name, "default_rate_per_kg": default_rate_per_kg}
    response = await client.table("customers").insert(data).execute()
    return response.data[0]

async def update_customer(client: AsyncClient, customer_id: str | uuid.UUID, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("customers").update(data).eq("id", str(customer_id)).execute()
    return response.data[0]


# ── Trips ──────────────────────────────────────────────────────────────────────

async def get_trips(client: AsyncClient, status: TripStatus | None = None) -> list[dict]:
    query = client.table("trips").select("*, driver:drivers(*), vehicle:vehicles(*), loads:loads(*)")
    if status:
        query = query.eq("status", status.value)
    response = await query.order("created_at", desc=True).execute()
    return response.data

async def get_trip(client: AsyncClient, trip_id: str | uuid.UUID) -> dict | None:
    response = await client.table("trips").select("*, driver:drivers(*), vehicle:vehicles(*), loads:loads(*, customer:customers(*))").eq("id", str(trip_id)).execute()
    return response.data[0] if response.data else None

async def create_trip(client: AsyncClient, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("trips").insert(data).execute()
    return response.data[0]

async def update_trip(client: AsyncClient, trip_id: str | uuid.UUID, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("trips").update(data).eq("id", str(trip_id)).execute()
    return response.data[0]


# ── Loads ──────────────────────────────────────────────────────────────────────

async def get_loads_for_trip(client: AsyncClient, trip_id: str | uuid.UUID) -> list[dict]:
    response = await client.table("loads").select("*, customer:customers(*)").eq("trip_id", str(trip_id)).order("created_at").execute()
    return response.data

async def get_load(client: AsyncClient, load_id: str | uuid.UUID) -> dict | None:
    response = await client.table("loads").select("*, customer:customers(*), trip:trips(*)").eq("id", str(load_id)).execute()
    return response.data[0] if response.data else None

async def create_load(client: AsyncClient, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("loads").insert(data).execute()
    return response.data[0]

async def update_load(client: AsyncClient, load_id: str | uuid.UUID, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("loads").update(data).eq("id", str(load_id)).execute()
    return response.data[0]

async def get_uncollected_loads_for_driver(client: AsyncClient, driver_id: str | uuid.UUID) -> list[dict]:
    response = await client.table("loads").select("*, customer:customers(*), trip:trips!inner(*)").eq("trip.driver_id", str(driver_id)).eq("collected_status", False).order("created_at", desc=True).execute()
    return response.data


# ── Vehicle Expenses ───────────────────────────────────────────────────────────

async def get_vehicle_expenses(client: AsyncClient, vehicle_id: str | uuid.UUID, expense_type: ExpenseType | None = None) -> list[dict]:
    query = client.table("vehicle_expenses").select("*").eq("vehicle_id", str(vehicle_id))
    if expense_type:
        query = query.eq("type", expense_type.value)
    response = await query.order("created_at", desc=True).execute()
    return response.data

async def create_vehicle_expense(client: AsyncClient, **kwargs) -> dict:
    data = {k: to_str(v) for k, v in kwargs.items() if v is not None}
    response = await client.table("vehicle_expenses").insert(data).execute()
    return response.data[0]


# ── Ledger ─────────────────────────────────────────────────────────────────────

async def get_ledger_for_driver(client: AsyncClient, driver_id: str | uuid.UUID) -> list[dict]:
    response = await client.table("ledger").select("*").eq("driver_id", str(driver_id)).order("created_at", desc=True).execute()
    return response.data

async def create_ledger_entry(client: AsyncClient, driver_id: str | uuid.UUID, amount: float, entry_type: LedgerType, trip_id: str | uuid.UUID | None = None, description: str | None = None) -> dict:
    data = {
        "driver_id": str(driver_id),
        "amount": amount,
        "type": entry_type.value,
        "trip_id": str(trip_id) if trip_id else None,
        "description": description
    }
    response = await client.table("ledger").insert(data).execute()
    return response.data[0]


# ── Analytics ──────────────────────────────────────────────────────────────────

async def get_total_income(client: AsyncClient, start_date: datetime | None = None, end_date: datetime | None = None) -> float:
    query = client.table("loads").select("gross_rent, loading_chg, unloading_chg, loading_comm, unloading_comm, broker_comm").eq("collected_status", True)
    if start_date:
        query = query.gte("created_at", start_date.isoformat())
    if end_date:
        query = query.lte("created_at", end_date.isoformat())
    response = await query.execute()
    
    total = 0.0
    for load in response.data:
        total += float(load.get("gross_rent") or 0) - \
                 float(load.get("loading_chg") or 0) - \
                 float(load.get("unloading_chg") or 0) - \
                 float(load.get("loading_comm") or 0) - \
                 float(load.get("unloading_comm") or 0) - \
                 float(load.get("broker_comm") or 0)
    return total

async def get_total_expenses(client: AsyncClient, start_date: datetime | None = None, end_date: datetime | None = None) -> float:
    # Trips
    trip_query = client.table("trips").select("fuel_cost, other_expenses, driver_charge").eq("status", TripStatus.COMPLETED.value)
    if start_date:
        trip_query = trip_query.gte("completed_at", start_date.isoformat())
    if end_date:
        trip_query = trip_query.lte("completed_at", end_date.isoformat())
    trip_response = await trip_query.execute()
    
    trip_total = sum([
        float(t.get("fuel_cost") or 0) + float(t.get("other_expenses") or 0) + float(t.get("driver_charge") or 0)
        for t in trip_response.data
    ])
    
    # Vehicle Expenses
    ve_query = client.table("vehicle_expenses").select("amount")
    if start_date:
        ve_query = ve_query.gte("created_at", start_date.isoformat())
    if end_date:
        ve_query = ve_query.lte("created_at", end_date.isoformat())
    ve_response = await ve_query.execute()
    
    ve_total = sum([float(e.get("amount") or 0) for e in ve_response.data])
    
    return trip_total + ve_total

async def get_active_trip_count(client: AsyncClient) -> int:
    response = await client.table("trips").select("id", count="exact").eq("status", TripStatus.ACTIVE.value).execute()
    return response.count or 0

async def get_pending_settlement_count(client: AsyncClient) -> int:
    response = await client.table("loads").select("id", count="exact").eq("collected_status", False).execute()
    return response.count or 0

async def get_tax_reminder_count(client: AsyncClient) -> int:
    cutoff = (date.today() + timedelta(days=7)).isoformat()
    response = await client.table("vehicles").select("id", count="exact").not_.is_("tax_due_date", "null").lte("tax_due_date", cutoff).execute()
    return response.count or 0
