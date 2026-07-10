import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, ArrowRight } from 'lucide-react'
import { useUpcomingEvents, type Event } from '../../lib/useEvents'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'

function dayTag(dateStr: string): { label: string; style: 'today' | 'tomorrow' | 'future' } {
  const d = parseISO(dateStr)
  if (isToday(d)) return { label: 'Today', style: 'today' }
  if (isTomorrow(d)) return { label: 'Tomorrow', style: 'tomorrow' }
  return { label: format(d, 'EEEE'), style: 'future' }
}

function formatTime(t: string | null): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

// Static fallback shown when Supabase has no data yet
const STATIC_EVENTS: Event[] = [
  { id: 's1', title: 'Annual Meeting', date: new Date(Date.now() + 86400000).toISOString().slice(0,10), time_start: '10:00', time_end: '11:00', is_onsite: true, venue: 'Barn', distance_miles: null, city: null, category: 'community' },
  { id: 's2', title: 'Lobster Rock', date: new Date().toISOString().slice(0,10), time_start: '15:00', time_end: '18:00', is_onsite: false, venue: null, distance_miles: 19, city: 'Old Orchard Beach', category: 'food' },
  { id: 's3', title: 'Game Night', date: new Date(Date.now() + 86400000).toISOString().slice(0,10), time_start: '20:00', time_end: '22:00', is_onsite: true, venue: 'Barn', distance_miles: null, city: null, category: 'community' },
  { id: 's4', title: 'Open Air Arts Gallery', date: new Date(Date.now() + 86400000).toISOString().slice(0,10), time_start: '09:00', time_end: '15:00', is_onsite: false, venue: null, distance_miles: 16, city: 'Saco', category: 'arts' },
  { id: 's5', title: "Father's Day Celebration", date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0,10), time_start: '12:00', time_end: '14:00', is_onsite: true, venue: 'Pavilion', distance_miles: null, city: null, category: 'community' },
  { id: 's6', title: 'York Car Show', date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0,10), time_start: '08:00', time_end: null, is_onsite: false, venue: null, distance_miles: 12, city: 'York', category: 'auto' },
]

export function EventsScroll() {
  const navigate = useNavigate()
  const { events: liveEvents, loading } = useUpcomingEvents(6)
  const events = (!loading && liveEvents.length > 0) ? liveEvents : STATIC_EVENTS

  return (
    <div>
      <div className="flex justify-between items-center px-0.5 pb-2">
        <h2 className="font-display font-bold text-white text-[14px]">Events & Activities</h2>
        <button
          onClick={() => navigate('/events')}
          className="font-body font-semibold text-white/55 hover:text-white/85 transition-colors"
          style={{ fontSize: 11 }}
        >
          View all →
        </button>
      </div>

      <div
        className="flex gap-[9px] overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        <ViewAllCard onClick={() => navigate('/events')} />
      </div>
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  const { label, style } = dayTag(event.date)

  const tagColors = {
    today:    { background: '#f0a500', color: '#1a0a00' },
    tomorrow: { background: '#1b9e8a', color: 'white' },
    future:   { background: 'rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.85)' },
  }

  const timeStr = formatTime(event.time_start) + (event.time_end ? `–${formatTime(event.time_end)}` : '')
  const location = event.is_onsite ? (event.venue ?? 'On-site') : (event.city ?? event.venue ?? '')

  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-[14px] p-[11px_12px]"
      style={{
        width: 158,
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.22)',
      }}
    >
      <div className="flex justify-between items-center mb-[7px]">
        <span
          className="font-body font-bold uppercase tracking-[0.04em] px-2 py-0.5 rounded-full"
          style={{ ...tagColors[style], fontSize: 9 }}
        >
          {label}
        </span>
        {event.is_onsite ? (
          <span className="font-body font-semibold" style={{ fontSize: 9, color: 'rgba(163,210,255,0.9)' }}>
            On-site
          </span>
        ) : (
          <span
            className="font-body font-semibold px-1.5 py-0.5 rounded-[10px]"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.12)' }}
          >
            {event.distance_miles ? `~${event.distance_miles} mi` : ''}
          </span>
        )}
      </div>

      <div className="font-display font-bold text-white leading-[1.3]" style={{ fontSize: 12 }}>
        {event.title}
      </div>
      <div className="font-body text-white/60 mt-[5px] leading-[1.5]" style={{ fontSize: 11 }}>
        {timeStr && (
          <div className="flex items-center gap-1">
            <Clock size={10} />
            {timeStr}
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} />
            {location}
          </div>
        )}
      </div>
    </div>
  )
}

function ViewAllCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-[14px]"
      style={{
        width: 80,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.16)',
      }}
    >
      <ArrowRight size={22} className="text-white/60" />
      <span className="font-body font-semibold text-white/50 text-center leading-[1.4]" style={{ fontSize: 10 }}>
        View All<br />Events
      </span>
    </button>
  )
}
