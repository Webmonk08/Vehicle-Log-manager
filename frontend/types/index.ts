// ── Enums ─────────────────────────────────────────────────────────────────────

export type TripStatus = 'active' | 'completed';
export type RentType = 'KG' | 'Unit' | 'Bulk';
export type ExpenseType = 'Tax' | 'Other';
export type LedgerType = 'Debit' | 'Credit';

// ── Response Models (matching backend) ────────────────────────────────────────

export interface DriverResponse {
  id: string;
  name: string;
  contact: string | null;
  status: boolean;
  created_at: string;
}

export interface VehicleResponse {
  id: string;
  plate_number: string;
  model: string | null;
  tax_due_date: string | null;
  last_service_date: string | null;
  status: boolean;
  created_at: string;
}

// ── Models ────────────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  contact: string | null;
  total_pending_amount: number;
  status: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  model: string | null;
  tax_due_date: string | null;
  last_service_date: string | null;
  status: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  default_rate_per_kg: number | null;
  status: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  customer_id: string;
  name: string;
  default_rate: number;
  unit_type: RentType;
  created_at: string;
}

export interface Load {
  id: string;
  trip_id: string;
  customer_id: string;
  product_id: string | null;
  product?: Product;
  product_name: string;
  quantity: number;
  rent_type: RentType;
  gross_rent: number;
  amount_collected: number;
  collected_status: boolean;
  loading_chg: number;
  unloading_chg: number;
  loading_comm: number;
  unloading_comm: number;
  broker_comm: number;
  created_at: string;
  customer_name?: string;
  customer?: Customer;
}

export interface Trip {
  id: string;
  driver_id: string;
  vehicle_id: string;
  fuel_cost: number;
  other_expenses: number;
  driver_charge: number;
  loading_comm: number;
  unloading_comm: number;
  loading_chg: number;
  unloading_chg: number;
  status: TripStatus;
  created_at: string;
  completed_at: string | null;
  driver_name?: string;
  vehicle_plate?: string;
  loads: Load[];
  driver?: DriverResponse;
  vehicle?: VehicleResponse;
}

export interface VehicleExpense {
  id: string;
  vehicle_id: string;
  type: ExpenseType;
  amount: number;
  due_date: string | null;
  description: string | null;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  driver_id: string;
  amount: number;
  type: LedgerType;
  trip_id: string | null;
  description: string | null;
  created_at: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface PeriodAnalytics {
  label: string;
  income: number;
  expenses: number;
  net_profit: number;
}

export interface DashboardData {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  active_trips: number;
  pending_settlements: number;
  tax_reminders_count: number;
  period_data: PeriodAnalytics[];
}

// ── Create / Update payloads ──────────────────────────────────────────────────

export interface DriverCreate {
  name: string;
  contact?: string;
}

export interface VehicleCreate {
  plate_number: string;
  model?: string;
  tax_due_date?: string;
  last_service_date?: string;
}

export interface CustomerCreate {
  name: string;
  default_rate_per_kg?: number;
}

export interface ProductCreate {
  customer_id: string;
  name: string;
  default_rate: number;
  unit_type: RentType;
}

export interface ProductUpdate {
  name?: string;
  default_rate?: number;
  unit_type?: RentType;
}

export interface TripCreate {
  driver_id: string;
  vehicle_id: string;
  fuel_cost?: number;
  other_expenses?: number;
  driver_charge?: number;
  loading_comm?: number;
  unloading_comm?: number;
  loading_chg?: number;
  unloading_chg?: number;
}

export interface LoadCreate {
  trip_id: string;
  customer_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  rent_type: RentType;
  gross_rent?: number;
  collected_status?: boolean;
  loading_chg?: number;
  unloading_chg?: number;
  loading_comm?: number;
  unloading_comm?: number;
  broker_comm?: number;
}

export interface TripCompletePayload {
  fuel_cost: number;
  other_expenses: number;
  driver_charge: number;
  loading_comm: number;
  unloading_comm: number;
  loading_chg: number;
  unloading_chg: number;
}

export interface LoadSettlePayload {
  amount_received: number;
  loading_chg?: number;
  unloading_chg?: number;
  loading_comm?: number;
  unloading_comm?: number;
  broker_comm?: number;
}

export interface ExpenseCreate {
  vehicle_id: string;
  type: ExpenseType;
  amount: number;
  due_date?: string;
  description?: string;
}
