import { useEffect, useState, FormEvent } from 'react'
import { Plus, Trash2, Megaphone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AdminPageTitle } from './AdminLayout'
import { Modal } from './components/Modal'
import { FormField, FormError, textareaClass, inputClass } from './components/FormField'
import { Toggle } from './components/Toggle'
import { ConfirmButton } from './components/ConfirmButton'
import { useSupabaseMutation } from './hooks/useSupabaseMutation'
import { toDateTimeLocalInput, fromDateTimeLocalInput, midnightOfDay } from '../../lib/format'
import { format, parseISO } from 'date-fns'

interface Announcement {
  id: string
  message: string
  starts_at: string
  ends_at: string
}

function statusFor(a: Announcement): { label: string; bg: string; color: string } {
  const now = new Date()
  if (now < new Date(a.starts_at)) return { label: 'Scheduled', bg: '#fffbf0', color: '#7a4f00' }
  if (now >= new Date(a.ends_at)) return { label: 'Expired', bg: '#f3f4f6', color: '#6b7280' }
  return { label: 'Live', bg: '#f0fdf4', color: '#166534' }
}

export function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImmediately, setShowImmediately] = useState(true)
  const [message, setMessage] = useState('')
  const [startsAtLocal, setStartsAtLocal] = useState('')
  const [endsAtLocal, setEndsAtLocal] = useState('')
  const { mutate, saving, error, setError } = useSupabaseMutation()

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('starts_at', { ascending: false })
    setAnnouncements((data ?? []) as Announcement[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openForm = () => {
    setError(null)
    setMessage('')
    setShowImmediately(true)
    const now = new Date().toISOString()
    setStartsAtLocal(toDateTimeLocalInput(now))
    setEndsAtLocal(toDateTimeLocalInput(midnightOfDay(now)))
    setShowForm(true)
  }

  const handleStartsAtChange = (value: string) => {
    setStartsAtLocal(value)
    setEndsAtLocal(toDateTimeLocalInput(midnightOfDay(fromDateTimeLocalInput(value))))
  }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    const starts_at = showImmediately ? new Date().toISOString() : fromDateTimeLocalInput(startsAtLocal)
    const ends_at = fromDateTimeLocalInput(endsAtLocal)
    const { ok } = await mutate(() => supabase.from('announcements').insert({ message, starts_at, ends_at }))
    if (ok) {
      setShowForm(false)
      load()
    }
  }

  const remove = async (id: string) => {
    const { ok } = await mutate(() => supabase.from('announcements').delete().eq('id', id))
    if (ok) load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <AdminPageTitle>Announcements</AdminPageTitle>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white"
          style={{ background: '#103457' }}
        >
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {showForm && (
        <Modal title="New Announcement" onClose={() => setShowForm(false)}>
          <form onSubmit={create} className="flex flex-col gap-4">
            <FormError message={error} />

            <FormField label="Message (1–2 sentences)" required>
              <textarea
                required
                rows={2}
                maxLength={280}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. The Barn will be closed Friday afternoon for a private event."
                className={textareaClass}
              />
            </FormField>

            <Toggle checked={showImmediately} onChange={setShowImmediately} label="Show immediately" />

            {!showImmediately && (
              <FormField label="Starts">
                <input
                  type="datetime-local"
                  value={startsAtLocal}
                  onChange={e => handleStartsAtChange(e.target.value)}
                  className={inputClass}
                />
              </FormField>
            )}

            <FormField label="Ends">
              <input
                type="datetime-local"
                value={endsAtLocal}
                onChange={e => setEndsAtLocal(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <p className="font-body text-[11px] text-gray-400 -mt-2">
              Defaults to midnight on the day it starts showing — adjust if needed.
            </p>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl font-body text-[14px] text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white disabled:opacity-60" style={{ background: '#103457' }}>
                {saving ? 'Posting…' : 'Post Announcement'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {loading ? (
        <p className="font-body text-gray-400 text-[14px]">Loading…</p>
      ) : announcements.length === 0 ? (
        <p className="font-body text-gray-400 text-[14px]">No announcements yet.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {announcements.map(a => {
            const s = statusFor(a)
            return (
              <div key={a.id} className="flex items-start gap-3 px-5 py-4">
                <Megaphone size={15} className="text-gray-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-body font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="font-body text-gray-900 text-[14px]">{a.message}</p>
                  <p className="font-body text-gray-400 text-[11px] mt-1">
                    {format(parseISO(a.starts_at), 'MMM d, h:mm a')} – {format(parseISO(a.ends_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <ConfirmButton icon={Trash2} onConfirm={() => remove(a.id)} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
