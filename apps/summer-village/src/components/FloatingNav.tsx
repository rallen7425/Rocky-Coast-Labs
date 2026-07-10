import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Building2, Calendar, Compass, Menu } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home',    Icon: Home,      path: '/' },
  { label: 'Village', Icon: Building2, path: '/village' },
  { label: 'Events',  Icon: Calendar,  path: '/events' },
  { label: 'Guide',   Icon: Compass,   path: '/guide' },
  { label: 'Menu',    Icon: Menu,      path: null },
] as const

interface FloatingNavProps {
  onMenuOpen: () => void
}

export function FloatingNav({ onMenuOpen }: FloatingNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleTap = (path: string | null) => {
    if (path === null) {
      onMenuOpen()
    } else {
      navigate(path)
    }
  }

  const isActive = (path: string | null) => {
    if (path === null) return false
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center"
      style={{
        width: 355,
        background: 'rgba(16,52,87,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 40,
        padding: '9px 6px',
        boxShadow: '0 8px 32px rgba(8,18,36,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
      }}
    >
      {NAV_ITEMS.map(({ label, Icon, path }) => {
        const active = isActive(path)
        return (
          <button
            key={label}
            onClick={() => handleTap(path)}
            className="flex-1 flex flex-col items-center gap-[3px] py-1.5 px-0.5 rounded-full transition-colors"
            style={{
              background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ opacity: active ? 1 : 0.4, color: 'white', display: 'flex' }}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            </span>
            <span
              className="font-body font-semibold"
              style={{
                fontSize: 9,
                color: active ? 'white' : 'rgba(255,255,255,0.45)',
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
