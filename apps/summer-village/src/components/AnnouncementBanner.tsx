import { useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import type { Announcement } from '../lib/useAnnouncements'

interface AnnouncementBannerProps {
  announcements: Announcement[]
}

/** Calmer counterpart to AlertBanner — multiple can stack, each independently session-dismissible. */
export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const visible = announcements.filter(a => !dismissedIds.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 mx-5 mt-2.5">
      {visible.map(a => (
        <div
          key={a.id}
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
          style={{
            background: 'rgba(163,210,255,0.18)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.14)',
          }}
        >
          <Megaphone size={14} className="text-white flex-shrink-0" />
          <span className="text-white text-[12px] font-semibold font-body flex-1">{a.message}</span>
          <button
            onClick={() => setDismissedIds(prev => new Set(prev).add(a.id))}
            className="text-white/65 hover:text-white/90 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
