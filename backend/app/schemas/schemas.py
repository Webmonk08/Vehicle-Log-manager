from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.models import TripStatus, RentType, ExpenseType, LedgerType


# ── Driver Schemas ─────────────────────────────────────────────────────────────

class DriverCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    contact: Optional[str] = Field(None, max_length=50)


class DriverUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact: Optional[str] = Field(None, max_length=50)


class DriverResponse(BaseModel):
    id: UUID
    name: str
    contact: Optional[str]
    total_pending_amount: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Vehicle Schemas ────────────────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    plate_number: str = Field(..., min_length=1, max_length=30)
    model: Optional[str] = Field(None, max_length=100)
    tax_due_date: Optional[date] = None
    last_service_date: Optional[date] = None


class VehicleUpdate(BaseModel):
    plate_number: Optional[str] = Field(None, max_length=30)
    model: Optional[str] = Field(None, max_length=100)
    tax_due_date: Optional[date] = None
    last_service_date: Optional[date] = None


class VehicleResponse(BaseModel):
    id: UUID
    plate_number: str
    model: Optional[str]
    tax_due_date: Optional[date]
    last_service_date: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Customer Schemas ───────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    default_rate_per_kg: Optional[float] = Field(None, ge=0)


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    default_rate_per_kg: Optional[float] = Field(None, ge=0)


class CustomerResponse(BaseModel):
    id: UUID
    name: str
    default_rate_per_kg: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Product (Rate Card) Schemas ────────────────────────────────────────────────

class ProductCreate(BaseModel):
    customer_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    default_rate: float = Field(..., ge=0)
    unit_type: RentType


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    default_rate: Optional[float] = Field(None, ge=0)
    unit_type: Optional[RentType] = None


class ProductResponse(BaseModel):
    id: UUID
    customer_id: UUID
    name: str
    default_rate: float
    unit_type: RentType
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Load Schemas ───────────────────────────────────────────────────────────────

class LoadCreate(BaseModel):
    trip_id: UUID
    customer_id: UUID
    product_id: Optional[UUID] = None
    product_name: str = Field(..., min_length=1, max_length=255)
    quantity: float = Field(0, ge=0)
    rent_type: RentType
    gross_rent: Optional[float] = Field(None, ge=0)
    collected_status: bool = False
    loading_chg: float = Field(0, ge=0)
    unloading_chg: float = Field(0, ge=0)
    loading_comm: float = Field(0, ge=0)
    unloading_comm: float = Field(0, ge=0)
    broker_comm: float = Field(0, ge=0)


class LoadUpdate(BaseModel):
    product_id: Optional[UUID] = None
    product_name: Optional[str] = None
    quantity: Optional[float] = Field(None, ge=0)
    gross_rent: Optional[float] = Field(None, ge=0)
    collected_status: Optional[bool] = None
    loading_chg: Optional[float] = Field(None, ge=0)
    unloading_chg: Optional[float] = Field(None, ge=0)
    loading_comm: Optional[float] = Field(None, ge=0)
    unloading_comm: Optional[float] = Field(None, ge=0)
    broker_comm: Optional[float] = Field(None, ge=0)


class LoadResponse(BaseModel):
    id: UUID
    trip_id: UUID
    customer_id: UUID
    customer: CustomerResponse
    customer_name: Optional[str] = None
    product_id: Optional[UUID] = None
    product: Optional[ProductResponse] = None
    product_name: str
    quantity: float
    rent_type: RentType
    gross_rent: float
    collected_status: bool
    loading_chg: float
    unloading_chg: float
    loading_comm: float
    unloading_comm: float
    broker_comm: float
    amount_collected: float
    created_at: datetime

    model_config = {"from_attributes": True}


class LoadSettleRequest(BaseModel):
    """Request body for retroactive settlement of an uncollected load."""
    amount_received: float = Field(..., ge=0)
    loading_chg: float = Field(0, ge=0)
    unloading_chg: float = Field(0, ge=0)
    loading_comm: float = Field(0, ge=0)
    unloading_comm: float = Field(0, ge=0)
    broker_comm: float = Field(0, ge=0)


# ── Trip Schemas ───────────────────────────────────────────────────────────────

class TripCreate(BaseModel):
    driver_id: UUID
    vehicle_id: UUID
    fuel_cost: float = Field(0, ge=0)
    other_expenses: float = Field(0, ge=0)
    driver_charge: float = Field(0, ge=0)
    loading_comm: float = Field(0, ge=0)
    unloading_comm: float = Field(0, ge=0)
    loading_chg: float = Field(0, ge=0)
    unloading_chg: float = Field(0, ge=0)


class TripUpdate(BaseModel):
    driver_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None
    fuel_cost: Optional[float] = Field(None, ge=0)
    other_expenses: Optional[float] = Field(None, ge=0)
    driver_charge: Optional[float] = Field(None, ge=0)
    loading_comm: Optional[float] = Field(None, ge=0)
    unloading_comm: Optional[float] = Field(None, ge=0)
    loading_chg: Optional[float] = Field(None, ge=0)
    unloading_chg: Optional[float] = Field(None, ge=0)


class TripResponse(BaseModel):
    id: UUID
    driver_id: UUID
    vehicle_id: UUID
    driver: DriverResponse
    vehicle: VehicleResponse
    driver_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    fuel_cost: float
    other_expenses: float
    driver_charge: float
    loading_comm: float
    unloading_comm: float
    loading_chg: float
    unloading_chg: float
    status: TripStatus
    created_at: datetime
    completed_at: Optional[datetime]
    loads: List[LoadResponse] = []

    model_config = {"from_attributes": True}


class TripCompleteRequest(BaseModel):
    fuel_cost: float = Field(0, ge=0)
    other_expenses: float = Field(0, ge=0)
    driver_charge: float = Field(0, ge=0)
    loading_comm: float = Field(0, ge=0)
    unloading_comm: float = Field(0, ge=0)
    loading_chg: float = Field(0, ge=0)
    unloading_chg: float = Field(0, ge=0)


# ── Vehicle Expense Schemas ────────────────────────────────────────────────────

class VehicleExpenseCreate(BaseModel):
    vehicle_id: UUID
    type: ExpenseType
    amount: float = Field(..., gt=0)
    due_date: Optional[date] = None
    description: Optional[str] = None


class VehicleExpenseResponse(BaseModel):
    id: UUID
    vehicle_id: UUID
    type: ExpenseType
    amount: float
    due_date: Optional[date]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Ledger Schemas ─────────────────────────────────────────────────────────────

class LedgerResponse(BaseModel):
    id: UUID
    driver_id: UUID
    amount: float
    type: LedgerType
    trip_id: Optional[UUID]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard / Analytics ─────────────────────────────────────────────────────

class PeriodAnalytics(BaseModel):
    label: str
    income: float
    expenses: float
    net_profit: float


class DashboardResponse(BaseModel):
    total_income: float
    total_expenses: float
    net_profit: float
    active_trips: int
    pending_settlements: int
    tax_reminders_count: int
    period_data: list[PeriodAnalytics]


class RentCalculationRequest(BaseModel):
    customer_id: UUID
    quantity: float = Field(..., ge=0)
    rent_type: RentType
    gross_rent: Optional[float] = None


class RentCalculationResponse(BaseModel):
    calculated_rent: float
    rent_type: RentType
