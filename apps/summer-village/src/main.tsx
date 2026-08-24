import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import './index.css'
import App from './App.tsx'

// registerType: 'autoUpdate' makes a new service worker skipWaiting/claim
// clients automatically, but an already-open tab keeps running its old
// in-memory JS until something reloads it — this app's build never had
// that reload, so a real deploy could be live on the server while any
// tab open since before it silently kept showing stale UI/behavior
// indefinitely. Reload once, the first time a new SW actually takes
// control, so a deploy reaches open tabs without the user having to
// know to hard-refresh.
//
// A blind, immediate reload can itself destroy work-in-progress: an admin
// mid-edit in an Alerts/Announcements/Events/Amenities modal would lose
// whatever they were typing the instant a deploy lands. `useScrollLock`
// marks `document.body[data-modal-open]` for as long as any modal built on
// it is open, so defer the reload until that marker is gone.
if ('serviceWorker' in navigator) {
  let refreshed = false
  let pendingReload = false

  const reloadIfSafe = () => {
    if (refreshed || !pendingReload) return
    if (document.body.dataset.modalOpen) return
    refreshed = true
    window.location.reload()
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    pendingReload = true
    reloadIfSafe()
  })

  new MutationObserver(reloadIfSafe).observe(document.body, { attributes: true, attributeFilter: ['data-modal-open'] })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
