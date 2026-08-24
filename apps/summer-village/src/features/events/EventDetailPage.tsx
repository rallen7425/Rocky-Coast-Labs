import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { StatusBar } from '../../components/StatusBar'
import { GlassCard } from '../../components/GlassCard'
import { useEvent } from '../../lib/useEvents'
import { formatTime } from '../../lib/format'
import barnPhoto from '../../assets/sv-barn.jpg'

const PAGE_GRADIENT = 'linear-gradient(180deg, rgba(8,18,36,0.92) 0%, rgba(8,18,36,0.78) 30%, rgba(8,18,36,0.72) 60%, rgba(8,18,36,0.92) 100%)'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { event, loading } = useEvent(id)

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0 bg-cover" style={{ backgroundImage: `url(${barnPhoto})`, backgroundPosition: 'center 30%' }} />
      <div className="fixed inset-0 z-0" style={{ background: PAGE_GRADIENT }} />

      <div className="relative z-10 flex flex-col min-h-screen scrollbar-hide overflow-y-auto pb-28">
        <StatusBar />

        <div className="px-5 pt-2 pb-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-white/70 font-body text-[13px]">
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {loading ? (
          <p className="font-body text-white/55 text-[14px] text-center py-12">Loading…</p>
        ) : !event ? (
          <p className="font-body text-white/55 text-[14px] text-center py-12">Event not found.</p>
        ) : (
          <div className="flex flex-col gap-3 px-5 pt-2">
            <h1
              className="font-display font-bold text-white text-[24px] leading-[1.15]"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
            >
              {event.title}
            </h1>

            <GlassCard className="p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-white/85 font-body text-[13px]">
                <Clock size={14} className="text-white/50 flex-shrink-0" />
                <span>
                  {format(parseISO(event.date), 'EEEE, MMMM d')}
                  {event.is_all_day
                    ? ' · All day'
                    : event.time_start && ` · ${formatTime(event.time_start)}${event.time_end ? `–${formatTime(event.time_end)}` : ''}`}
                </span>
              </div>
              <div className="flex items-start gap-2 text-white/85 font-body text-[13px]">
                <MapPin size={14} className="text-white/50 flex-shrink-0 mt-0.5" />
                <span>
                  {event.is_onsite
                    ? (event.venue ?? 'On-site')
                    : [event.address ?? event.city, event.distance_miles != null ? `~${event.distance_miles} mi` : null]
                        .filter(Boolean)
                        .join(' · ')}
                </span>
              </div>
            </GlassCard>

            {event.description && (
              <p className="font-body text-white/80 text-[14px] leading-[1.5]">{event.description}</p>
            )}

            {event.long_description && (
              <GlassCard className="p-4">
                <p className="font-body text-white/75 text-[13px] leading-[1.6] whitespace-pre-line">
                  {event.long_description}
                </p>
              </GlassCard>
            )}

            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl py-3 font-body font-semibold text-[14px] text-white"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)' }}
              >
                <ExternalLink size={15} /> More details
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
