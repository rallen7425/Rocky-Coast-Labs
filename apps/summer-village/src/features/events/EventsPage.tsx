import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow, isSaturday, isSunday, nextSaturday, nextSunday, previousSaturday, parseISO } from 'date-fns'
import { StatusBar } from '../../components/StatusBar'
import { PageHeader } from '../../components/PageHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { useUpcomingEvents, type Event } from '../../lib/useEvents'
import { formatTime } from '../../lib/format'
import barnPhoto from '../../assets/sv-barn.jpg'

type Filter = 'All' | 'On-Site' | 'Nearby' | 'This Weekend'

const PAGE_GRADIENT = 'linear-gradient(180deg, rgba(8,18,36,0.92) 0%, rgba(8,18,36,0.78) 30%, rgba(8,18,36,0.72) 60%, rgba(8,18,36,0.92) 100%)'

function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return `Today — ${format(d, 'EEEE, MMM d')}`
  if (isTomorrow(d)) return `Tomorrow — ${format(d, 'EEEE, MMM d')}`
  return format(d, 'EEEE, MMM d')
}

function isThisWeekend(dateStr: string): boolean {
  const d = parseISO(dateStr)
  const now = new Date()
  const weekendStart = isSaturday(now) ? now : isSunday(now) ? previousSaturday(now) : nextSaturday(now)
  const weekendEnd = isSunday(now) ? now : isSaturday(now) ? nextSunday(now) : nextSunday(nextSaturday(now))
  return d >= new Date(weekendStart.toDateString()) && d <= new Date(weekendEnd.toDateString())
}

export function EventsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('All')
  const { events, loading } = useUpcomingEvents(50, 60)

  const filtered = events.filter(e => {
    if (activeFilter === 'On-Site') return e.is_onsite
    if (activeFilter === 'Nearby') return !e.is_onsite
    if (activeFilter === 'This Weekend') return isThisWeekend(e.date)
    return true
  })

  const grouped = filtered.reduce<Record<string, { label: string; events: Event[] }>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = { label: dateLabel(e.date), events: [] }
    acc[e.date].events.push(e)
    return acc
  }, {})

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0 bg-cover" style={{ backgroundImage: `url(${barnPhoto})`, backgroundPosition: 'center 30%' }} />
      <div className="fixed inset-0 z-0" style={{ background: PAGE_GRADIENT }} />

      <div className="relative z-10 flex flex-col min-h-screen scrollbar-hide overflow-y-auto pb-28">
        <StatusBar />
        <PageHeader title="Events" subtitle="What's happening at Summer Village" />

        <div className="flex flex-col gap-2.5 px-5 pt-3.5">

          {/* Filter chips */}
          <div className="flex gap-[7px] -mx-0 overflow-x-auto scrollbar-hide pb-0.5">
            {(['All', 'On-Site', 'Nearby', 'This Weekend'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="flex-shrink-0 font-body font-semibold px-3.5 py-1.5 rounded-full transition-colors"
                style={{
                  fontSize: 11,
                  border: '1px solid rgba(255,255,255,0.22)',
                  ...(activeFilter === f
                    ? { background: 'white', color: '#103457', borderColor: 'white' }
                    : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }),
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Date groups */}
          {Object.entries(grouped).map(([date, { label, events }]) => (
            <div key={date}>
              <SectionLabel>{label}</SectionLabel>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.13)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              >
                {events.map((event, idx) => (
                  <EventListItem key={event.id} event={event} last={idx === events.length - 1} />
                ))}
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <p className="font-body text-white/55 text-[13px] text-center py-8">
              No events match this filter.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function EventListItem({ event, last }: { event: Event; last: boolean }) {
  const navigate = useNavigate()
  const timeStr = event.is_all_day
    ? 'All day'
    : formatTime(event.time_start) + (event.time_end ? `–${formatTime(event.time_end)}` : '')

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 cursor-pointer active:bg-white/5 transition-colors"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {/* Dot */}
      <div className="mt-[5px] flex-shrink-0">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: event.is_onsite ? '#a9c9f3' : '#f0a500' }}
        />
      </div>

      {/* Body */}
      <div className="flex-1">
        <div className="font-display font-semibold text-white text-[14px]">{event.title}</div>
        <div className="font-body text-white/55 mt-0.5" style={{ fontSize: 11 }}>
          {timeStr}
          {!event.is_onsite && event.city && ` · ${event.city}`}
        </div>
      </div>

      {/* Location badge */}
      {event.is_onsite ? (
        <span className="font-body font-semibold text-[10px] mt-0.5 flex-shrink-0" style={{ color: '#7ee8a2' }}>
          {event.venue ?? 'On-site'}
        </span>
      ) : (
        <span className="font-body font-semibold text-[10px] mt-0.5 flex-shrink-0" style={{ color: '#f0a500' }}>
          {event.distance_miles != null ? `~${event.distance_miles} mi` : ''}
        </span>
      )}
    </div>
  )
}
