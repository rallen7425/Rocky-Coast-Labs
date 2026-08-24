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
if ('serviceWorker' in navigator) {
  let refreshed = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshed) return
    refreshed = true
    window.location.reload()
  })
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
