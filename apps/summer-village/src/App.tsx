import { useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { FloatingNav } from './components/FloatingNav'
import { MenuDrawer } from './features/menu/MenuDrawer'
import { HomePage } from './features/home/HomePage'
import { LoginPage } from './features/auth/LoginPage'
import { OnboardingPage } from './features/auth/OnboardingPage'
import { SplashPage } from './features/auth/SplashPage'

// Route-level code splitting: guests never need admin code (including
// @dnd-kit, only used by AdminAmenitiesPage), and most guest sessions only
// ever touch a subset of these pages -- keeping them out of the initial
// bundle is most of what was behind Vite's "chunk larger than 500 kB"
// build warning. Home/Login/Onboarding/Splash stay eager since they're
// needed immediately for the auth flow and the most common landing page.
const VillagePage = lazy(() => import('./features/village/VillagePage').then(m => ({ default: m.VillagePage })))
const AmenityDetailPage = lazy(() => import('./features/village/AmenityDetailPage').then(m => ({ default: m.AmenityDetailPage })))
const EventsPage = lazy(() => import('./features/events/EventsPage').then(m => ({ default: m.EventsPage })))
const EventDetailPage = lazy(() => import('./features/events/EventDetailPage').then(m => ({ default: m.EventDetailPage })))
const GuidePage = lazy(() => import('./features/guide/GuidePage').then(m => ({ default: m.GuidePage })))

const AdminLayout = lazy(() => import('./features/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminAlertsPage = lazy(() => import('./features/admin/AdminAlertsPage').then(m => ({ default: m.AdminAlertsPage })))
const AdminAnnouncementsPage = lazy(() => import('./features/admin/AdminAnnouncementsPage').then(m => ({ default: m.AdminAnnouncementsPage })))
const AdminEventsPage = lazy(() => import('./features/admin/AdminEventsPage').then(m => ({ default: m.AdminEventsPage })))
const AdminAmenitiesPage = lazy(() => import('./features/admin/AdminAmenitiesPage').then(m => ({ default: m.AdminAmenitiesPage })))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1628' }}>
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
    </div>
  )
}

function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile, isGuest } = useAuth()

  const needsOnboarding = !isGuest && profile && profile.role !== 'admin' && !profile.cottageNumber

  if (needsOnboarding) return <OnboardingPage />

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/village" element={<VillagePage />} />
          <Route path="/amenities/:id" element={<AmenityDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <FloatingNav onMenuOpen={() => setMenuOpen(true)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

function AdminShell() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminLayout>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="alerts" element={<AdminAlertsPage />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="amenities" element={<AdminAmenitiesPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </Suspense>
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
