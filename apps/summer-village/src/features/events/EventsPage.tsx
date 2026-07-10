import { useState } from 'react'
import { StatusBar } from '../../components/StatusBar'
import { PageHeader } from '../../components/PageHeader'
import { SectionLabel } from '../../components/SectionLabel'
import barnPhoto from '../../assets/sv-barn.jpg'

type Filter = 'All' | 'On-Site' | 'Nearby' | 'This Weekend'

interface Event {
  id: string
  title: string
  timeStart: string
  timeEnd?: string
  isOnsite: boolean
  venue: string
  distance?: string
  date: string
  dateLabel: string
}

const EVENTS: Event[] = [
  { id: '1', title: 'Lobster Rock', timeStart: '3:00', timeEnd: '6:00 PM', isOnsite: false, venue: 'Veterans Memorial Park, Old Orchard Beach', distance: '~19 mi', date: '2026-06-19', dateLabel: 'Today — Friday, Jun 19' },
  { id: '2', title: 'Annual Meeting', timeStart: '10:00', timeEnd: '11:00 AM', isOnsite: true, venue: 'Barn', date: '2026-06-20', dateLabel: 'Tomorrow — Saturday, Jun 20' },
  { id: '3', title: '55th Open Air Arts Gallery', timeStart: '9:00 AM', timeEnd: '3:00 PM', isOnsite: false, venue: 'Main St, Saco', distance: '~16 mi', date: '2026-06-20', dateLabel: 'Tomorrow — Saturday, Jun 20' },
  { id: '4', title: 'Game Night', timeStart: '8:00', timeEnd: '10:00 PM', isOnsite: true, venue: 'Barn', date: '2026-06-20', dateLabel: 'Tomorrow — Saturday, Jun 20' },
  { id: '5', title: '8th Annual York Car Show', timeStart: '8:00 AM', isOnsite: false, venue: '1 Robert Stevens Dr, York', distance: '~12 mi', date: '2026-06-21', dateLabel: "Sunday, Jun 21 — Father's Day" },
  { id: '6', title: "Father's Day Celebration", timeStart: '12:00', timeEnd: '2:00 PM', isOnsite: true, venue: 'Pavilion', date: '2026-06-21', dateLabel: "Sunday, Jun 21 — Father's Day" },
]

const PAGE_GRADIENT = 'linear-gradient(180deg, rgba(8,18,36,0.92) 0%, rgba(8,18,36,0.78) 30%, rgba(8,18,36,0.72) 60%, rgba(8,18,36,0.92) 100%)'

export function EventsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('All')

  const filtered = EVENTS.filter(e => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'On-Site') return e.isOnsite
    if (activeFilter === 'Nearby') return !e.isOnsite
    if (activeFilter === 'This Weekend') return ['2026-06-20', '2026-06-21'].includes(e.date)
    return true
  })

  const grouped = filtered.reduce<Record<string, { label: string; events: Event[] }>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = { label: e.dateLabel, events: [] }
    acc[e.date].events.push(e)
    return acc
  }, {})

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0 bg-cover" style={{ backgroundImage: `url(${barnPhoto})`, backgroundPosition: 'center 30%' }} />
      <div className="fixed inset-0 z-0" style={{ background: PAGE_GRADIENT }} />

      <div className="relative z-10 flex flex-col min-h-screen scrollbar-hide overflow-y-auto pb-28">
        <StatusBar />
        <PageHeader title="Events" subtitle="This weekend at Summer Village" />

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

          {filtered.length === 0 && (
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
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
    >
      {/* Dot */}
      <div className="mt-[5px] flex-shrink-0">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: event.isOnsite ? '#a9c9f3' : '#f0a500' }}
        />
      </div>

      {/* Body */}
      <div className="flex-1">
        <div className="font-display font-semibold text-white text-[14px]">{event.title}</div>
        <div className="font-body text-white/55 mt-0.5" style={{ fontSize: 11 }}>
          {event.timeStart}{event.timeEnd ? `–${event.timeEnd}` : ''}
          {!event.isOnsite && event.venue && ` · ${event.venue}`}
        </div>
      </div>

      {/* Location badge */}
      {event.isOnsite ? (
        <span className="font-body font-semibold text-[10px] mt-0.5 flex-shrink-0" style={{ color: '#7ee8a2' }}>
          {event.venue}
        </span>
      ) : (
        <span className="font-body font-semibold text-[10px] mt-0.5 flex-shrink-0" style={{ color: '#f0a500' }}>
          {event.distance}
        </span>
      )}
    </div>
  )
}
