import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { FloatingNav } from './components/FloatingNav'
import { MenuDrawer } from './features/menu/MenuDrawer'
import { HomePage } from './features/home/HomePage'
import { VillagePage } from './features/village/VillagePage'
import { EventsPage } from './features/events/EventsPage'
import { GuidePage } from './features/guide/GuidePage'
import { LoginPage } from './features/auth/LoginPage'
import { OnboardingPage } from './features/auth/OnboardingPage'
import { SplashPage } from './features/auth/SplashPage'
import { AdminLayout } from './features/admin/AdminLayout'
import { AdminDashboard } from './features/admin/AdminDashboard'
import { AdminAlertsPage } from './features/admin/AdminAlertsPage'
import { AdminEventsPage } from './features/admin/AdminEventsPage'
import { AdminAmenitiesPage } from './features/admin/AdminAmenitiesPage'

function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile, isGuest } = useAuth()

  const needsOnboarding = !isGuest && profile && !profile.cottageNumber

  if (needsOnboarding) return <OnboardingPage />

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/village" element={<VillagePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/guide" element={<GuidePage />} />
      </Routes>
      <FloatingNav onMenuOpen={() => setMenuOpen(true)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

function AdminShell() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="alerts" element={<AdminAlertsPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="amenities" element={<AdminAmenitiesPage />} />
      </Routes>
    </AdminLayout>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isGuest, loading } = useAuth()
  if (loading) return null
  if (!session && !isGuest) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { session, isGuest, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1628' }}>
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/welcome" element={(session || isGuest) ? <Navigate to="/" replace /> : <SplashPage />} />
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route path="/admin/*" element={
        <RequireAuth>
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        </RequireAuth>
      } />

      <Route path="/*" element={
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      } />
    </Routes>
  )
}
