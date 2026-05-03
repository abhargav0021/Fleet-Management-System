import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { usageApi, vehicleApi, driverApi } from '@/api'
import { toast } from '@/components/ui/use-toast'
import type { Trip } from '@/api/types'
import { ArrowLeft, Square, LocateFixed, Loader2 } from 'lucide-react'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function formatDuration(start: string, end?: string) {
  const a = new Date(start).getTime()
  const b = end ? new Date(end).getTime() : Date.now()
  const s = Math.round((b - a) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── End Trip Modal ───────────────────────────────────────────────────────────

function EndTripModal({
  trip,
  open,
  onOpenChange,
  onEnded,
}: {
  trip: Trip
  open: boolean
  onOpenChange: (o: boolean) => void
  onEnded: () => void
}) {
  const qc = useQueryClient()
  const [lat, setLat] = useState(String(trip.startLat))
  const [lon, setLon] = useState(String(trip.startLon))
  const [gpsLoading, setGpsLoading] = useState(false)

  async function getGPS() {
    setGpsLoading(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000 })
      )
      setLat(pos.coords.latitude.toFixed(6))
      setLon(pos.coords.longitude.toFixed(6))
    } catch {
      toast({ variant: 'destructive', title: 'GPS unavailable', description: 'Enter coordinates manually.' })
    } finally {
      setGpsLoading(false)
    }
  }

  const endMut = useMutation({
    mutationFn: () =>
      usageApi.endTrip(trip.id, {
        endLat: parseFloat(lat),
        endLon: parseFloat(lon),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] })
      toast({ title: `Trip #${trip.id} ended` })
      onOpenChange(false)
      onEnded()
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to end trip' }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>End Trip #{trip.id}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>End Location</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getGPS}
                disabled={gpsLoading}
                className="h-7 text-xs gap-1"
              >
                {gpsLoading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <LocateFixed className="h-3 w-3" />}
                Use GPS
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => endMut.mutate()}
            disabled={endMut.isPending || !lat || !lon}
          >
            {endMut.isPending && <Spinner className="h-4 w-4 mr-2" />}
            End Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Trip detail view ─────────────────────────────────────────────────────────

function TripDetail({ trip, onBack }: { trip: Trip; onBack: () => void; onEnded: () => void }) {
  const [endModalOpen, setEndModalOpen] = useState(false)

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['trip-locations', trip.vehicleId, trip.startTime, trip.endTime],
    queryFn: () => usageApi.getVehicleLocations(trip.vehicleId, trip.startTime, trip.endTime),
  })

  const path: [number, number][] = locations.map((l) => [l.latitude, l.longitude])
  const center: [number, number] =
    path.length > 0 ? path[Math.floor(path.length / 2)] : [trip.startLat, trip.startLon]

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: vehicleApi.list })
  const { data: drivers  = [] } = useQuery({ queryKey: ['drivers'],  queryFn: driverApi.list  })
  const vehicle = vehicles.find((v) => v.id === trip.vehicleId)
  const driver  = drivers.find((d)  => d.id === trip.driverId)

  return (
    <div className="space-y-4">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">Trip #{trip.id}</h2>
        <StatusBadge status={trip.status} />

        {/* End trip button — only for in-progress trips */}
        {trip.status === 'IN_PROGRESS' && (
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => setEndModalOpen(true)}
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            End Trip
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Vehicle',  value: vehicle ? vehicle.licensePlate : `#${trip.vehicleId}` },
          { label: 'Driver',   value: driver  ? `${driver.firstName} ${driver.lastName}` : `#${trip.driverId}` },
          { label: 'Duration', value: formatDuration(trip.startTime, trip.endTime) },
          { label: 'Distance', value: trip.distanceKm != null ? `${trip.distanceKm.toFixed(2)} km` : '—' },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-sm">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Route map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Route</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-xl" style={{ height: 340 }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Spinner /></div>
          ) : (
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {path.length >= 2 && <Polyline positions={path} color="#3b82f6" weight={3} />}
              {path.length > 0 && (
                <>
                  <Marker position={path[0]}><Popup>Start</Popup></Marker>
                  <Marker position={path[path.length - 1]}>
                    <Popup>{trip.status === 'IN_PROGRESS' ? 'Current' : 'End'}</Popup>
                  </Marker>
                </>
              )}
              {path.length === 0 && (
                <Marker position={[trip.startLat, trip.startLon]}><Popup>Start</Popup></Marker>
              )}
            </MapContainer>
          )}
        </CardContent>
      </Card>

      {/* End trip modal */}
      <EndTripModal
        trip={trip}
        open={endModalOpen}
        onOpenChange={setEndModalOpen}
        onEnded={onBack}
      />
    </div>
  )
}

// ─── Trips list ───────────────────────────────────────────────────────────────

export function Trips() {
  const qc = useQueryClient()
  const [selected, setSelected]     = useState<Trip | null>(null)
  const [endTarget, setEndTarget]   = useState<Trip | null>(null)

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: usageApi.listTrips,
    refetchInterval: 10_000,
  })
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: vehicleApi.list })
  const { data: drivers  = [] } = useQuery({ queryKey: ['drivers'],  queryFn: driverApi.list  })
  const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]))
  const driverById  = Object.fromEntries(drivers.map((d)  => [d.id, d]))

  if (selected) {
    return (
      <TripDetail
        trip={selected}
        onBack={() => setSelected(null)}
        onEnded={() => {
          setSelected(null)
          qc.invalidateQueries({ queryKey: ['trips'] })
        }}
      />
    )
  }

  const sorted = [...trips].sort((a, b) => b.startTime.localeCompare(a.startTime))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Trips</h1>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : trips.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No trips recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((trip) => {
            const v = vehicleById[trip.vehicleId]
            const d = driverById[trip.driverId]
            const isActive = trip.status === 'IN_PROGRESS'

            return (
              <Card
                key={trip.id}
                className="hover:bg-accent/40 transition-colors cursor-pointer"
                onClick={() => setSelected(trip)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                      )}
                      <span className="font-semibold text-sm">Trip #{trip.id}</span>
                      <StatusBadge status={trip.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {v ? `${v.licensePlate} (${v.make} ${v.model})` : `Vehicle ${trip.vehicleId}`}
                      {' · '}
                      {d ? `${d.firstName} ${d.lastName}` : `Driver ${trip.driverId}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm space-y-1">
                      <p className="text-muted-foreground">
                        {new Date(trip.startTime).toLocaleDateString()}{' '}
                        {new Date(trip.startTime).toLocaleTimeString()}
                      </p>
                      <div className="flex items-center gap-3 justify-end">
                        <span className="text-muted-foreground">{formatDuration(trip.startTime, trip.endTime)}</span>
                        {trip.distanceKm != null && (
                          <span className="font-medium">{trip.distanceKm.toFixed(2)} km</span>
                        )}
                      </div>
                    </div>

                    {/* End trip button — stop propagation so row click still works */}
                    {isActive && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5 shrink-0"
                        onClick={(e) => { e.stopPropagation(); setEndTarget(trip) }}
                      >
                        <Square className="h-3 w-3 fill-current" />
                        End Trip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* End trip modal from list */}
      {endTarget && (
        <EndTripModal
          trip={endTarget}
          open={!!endTarget}
          onOpenChange={(o) => !o && setEndTarget(null)}
          onEnded={() => setEndTarget(null)}
        />
      )}
    </div>
  )
}
