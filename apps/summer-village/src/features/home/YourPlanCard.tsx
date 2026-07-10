import { ChevronRight, Edit3, PartyPopper, Waves } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { GlassCard } from '../../components/GlassCard'
import { useAuth } from '../../lib/auth'

export function YourPlanCard() {
  const { profile } = useAuth()

  const today = new Date()
  const dateLabel = format(today, 'EEEE, MMMM d')

  const checkoutLabel = profile?.checkOut
    ? `Check-out ${format(parseISO(profile.checkOut), 'EEE, h:mm aaa')}`
    : 'Check-out Sun 10am'

  return (
    <GlassCard className="p-[14px_16px]" style={{ background: 'rgba(8, 18, 36, 0.28)' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-display font-bold text-white text-[14px]">
            Your Plan
          </div>
          <div className="font-display font-bold text-white text-[17px] leading-tight mt-0.5">
            {dateLabel}
          </div>
        </div>
        <div
          className="font-body font-semibold text-[10px] px-[9px] py-1 rounded-full whitespace-nowrap"
          style={{ color: 'rgba(163,210,255,0.9)', background: 'rgba(163,210,255,0.12)' }}
        >
          {checkoutLabel}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.14)' }} />

      {/* Rows */}
      <div className="flex flex-col gap-2.5">
        <PlanRow icon={<PartyPopper size={18} className="text-white" />} title="Game Night at the Barn" meta="Tonight · 8:00–10:00 PM" />
        <PlanRow icon={<Waves size={18} className="text-white" />} title="Beach conditions: Ideal" meta="Low tide 2:14pm · Wind 8mph" />
      </div>

      {/* Action */}
      <div className="h-px mt-3" style={{ background: 'rgba(255,255,255,0.14)' }} />
      <button className="flex items-center gap-1.5 pt-2.5 font-body font-semibold text-white/55 hover:text-white/85 transition-colors">
        <Edit3 size={13} className="opacity-60" />
        <span style={{ fontSize: 11 }}>Edit your plan</span>
      </button>
    </GlassCard>
  )
}

function PlanRow({ icon, title, meta }: { icon: React.ReactNode; title: string; meta: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.16)' }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-display font-semibold text-white" style={{ fontSize: 13 }}>{title}</div>
        <div className="font-body text-white/58 mt-[1px]" style={{ fontSize: 11 }}>{meta}</div>
      </div>
      <ChevronRight size={16} className="text-white/40" />
    </div>
  )
}
