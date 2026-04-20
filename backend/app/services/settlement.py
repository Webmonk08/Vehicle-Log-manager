"""
Settlement Service — handles trip completion and retroactive load settlement.
"""
import uuid
from datetime import datetime, timezone
from supabase import AsyncClient

from app.models.models import LedgerType, TripStatus
from app.repositories import repo


async def complete_trip(
    client: AsyncClient,
    trip: dict,
    fuel_cost: float,
    other_expenses: float,
    driver_charge: float,
) -> dict:
    """
    Settle all loads on trip completion:
    - Collected loads: net = gross_rent - all charges (income)
    - Uncollected loads: Debit full gross_rent to driver's ledger
    - driver_charge: Credit to driver's ledger
    - Update trip status to COMPLETED
    """
    driver = await repo.get_driver(client, trip["driver_id"])
    if not driver:
        raise ValueError("Driver not found")

    # Process each load
    loads = await repo.get_loads_for_trip(client, trip["id"])
    for load in loads:
        if not load.get("collected_status", False):
            # Uncollected: Debit full gross_rent to driver's ledger
            gross_rent = float(load.get("gross_rent") or 0)
            await repo.create_ledger_entry(
                client,
                driver_id=trip["driver_id"],
                amount=gross_rent,
                entry_type=LedgerType.DEBIT,
                trip_id=trip["id"],
                description=f"Uncollected load: {load.get('product_name')} (₹{gross_rent})",
            )
            # Update driver's total pending amount
            driver["total_pending_amount"] = float(driver.get("total_pending_amount") or 0) + gross_rent
            await repo.update_driver(client, driver["id"], total_pending_amount=driver["total_pending_amount"])

    # Driver charge → Credit entry
    if driver_charge > 0:
        await repo.create_ledger_entry(
            client,
            driver_id=trip["driver_id"],
            amount=driver_charge,
            entry_type=LedgerType.CREDIT,
            trip_id=trip["id"],
            description=f"Driver payment for trip",
        )
        driver["total_pending_amount"] = float(driver.get("total_pending_amount") or 0) - driver_charge
        await repo.update_driver(client, driver["id"], total_pending_amount=driver["total_pending_amount"])

    # Update trip costs and status
    updated_trip = await repo.update_trip(
        client, 
        trip["id"], 
        fuel_cost=fuel_cost,
        other_expenses=other_expenses,
        driver_charge=driver_charge,
        status=TripStatus.COMPLETED,
        completed_at=datetime.now(timezone.utc).isoformat()
    )
    
    return updated_trip


async def settle_load(
    client: AsyncClient,
    load: dict,
    loading_chg: float | None = None,
    unloading_chg: float | None = None,
    loading_comm: float | None = None,
    unloading_comm: float | None = None,
    broker_comm: float | None = None,
) -> dict:
    """
    Retroactive settlement: mark uncollected load as collected,
    apply optional commissions, and reverse the ledger debit.
    """
    if load.get("collected_status", False):
        raise ValueError("Load is already collected/settled.")

    updates = {"collected_status": True}

    if loading_chg is not None:
        updates["loading_chg"] = loading_chg
    if unloading_chg is not None:
        updates["unloading_chg"] = unloading_chg
    if loading_comm is not None:
        updates["loading_comm"] = loading_comm
    if unloading_comm is not None:
        updates["unloading_comm"] = unloading_comm
    if broker_comm is not None:
        updates["broker_comm"] = broker_comm

    updated_load = await repo.update_load(client, load["id"], **updates)

    # Reverse the original debit by creating a Credit entry
    trip = await repo.get_trip(client, load["trip_id"])
    if trip:
        driver = await repo.get_driver(client, trip["driver_id"])
        if driver:
            gross_rent = float(load.get("gross_rent") or 0)
            await repo.create_ledger_entry(
                client,
                driver_id=trip["driver_id"],
                amount=gross_rent,
                entry_type=LedgerType.CREDIT,
                trip_id=trip["id"],
                description=f"Settlement: {load.get('product_name')} collected (₹{gross_rent})",
            )
            
            new_pending = float(driver.get("total_pending_amount") or 0) - gross_rent
            await repo.update_driver(client, driver["id"], total_pending_amount=new_pending)

    return updated_load


def _calculate_net(load: dict) -> float:
    """Calculate net amount for a collected load."""
    return round(
        float(load.get("gross_rent") or 0)
        - float(load.get("loading_chg") or 0)
        - float(load.get("unloading_chg") or 0)
        - float(load.get("loading_comm") or 0)
        - float(load.get("unloading_comm") or 0)
        - float(load.get("broker_comm") or 0),
        2,
    )
