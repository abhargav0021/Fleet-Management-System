// ─── Enums ───────────────────────────────────────────────────────────────────

export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY'
export type TripStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: number
  licensePlate: string
  type: string
  make: string
  model: string
  year: number
  status: VehicleStatus
  createdAt: string
  updatedAt: string
}

export interface CreateVehicleRequest {
  licensePlate: string
  type: string
  make: string
  model: string
  year: number
  status?: VehicleStatus
}

export interface UpdateVehicleStatusRequest {
  status: VehicleStatus
}

// ─── Driver ──────────────────────────────────────────────────────────────────

export interface Driver {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  licenseNumber: string
  status: DriverStatus
  assignedVehicleId?: number
  createdAt: string
  updatedAt: string
}

export interface CreateDriverRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  licenseNumber: string
  status?: DriverStatus
}

export interface AssignVehicleRequest {
  vehicleId: number | null
}

export interface UpdateDriverStatusRequest {
  status: DriverStatus
}

// ─── Trip ────────────────────────────────────────────────────────────────────

export interface Trip {
  id: number
  vehicleId: number
  driverId: number
  startTime: string
  endTime?: string
  startLat: number
  startLon: number
  endLat?: number
  endLon?: number
  status: TripStatus
  distanceKm?: number
  locationUpdates?: LocationUpdate[]
}

export interface StartTripRequest {
  vehicleId: number
  driverId: number
  startLat: number
  startLon: number
}

export interface EndTripRequest {
  endLat: number
  endLon: number
  distanceKm?: number
}

// ─── Location ────────────────────────────────────────────────────────────────

export interface LocationUpdate {
  id: number
  vehicleId: number
  driverId: number
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  timestamp: string
  tripId?: number
}

export interface LocationUpdateRequest {
  vehicleId: number
  driverId: number
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  tripId?: number
}

export interface LocationUpdateMessage {
  vehicleId: number
  driverId: number
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  timestamp: string
}

// ─── Error ───────────────────────────────────────────────────────────────────

export interface ApiError {
  status: number
  message: string
  timestamp: string
}
