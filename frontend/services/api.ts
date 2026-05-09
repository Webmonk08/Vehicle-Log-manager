import axios from 'axios';
import {
  Driver, Vehicle, Customer, Product, Trip, Load, VehicleExpense, LedgerEntry,
  DashboardData, DriverCreate, VehicleCreate, CustomerCreate, ProductCreate, ProductUpdate, TripCreate,
  LoadCreate, TripCompletePayload, LoadSettlePayload, ExpenseCreate,
} from '@/types';

let BASE_URL 
console.log(process.env.EXPO_PUBLIC_PRODUCTION, "production")
if (process.env.EXPO_PUBLIC_PRODUCTION == "false") {
  BASE_URL = 'http://10.177.25.42/api/v1'
}
else{
  BASE_URL = process.env.EXPO_PUBLIC_API_URL
}
console.log(BASE_URL, "BASE_URL");
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptors ─────────────────────────────────────────────────────────────

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Log outgoing requests
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error(`[API Request Error]`, error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Log and handle errors
    const { response, config } = error;
    
    if (response) {
      // The server responded with a status code outside the 2xx range
      const status = response.status;
      const data = response.data;
      const message = data?.detail || data?.message || error.message;
      
      console.error(
        `[API Error] ${status} ${config.method?.toUpperCase()} ${config.url}`,
        '\nMessage:', message,
        '\nResponse Data:', data
      );

      // Handle specific status codes if needed
      if (status === 401) {
        // Handle Unauthorized
      } else if (status === 403) {
        // Handle Forbidden
      } else if (status >= 500) {
        // Server errors
        console.error('Server side error occurred');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`[API Network Error] ${config.method?.toUpperCase()} ${config.url}`, error.message);
      // Alert.alert('Network Error', 'Please check your internet connection and try again.');
    } else {
      // Something happened in setting up the request
      console.error(`[API Setup Error]`, error.message);
    }
    
    return Promise.reject(error);
  }
);

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
  updateExpense: (id: string, data: ExpenseCreate) =>
    api.put<VehicleExpense>(`/vehicles/expenses/${id}`, data).then(r => r.data),
  deleteExpense: (id: string) =>
    api.delete(`/vehicles/expenses/${id}`).then(r => r.data),
};

// ── Customers ─────────────────────────────────────────────────────────────────

export const customersApi = {
  list: () => api.get<Customer[]>('/customers').then(r => r.data),
  get: (id: string) => api.get<Customer>(`/customers/${id}`).then(r => r.data),
  create: (data: CustomerCreate) => api.post<Customer>('/customers', data).then(r => r.data),
};

// ── Products (Rate Card) ───────────────────────────────────────────────────────

export const productsApi = {
  list: (customerId?: string) =>
    api.get<Product[]>('/products', { params: customerId ? { customer_id: customerId } : {} }).then(r => r.data),
  get: (id: string) => api.get<Product>(`/products/${id}`).then(r => r.data),
  create: (data: ProductCreate) => api.post<Product>('/products', data).then(r => r.data),
  update: (id: string, data: ProductUpdate) => api.put<Product>(`/products/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/products/${id}`).then(r => r.data),
};

// ── Trips ─────────────────────────────────────────────────────────────────────

export const tripsApi = {
  list: (status?: string) =>
    api.get<Trip[]>('/trips', { params: status ? { status } : {} }).then(r => r.data),
  get: (id: string) => api.get<Trip>(`/trips/${id}`).then(r => r.data),
  create: (data: TripCreate) => api.post<Trip>('/trips', data).then(r => r.data),
  update: (id: string, data: Partial<TripCreate>) =>
    api.put<Trip>(`/trips/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/trips/${id}`).then(r => r.data),
  complete: (id: string, data: TripCompletePayload) =>
    api.post<Trip>(`/trips/${id}/complete`, data).then(r => r.data),
};

// ── Loads ──────────────────────────────────────────────────────────────────────

export const loadsApi = {
  create: (data: LoadCreate) => api.post<Load>('/loads', data).then(r => r.data),
  get: (id: string) => api.get<Load>(`/loads/${id}`).then(r => r.data),
  update: (id: string, data: Partial<LoadCreate>) =>
    api.put<Load>(`/loads/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/loads/${id}`).then(r => r.data),
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
