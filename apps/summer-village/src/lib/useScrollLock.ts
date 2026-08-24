import { useEffect } from 'react'

/**
 * Locks body scroll while mounted and marks `document.body` with
 * `data-modal-open` for the duration -- iOS Safari renders `position: fixed`
 * relative to the layout viewport, not the visual one, so a fixed
 * full-screen overlay can end up shifted off-screen if the background page
 * was scrolled before it opened. Locking (and precisely restoring) body
 * scroll is the standard fix. The `data-modal-open` marker lets other code
 * (see main.tsx's deploy-reload listener) know it's unsafe to interrupt
 * whatever's open right now.
 */
export function useScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY
    const body = document.body
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    body.dataset.modalOpen = 'true'
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      delete body.dataset.modalOpen
      window.scrollTo(0, scrollY)
    }
  }, [])
}
