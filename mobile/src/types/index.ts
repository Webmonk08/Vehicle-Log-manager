// Mirrors backend/app/schemas/entities.py — keep in sync when the API changes.

export type ChargeType = "quantity" | "kg" | "bulk" | "custom";
export type LoadStatus = "pending" | "in_transit" | "delivered" | "collected";
export type TripStatus = "ongoing" | "completed";
export type ChargeRuleScope = "customer" | "route";
export type TripExpenseCategory = "fuel" | "toll" | "driver_wage" | "other";

export interface Vehicle {
  id: string;
  number: string;
  type?: string;
  capacity?: number;
  rc_expiry?: string;
  insurance_expiry?: string;
  permit_expiry?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  created_at: string;
  debt: number; // computed server-side, never sent on create
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  place_id?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  created_at: string;
}

export interface ProductChargeOption {
  id: string;
  product_id: string;
  charge_type: ChargeType;
  kg_variant?: number; // e.g. 25 / 50 / 100 — only set when charge_type === "kg"
  rate: number;
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  region?: string;
  created_at: string;
}

export interface ChargeRule {
  id: string;
  scope: ChargeRuleScope;
  product_id: string;
  customer_id?: string;
  origin_place_id?: string;
  destination_place_id?: string;
  charge_type: ChargeType;
  kg_variant?: number;
  rate: number;
  created_at: string;
}

export interface ChargeOptionResult {
  id: string;
  source: "customer" | "route" | "product_default";
  charge_type: ChargeType;
  kg_variant?: number;
  rate: number;
}

export interface Trip {
  id: string;
  driver_id: string;
  vehicle_id: string;
  start_date: string;
  end_date?: string;
  status: TripStatus;
  created_at: string;
}

export interface Load {
  id: string;
  trip_id?: string | null;
  product_id: string;
  customer_id: string;
  origin_place_id?: string;
  destination_place_id?: string;
  quantity?: number;
  weight_kg?: number;
  charge_type: ChargeType;
  kg_variant?: number;
  charge: number;
  charge_rule_used?: string;
  discount: number;
  wages: number;
  commission_loading: number;
  commission_unloading: number;
  status: LoadStatus;
  created_at: string;
  net: number; // computed
}

export interface TripExpense {
  id: string;
  trip_id: string;
  category: TripExpenseCategory;
  custom_label?: string;
  amount: number;
  note?: string;
  date: string;
  created_at: string;
}

export interface VehicleExpense {
  id: string;
  vehicle_id: string;
  category: string;
  amount: number;
  is_recurring: boolean;
  date: string;
  note?: string;
  created_at: string;
}

export interface DriverSettlement {
  id: string;
  driver_id: string;
  trip_id?: string;
  amount: number;
  date: string;
  note?: string;
  created_at: string;
}

export interface DebtSummary {
  collected: number;
  pending: number;
  expenses: number;
  settlements: number;
  net_debt: number;
}

export interface TripDebtSummary extends DebtSummary {
  trip_id: string;
}

export interface DriverLedgerEntry {
  date: string;
  type: "collection" | "expense" | "settlement";
  label: string;
  amount: number;
  running_balance: number;
}