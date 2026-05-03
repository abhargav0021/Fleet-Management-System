import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Toaster } from '@/components/ui/toaster'
import { useGlobalApiErrorHandler } from '@/components/GlobalErrorBoundary'
import { Dashboard } from '@/pages/Dashboard'
import { Vehicles } from '@/pages/Vehicles'
import { Drivers } from '@/pages/Drivers'
import { Map } from '@/pages/Map'
import { Trips } from '@/pages/Trips'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: 1,
    },
  },
})

function AppRoutes() {
  useGlobalApiErrorHandler()
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="map" element={<Map />} />
        <Route path="trips" element={<Trips />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
