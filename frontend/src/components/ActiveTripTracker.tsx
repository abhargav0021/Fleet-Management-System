import { useEffect, useRef, useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Square, Wifi, WifiOff, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/Spinner'
import { useGeolocation, haversineKm, type GeoPosition } from '@/hooks/useGeolocation'
import { usageApi } from '@/api'
import { toast } from '@/components/ui/use-toast'
import type { Trip, Vehicle, Driver } from '@/api/types'

interface Props {
  trip: Trip
  vehicle: Vehicle | undefined
  driver: Driver | undefined
  simulate: boolean
  startPos: GeoPosition
  onTripEnded: () => void
  onPositionChange: (pos: GeoPosition) => void
}

function elapsed(startTime: string) {
  const secs = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

const POST_INTERVAL_MS = 3000   // post location every 3 s even without GPS change

export function ActiveTripTracker({ trip, vehicle, driver, simulate, startPos, onTripEnded, onPositionChange }: Props) {
  const qc = useQueryClient()
  const geo = useGeolocation()

  const [duration, setDuration]         = useState('0:00')
  const [distanceKm, setDistanceKm]     = useState(0)
  const [lastPosted, setLastPosted]     = useState<GeoPosition | null>(null)
  const [postCount, setPostCount]       = useState(0)
  const [postError, setPostError]       = useState(false)

  const prevPosRef = useRef<GeoPosition>(startPos)
  const accDistRef = useRef(0)
  const postTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // --- start tracking on mount ---
  useEffect(() => {
    if (simulate) {
      geo.startSimulation(startPos)
    } else {
      geo.startTracking()
    }
    return () => geo.stopTracking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- clock ---
  useEffect(() => {
    const t = setInterval(() => setDuration(elapsed(trip.startTime)), 1000)
    return () => clearInterval(t)
  }, [trip.startTime])

  // --- accumulate distance when position changes ---
  useEffect(() => {
    if (!geo.position) return
    const prev = prevPosRef.current
    const d = haversineKm(prev.lat, prev.lon, geo.position.lat, geo.position.lon)
    if (d > 0.005) {               // ignore sub-5m noise
      accDistRef.current += d
      setDistanceKm(accDistRef.current)
      prevPosRef.current = geo.position
    }
    onPositionChange(geo.position)
  }, [geo.position, onPositionChange])

  // --- post location to backend every POST_INTERVAL_MS ---
  const postLocation = useCallback(() => {
    const pos = geo.position ?? startPos
    usageApi
      .postLocation({
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        latitude: pos.lat,
        longitude: pos.lon,
        speed: pos.speed,
        heading: pos.heading,
        tripId: trip.id,
      })
      .then(() => {
        setLastPosted(pos)
        setPostError(false)
        setPostCount((c) => c + 1)
      })
      .catch(() => setPostError(true))
  }, [geo.position, startPos, trip])

  useEffect(() => {
    postLocation()                                  // post immediately on mount
    postTimerRef.current = setInterval(postLocation, POST_INTERVAL_MS)
    return () => {
      if (postTimerRef.current) clearInterval(postTimerRef.current)
    }
  }, [postLocation])

  // --- end trip ---
  const endMut = useMutation({
    mutationFn: () => {
      const pos = geo.position ?? startPos
      return usageApi.endTrip(trip.id, {
        endLat: pos.lat,
        endLon: pos.lon,
        distanceKm: accDistRef.current > 0 ? accDistRef.current : undefined,
      })
    },
    onSuccess: () => {
      geo.stopTracking()
      if (postTimerRef.current) clearInterval(postTimerRef.current)
      qc.invalidateQueries({ queryKey: ['trips'] })
      toast({ title: 'Trip ended', description: `${accDistRef.current.toFixed(2)} km covered.` })
      onTripEnded()
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to end trip' }),
  })

  const currentPos = geo.position ?? startPos

  return (
    <Card className="fixed bottom-4 left-4 z-[2000] w-72 shadow-xl border-2 border-primary/30 bg-card/95 backdrop-blur">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            Live Trip #{trip.id}
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {postError ? (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Wifi className="h-3.5 w-3.5 text-green-500" />
            )}
            {geo.isSimulating && (
              <span className="text-blue-500 font-medium">SIM</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Vehicle + driver */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Vehicle</span>
          <span className="font-mono font-medium text-right">
            {vehicle?.licensePlate ?? `#${trip.vehicleId}`}
          </span>
          <span className="text-muted-foreground">Driver</span>
          <span className="text-right">
            {driver ? `${driver.firstName} ${driver.lastName}` : `#${trip.driverId}`}
          </span>
        </div>

        <div className="h-px bg-border" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold tabular-nums">{duration}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Duration</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{distanceKm.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">km</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">
              {currentPos.speed != null ? Math.round(currentPos.speed) : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">km/h</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Current position */}
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Position
            </span>
            <span className="font-mono">
              {currentPos.lat.toFixed(5)}, {currentPos.lon.toFixed(5)}
            </span>
          </div>
          {geo.error && (
            <p className="text-destructive">{geo.error}</p>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Updates posted</span>
            <span className={postError ? 'text-destructive' : ''}>{postCount}</span>
          </div>
          {lastPosted && (
            <div className="flex justify-between text-muted-foreground">
              <span>Last posted</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* End trip */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2"
          onClick={() => endMut.mutate()}
          disabled={endMut.isPending}
        >
          {endMut.isPending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Square className="h-3.5 w-3.5 fill-current" />
          )}
          End Trip
        </Button>
      </CardContent>
    </Card>
  )
}
