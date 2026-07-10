import { Bell } from 'lucide-react'
import { StatusBar } from '../../components/StatusBar'
import { AlertBanner } from '../../components/AlertBanner'
import { YourPlanCard } from './YourPlanCard'
import { WeatherRow } from './WeatherRow'
import { EventsScroll } from './EventsScroll'
import { useActiveAlert } from '../../lib/useAlerts'
import barnPhoto from '../../assets/sv-barn.jpg'

export function HomePage() {
  const { alert } = useActiveAlert()

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Fixed background */}
      <img
        src={barnPhoto}
        alt=""
        className="fixed inset-0 w-full h-full object-cover object-center z-0"
        style={{ pointerEvents: 'none' }}
      />
      {/* Gradient overlay */}
      <div className="fixed inset-0 z-0 gradient-overlay" />

      {/* Scrollable content */}
      <div className="relative z-10 flex flex-col min-h-screen scrollbar-hide overflow-y-auto" style={{ paddingBottom: 100 }}>
        <StatusBar />

        {/* Greeting */}
        <div className="px-5 pt-1 pb-0">
          <div className="font-body font-semibold text-white/65 text-[13px]">Good Morning</div>
          <div className="flex justify-between items-start mt-0.5">
            <h1 className="font-display font-bold text-white text-[28px] leading-[1.1]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
              Welcome to<br />Summer Village
            </h1>
            <div className="flex gap-2 mt-1">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Bell size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Alert — live from Supabase, falls back to null (hidden) */}
        {alert && <AlertBanner message={alert.message} />}

        {/* Hero spacer — barn photo shows through here */}
        <div className="flex-1 min-h-[60px]" />

        {/* Modules */}
        <div className="flex flex-col gap-2.5 px-5">
          <YourPlanCard />
          <WeatherRow />
          <EventsScroll />
        </div>
      </div>
    </div>
  )
}
