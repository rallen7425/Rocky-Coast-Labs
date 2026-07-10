import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import barnPhoto from '../../assets/sv-barn.jpg'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Invalid email or password. Please try again.')
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="relative min-h-screen flex items-end justify-center pb-16">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${barnPhoto})` }} />
      <div className="fixed inset-0 z-0" style={{ background: 'linear-gradient(180deg, rgba(8,18,36,0.7) 0%, rgba(8,18,36,0.95) 100%)' }} />

      <div className="relative z-10 w-full max-w-[390px] px-6">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-white text-[32px] leading-tight">
            Summer Village Life
          </h1>
          <p className="font-body text-white/55 text-[14px] mt-2">
            The Cottages at Summer Village · Wells, ME
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          <h2 className="font-display font-semibold text-white text-[18px] mb-5">Sign In</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="font-body text-white/65 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl px-4 py-3 font-body text-[14px] outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(163,210,255,0.6)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              />
            </div>

            <div>
              <label className="font-body text-white/65 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 font-body text-[14px] outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(163,210,255,0.6)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              />
            </div>

            {error && (
              <p className="font-body text-[12px] text-red-300 bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 rounded-xl py-3.5 font-display font-semibold text-white text-[15px] transition-opacity disabled:opacity-60"
              style={{ background: '#103457' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="font-body text-white/40 text-[11px] text-center mt-4">
            First visit? Your access code was provided at check-in.
          </p>
        </div>
      </div>
    </div>
  )
}
