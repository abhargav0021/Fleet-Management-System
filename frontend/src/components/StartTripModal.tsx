import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LocateFixed, Loader2, AlertCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/Spinner'
import { vehicleApi, driverApi, usageApi } from '@/api'
import { toast } from '@/components/ui/use-toast'
import type { Trip } from '@/api/types'
import type { GeoPosition } from '@/hooks/useGeolocation'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  onTripStarted: (trip: Trip, simulate: boolean, startPos: GeoPosition) => void
}

export function StartTripModal({ open, onOpenChange, onTripStarted }: Props) {
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId]   = useState('')
  const [lat, setLat]             = useState('')
  const [lon, setLon]             = useState('')
  const [simulate, setSimulate]   = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError]   = useState<string | null>(null)

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: vehicleApi.list })
  const { data: drivers  = [] } = useQuery({ queryKey: ['drivers'],  queryFn: driverApi.list  })

  const activeVehicles    = vehicles.filter((v) => v.status === 'ACTIVE')
  const availableDrivers  = drivers.filter((d) => d.status === 'AVAILABLE')

  const qc = useQueryClient()
  const startMut = useMutation({
    mutationFn: usageApi.startTrip,
    onSuccess: (trip) => {
      qc.invalidateQueries({ queryKey: ['trips'] })
      const startPos: GeoPosition = { lat: Number(lat), lon: Number(lon) }
      onTripStarted(trip, simulate, startPos)
      onOpenChange(false)
      reset()
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to start trip' }),
  })

  function reset() {
    setVehicleId('')
    setDriverId('')
    setLat('')
    setLon('')
    setSimulate(false)
    setGpsError(null)
  }

  function handleClose(o: boolean) {
    if (!o) reset()
    onOpenChange(o)
  }

  async function getGPS() {
    setGpsLoading(true)
    setGpsError(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10_000,
        })
      )
      setLat(pos.coords.latitude.toFixed(6))
      setLon(pos.coords.longitude.toFixed(6))
    } catch (e: unknown) {
      const msg = e instanceof GeolocationPositionError ? e.message : 'GPS unavailable — enter coordinates manually or use Simulate mode.'
      setGpsError(msg)
    } finally {
      setGpsLoading(false)
    }
  }

  function handleSubmit() {
    const parsedLat = parseFloat(lat)
    const parsedLon = parseFloat(lon)
    if (!vehicleId || !driverId) {
      toast({ variant: 'destructive', title: 'Select a vehicle and driver' })
      return
    }
    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      toast({ variant: 'destructive', title: 'Enter valid coordinates' })
      return
    }
    startMut.mutate({
      vehicleId: Number(vehicleId),
      driverId: Number(driverId),
      startLat: parsedLat,
      startLon: parsedLon,
    })
  }

  const canSubmit = vehicleId && driverId && lat && lon && !startMut.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Trip</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Vehicle */}
          <div className="space-y-1">
            <Label>Vehicle <span className="text-destructive">*</span></Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select active vehicle…" />
              </SelectTrigger>
              <SelectContent>
                {activeVehicles.length === 0 && (
                  <SelectItem value="_none" disabled>No active vehicles</SelectItem>
                )}
                {activeVehicles.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.licensePlate} — {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Driver */}
          <div className="space-y-1">
            <Label>Driver <span className="text-destructive">*</span></Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Select available driver…" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.length === 0 && (
                  <SelectItem value="_none" disabled>No available drivers</SelectItem>
                )}
                {availableDrivers.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.firstName} {d.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start coordinates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Start Location <span className="text-destructive">*</span></Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getGPS}
                disabled={gpsLoading}
                className="h-7 text-xs gap-1"
              >
                {gpsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
                Use GPS
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 37.7749"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. -122.4194"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                />
              </div>
            </div>
            {gpsError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {gpsError}
              </p>
            )}
          </div>

          {/* Simulate mode */}
          <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/40 transition-colors">
            <input
              type="checkbox"
              checked={simulate}
              onChange={(e) => setSimulate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-primary"
            />
            <div>
              <p className="text-sm font-medium">Simulate GPS movement</p>
              <p className="text-xs text-muted-foreground">
                Automatically moves the vehicle at ~35 km/h from the start point —
                useful for demos without a real GPS device.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {startMut.isPending && <Spinner className="h-4 w-4 mr-2" />}
            Start Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
