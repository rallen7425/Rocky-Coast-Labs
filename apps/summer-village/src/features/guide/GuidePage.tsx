import { Navigation, Sunset, Truck, Star } from 'lucide-react'
import { StatusBar } from '../../components/StatusBar'
import { PageHeader } from '../../components/PageHeader'
import { SectionLabel } from '../../components/SectionLabel'
import { RowCard, RowItem } from '../../components/RowCard'
import guidePhoto from '../../assets/rocky-coast-guide.jpg'

const PAGE_GRADIENT = 'linear-gradient(180deg, rgba(8,18,36,0.92) 0%, rgba(8,18,36,0.78) 30%, rgba(8,18,36,0.72) 60%, rgba(8,18,36,0.92) 100%)'

const CATEGORIES = [
  { icon: '🏖️', name: 'Beaches',     count: '8 beaches nearby' },
  { icon: '🍽️', name: 'Restaurants', count: 'Staff-curated picks' },
  { icon: '🎭', name: 'Attractions',  count: 'Things to do nearby' },
  { icon: '🛍️', name: 'Shopping',    count: 'Boutiques & markets' },
]

export function GuidePage() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${guidePhoto})` }} />
      <div className="fixed inset-0 z-0" style={{ background: PAGE_GRADIENT }} />

      <div className="relative z-10 flex flex-col min-h-screen scrollbar-hide overflow-y-auto pb-28">
        <StatusBar />
        <PageHeader title="Rocky Coast Guide" subtitle="Explore Southern Maine" />

        <div className="flex flex-col gap-2.5 px-5 pt-3.5">

          {/* Staff Pick */}
          <div>
            <SectionLabel>Staff Pick Today</SectionLabel>
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(16,52,87,0.90)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="font-body font-semibold uppercase tracking-[0.07em] text-white/60" style={{ fontSize: 9 }}>
                  Recommended
                </span>
              </div>
              <div className="font-display font-bold text-white text-[20px] leading-tight mb-1">
                Ogunquit Beach
              </div>
              <div className="font-body text-white/65 leading-[1.5]" style={{ fontSize: 12 }}>
                Ideal conditions today · 3.5 mi of white sand · Lifeguards on duty
              </div>
              <button className="mt-3 font-body font-semibold text-[12px]" style={{ color: 'rgba(163,210,255,0.9)' }}>
                Get directions →
              </button>
            </div>
          </div>

          {/* Category Grid */}
          <div>
            <SectionLabel>Explore</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIES.map(({ icon, name, count }) => (
                <button
                  key={name}
                  className="flex flex-col items-start p-4 rounded-2xl text-left transition-opacity hover:opacity-80"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.22)',
                  }}
                >
                  <span className="text-[26px] mb-2 leading-none">{icon}</span>
                  <div className="font-display font-bold text-white text-[15px]">{name}</div>
                  <div className="font-body text-white/55 mt-0.5" style={{ fontSize: 10 }}>{count}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditions & Planning */}
          <div>
            <SectionLabel>Conditions & Planning</SectionLabel>
            <RowCard>
              <RowItem
                icon={<Navigation size={17} />}
                title="Tide Charts"
                meta="Wells & Ogunquit beaches"
              />
              <RowItem
                icon={<Sunset size={17} />}
                title="Sunrise & Sunset"
                meta="Rises 5:08am · Sets 8:24pm"
              />
              <RowItem
                icon={<Truck size={17} />}
                title="Route 1 Traffic"
                meta="Current conditions"
              />
            </RowCard>
          </div>

          {/* Day Trips */}
          <div>
            <SectionLabel>Day Trips</SectionLabel>
            <RowCard>
              <RowItem icon="🦞" title="Portland" meta="Old Port, food scene · ~50 mi" />
              <RowItem icon="🏔️" title="White Mountains" meta="Hiking & scenic drives · ~90 mi" />
              <RowItem icon="⛵" title="Acadia National Park" meta="Bar Harbor · ~175 mi" />
            </RowCard>
          </div>

        </div>
      </div>
    </div>
  )
}
