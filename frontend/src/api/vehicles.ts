import { apiClient } from './client'
import type {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleStatusRequest,
} from './types'

const BASE = '/api/vehicles'

export const vehicleApi = {
  list: () => apiClient.get<Vehicle[]>(BASE).then((r) => r.data),

  get: (id: number) => apiClient.get<Vehicle>(`${BASE}/${id}`).then((r) => r.data),

  create: (body: CreateVehicleRequest) =>
    apiClient.post<Vehicle>(BASE, body).then((r) => r.data),

  update: (id: number, body: CreateVehicleRequest) =>
    apiClient.put<Vehicle>(`${BASE}/${id}`, body).then((r) => r.data),

  remove: (id: number) => apiClient.delete(`${BASE}/${id}`),

  updateStatus: (id: number, body: UpdateVehicleStatusRequest) =>
    apiClient.patch<Vehicle>(`${BASE}/${id}/status`, body).then((r) => r.data),
}
