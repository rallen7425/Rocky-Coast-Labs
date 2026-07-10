import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import barnPhoto from '../../assets/sv-barn.jpg'

type Step = 'name' | 'cottage' | 'dates'

export function OnboardingPage() {
  const { updateProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('name')
  const [firstName, setFirstName] = useState('')
  const [cottage, setCottage] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [saving, setSaving] = useState(false)

  const handleName = (e: FormEvent) => {
    e.preventDefault()
    if (firstName.trim()) setStep('cottage')
  }

  const handleCottage = (e: FormEvent) => {
    e.preventDefault()
    if (cottage.trim()) setStep('dates')
  }

  const handleDates = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await updateProfile({ firstName: firstName.trim(), cottageNumber: cottage.trim(), checkIn, checkOut })
    navigate('/', { replace: true })
  }

  const bgGrad = 'linear-gradient(180deg, rgba(8,18,36,0.7) 0%, rgba(8,18,36,0.95) 100%)'

  return (
    <div className="relative min-h-screen flex items-end justify-center pb-16">
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${barnPhoto})` }} />
      <div className="fixed inset-0 z-0" style={{ background: bgGrad }} />

      <div className="relative z-10 w-full max-w-[390px] px-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {(['name', 'cottage', 'dates'] as Step[]).map(s => (
            <div
              key={s}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: s === step ? 'white' : 'rgba(255,255,255,0.3)' }}
            />
          ))}
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          {step === 'name' && (
            <form onSubmit={handleName} className="flex flex-col gap-4">
              <div>
                <h2 className="font-display font-bold text-white text-[22px]">Welcome!</h2>
                <p className="font-body text-white/55 text-[13px] mt-1">Let's personalise your experience.</p>
              </div>
              <div>
                <label className="font-body text-white/65 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
                  Your first name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Sarah"
                  className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                />
              </div>
              <button type="submit" className="w-full rounded-xl py-3.5 font-display font-semibold text-white text-[15px]" style={{ background: '#103457' }}>
                Continue →
              </button>
            </form>
          )}

          {step === 'cottage' && (
            <form onSubmit={handleCottage} className="flex flex-col gap-4">
              <div>
                <h2 className="font-display font-bold text-white text-[22px]">Your Cottage</h2>
                <p className="font-body text-white/55 text-[13px] mt-1">This is on your check-in paperwork.</p>
              </div>
              <div>
                <label className="font-body text-white/65 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
                  Cottage number
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={cottage}
                  onChange={e => setCottage(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('name')} className="flex-1 rounded-xl py-3.5 font-display font-semibold text-white/60 text-[14px]" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  ← Back
                </button>
                <button type="submit" className="flex-[2] rounded-xl py-3.5 font-display font-semibold text-white text-[15px]" style={{ background: '#103457' }}>
                  Continue →
                </button>
              </div>
            </form>
          )}

          {step === 'dates' && (
            <form onSubmit={handleDates} className="flex flex-col gap-4">
              <div>
                <h2 className="font-display font-bold text-white text-[22px]">Your Stay</h2>
                <p className="font-body text-white/55 text-[13px] mt-1">We'll highlight events during your visit.</p>
              </div>
              <div>
                <label className="font-body text-white/65 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
                  Check-in date
                </label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="font-body text-white/65 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
                  Check-out date
                </label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', colorScheme: 'dark' }}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('cottage')} className="flex-1 rounded-xl py-3.5 font-display font-semibold text-white/60 text-[14px]" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  ← Back
                </button>
                <button type="submit" disabled={saving} className="flex-[2] rounded-xl py-3.5 font-display font-semibold text-white text-[15px] disabled:opacity-60" style={{ background: '#103457' }}>
                  {saving ? 'Saving…' : "Let's go! →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
