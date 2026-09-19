import { useQuery } from "@tanstack/react-query";
import { customersApi, driversApi, productsApi, vehiclesApi } from "@/api/entities";

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: () => driversApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => customersApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}
