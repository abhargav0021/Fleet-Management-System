import { apiClient } from './client'
import type {
  Trip,
  StartTripRequest,
  EndTripRequest,
  LocationUpdate,
  LocationUpdateRequest,
  LocationUpdateMessage,
} from './types'

const BASE = '/api/usage'

export const usageApi = {
  // ── Trips ──────────────────────────────────────────────────────────────────

  listTrips: () => apiClient.get<Trip[]>(`${BASE}/trips`).then((r) => r.data),

  startTrip: (body: StartTripRequest) =>
    apiClient.post<Trip>(`${BASE}/trips/start`, body).then((r) => r.data),

  endTrip: (id: number, body: EndTripRequest) =>
    apiClient.put<Trip>(`${BASE}/trips/${id}/end`, body).then((r) => r.data),

  // ── Locations ──────────────────────────────────────────────────────────────

  postLocation: (body: LocationUpdateRequest) =>
    apiClient.post<LocationUpdateMessage>(`${BASE}/locations`, body).then((r) => r.data),

  getVehicleLocations: (vehicleId: number, from?: string, to?: string) => {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    return apiClient
      .get<LocationUpdate[]>(`${BASE}/locations/vehicle/${vehicleId}`, { params })
      .then((r) => r.data)
  },

  // Fetches the single most-recent location for each vehicleId in `ids`.
  // Calls /locations/vehicle/{id} with a 30-minute lookback and picks the latest.
  getLatestLocations: async (vehicleIds: number[]): Promise<LocationUpdate[]> => {
    if (vehicleIds.length === 0) return []
    const from = new Date(Date.now() - 30 * 60 * 1000).toISOString().slice(0, 19)
    const results = await Promise.allSettled(
      vehicleIds.map((id) => usageApi.getVehicleLocations(id, from))
    )
    return results.flatMap((r) => {
      if (r.status !== 'fulfilled' || r.value.length === 0) return []
      return [r.value.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]]
    })
  },
}
