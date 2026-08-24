import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { StatusBar } from '../../components/StatusBar'
import { GlassCard } from '../../components/GlassCard'
import { StatusBadge } from '../../components/RowCard'
import { useAmenity, amenityPhotoUrl } from '../../lib/useAmenities'
import { formatTime } from '../../lib/format'
import barnPhoto from '../../assets/sv-barn.jpg'

const PAGE_GRADIENT = 'linear-gradient(180deg, rgba(8,18,36,0.92) 0%, rgba(8,18,36,0.78) 30%, rgba(8,18,36,0.72) 60%, rgba(8,18,36,0.92) 100%)'

export function AmenityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { amenity, loading } = useAmenity(id)

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
        ) : !amenity ? (
          <p className="font-body text-white/55 text-[14px] text-center py-12">Amenity not found.</p>
        ) : (
          <div className="flex flex-col gap-3 px-5 pt-2">
            {amenity.photo_url && (
              <img
                src={amenityPhotoUrl(amenity.photo_url) ?? undefined}
                alt={amenity.name}
                className="w-full rounded-2xl object-cover"
                style={{ height: 180, border: '1px solid rgba(255,255,255,0.22)' }}
              />
            )}

            <div className="flex items-center justify-between gap-2">
              <h1
                className="font-display font-bold text-white text-[24px] leading-[1.15]"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
              >
                {amenity.name}
              </h1>
              {amenity.status !== 'open' && <StatusBadge status={amenity.status} />}
            </div>

            {(amenity.hours_open || amenity.age_restriction) && (
              <GlassCard className="p-4 flex flex-col gap-2.5">
                {amenity.hours_open && amenity.hours_close && (
                  <div className="flex items-center gap-2 text-white/85 font-body text-[13px]">
                    <Clock size={14} className="text-white/50 flex-shrink-0" />
                    <span>{formatTime(amenity.hours_open)}–{formatTime(amenity.hours_close)}</span>
                  </div>
                )}
                {amenity.age_restriction && (
                  <div className="text-white/85 font-body text-[13px]">{amenity.age_restriction}</div>
                )}
              </GlassCard>
            )}

            {amenity.description && (
              <p className="font-body text-white/80 text-[14px] leading-[1.5]">{amenity.description}</p>
            )}

            {amenity.long_description && (
              <GlassCard className="p-4">
                <p className="font-body text-white/75 text-[13px] leading-[1.6] whitespace-pre-line">
                  {amenity.long_description}
                </p>
              </GlassCard>
            )}

            {amenity.rules && (
              <GlassCard className="p-4">
                <div className="font-body font-semibold text-white/60 text-[11px] uppercase tracking-wider mb-1.5">Rules</div>
                <p className="font-body text-white/75 text-[13px] leading-[1.6] whitespace-pre-line">{amenity.rules}</p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
