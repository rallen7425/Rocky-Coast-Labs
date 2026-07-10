import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import barnPhoto from '../../assets/sv-barn.jpg'

export function SplashPage() {
  const navigate = useNavigate()
  const { enterGuestMode } = useAuth()

  const handleGuest = () => {
    enterGuestMode()
    navigate('/', { replace: true })
  }

  return (
    <div
      className="relative w-full min-h-screen flex flex-col"
      style={{
        backgroundImage: `url(${barnPhoto})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Gradient overlay — only darkens the bottom where text sits */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, transparent 40%, rgba(8,18,36,0.45) 70%, rgba(8,18,36,0.72) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pb-10">
        <div className="flex-1" />

        <div className="font-body font-medium text-white/60 text-[15px] mb-1">Wells, Maine</div>
        <h1
          className="font-display font-bold text-white leading-[1.08]"
          style={{ fontSize: 38, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          Welcome to<br />Summer Village
        </h1>

        <div className="flex flex-col gap-3 mt-10">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-2xl font-display font-bold text-[16px] text-white transition-opacity active:opacity-80"
            style={{ background: '#103457' }}
          >
            Sign In
          </button>
          <button
            onClick={handleGuest}
            className="w-full py-4 rounded-2xl font-display font-semibold text-[16px] text-white transition-opacity active:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.13)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.28)',
            }}
          >
            Continue as Guest
          </button>
        </div>

        <p className="font-body text-white/35 text-[12px] text-center mt-5">
          Guests can browse community info and events.
        </p>
      </div>
    </div>
  )
}
