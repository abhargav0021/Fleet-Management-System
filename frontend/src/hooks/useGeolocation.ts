import { useState, useEffect, useRef, useCallback } from 'react'

export interface GeoPosition {
  lat: number
  lon: number
  speed?: number       // km/h
  heading?: number     // degrees 0-360
  accuracy?: number    // metres
}

interface UseGeolocationReturn {
  position: GeoPosition | null
  error: string | null
  isTracking: boolean
  isSimulating: boolean
  startTracking: () => void
  startSimulation: (origin: GeoPosition) => void
  stopTracking: () => void
  getOnce: () => Promise<GeoPosition>
}

// Haversine – returns distance in km between two GPS coords.
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const SIM_INTERVAL_MS = 3000          // update every 3 s
const SIM_SPEED_KMH  = 35            // simulated driving speed
const SIM_TURN_DEG   = 8             // max heading change per tick

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [isTracking, setIsTracking]     = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  const watchIdRef  = useRef<number | null>(null)
  const simRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const simStateRef = useRef<{ lat: number; lon: number; heading: number } | null>(null)

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (simRef.current !== null) {
      clearInterval(simRef.current)
      simRef.current = null
    }
    simStateRef.current = null
    setIsTracking(false)
    setIsSimulating(false)
  }, [])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported — use Simulate mode instead.')
      return
    }
    setIsTracking(true)
    setIsSimulating(false)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
          heading: pos.coords.heading ?? undefined,
          accuracy: pos.coords.accuracy,
        })
        setError(null)
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 0 }
    )
  }, [])

  // Simulation: move from `origin` in a gradual curved path.
  const startSimulation = useCallback((origin: GeoPosition) => {
    stopTracking()
    const initHeading = origin.heading ?? Math.random() * 360

    simStateRef.current = { lat: origin.lat, lon: origin.lon, heading: initHeading }
    setPosition({ ...origin, speed: SIM_SPEED_KMH, heading: initHeading })
    setIsTracking(true)
    setIsSimulating(true)

    simRef.current = setInterval(() => {
      const s = simStateRef.current!
      // Drift heading by a random amount each tick
      const turn = (Math.random() - 0.5) * 2 * SIM_TURN_DEG
      s.heading = (s.heading + turn + 360) % 360

      // Distance per tick in degrees (approx at equator)
      const distKm = (SIM_SPEED_KMH * SIM_INTERVAL_MS) / 3_600_000
      const headingRad = s.heading * (Math.PI / 180)
      s.lat += (distKm / 111) * Math.cos(headingRad)
      s.lon += (distKm / (111 * Math.cos(s.lat * (Math.PI / 180)))) * Math.sin(headingRad)

      const next: GeoPosition = {
        lat: s.lat,
        lon: s.lon,
        speed: SIM_SPEED_KMH + (Math.random() - 0.5) * 10,
        heading: s.heading,
      }
      setPosition(next)
    }, SIM_INTERVAL_MS)
  }, [stopTracking])

  const getOnce = useCallback((): Promise<GeoPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
          heading: pos.coords.heading ?? undefined,
          accuracy: pos.coords.accuracy,
        }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 10_000 }
      )
    }), [])

  // Clean up on unmount
  useEffect(() => () => stopTracking(), [stopTracking])

  return { position, error, isTracking, isSimulating, startTracking, startSimulation, stopTracking, getOnce }
}
