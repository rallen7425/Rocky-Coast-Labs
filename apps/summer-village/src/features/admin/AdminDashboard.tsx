import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, Dumbbell, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AdminPageTitle } from './AdminLayout'

interface Stats {
  activeAlerts: number
  upcomingEvents: number
  amenitiesDown: number
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ activeAlerts: 0, upcomingEvents: 0, amenitiesDown: 0 })

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('date', today),
      supabase.from('amenities').select('id', { count: 'exact', head: true }).in('status', ['closed', 'maintenance']),
    ]).then(([a, e, am]) => {
      setStats({
        activeAlerts: a.count ?? 0,
        upcomingEvents: e.count ?? 0,
        amenitiesDown: am.count ?? 0,
      })
    })
  }, [])

  const cards = [
    { label: 'Active Alerts', value: stats.activeAlerts, icon: Bell, color: '#ba1a1a', bg: '#fff5f5', to: '/admin/alerts' },
    { label: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, color: '#103457', bg: '#f0f6ff', to: '/admin/events' },
    { label: 'Amenities Down', value: stats.amenitiesDown, icon: Dumbbell, color: '#f0a500', bg: '#fffbf0', to: '/admin/amenities' },
  ]

  return (
    <div>
      <AdminPageTitle>Dashboard</AdminPageTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left w-full"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-gray-900 text-[28px] leading-none">{value}</div>
              <div className="font-body text-gray-500 text-[12px] mt-1">{label}</div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-display font-semibold text-gray-900 text-[16px] mb-3">Quick Actions</h2>
        <div className="flex flex-col gap-2">
          <QuickAction label="Post an emergency alert" onClick={() => navigate('/admin/alerts')} urgent />
          <QuickAction label="Add an event" onClick={() => navigate('/admin/events')} />
          <QuickAction label="Update pool status" onClick={() => navigate('/admin/amenities')} />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ label, onClick, urgent }: { label: string; onClick: () => void; urgent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
      style={{ border: `1px solid ${urgent ? '#ffdad6' : '#e5e7eb'}` }}
    >
      <span className="font-body text-[14px]" style={{ color: urgent ? '#ba1a1a' : '#374151' }}>
        {label}
      </span>
      <ChevronRight size={16} className="text-gray-400" />
    </button>
  )
}
