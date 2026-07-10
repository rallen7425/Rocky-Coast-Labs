import { Sun, Waves } from 'lucide-react'
import { GlassCard } from '../../components/GlassCard'

export function WeatherRow() {
  return (
    <GlassCard className="py-[13px] px-[6px] flex items-center">
      <WeatherSection
        label="Temp"
        icon={<Sun size={13} />}
        value="74°"
        sub="Feels 78°"
      />
      <div className="w-px h-[34px] flex-shrink-0" style={{ background: 'rgba(255,255,255,0.22)' }} />
      <WeatherSection
        label="Next Tide"
        icon={<Waves size={13} />}
        value="2:14 pm"
        valueSize={16}
        sub="Low Tide"
      />
      <div className="w-px h-[34px] flex-shrink-0" style={{ background: 'rgba(255,255,255,0.22)' }} />
      <WeatherSection
        label="Beach"
        icon={<Waves size={13} />}
        value="Ideal"
        valueSize={15}
        valueColor="#7ee8a2"
        sub="Wind 8mph"
      />
    </GlassCard>
  )
}

interface WeatherSectionProps {
  label: string
  icon: React.ReactNode
  value: string
  sub: string
  valueSize?: number
  valueColor?: string
}

function WeatherSection({ label, icon, value, sub, valueSize = 20, valueColor = 'white' }: WeatherSectionProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1 font-body font-semibold uppercase tracking-[0.07em] text-white/55" style={{ fontSize: 10 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-display font-bold leading-none" style={{ fontSize: valueSize, color: valueColor }}>
        {value}
      </div>
      <div className="font-body text-white/58" style={{ fontSize: 11 }}>{sub}</div>
    </div>
  )
}
