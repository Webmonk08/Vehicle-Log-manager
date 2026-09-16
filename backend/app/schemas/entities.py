"""
Pydantic request/response schemas mirroring the Supabase tables.
Naming convention: <Entity>Base (shared fields) -> <Entity>Create (input) -> <Entity> (output, has id/timestamps).
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------- Enums ----------

class ChargeType(str, Enum):
    quantity = "quantity"
    kg = "kg"
    bulk = "bulk"
    custom = "custom"


class LoadStatus(str, Enum):
    pending = "pending"
    in_transit = "in_transit"
    delivered = "delivered"
    collected = "collected"


class TripStatus(str, Enum):
    ongoing = "ongoing"
    completed = "completed"


class ChargeRuleScope(str, Enum):
    customer = "customer"        # customer + product
    route = "route"              # origin place + destination place + product


class TripExpenseCategory(str, Enum):
    fuel = "fuel"
    toll = "toll"
    driver_wage = "driver_wage"
    other = "other"


# ---------- Vehicle ----------

class VehicleBase(BaseModel):
    number: str
    type: Optional[str] = None
    capacity: Optional[float] = None
    rc_expiry: Optional[date] = None
    insurance_expiry: Optional[date] = None
    permit_expiry: Optional[date] = None


class VehicleCreate(VehicleBase):
    pass


class Vehicle(VehicleBase):
    id: UUID
    created_at: datetime


# ---------- Driver ----------

class DriverBase(BaseModel):
    name: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None


class DriverCreate(DriverBase):
    pass


class Driver(DriverBase):
    id: UUID
    created_at: datetime
    debt: float = 0.0  # computed, not stored — populated by the service layer


# ---------- Customer ----------

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    place_id: Optional[UUID] = None


class CustomerCreate(CustomerBase):
    pass


class Customer(CustomerBase):
    id: UUID
    created_at: datetime


# ---------- Product ----------

class ProductBase(BaseModel):
    name: str


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: UUID
    created_at: datetime


class ProductChargeOptionBase(BaseModel):
    charge_type: ChargeType
    kg_variant: Optional[float] = None  # e.g. 25 / 50 / 100 — only used when charge_type == kg
    rate: float


class ProductChargeOptionCreate(ProductChargeOptionBase):
    pass


class ProductChargeOptionBatchCreate(BaseModel):
    """Lets the product-creation form submit Quantity + several KG brackets + Bulk + Custom in one call."""
    options: list[ProductChargeOptionCreate]


class ProductChargeOption(ProductChargeOptionBase):
    id: UUID
    product_id: UUID
    created_at: datetime


# ---------- Place ----------

class PlaceBase(BaseModel):
    name: str
    region: Optional[str] = None


class PlaceCreate(PlaceBase):
    pass


class Place(PlaceBase):
    id: UUID
    created_at: datetime


# ---------- Charge Rule ----------
# A rule is always scoped to a product now (rates can vary by product on the
# same route or for the same customer). Each rule row is ONE charge type/KG
# bracket; ChargeRuleBatchCreate lets the UI submit several at once (e.g.
# Quantity + 25kg + 50kg + Bulk for one customer in a single form).

class ChargeRuleBase(BaseModel):
    scope: ChargeRuleScope
    product_id: UUID
    customer_id: Optional[UUID] = None            # required when scope == customer
    origin_place_id: Optional[UUID] = None        # required when scope == route
    destination_place_id: Optional[UUID] = None   # required when scope == route


class ChargeOptionInput(BaseModel):
    """One charge-type entry within a batch submission (product creation or charge-rule creation)."""
    charge_type: ChargeType
    kg_variant: Optional[float] = None
    rate: float


class ChargeRuleCreate(ChargeRuleBase):
    charge_type: ChargeType
    kg_variant: Optional[float] = None
    rate: float


class ChargeRuleBatchCreate(ChargeRuleBase):
    options: list[ChargeOptionInput]


class ChargeRule(ChargeRuleBase):
    id: UUID
    charge_type: ChargeType
    kg_variant: Optional[float] = None
    rate: float
    created_at: datetime


class ChargeOptionResult(BaseModel):
    """
    A single selectable charge option shown to the user at load-creation time.
    Unlike the old single-best resolve_charge, ALL matching options are
    returned (customer-specific, route-specific, and every product default —
    including every KG bracket) so the user picks explicitly rather than the
    server silently picking one via priority order.
    """
    id: UUID  # id of the underlying charge_rule or product_charge_option row
    source: str  # "customer" | "route" | "product_default"
    charge_type: ChargeType
    kg_variant: Optional[float] = None
    rate: float


# ---------- Trip ----------

class TripBase(BaseModel):
    driver_id: UUID
    vehicle_id: UUID
    start_date: date
    end_date: Optional[date] = None
    status: TripStatus = TripStatus.ongoing


class TripCreate(TripBase):
    pass


class Trip(TripBase):
    id: UUID
    created_at: datetime


# ---------- Load ----------

class LoadBase(BaseModel):
    trip_id: Optional[UUID] = None  # nullable: supports "unassigned pool" flow
    product_id: UUID
    customer_id: UUID
    origin_place_id: Optional[UUID] = None
    destination_place_id: Optional[UUID] = None
    quantity: Optional[float] = None
    weight_kg: Optional[float] = None
    charge_type: ChargeType
    kg_variant: Optional[float] = None  # which bracket (25/50/100) was selected, if charge_type == kg
    charge: float = 0.0            # resolved or custom-overridden
    charge_rule_used: Optional[str] = None  # e.g. "customer" | "route" | "product_default" | "custom" — for UI display
    discount: float = 0.0          # only meaningful once status == collected
    wages: float = 0.0             # mandatory
    commission_loading: float = 0.0
    commission_unloading: float = 0.0
    status: LoadStatus = LoadStatus.pending


class LoadCreate(LoadBase):
    pass


class LoadCollectRequest(BaseModel):
    """
    Payload for the load-completion step. Wages is asked here (not at load
    creation) — the owner only knows the real wages/commission once the load
    is actually finished. Discount also still only applies once collected.
    """
    discount: float = 0.0
    wages: Optional[float] = None
    commission_loading: Optional[float] = None
    commission_unloading: Optional[float] = None


class Load(LoadBase):
    id: UUID
    created_at: datetime
    net: float = 0.0  # computed: charge - discount - wages - commission


# ---------- Trip Expense ----------

class TripExpenseBase(BaseModel):
    trip_id: UUID
    category: TripExpenseCategory
    custom_label: Optional[str] = None  # used when category == other / custom tile
    amount: float
    note: Optional[str] = None
    date: date


class TripExpenseCreate(TripExpenseBase):
    pass


class TripExpenseUpdate(BaseModel):
    trip_id: Optional[UUID] = None
    category: Optional[TripExpenseCategory] = None
    custom_label: Optional[str] = None
    amount: Optional[float] = None
    note: Optional[str] = None
    date: Optional[date] = None


class TripExpense(TripExpenseBase):
    id: UUID
    created_at: datetime


# ---------- Vehicle Expense ----------

class VehicleExpenseBase(BaseModel):
    vehicle_id: UUID
    category: str
    amount: float
    is_recurring: bool = False
    date: date
    note: Optional[str] = None


class VehicleExpenseCreate(VehicleExpenseBase):
    pass


class VehicleExpense(VehicleExpenseBase):
    id: UUID
    created_at: datetime


# ---------- Driver Settlement ----------

class DriverSettlementBase(BaseModel):
    driver_id: UUID
    trip_id: Optional[UUID] = None  # open item: optionally linked to a trip
    amount: float
    date: date
    note: Optional[str] = None


class DriverSettlementCreate(DriverSettlementBase):
    pass


class DriverSettlement(DriverSettlementBase):
    id: UUID
    created_at: datetime


# ---------- Aggregate / computed response shapes ----------

class DebtSummary(BaseModel):
    collected: float
    pending: float
    expenses: float
    settlements: float
    net_debt: float


class TripDebtSummary(DebtSummary):
    trip_id: UUID


class DriverLedgerEntry(BaseModel):
    date: date
    type: str  # "collection" | "expense" | "settlement"
    label: str
    amount: float  # signed: +collection, -expense, -settlement
    running_balance: float