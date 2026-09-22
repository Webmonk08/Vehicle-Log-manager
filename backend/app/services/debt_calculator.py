"""
Core debt logic (see plan section 2.2). Debt is NEVER stored as a raw column —
always computed live from loads + trip_expenses + driver_settlements.

    Net per load          = Charge - Discount - Wages - Commission
    Driver debt (live)    = Σ(Net of COLLECTED loads) - Σ(trip expenses) - Σ(settlements)

Trip expenses reduce debt immediately regardless of load-collection status,
because the driver fronts that cash out of pocket. Discount only applies once
a load has been marked "collected" (enforced at the API layer / ConfirmSheet,
not here — this module trusts the discount field once status == collected).
"""
from uuid import UUID

from supabase import Client

from app.schemas.entities import DebtSummary, DriverLedgerEntry, LoadStatus, TripDebtSummary


def compute_load_net(charge: float, discount: float, wages: float,
                      commission_loading: float, commission_unloading: float) -> float:
    return charge - discount - wages - commission_loading - commission_unloading


def get_trip_debt_summary(db: Client, trip_id: UUID) -> TripDebtSummary:
    loads_res = db.table("loads").select("*").eq("trip_id", str(trip_id)).execute()
    loads = loads_res.data or []

    collected_net = 0.0
    pending_net = 0.0
    for load in loads:
        net = compute_load_net(
            load["charge"], load.get("discount", 0.0), load["wages"],
            load.get("commission_loading", 0.0), load.get("commission_unloading", 0.0),
        )
        if load["status"] == LoadStatus.collected.value:
            collected_net += net
        else:
            pending_net += net

    expenses_res = db.table("trip_expenses").select("amount").eq("trip_id", str(trip_id)).execute()
    total_expenses = sum(e["amount"] for e in (expenses_res.data or []))

    # Settlements are recorded against a driver, optionally scoped to a trip.
    settlements_res = (
        db.table("driver_settlements").select("amount").eq("trip_id", str(trip_id)).execute()
    )
    total_settlements = sum(s["amount"] for s in (settlements_res.data or []))

    net_debt = collected_net - total_expenses - total_settlements

    return TripDebtSummary(
        trip_id=trip_id,
        collected=collected_net,
        pending=pending_net,
        expenses=total_expenses,
        settlements=total_settlements,
        net_debt=net_debt,
    )


def get_driver_debt_summary(db: Client, driver_id: UUID) -> DebtSummary:
    """
    Aggregates across ALL trips ever assigned to this driver — this is the
    number shown on DriverCard / DriverDetail, independent of any single trip.
    """
    res = db.rpc("get_debt_summary", {"p_driver_id": str(driver_id)}).execute()
    data = res.data
    
    if data:
        row = data[0]
        return DebtSummary(
            collected=row.get("collected", 0.0),
            pending=row.get("pending", 0.0),
            expenses=row.get("expenses", 0.0),
            settlements=row.get("settlements", 0.0),
            net_debt=row.get("net_debt", 0.0),
        )

    return DebtSummary(
        collected=0.0,
        pending=0.0,
        expenses=0.0,
        settlements=0.0,
        net_debt=0.0,
    )


def get_driver_ledger(db: Client, driver_id: UUID) -> list[DriverLedgerEntry]:
    """
    Chronological (+collected, -expense, -settlement) log with running balance,
    for the Driver Detail > Ledger tab.
    """
    trips_res = db.table("trips").select("id").eq("driver_id", str(driver_id)).execute()
    trip_ids = [t["id"] for t in (trips_res.data or [])]

    events: list[tuple[str, str, str, float]] = []  # (date, type, label, signed_amount)

    if trip_ids:
        loads_res = (
            db.table("loads").select("*").in_("trip_id", trip_ids)
            .eq("status", LoadStatus.collected.value).execute()
        )
        for load in (loads_res.data or []):
            net = compute_load_net(
                load["charge"], load.get("discount", 0.0), load["wages"],
                load.get("commission_loading", 0.0), load.get("commission_unloading", 0.0),
            )
            events.append((load["created_at"][:10], "collection", "Load collected", net))

        expenses_res = db.table("trip_expenses").select("*").in_("trip_id", trip_ids).execute()
        for exp in (expenses_res.data or []):
            label = exp.get("custom_label") or exp["category"].replace("_", " ").title()
            events.append((exp["date"], "expense", label, -exp["amount"]))

    settlements_res = db.table("driver_settlements").select("*").eq("driver_id", str(driver_id)).execute()
    for s in (settlements_res.data or []):
        events.append((s["date"], "settlement", s.get("note") or "Settlement", -s["amount"]))

    events.sort(key=lambda e: e[0])

    ledger: list[DriverLedgerEntry] = []
    running = 0.0
    for event_date, event_type, label, signed_amount in events:
        running += signed_amount
        ledger.append(
            DriverLedgerEntry(
                date=event_date, type=event_type, label=label,
                amount=signed_amount, running_balance=running,
            )
        )
    return ledger
