import { useState, ReactNode } from 'react'
import { Dumbbell, Flame, Gamepad2, Calendar } from 'lucide-react'
import { StatusBar } from '../../components/StatusBar'
import { PageHeader } from '../../components/PageHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { RowCard, RowItem, StatusBadge } from '../../components/RowCard'
import { useAmenities, type Amenity } from '../../lib/useAmenities'
import { formatTime } from '../../lib/format'
import barnPhoto from '../../assets/sv-barn.jpg'
import mapThumb from '../../assets/sv-map-thumb.png'

const POOL_GRADIENT = 'linear-gradient(180deg, rgba(8,18,36,0.92) 0%, rgba(8,18,36,0.78) 30%, rgba(8,18,36,0.72) 60%, rgba(8,18,36,0.92) 100%)'

const ICONS: Record<string, ReactNode> = {
  'adult pool': '🏊',
  'family pool': '🌊',
  'pavilion pool': '💦',
  'pickleball courts': '🏓',
  'fitness center': <Dumbbell size={17} />,
  'sauna': <Flame size={17} />,
  'game room': <Gamepad2 size={17} />,
  'tennis courts': '🎾',
  'basketball courts': '🏀',
  'playground': '🛝',
  'pavilion': '🏛️',
}

function iconFor(amenity: Amenity) {
  return ICONS[amenity.name.toLowerCase()] ?? (amenity.category === 'pool' ? '🏊' : '🏛️')
}

function amenityMeta(amenity: Amenity): string {
  const parts: string[] = []
  if (amenity.hours_open && amenity.hours_close) {
    parts.push(`${formatTime(amenity.hours_open)}–${formatTime(amenity.hours_close)}`)
  }
  if (amenity.age_restriction) parts.push(amenity.age_restriction)
  if (amenity.location) parts.push(amenity.location)
  if (amenity.notes) parts.push(amenity.notes)
  return parts.join(' · ') || (amenity.category === 'pool' ? 'Open daily' : '')
}

export function VillagePage() {
  const [mapExpanded, setMapExpanded] = useState(false)
  const { pools, other, loading } = useAmenities()

  return (
    <>
      <div className="relative w-full min-h-screen overflow-hidden">
        {/* Fixed background */}
        <div className="fixed inset-0 z-0 bg-cover" style={{ backgroundImage: `url(${barnPhoto})`, backgroundPosition: 'center 30%' }} />
        <div className="fixed inset-0 z-0" style={{ background: POOL_GRADIENT }} />

        {/* Scrollable content */}
        <div className="relative z-10 flex flex-col min-h-screen scrollbar-hide overflow-y-auto pb-28">
          <StatusBar />
          <PageHeader title="The Village" subtitle="Amenities, map & schedules" />

          <div className="flex flex-col gap-2.5 px-5 pt-3.5">

            {/* Property Map */}
            <div>
              <SectionLabel>Property Map</SectionLabel>
              <button
                className="w-full rounded-2xl overflow-hidden relative"
                style={{
                  height: 180,
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: 'rgba(16,52,87,0.5)',
                }}
                onClick={() => setMapExpanded(true)}
              >
                <img src={mapThumb} alt="Map of Summer Village" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(8,18,36,0.6) 100%)' }} />
                <span className="absolute bottom-2.5 left-3 font-body font-bold uppercase tracking-[0.08em] text-white/70" style={{ fontSize: 10 }}>
                  Summer Village · 65 acres
                </span>
                <span className="absolute bottom-2 right-3 font-body font-semibold" style={{ fontSize: 10, color: 'rgba(163,210,255,0.9)' }}>
                  Full map →
                </span>
              </button>
            </div>

            {/* Pools */}
            {!loading && pools.length > 0 && (
              <div>
                <SectionLabel>Pools</SectionLabel>
                <RowCard>
                  {pools.map(pool => (
                    <RowItem
                      key={pool.id}
                      icon={iconFor(pool)}
                      title={pool.name}
                      meta={amenityMeta(pool)}
                      right={<StatusBadge status={pool.status} />}
                    />
                  ))}
                </RowCard>
              </div>
            )}

            {/* Amenities */}
            {!loading && other.length > 0 && (
              <div>
                <SectionLabel>Amenities</SectionLabel>
                <RowCard>
                  {other.map(amenity => (
                    <RowItem
                      key={amenity.id}
                      icon={iconFor(amenity)}
                      title={amenity.name}
                      meta={amenityMeta(amenity)}
                      right={amenity.status !== 'open' ? <StatusBadge status={amenity.status} /> : undefined}
                    />
                  ))}
                </RowCard>
              </div>
            )}

            {/* Schedules */}
            <div>
              <SectionLabel>Schedules & Info</SectionLabel>
              <RowCard>
                <RowItem icon={<Calendar size={17} />} title="Barn Schedule" meta="Events, movies & activities" />
              </RowCard>
            </div>

          </div>
        </div>
      </div>

      {/* Full-screen map overlay */}
      {mapExpanded && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-5 py-4" style={{ background: '#103457' }}>
            <span className="font-display font-bold text-white text-[17px]">Property Map</span>
            <button className="text-white/70 font-body text-[14px]" onClick={() => setMapExpanded(false)}>
              Close ✕
            </button>
          </div>
          <img src={mapThumb} alt="Full property map" className="flex-1 w-full object-contain bg-[#0a1628]" />
        </div>
      )}
    </>
  )
}
