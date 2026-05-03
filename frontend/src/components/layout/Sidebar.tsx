import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Truck, Users, Map, Route } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles', icon: Truck, label: 'Vehicles' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/map', icon: Map, label: 'Live Map' },
  { to: '/trips', icon: Route, label: 'Trips' },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2 h-14 px-4 border-b font-semibold text-sm">
        <Truck className="h-5 w-5 text-primary" />
        Fleet Management
      </div>
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
