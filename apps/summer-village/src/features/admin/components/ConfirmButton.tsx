import { useState } from 'react'
import { Check, X, type LucideIcon } from 'lucide-react'

interface ConfirmButtonProps {
  icon: LucideIcon
  className?: string
  onConfirm: () => void
  confirmMessage?: string
}

/** Extracted from AdminEventsPage's original inline delete-confirm pattern; reused for hide and hard-delete everywhere. */
export function ConfirmButton({ icon: Icon, className, onConfirm, confirmMessage }: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        {confirmMessage && <span className="font-body text-[11px] text-gray-400 mr-1">{confirmMessage}</span>}
        <button
          onClick={() => { onConfirm(); setConfirming(false) }}
          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <Check size={15} />
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <X size={15} />
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={className ?? 'p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors'}
    >
      <Icon size={15} />
    </button>
  )
}
