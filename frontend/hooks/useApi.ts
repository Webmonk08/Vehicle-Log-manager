import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, driversApi, vehiclesApi, customersApi, productsApi, tripsApi, loadsApi } from '@/services/api';
import {
  DriverCreate, VehicleCreate, CustomerCreate, ProductCreate, ProductUpdate, TripCreate,
  LoadCreate, TripCompletePayload, LoadSettlePayload, ExpenseCreate,
} from '@/types';
import { vehiclesApi as vApi } from '@/services/api';

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useDashboard(period: string = 'monthly') {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => dashboardApi.getAnalytics(period),
    staleTime: 30_000,
  });
}

// ── Drivers ───────────────────────────────────────────────────────────────────

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: driversApi.list,
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ['drivers', id],
    queryFn: () => driversApi.get(id),
    enabled: !!id,
  });
}

export function useDriverLedger(id: string) {
  return useQuery({
    queryKey: ['drivers', id, 'ledger'],
    queryFn: () => driversApi.getLedger(id),
    enabled: !!id,
  });
}

export function useDriverUncollected(id: string) {
  return useQuery({
    queryKey: ['drivers', id, 'uncollected'],
    queryFn: () => driversApi.getUncollected(id),
    enabled: !!id,
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DriverCreate) => driversApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

// ── Vehicles ──────────────────────────────────────────────────────────────────

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.list,
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => vehiclesApi.get(id),
    enabled: !!id,
  });
}

export function useVehicleExpenses(id: string, type?: string) {
  return useQuery({
    queryKey: ['vehicles', id, 'expenses', type],
    queryFn: () => vehiclesApi.getExpenses(id, type),
    enabled: !!id,
  });
}

export function useTaxReminders() {
  return useQuery({
    queryKey: ['vehicles', 'tax-reminders'],
    queryFn: vehiclesApi.getTaxReminders,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleCreate) => vehiclesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleCreate> }) =>
      vehiclesApi.update(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['vehicles', variables.id] });
    },
  });
}

export function useAddVehicleExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreate) => vApi.addExpense(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['vehicles', variables.vehicle_id, 'expenses'] });
      qc.invalidateQueries({ queryKey: ['vehicles', 'tax-reminders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateVehicleExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseCreate }) => 
      vApi.updateExpense(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['vehicles', variables.data.vehicle_id, 'expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteVehicleExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vehicle_id }: { id: string; vehicle_id: string }) => 
      vApi.deleteExpense(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['vehicles', variables.vehicle_id, 'expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ── Customers ─────────────────────────────────────────────────────────────────

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.list,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerCreate) => customersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

// ── Products (Rate Card) ───────────────────────────────────────────────────────

export function useProducts(customerId?: string) {
  return useQuery({
    queryKey: ['products', { customerId }],
    queryFn: () => productsApi.list(customerId),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductCreate) => productsApi.create(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products', { customerId: variables.customer_id }] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ── Trips ─────────────────────────────────────────────────────────────────────

export function useTrips(status?: string) {
  return useQuery({
    queryKey: ['trips', status],
    queryFn: () => tripsApi.list(status),
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => tripsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TripCreate) => tripsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCompleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TripCompletePayload }) =>
      tripsApi.complete(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TripCreate> }) =>
      tripsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ── Loads ──────────────────────────────────────────────────────────────────────

export function useCreateLoad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoadCreate) => loadsApi.create(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['trips', variables.trip_id] });
      qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useUpdateLoad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LoadCreate> }) =>
      loadsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useDeleteLoad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loadsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useSettleLoad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoadSettlePayload }) =>
      loadsApi.settle(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCalculateRent() {
  return useMutation({
    mutationFn: (data: { customer_id: string; quantity: number; rent_type: string; gross_rent?: number }) =>
      loadsApi.calculateRent(data),
  });
}
