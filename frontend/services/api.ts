import axios from 'axios';
import {
  Driver, Vehicle, Customer, Trip, Load, VehicleExpense, LedgerEntry,
  DashboardData, DriverCreate, VehicleCreate, CustomerCreate, TripCreate,
  LoadCreate, TripCompletePayload, LoadSettlePayload, ExpenseCreate,
} from '@/types';

// Change this to your backend URL
const BASE_URL = 'http://localhost:8001/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  signup: (email: string, password: string) =>
    api.post('/auth/signup', { email, password }).then(r => r.data),
};

// ── Drivers ───────────────────────────────────────────────────────────────────

export const driversApi = {
  list: () => api.get<Driver[]>('/drivers').then(r => r.data),
  get: (id: string) => api.get<Driver>(`/drivers/${id}`).then(r => r.data),
  create: (data: DriverCreate) => api.post<Driver>('/drivers', data).then(r => r.data),
  update: (id: string, data: Partial<DriverCreate>) =>
    api.put<Driver>(`/drivers/${id}`, data).then(r => r.data),
  getLedger: (id: string) =>
    api.get<LedgerEntry[]>(`/drivers/${id}/ledger`).then(r => r.data),
  getUncollected: (id: string) =>
    api.get<Load[]>(`/drivers/${id}/uncollected`).then(r => r.data),
};

// ── Vehicles ──────────────────────────────────────────────────────────────────

export const vehiclesApi = {
  list: () => api.get<Vehicle[]>('/vehicles').then(r => r.data),
  get: (id: string) => api.get<Vehicle>(`/vehicles/${id}`).then(r => r.data),
  create: (data: VehicleCreate) => api.post<Vehicle>('/vehicles', data).then(r => r.data),
  update: (id: string, data: Partial<VehicleCreate>) =>
    api.put<Vehicle>(`/vehicles/${id}`, data).then(r => r.data),
  getExpenses: (id: string, type?: string) =>
    api.get<VehicleExpense[]>(`/vehicles/${id}/expenses`, { params: type ? { expense_type: type } : {} }).then(r => r.data),
  getTaxReminders: () => api.get<Vehicle[]>('/vehicles/tax-reminders').then(r => r.data),
  addExpense: (data: ExpenseCreate) =>
    api.post<VehicleExpense>('/vehicles/expenses', data).then(r => r.data),
};

// ── Customers ─────────────────────────────────────────────────────────────────

export const customersApi = {
  list: () => api.get<Customer[]>('/customers').then(r => r.data),
  get: (id: string) => api.get<Customer>(`/customers/${id}`).then(r => r.data),
  create: (data: CustomerCreate) => api.post<Customer>('/customers', data).then(r => r.data),
};

// ── Trips ─────────────────────────────────────────────────────────────────────

export const tripsApi = {
  list: (status?: string) =>
    api.get<Trip[]>('/trips', { params: status ? { status } : {} }).then(r => r.data),
  get: (id: string) => api.get<Trip>(`/trips/${id}`).then(r => r.data),
  create: (data: TripCreate) => api.post<Trip>('/trips', data).then(r => r.data),
  update: (id: string, data: Partial<TripCreate>) =>
    api.put<Trip>(`/trips/${id}`, data).then(r => r.data),
  complete: (id: string, data: TripCompletePayload) =>
    api.post<Trip>(`/trips/${id}/complete`, data).then(r => r.data),
};

// ── Loads ──────────────────────────────────────────────────────────────────────

export const loadsApi = {
  create: (data: LoadCreate) => api.post<Load>('/loads', data).then(r => r.data),
  get: (id: string) => api.get<Load>(`/loads/${id}`).then(r => r.data),
  settle: (id: string, data: LoadSettlePayload) =>
    api.post<Load>(`/loads/${id}/settle`, data).then(r => r.data),
  calculateRent: (data: { customer_id: string; quantity: number; rent_type: string; gross_rent?: number }) =>
    api.post('/loads/calculate-rent', data).then(r => r.data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getAnalytics: (period: string = 'monthly') =>
    api.get<DashboardData>('/dashboard/analytics', { params: { period } }).then(r => r.data),
};

export default api;
