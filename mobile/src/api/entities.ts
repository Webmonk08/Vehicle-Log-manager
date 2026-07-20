import { apiClient } from "./client";
import { makeResource } from "./resource";
import type {
  ChargeOptionResult, ChargeRule, Customer, DebtSummary, Driver, DriverLedgerEntry, DriverSettlement,
  Load, Place, Product, ProductChargeOption, Trip, TripDebtSummary, TripExpense, Vehicle, VehicleExpense,
} from "@/types";

export const vehiclesApi = makeResource<Vehicle>("/vehicles");
export const customersApi = makeResource<Customer>("/customers");
export const placesApi = makeResource<Place>("/places");
export const vehicleExpensesApi = makeResource<VehicleExpense>("/vehicle-expenses");

const productBase = makeResource<Product>("/products");
export const productsApi = {
  ...productBase,
  chargeOptions: {
    list: (productId: string) =>
      apiClient.get<ProductChargeOption[]>(`/products/${productId}/charge-options`).then((r) => r.data),
    batchCreate: (productId: string, options: { charge_type: string; kg_variant?: number; rate: number }[]) =>
      apiClient
        .post<ProductChargeOption[]>(`/products/${productId}/charge-options/batch`, { options })
        .then((r) => r.data),
    update: (optionId: string, payload: { charge_type: string; kg_variant?: number; rate: number }) =>
      apiClient.patch<ProductChargeOption>(`/products/charge-options/${optionId}`, payload).then((r) => r.data),
    remove: (optionId: string) => apiClient.delete(`/products/charge-options/${optionId}`),
  },
};

export const chargeRulesApi = {
  list: (params?: { product_id?: string; customer_id?: string }) =>
    apiClient.get<ChargeRule[]>("/charge-rules/", { params }).then((r) => r.data),
  batchCreate: (payload: {
    scope: "customer" | "route";
    product_id: string;
    customer_id?: string;
    origin_place_id?: string;
    destination_place_id?: string;
    options: { charge_type: string; kg_variant?: number; rate: number }[];
  }) => apiClient.post<ChargeRule[]>("/charge-rules/batch", payload).then((r) => r.data),
  update: (id: string, payload: Partial<ChargeRule>) =>
    apiClient.patch<ChargeRule>(`/charge-rules/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/charge-rules/${id}`),
};

const driverBase = makeResource<Driver>("/drivers");
export const driversApi = {
  ...driverBase,
  debtSummary: (id: string) =>
    apiClient.get<DebtSummary>(`/drivers/${id}/debt-summary`).then((r) => r.data),
  ledger: (id: string) =>
    apiClient.get<DriverLedgerEntry[]>(`/drivers/${id}/ledger`).then((r) => r.data),
  recordSettlement: (id: string, payload: { driver_id: string; amount: number; date: string; note?: string; trip_id?: string }) =>
    apiClient.post<DriverSettlement>(`/drivers/${id}/settlements`, payload).then((r) => r.data),
};

const tripBase = makeResource<Trip>("/trips");
export const tripsApi = {
  ...tripBase,
  debtSummary: (id: string) =>
    apiClient.get<TripDebtSummary>(`/trips/${id}/debt-summary`).then((r) => r.data),
  complete: (id: string) =>
    apiClient.post<Trip>(`/trips/${id}/complete`).then((r) => r.data),
};

const loadBase = makeResource<Load>("/loads");
export const loadsApi = {
  ...loadBase,
  chargeOptions: (params: {
    product_id: string; customer_id?: string;
    origin_place_id?: string; destination_place_id?: string;
  }) => apiClient.get<ChargeOptionResult[]>(`/loads/charge-options`, { params }).then((r) => r.data),
  attachToTrip: (loadId: string, tripId: string) =>
    apiClient.patch<Load>(`/loads/${loadId}/attach-to-trip`, null, { params: { trip_id: tripId } }).then((r) => r.data),
  collect: (loadId: string, payload: { discount: number; wages?: number; commission_loading?: number; commission_unloading?: number }) =>
    apiClient.post<Load>(`/loads/${loadId}/collect`, payload).then((r) => r.data),
};

export const tripExpensesApi = {
  list: (tripId: string) =>
    apiClient.get<TripExpense[]>(`/trip-expenses/`, { params: { trip_id: tripId } }).then((r) => r.data),
  create: (payload: Partial<TripExpense>) =>
    apiClient.post<TripExpense>(`/trip-expenses/`, payload).then((r) => r.data),
  update: (id: string, payload: Partial<TripExpense>) =>
    apiClient.patch<TripExpense>(`/trip-expenses/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/trip-expenses/${id}`),
};

export const reportsApi = {
  summary: (params: { date_from: string; date_to: string; driver_id?: string; vehicle_id?: string; customer_id?: string }) =>
    apiClient.get(`/reports/summary`, { params }).then((r) => r.data),
};