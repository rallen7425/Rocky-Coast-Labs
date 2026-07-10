import { useEffect, useState, FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AdminPageTitle } from './AdminLayout'
import { format, parseISO } from 'date-fns'

interface Event {
  id: string
  title: string
  date: string
  time_start: string | null
  time_end: string | null
  is_onsite: boolean
  venue: string | null
  distance_miles: number | null
  city: string | null
  category: string | null
  is_active: boolean
}

const BLANK: Omit<Event, 'id' | 'is_active'> = {
  title: '', date: '', time_start: '', time_end: '',
  is_onsite: true, venue: '', distance_miles: null, city: '', category: 'community',
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('date', today)
      .order('date')
      .order('time_start')
    setEvents((data ?? []) as Event[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const startEdit = (e: Event) => {
    setForm({
      title: e.title, date: e.date,
      time_start: e.time_start ?? '', time_end: e.time_end ?? '',
      is_onsite: e.is_onsite, venue: e.venue ?? '',
      distance_miles: e.distance_miles, city: e.city ?? '', category: e.category ?? 'community',
    })
    setEditId(e.id)
    setShowNew(false)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      time_start: form.time_start || null,
      time_end: form.time_end || null,
      venue: form.venue || null,
      city: form.city || null,
    }
    if (editId) {
      await supabase.from('events').update(payload).eq('id', editId)
    } else {
      await supabase.from('events').insert({ ...payload, is_active: true })
    }
    setEditId(null)
    setShowNew(false)
    setForm(BLANK)
    setSaving(false)
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('events').update({ is_active: false }).eq('id', id)
    setDeleteId(null)
    load()
  }

  const EventForm = (
    <form onSubmit={save} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5 flex flex-col gap-4">
      <h3 className="font-display font-semibold text-gray-900 text-[16px]">
        {editId ? 'Edit Event' : 'New Event'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Title *</label>
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Event title" className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400" />
        </div>

        <div>
          <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Date *</label>
          <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400" />
        </div>

        <div>
          <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Category</label>
          <select value={form.category ?? 'community'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400">
            {['community', 'arts', 'food', 'fitness', 'auto', 'other'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Start Time</label>
          <input type="time" value={form.time_start ?? ''} onChange={e => setForm(f => ({ ...f, time_start: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400" />
        </div>

        <div>
          <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">End Time</label>
          <input type="time" value={form.time_end ?? ''} onChange={e => setForm(f => ({ ...f, time_end: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400" />
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <input type="checkbox" id="onsite" checked={form.is_onsite} onChange={e => setForm(f => ({ ...f, is_onsite: e.target.checked }))}
            className="w-4 h-4 rounded" />
          <label htmlFor="onsite" className="font-body text-[14px] text-gray-700">On-site event</label>
        </div>

        <div>
          <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            {form.is_onsite ? 'Venue' : 'City'}
          </label>
          {form.is_onsite ? (
            <input value={form.venue ?? ''} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              placeholder="e.g. Barn, Pavilion" className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400" />
          ) : (
            <input value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="e.g. Ogunquit" className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400" />
          )}
        </div>

        {!form.is_onsite && (
          <div>
            <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Distance (miles)</label>
            <input type="number" step="0.1" value={form.distance_miles ?? ''}
              onChange={e => setForm(f => ({ ...f, distance_miles: e.target.value ? parseFloat(e.target.value) : null }))}
              placeholder="e.g. 3.5" className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400" />
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => { setEditId(null); setShowNew(false); setForm(BLANK) }}
          className="px-4 py-2.5 rounded-xl font-body text-[14px] text-gray-600 border border-gray-200 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white disabled:opacity-60" style={{ background: '#103457' }}>
          {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Event'}
        </button>
      </div>
    </form>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <AdminPageTitle>Events</AdminPageTitle>
        <button onClick={() => { setShowNew(true); setEditId(null); setForm(BLANK) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white" style={{ background: '#103457' }}>
          <Plus size={16} /> New Event
        </button>
      </div>

      {(showNew || editId) && EventForm}

      {loading ? <p className="font-body text-gray-400 text-[14px]">Loading…</p> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <span className="font-body text-gray-500 text-[12px]">Showing upcoming events</span>
          </div>
          {events.length === 0 ? (
            <p className="px-5 py-8 font-body text-gray-400 text-[14px] text-center">No upcoming events.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-gray-900 text-[14px] truncate">{ev.title}</div>
                    <div className="font-body text-gray-500 text-[12px] mt-0.5">
                      {format(parseISO(ev.date), 'EEE, MMM d')}
                      {ev.time_start && ` · ${ev.time_start.slice(0,5)}`}
                      {ev.is_onsite ? ` · ${ev.venue ?? 'On-site'}` : ` · ${ev.city ?? ''} (~${ev.distance_miles} mi)`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(ev)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <Pencil size={15} />
                    </button>
                    {deleteId === ev.id ? (
                      <>
                        <button onClick={() => remove(ev.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"><Check size={15} /></button>
                        <button onClick={() => setDeleteId(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={15} /></button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteId(ev.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
