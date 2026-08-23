import { Sun, Waves } from 'lucide-react'
import { GlassCard } from '../../components/GlassCard'
import { useWeather } from '../../lib/useWeather'

const BEACH_COLORS: Record<string, string> = {
  Ideal: '#7ee8a2',
  Fair: '#f0a500',
  Poor: '#ff8080',
}

function formatTideTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase()
}

export function WeatherRow() {
  const { weather } = useWeather()

  const tempF = weather?.temp_f
  const feelsLikeF = weather?.feels_like_f
  const beachStatus = weather?.beach_status
  const windMph = weather?.wind_mph

  return (
    <GlassCard className="py-[13px] px-[6px] flex items-center">
      <WeatherSection
        label="Temp"
        icon={<Sun size={13} />}
        value={tempF != null ? `${tempF}°` : '—'}
        sub={feelsLikeF != null ? `Feels ${feelsLikeF}°` : ''}
      />
      <div className="w-px h-[34px] flex-shrink-0" style={{ background: 'rgba(255,255,255,0.22)' }} />
      <WeatherSection
        label="Next Tide"
        icon={<Waves size={13} />}
        value={formatTideTime(weather?.next_tide_at ?? null)}
        valueSize={16}
        sub={weather?.next_tide_type ? `${weather.next_tide_type} Tide` : ''}
      />
      <div className="w-px h-[34px] flex-shrink-0" style={{ background: 'rgba(255,255,255,0.22)' }} />
      <WeatherSection
        label="Beach"
        icon={<Waves size={13} />}
        value={beachStatus ?? '—'}
        valueSize={15}
        valueColor={beachStatus ? BEACH_COLORS[beachStatus] : 'white'}
        sub={windMph != null ? `Wind ${windMph}mph` : ''}
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
