import { Badge } from '@/components/ui/badge'
import type { VehicleStatus, DriverStatus, TripStatus } from '@/api/types'

type Status = VehicleStatus | DriverStatus | TripStatus

const variantMap: Record<Status, 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  ACTIVE: 'success',
  AVAILABLE: 'success',
  COMPLETED: 'success',
  ON_TRIP: 'info',
  IN_PROGRESS: 'info',
  INACTIVE: 'secondary',
  OFF_DUTY: 'secondary',
  CANCELLED: 'destructive',
  MAINTENANCE: 'warning',
}

const labelMap: Record<Status, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  MAINTENANCE: 'Maintenance',
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>
}
