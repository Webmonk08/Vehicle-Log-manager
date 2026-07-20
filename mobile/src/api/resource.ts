import { apiClient } from "./client";

/**
 * Generic CRUD wrapper matching the backend's make_crud_router shape.
 * Entity-specific files (trips.ts, loads.ts, drivers.ts) extend this with
 * their custom endpoints (debt-summary, collect, complete, etc).
 */
export function makeResource<T, TCreate = Partial<T>>(path: string) {
  return {
    list: (params?: Record<string, any>) =>
      apiClient.get<T[]>(`${path}/`, { params }).then((r) => r.data),

    get: (id: string) => apiClient.get<T>(`${path}/${id}`).then((r) => r.data),

    create: (payload: TCreate) =>
      apiClient.post<T>(`${path}/`, payload).then((r) => r.data),

    update: (id: string, payload: TCreate) =>
      apiClient.patch<T>(`${path}/${id}`, payload).then((r) => r.data),

    remove: (id: string) => apiClient.delete(`${path}/${id}`),
  };
}
