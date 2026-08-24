import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useScrollLock } from '../../../lib/useScrollLock'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  useScrollLock()

  return (
    <div
      // Always top-aligned, never centered: a vertically-centered flex item
      // taller than the viewport can leave its top edge unscrollable and
      // inaccessible in some browsers (a well-known flexbox overflow quirk)
      // -- the Amenities form is tall enough to hit this and hide the Name
      // field entirely, blocking creation. Top-aligned + scrollable is the
      // one layout guaranteed to keep the whole form reachable.
      //
      // 100dvh (dynamic viewport height) instead of relying on `inset-0`
      // alone: on mobile browsers the address/toolbar can grow or shrink,
      // and `100vh` reflects the *largest* possible viewport rather than
      // what's actually visible right now, which can push this overlay's
      // effective bottom (and, once combined with a shifted top, the whole
      // dialog) out of view. `dvh` tracks the real visible viewport.
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
      style={{ height: '100dvh', paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-display font-semibold text-gray-900 text-[16px]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}
