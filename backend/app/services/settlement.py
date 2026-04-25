"""
Settlement Service — handles trip completion, retroactive load settlement, and reversal.
Now uses PostgreSQL RPCs for atomic operations and accurate debt calculation.
"""
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
    Settle all loads on trip completion using RPC.
    """
    await client.rpc("complete_trip_settlement", {
        "p_trip_id": str(trip["id"]),
        "p_fuel_cost": fuel_cost,
        "p_other_expenses": other_expenses,
        "p_driver_charge": driver_charge,
        "p_loading_comm": loading_comm,
        "p_unloading_comm": unloading_comm,
        "p_loading_chg": loading_chg,
        "p_unloading_chg": unloading_chg,
    }).execute()
    
    # Return updated trip
    return await repo.get_trip(client, trip["id"])


async def settle_load(
    client: AsyncClient,
    load: dict,
    loading_chg: float = 0,
    unloading_chg: float = 0,
    loading_comm: float = 0,
    unloading_comm: float = 0,
    broker_comm: float = 0,
) -> dict:
    """
    Retroactive settlement using RPC.
    """
    await client.rpc("settle_uncollected_load_rpc", {
        "p_load_id": str(load["id"]),
        "p_loading_chg": loading_chg,
        "p_unloading_chg": unloading_chg,
        "p_loading_comm": loading_comm,
        "p_unloading_comm": unloading_comm,
        "p_broker_comm": broker_comm,
    }).execute()

    return await repo.get_load(client, load["id"])


async def update_trip_after_completion(
    client: AsyncClient,
    trip: dict,
    updates: dict
) -> dict:
    """
    Adjust expenses for a completed trip using RPCs.
    """
    driver_id = trip["driver_id"]
    
    # If driver is changing, we must transfer the full financial impact
    if "driver_id" in updates and str(updates["driver_id"]) != str(driver_id):
        # 1. Reverse impact on old driver
        await cancel_trip_settlement(client, trip)
        
        # 2. Update trip driver
        trip = await repo.update_trip(client, trip["id"], driver_id=updates["driver_id"])
        
        # 3. Re-apply impact on new driver
        merged_trip = {**trip, **updates}
        return await complete_trip(
            client, 
            merged_trip,
            fuel_cost=float(merged_trip.get("fuel_cost") or 0),
            other_expenses=float(merged_trip.get("other_expenses") or 0),
            driver_charge=float(merged_trip.get("driver_charge") or 0),
            loading_comm=float(merged_trip.get("loading_comm") or 0),
            unloading_comm=float(merged_trip.get("unloading_comm") or 0),
            loading_chg=float(merged_trip.get("loading_chg") or 0),
            unloading_chg=float(merged_trip.get("unloading_chg") or 0),
        )

    # Calculate differences for each expense field and create ledger adjustments
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
                entry_type = LedgerType.CREDIT if diff > 0 else LedgerType.DEBIT
                abs_diff = abs(diff)
                
                await client.rpc("adjust_ledger_and_balance", {
                    "p_driver_id": str(driver_id),
                    "p_amount": abs_diff,
                    "p_type": entry_type.value,
                    "p_trip_id": str(trip["id"]),
                    "p_description": f"Adjustment to {field.replace('_', ' ')} (₹{old_val} -> ₹{new_val})"
                }).execute()

    # Update trip with new values
    return await repo.update_trip(client, trip["id"], **updates)


async def cancel_trip_settlement(client: AsyncClient, trip: dict):
    """
    Reverse the financial impact of a COMPLETED trip using RPC.
    """
    if trip.get("status") != TripStatus.COMPLETED.value:
        return

    await client.rpc("cancel_trip_settlement_rpc", {"p_trip_id": str(trip["id"])}).execute()


async def handle_load_deletion(client: AsyncClient, load: dict):
    """
    If an uncollected load is deleted from a COMPLETED trip,
    reduce the driver's debt using RPC.
    """
    if load.get("collected_status", False):
        return

    trip = await repo.get_trip(client, load["trip_id"])
    if not trip or trip.get("status") != TripStatus.COMPLETED.value:
        return

    gross_rent = float(load.get("gross_rent") or 0)
    if gross_rent > 0:
        await client.rpc("adjust_ledger_and_balance", {
            "p_driver_id": str(trip["driver_id"]),
            "p_amount": gross_rent,
            "p_type": LedgerType.CREDIT.value,
            "p_trip_id": str(trip["id"]),
            "p_description": f"Load deleted: {load.get('product_name')} (₹{gross_rent})"
        }).execute()


async def handle_load_update(client: AsyncClient, load: dict, updates: dict) -> dict:
    """
    If gross_rent is updated for an uncollected load on a COMPLETED trip,
    adjust the driver's debt using RPC.
    """
    if load.get("collected_status", False) or "gross_rent" not in updates:
        return await repo.update_load(client, load["id"], **updates)

    trip = await repo.get_trip(client, load["trip_id"])
    if not trip or trip.get("status") != TripStatus.COMPLETED.value:
        return await repo.update_load(client, load["id"], **updates)

    old_rent = float(load.get("gross_rent") or 0)
    new_rent = float(updates["gross_rent"])
    diff = new_rent - old_rent

    if diff != 0:
        entry_type = LedgerType.DEBIT if diff > 0 else LedgerType.CREDIT
        abs_diff = abs(diff)
        
        await client.rpc("adjust_ledger_and_balance", {
            "p_driver_id": str(trip["driver_id"]),
            "p_amount": abs_diff,
            "p_type": entry_type.value,
            "p_trip_id": str(trip["id"]),
            "p_description": f"Load rent adjustment: {load.get('product_name')} (₹{old_rent} -> ₹{new_rent})"
        }).execute()

    return await repo.update_load(client, load["id"], **updates)
