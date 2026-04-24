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
    loading_comm: float = 0,
    unloading_comm: float = 0,
    loading_chg: float = 0,
    unloading_chg: float = 0,
) -> dict:
    """
    Settle all loads on trip completion:
    - Collected loads: net = gross_rent - all charges (income)
    - Uncollected loads: Debit full gross_rent to driver's ledger
    - driver_charge, loading_comm, unloading_comm: Credit to driver's ledger
    - loading_chg, unloading_chg: Applied as charges
    - Update trip status to COMPLETED
    """
    if trip.get("status") == TripStatus.COMPLETED.value:
        return trip

    driver = await repo.get_driver(client, trip["driver_id"])
    if not driver:
        raise ValueError("Driver not found")

    # Use loads from trip dict if already fetched, otherwise fetch
    loads = trip.get("loads")
    if loads is None:
        loads = await repo.get_loads_for_trip(client, trip["id"])
    
    total_uncollected_rent = 0.0
    for load in loads:
        if not load.get("collected_status", False):
            # Uncollected: Debit full gross_rent to driver's ledger
            gross_rent = float(load.get("gross_rent") or 0)
            total_uncollected_rent += gross_rent
            await repo.create_ledger_entry(
                client,
                driver_id=trip["driver_id"],
                amount=gross_rent,
                entry_type=LedgerType.DEBIT,
                trip_id=trip["id"],
                description=f"Uncollected load: {load.get('product_name')} (₹{gross_rent})",
            )
    
    # Update driver's total pending amount with all uncollected rents
    current_pending = float(driver.get("total_pending_amount") or 0)
    new_pending = current_pending + total_uncollected_rent

    # Apply all expenses/credits for the driver
    if fuel_cost > 0:
        await repo.create_ledger_entry(
            client,
            driver_id=trip["driver_id"],
            amount=fuel_cost,
            entry_type=LedgerType.CREDIT,
            trip_id=trip["id"],
            description=f"Fuel reimbursement for trip",
        )
        new_pending -= fuel_cost

    if other_expenses > 0:
        await repo.create_ledger_entry(
            client,
            driver_id=trip["driver_id"],
            amount=other_expenses,
            entry_type=LedgerType.CREDIT,
            trip_id=trip["id"],
            description=f"Expense reimbursement for trip",
        )
        new_pending -= other_expenses

    if driver_charge > 0:
        await repo.create_ledger_entry(
            client,
            driver_id=trip["driver_id"],
            amount=driver_charge,
            entry_type=LedgerType.CREDIT,
            trip_id=trip["id"],
            description=f"Driver payment for trip",
        )
        new_pending -= driver_charge

    total_commissions = loading_comm + unloading_comm
    if total_commissions > 0:
        await repo.create_ledger_entry(
            client,
            driver_id=trip["driver_id"],
            amount=total_commissions,
            entry_type=LedgerType.CREDIT,
            trip_id=trip["id"],
            description=f"Commission (loading: ₹{loading_comm}, unloading: ₹{unloading_comm})",
        )
        new_pending -= total_commissions

    total_charges = loading_chg + unloading_chg
    if total_charges > 0:
        await repo.create_ledger_entry(
            client,
            driver_id=trip["driver_id"],
            amount=total_charges,
            entry_type=LedgerType.CREDIT,
            trip_id=trip["id"],
            description=f"Charges (loading: ₹{loading_chg}, unloading: ₹{unloading_chg})",
        )
        new_pending -= total_charges

    # Update driver if any financial change occurred
    if total_uncollected_rent > 0 or fuel_cost > 0 or other_expenses > 0 or driver_charge > 0 or total_commissions > 0 or total_charges > 0:
        await repo.update_driver(client, driver["id"], total_pending_amount=new_pending)

    # Update trip costs and status
    updated_trip = await repo.update_trip(
        client, 
        trip["id"], 
        fuel_cost=fuel_cost,
        other_expenses=other_expenses,
        driver_charge=driver_charge,
        loading_comm=loading_comm,
        unloading_comm=unloading_comm,
        loading_chg=loading_chg,
        unloading_chg=unloading_chg,
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


async def update_trip_after_completion(
    client: AsyncClient,
    trip: dict,
    updates: dict
) -> dict:
    """
    Adjust expenses for a completed trip and update the driver's ledger accordingly.
    """
    driver = await repo.get_driver(client, trip["driver_id"])
    if not driver:
        raise ValueError("Driver not found")

    new_pending = float(driver.get("total_pending_amount") or 0)
    
    # Calculate differences for each expense field
    expense_fields = [
        "fuel_cost", "other_expenses", "driver_charge",
        "loading_comm", "unloading_comm", "loading_chg", "unloading_chg"
    ]
    
    for field in expense_fields:
        if field in updates and updates[field] is not None:
            old_val = float(trip.get(field) or 0)
            new_val = float(updates[field])
            diff = new_val - old_val
            
            if diff != 0:
                # If diff > 0, we owe driver more (Credit)
                # If diff < 0, we owe driver less (Debit)
                entry_type = LedgerType.CREDIT if diff > 0 else LedgerType.DEBIT
                abs_diff = abs(diff)
                
                await repo.create_ledger_entry(
                    client,
                    driver_id=trip["driver_id"],
                    amount=abs_diff,
                    entry_type=entry_type,
                    trip_id=trip["id"],
                    description=f"Adjustment to {field.replace('_', ' ')} (₹{old_val} -> ₹{new_val})",
                )
                
                if entry_type == LedgerType.CREDIT:
                    new_pending -= abs_diff
                else:
                    new_pending += abs_diff

    # Update driver's pending amount
    await repo.update_driver(client, driver["id"], total_pending_amount=new_pending)

    # Update trip with new values
    updated_trip = await repo.update_trip(client, trip["id"], **updates)
    return updated_trip


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
