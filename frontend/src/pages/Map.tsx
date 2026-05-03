import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { StartTripModal } from '@/components/StartTripModal'
import { ActiveTripTracker } from '@/components/ActiveTripTracker'
import { usageApi, vehicleApi, driverApi } from '@/api'
import type { Trip, LocationUpdate, Vehicle, Driver } from '@/api/types'
import type { GeoPosition } from '@/hooks/useGeolocation'

// ─── Leaflet icon fix ────────────────────────────────────────────────────────

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Custom marker icons ─────────────────────────────────────────────────────

function dotIcon(color: string, pulse = false) {
  const ping = pulse
    ? `<span style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:.4;animation:ping 1.2s ease-in-out infinite;"></span>`
    : ''
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:16px;height:16px;">
      ${ping}
      <div style="position:absolute;inset:2px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,.35);"></div>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

// ─── Map auto-fit ─────────────────────────────────────────────────────────────

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map  = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (!done.current && positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [50, 50], maxZoom: 15 })
      done.current = true
    }
  }, [map, positions])
  return null
}

// ─── Moving-marker updater ────────────────────────────────────────────────────

function LiveMarkerUpdater({
  vehicleId,
  position,
}: {
  vehicleId: number
  position: GeoPosition
}) {
  const map = useMap()
  useEffect(() => {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const id = (layer as L.Marker & { _vehicleId?: number })._vehicleId
        if (id === vehicleId) {
          layer.setLatLng([position.lat, position.lon])
        }
      }
    })
  }, [map, vehicleId, position])
  return null
}

// ─── Trip details sidebar ─────────────────────────────────────────────────────

interface MarkerData {
  vehicleId: number
  lat: number
  lon: number
  speed?: number
  trip: Trip
  vehicle?: Vehicle
  driver?: Driver
}

function TripSidebar({ marker, onClose }: { marker: MarkerData; onClose: () => void }) {
  return (
    <Card className="fixed top-20 right-4 z-[2000] w-72 shadow-xl">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <CardTitle className="text-sm">Trip #{marker.trip.id}</CardTitle>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={marker.trip.status} />
        </div>
        {marker.vehicle && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehicle</span>
            <span className="font-mono font-medium">{marker.vehicle.licensePlate}</span>
          </div>
        )}
        {marker.driver && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Driver</span>
            <span>{marker.driver.firstName} {marker.driver.lastName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Speed</span>
          <span>{marker.speed != null ? `${marker.speed.toFixed(1)} km/h` : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Started</span>
          <span>{new Date(marker.trip.startTime).toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Coordinates</span>
          <span className="font-mono text-xs">{marker.lat.toFixed(5)}, {marker.lon.toFixed(5)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Ping keyframe injected once ─────────────────────────────────────────────

const PING_STYLE = `
  @keyframes ping {
    0%   { transform: scale(1); opacity: .6 }
    75%  { transform: scale(2.2); opacity: 0 }
    100% { transform: scale(2.2); opacity: 0 }
  }
`
if (!document.getElementById('ping-kf')) {
  const s = document.createElement('style')
  s.id = 'ping-kf'
  s.textContent = PING_STYLE
  document.head.appendChild(s)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ActiveTracking {
  trip: Trip
  simulate: boolean
  startPos: GeoPosition
  currentPos: GeoPosition
}

export function Map() {
  const [selected, setSelected]         = useState<MarkerData | null>(null)
  const [modalOpen, setModalOpen]       = useState(false)
  const [tracking, setTracking]         = useState<ActiveTracking | null>(null)

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: usageApi.listTrips,
    refetchInterval: 5_000,
  })
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: vehicleApi.list })
  const { data: drivers  = [] } = useQuery({ queryKey: ['drivers'],  queryFn: driverApi.list  })

  const activeTrips       = trips.filter((t) => t.status === 'IN_PROGRESS')
  const activeVehicleIds  = [...new Set(activeTrips.map((t) => t.vehicleId))]

  const { data: latestLocations = [] } = useQuery({
    queryKey: ['locations-latest', activeVehicleIds],
    queryFn: () => usageApi.getLatestLocations(activeVehicleIds),
    refetchInterval: 5_000,
    enabled: activeVehicleIds.length > 0,
  })

  const vehicleById  = Object.fromEntries(vehicles.map((v) => [v.id, v]))
  const driverById   = Object.fromEntries(drivers.map((d) => [d.id, d]))
  const locByVehicle = Object.fromEntries(latestLocations.map((l) => [l.vehicleId, l]))

  // Merge backend locations with live tracking position
  function resolvePosition(trip: Trip): { lat: number; lon: number; speed?: number } {
    if (tracking && tracking.trip.id === trip.id) {
      return {
        lat: tracking.currentPos.lat,
        lon: tracking.currentPos.lon,
        speed: tracking.currentPos.speed,
      }
    }
    const loc: LocationUpdate | undefined = locByVehicle[trip.vehicleId]
    return {
      lat:   loc?.latitude  ?? trip.startLat,
      lon:   loc?.longitude ?? trip.startLon,
      speed: loc?.speed,
    }
  }

  const markers: MarkerData[] = activeTrips.map((trip) => {
    const pos = resolvePosition(trip)
    return {
      vehicleId: trip.vehicleId,
      lat: pos.lat,
      lon: pos.lon,
      speed: pos.speed,
      trip,
      vehicle: vehicleById[trip.vehicleId],
      driver:  driverById[trip.driverId],
    }
  })

  const positions: [number, number][] = markers.map((m) => [m.lat, m.lon])
  const center: [number, number]      = positions.length > 0 ? positions[0] : [37.7749, -122.4194]

  const handleTripStarted = useCallback((trip: Trip, simulate: boolean, startPos: GeoPosition) => {
    setTracking({ trip, simulate, startPos, currentPos: startPos })
  }, [])

  const handlePositionChange = useCallback((pos: GeoPosition) => {
    setTracking((prev) => prev ? { ...prev, currentPos: pos } : null)
  }, [])

  const handleTripEnded = useCallback(() => {
    setTracking(null)
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Map</h1>
          <p className="text-sm text-muted-foreground">
            {activeTrips.length} active trip{activeTrips.length !== 1 ? 's' : ''} · map refreshes every 5 s
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          disabled={!!tracking}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          {tracking ? 'Trip in progress…' : 'Start Trip'}
        </Button>
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border" style={{ height: '70vh' }}>
        {activeTrips.length === 0 && !tracking && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-2 bg-muted/60 pointer-events-none">
            <p className="text-muted-foreground">No active trips.</p>
            <p className="text-sm text-muted-foreground">Click <strong>Start Trip</strong> to begin tracking.</p>
          </div>
        )}

        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />

          {/* Live tracking position update hook */}
          {tracking && (
            <LiveMarkerUpdater
              vehicleId={tracking.trip.vehicleId}
              position={tracking.currentPos}
            />
          )}

          {/* Vehicle markers */}
          {markers.map((m) => {
            const isLive = tracking?.trip.vehicleId === m.vehicleId
            return (
              <Marker
                key={m.vehicleId}
                position={[m.lat, m.lon]}
                icon={dotIcon(isLive ? '#22c55e' : '#3b82f6', isLive)}
                eventHandlers={{ click: () => { setSelected(m); } }}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-32">
                    <p className="font-semibold">{m.vehicle?.licensePlate ?? `Vehicle ${m.vehicleId}`}</p>
                    {m.driver && <p>{m.driver.firstName} {m.driver.lastName}</p>}
                    {m.speed != null && <p>{m.speed.toFixed(1)} km/h</p>}
                    {isLive && <p className="text-green-600 font-medium">● Live tracking</p>}
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Accuracy circle for live tracked vehicle */}
          {tracking && (
            <Circle
              center={[tracking.currentPos.lat, tracking.currentPos.lon]}
              radius={tracking.simulate ? 20 : 50}
              pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.08, weight: 1.5 }}
            />
          )}
        </MapContainer>

        {/* Trip detail sidebar (click marker) */}
        {selected && !tracking && (
          <TripSidebar marker={selected} onClose={() => setSelected(null)} />
        )}

        {/* Active trip tracker panel */}
        {tracking && (
          <ActiveTripTracker
            trip={tracking.trip}
            vehicle={vehicleById[tracking.trip.vehicleId]}
            driver={driverById[tracking.trip.driverId]}
            simulate={tracking.simulate}
            startPos={tracking.startPos}
            onTripEnded={handleTripEnded}
            onPositionChange={handlePositionChange}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
          Other active vehicle
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
          Your tracked vehicle
        </div>
        <span>Click a marker to view trip details</span>
      </div>

      {/* Start trip modal */}
      <StartTripModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onTripStarted={handleTripStarted}
      />
    </div>
  )
}
