import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Truck, Users, Activity, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { Spinner } from '@/components/Spinner'
import { vehicleApi, driverApi, usageApi } from '@/api'
import type { Trip } from '@/api/types'

function buildHourlyChart(trips: Trip[]) {
  const now = Date.now()
  const buckets: Record<string, number> = {}
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 3_600_000)
    buckets[`${d.getHours()}:00`] = 0
  }
  trips.forEach((t) => {
    if (!t.locationUpdates) return
    t.locationUpdates.forEach((loc) => {
      const ts = new Date(loc.timestamp)
      if (now - ts.getTime() <= 24 * 3_600_000) {
        const key = `${ts.getHours()}:00`
        if (key in buckets) buckets[key]++
      }
    })
  })
  return Object.entries(buckets).map(([hour, count]) => ({ hour, count }))
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: vehicleApi.list })
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: driverApi.list })
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: usageApi.listTrips,
    refetchInterval: 10_000,
  })

  const totalVehicles = vehicles.length
  const activeDrivers = drivers.filter((d) => d.status === 'ON_TRIP').length
  const ongoingTrips = trips.filter((t) => t.status === 'IN_PROGRESS').length
  const inMaintenance = vehicles.filter((v) => v.status === 'MAINTENANCE').length
  const chartData = buildHourlyChart(trips)
  const liveTrips = trips.filter((t) => t.status === 'IN_PROGRESS')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Vehicles" value={totalVehicles} icon={Truck} color="text-blue-500" />
        <SummaryCard title="Active Drivers" value={activeDrivers} icon={Users} color="text-green-500" />
        <SummaryCard title="Ongoing Trips" value={ongoingTrips} icon={Activity} color="text-purple-500" />
        <SummaryCard title="In Maintenance" value={inMaintenance} icon={Wrench} color="text-orange-500" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location Updates — Last 24 h</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live trips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {tripsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : liveTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No trips currently in progress.</p>
          ) : (
            <div className="divide-y">
              {liveTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-medium">Trip #{trip.id}</p>
                    <p className="text-muted-foreground">
                      Vehicle {trip.vehicleId} · Driver {trip.driverId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {new Date(trip.startTime).toLocaleTimeString()}
                    </span>
                    <StatusBadge status={trip.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
