import { ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, Calendar, Dumbbell, LayoutDashboard, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../lib/auth'

const NAV_ITEMS = [
  { to: '/admin',           label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/alerts',    label: 'Alerts',    icon: Bell },
  { to: '/admin/events',    label: 'Events',    icon: Calendar },
  { to: '/admin/amenities', label: 'Amenities', icon: Dumbbell },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="font-display font-bold text-primary text-[16px]" style={{ color: '#103457' }}>
          Summer Village Life
        </div>
        <div className="font-body text-gray-400 text-[11px] mt-0.5">Admin Console</div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-body font-medium text-[14px] transition-colors ${
                isActive
                  ? 'bg-blue-50 text-primary font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? '#103457' : undefined })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-body text-[14px] text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col flex-shrink-0 fixed top-0 left-0 bottom-0 z-30">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 bg-white shadow-xl">{sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-56 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-[15px]" style={{ color: '#103457' }}>Admin Console</span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

export function AdminPageTitle({ children }: { children: ReactNode }) {
  return <h1 className="font-display font-bold text-gray-900 text-[24px] mb-6">{children}</h1>
}
