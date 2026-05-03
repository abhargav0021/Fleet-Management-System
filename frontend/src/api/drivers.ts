import { apiClient } from './client'
import type {
  Driver,
  CreateDriverRequest,
  AssignVehicleRequest,
  UpdateDriverStatusRequest,
} from './types'

const BASE = '/api/drivers'

export const driverApi = {
  list: () => apiClient.get<Driver[]>(BASE).then((r) => r.data),

  get: (id: number) => apiClient.get<Driver>(`${BASE}/${id}`).then((r) => r.data),

  create: (body: CreateDriverRequest) =>
    apiClient.post<Driver>(BASE, body).then((r) => r.data),

  update: (id: number, body: CreateDriverRequest) =>
    apiClient.put<Driver>(`${BASE}/${id}`, body).then((r) => r.data),

  remove: (id: number) => apiClient.delete(`${BASE}/${id}`),

  assignVehicle: (id: number, body: AssignVehicleRequest) =>
    apiClient.patch<Driver>(`${BASE}/${id}/assign-vehicle`, body).then((r) => r.data),

  updateStatus: (id: number, body: UpdateDriverStatusRequest) =>
    apiClient.patch<Driver>(`${BASE}/${id}/status`, body).then((r) => r.data),
}
