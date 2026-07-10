import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { AdminPageTitle } from './AdminLayout'

type AmenityStatus = 'open' | 'closed' | 'maintenance'

interface Amenity {
  id: string
  name: string
  category: 'pool' | 'amenity'
  status: AmenityStatus
  hours_open: string | null
  hours_close: string | null
  location: string | null
  age_restriction: string | null
  notes: string | null
}

const STATUS_OPTS: { value: AmenityStatus; label: string; bg: string; color: string }[] = [
  { value: 'open',        label: 'Open',        bg: 'rgba(46,196,90,0.15)',  color: '#166534' },
  { value: 'maintenance', label: 'Maintenance',  bg: 'rgba(240,165,0,0.15)', color: '#7a4f00' },
  { value: 'closed',      label: 'Closed',       bg: 'rgba(186,26,26,0.12)', color: '#ba1a1a' },
]

function StatusPill({ status }: { status: AmenityStatus }) {
  const s = STATUS_OPTS.find(o => o.value === status) ?? STATUS_OPTS[0]
  return (
    <span className="font-body font-semibold text-[11px] px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = async () => {
    const { data } = await supabase.from('amenities').select('*').order('category').order('sort_order')
    const list = (data ?? []) as Amenity[]
    setAmenities(list)
    const n: Record<string, string> = {}
    list.forEach(a => { n[a.id] = a.notes ?? '' })
    setNotes(n)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const setStatus = async (id: string, status: AmenityStatus) => {
    setUpdating(id)
    await supabase.from('amenities').update({ status }).eq('id', id)
    setAmenities(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setUpdating(null)
  }

  const saveNotes = async (id: string) => {
    await supabase.from('amenities').update({ notes: notes[id] || null }).eq('id', id)
  }

  const pools = amenities.filter(a => a.category === 'pool')
  const other = amenities.filter(a => a.category === 'amenity')

  if (loading) return <p className="font-body text-gray-400 text-[14px]">Loading…</p>

  return (
    <div>
      <AdminPageTitle>Amenities</AdminPageTitle>

      {([['Pools', pools], ['Amenities', other]] as [string, Amenity[]][]).map(([label, list]) => (
        <div key={label} className="mb-6">
          <h2 className="font-display font-semibold text-gray-700 text-[13px] uppercase tracking-wider mb-3">{label}</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {list.map(amenity => (
                <div key={amenity.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-display font-semibold text-gray-900 text-[14px]">{amenity.name}</div>
                      <div className="font-body text-gray-500 text-[12px] mt-0.5">
                        {amenity.hours_open && amenity.hours_close && `${amenity.hours_open.slice(0,5)}–${amenity.hours_close.slice(0,5)}`}
                        {amenity.location && ` · ${amenity.location}`}
                        {amenity.age_restriction && ` · ${amenity.age_restriction}`}
                      </div>
                    </div>
                    <StatusPill status={amenity.status} />
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-2">
                    {STATUS_OPTS.map(opt => (
                      <button
                        key={opt.value}
                        disabled={updating === amenity.id}
                        onClick={() => setStatus(amenity.id, opt.value)}
                        className="flex-1 py-2 rounded-xl font-body font-semibold text-[12px] transition-all border"
                        style={{
                          background: amenity.status === opt.value ? opt.bg : 'transparent',
                          color: amenity.status === opt.value ? opt.color : '#9ca3af',
                          borderColor: amenity.status === opt.value ? 'transparent' : '#e5e7eb',
                          opacity: updating === amenity.id ? 0.6 : 1,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="flex gap-2 items-center">
                    <input
                      value={notes[amenity.id] ?? ''}
                      onChange={e => setNotes(n => ({ ...n, [amenity.id]: e.target.value }))}
                      placeholder="Add a note (optional)"
                      className="flex-1 rounded-lg px-3 py-2 font-body text-[13px] text-gray-700 border border-gray-200 outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={() => saveNotes(amenity.id)}
                      className="px-3 py-2 rounded-lg font-body text-[12px] text-white"
                      style={{ background: '#103457' }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
