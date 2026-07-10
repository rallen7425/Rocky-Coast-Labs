import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface AlertBannerProps {
  message: string
  onDismiss?: () => void
}

export function AlertBanner({ message, onDismiss }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className="mx-5 mt-2.5 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
      style={{
        background: 'rgba(186,26,26,0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <AlertTriangle size={14} className="text-white flex-shrink-0" />
      <span className="text-white text-[12px] font-semibold font-body flex-1">{message}</span>
      <button onClick={handleDismiss} className="text-white/65 hover:text-white/90 transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}
