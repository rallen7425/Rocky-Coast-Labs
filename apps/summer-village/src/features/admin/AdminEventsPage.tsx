import { useEffect, useState, FormEvent } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AdminPageTitle } from './AdminLayout'
import { Modal } from './components/Modal'
import { FormField, FormError, inputClass, textareaClass } from './components/FormField'
import { Toggle } from './components/Toggle'
import { DateTimeRange } from './components/DateTimeRange'
import { ConfirmButton } from './components/ConfirmButton'
import { useSupabaseMutation } from './hooks/useSupabaseMutation'
import { format, parseISO, addDays } from 'date-fns'

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
  address: string | null
  category: string | null
  description: string | null
  long_description: string | null
  url: string | null
  is_all_day: boolean
  is_active: boolean
  recurrence_id: string | null
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface FormState {
  title: string
  description: string
  date: string
  time_start: string
  time_end: string
  is_all_day: boolean
  is_onsite: boolean
  venue: string
  city: string
  address: string
  distance_miles: number | null
  category: string
  long_description: string
  url: string
  recurring: boolean
  weekdays: number[]
  recurrenceEnd: string
}

const BLANK: FormState = {
  title: '', description: '', date: '', time_start: '', time_end: '',
  is_all_day: false, is_onsite: true, venue: '', city: '', address: '', distance_miles: null,
  category: 'community', long_description: '', url: '',
  recurring: false, weekdays: [], recurrenceEnd: '',
}

function datesForRecurrence(startDate: string, endDate: string, weekdays: number[]): string[] {
  const dates: string[] = []
  const end = parseISO(endDate)
  let d = parseISO(startDate)
  while (d <= end) {
    if (weekdays.includes(d.getDay())) dates.push(format(d, 'yyyy-MM-dd'))
    d = addDays(d, 1)
  }
  return dates
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editingRecurrenceId, setEditingRecurrenceId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [submitting, setSubmitting] = useState(false)
  const { mutate, error, setError } = useSupabaseMutation()

  const load = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date')
      .order('time_start')
    setEvents((data ?? []) as Event[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setError(null)
    setForm(BLANK)
    setEditId(null)
    setEditingRecurrenceId(null)
    setShowForm(true)
  }

  const startEdit = (e: Event) => {
    setError(null)
    setForm({
      title: e.title, description: e.description ?? '', date: e.date,
      time_start: e.time_start ?? '', time_end: e.time_end ?? '', is_all_day: e.is_all_day,
      is_onsite: e.is_onsite, venue: e.venue ?? '', city: e.city ?? '', address: e.address ?? '',
      distance_miles: e.distance_miles, category: e.category ?? 'community',
      long_description: e.long_description ?? '', url: e.url ?? '',
      recurring: false, weekdays: [], recurrenceEnd: '',
    })
    setEditId(e.id)
    setEditingRecurrenceId(e.recurrence_id)
    setShowForm(true)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await saveInner()
    } finally {
      setSubmitting(false)
    }
  }

  const saveInner = async () => {
    const basePayload = {
      title: form.title,
      description: form.description || null,
      time_start: form.is_all_day ? null : (form.time_start || null),
      time_end: form.is_all_day ? null : (form.time_end || null),
      is_all_day: form.is_all_day,
      is_onsite: form.is_onsite,
      venue: form.is_onsite ? (form.venue || null) : null,
      city: form.is_onsite ? null : (form.city || null),
      address: form.is_onsite ? null : (form.address || null),
      distance_miles: form.is_onsite ? null : form.distance_miles,
      category: form.category,
      long_description: form.long_description || null,
      url: form.url || null,
    }

    if (editId) {
      if (form.recurring && form.weekdays.length > 0 && form.recurrenceEnd) {
        // Making an already-existing single event recurring: this row keeps
        // its own date, additional instances are generated for the other
        // matching dates going forward, and all of them share a fresh
        // recurrence_id. Same create-a-series-only scope as new events —
        // no bulk edit/cancel of a whole series yet.
        const otherDates = datesForRecurrence(form.date, form.recurrenceEnd, form.weekdays).filter(d => d !== form.date)
        if (otherDates.length === 0) { setError('No additional dates match the selected days in that range.'); return }
        const recurrence_id = crypto.randomUUID()
        const { ok: updateOk } = await mutate(() =>
          supabase.from('events').update({ ...basePayload, date: form.date, recurrence_id }).eq('id', editId)
        )
        if (!updateOk) return
        const rows = otherDates.map(date => ({ ...basePayload, date, is_active: true, recurrence_id }))
        const { ok: insertOk } = await mutate(() => supabase.from('events').insert(rows))
        if (!insertOk) return
      } else {
        const { ok } = await mutate(() =>
          supabase.from('events').update({ ...basePayload, date: form.date }).eq('id', editId)
        )
        if (!ok) return
      }
    } else if (form.recurring && form.weekdays.length > 0 && form.recurrenceEnd) {
      const dates = datesForRecurrence(form.date, form.recurrenceEnd, form.weekdays)
      if (dates.length === 0) { setError('No dates match the selected days in that range.'); return }
      const recurrence_id = crypto.randomUUID()
      const rows = dates.map(date => ({ ...basePayload, date, is_active: true, recurrence_id }))
      const { ok } = await mutate(() => supabase.from('events').insert(rows))
      if (!ok) return
    } else {
      const { ok } = await mutate(() => supabase.from('events').insert({ ...basePayload, date: form.date, is_active: true }))
      if (!ok) return
    }

    setShowForm(false)
    setEditId(null)
    setEditingRecurrenceId(null)
    setForm(BLANK)
    load()
  }

  const toggleHidden = async (ev: Event) => {
    const { ok } = await mutate(() => supabase.from('events').update({ is_active: !ev.is_active }).eq('id', ev.id))
    if (ok) load()
  }

  const remove = async (id: string) => {
    const { ok } = await mutate(() => supabase.from('events').delete().eq('id', id))
    if (ok) load()
  }

  const toggleWeekday = (day: number) => {
    setForm(f => ({
      ...f,
      weekdays: f.weekdays.includes(day) ? f.weekdays.filter(d => d !== day) : [...f.weekdays, day],
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <AdminPageTitle>Events</AdminPageTitle>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white"
          style={{ background: '#103457' }}
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      {showForm && (
        <Modal title={editId ? 'Edit Event' : 'New Event'} onClose={() => setShowForm(false)}>
          <form onSubmit={save} className="flex flex-col gap-4">
            <FormError message={error} />

            <FormField label="Title" required>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Event title" className={inputClass} />
            </FormField>

            <FormField label="Short Description (optional)">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="One or two sentences shown on the event card" className={textareaClass} />
            </FormField>

            <DateTimeRange
              date={form.date}
              timeStart={form.time_start}
              timeEnd={form.time_end}
              allDay={form.is_all_day}
              onDateChange={date => setForm(f => ({ ...f, date }))}
              onTimeStartChange={time_start => setForm(f => ({ ...f, time_start }))}
              onTimeEndChange={time_end => setForm(f => ({ ...f, time_end }))}
              onAllDayChange={is_all_day => setForm(f => ({ ...f, is_all_day }))}
            />

            {editId && editingRecurrenceId ? (
              <div className="rounded-xl border border-gray-100 p-3.5">
                <p className="font-body text-[12px] text-gray-500">
                  This event is part of a recurring series. Editing here only changes this occurrence — bulk edit/cancel of a whole series isn't supported yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-xl border border-gray-100 p-3.5">
                <Toggle
                  checked={form.recurring}
                  onChange={recurring => setForm(f => ({ ...f, recurring }))}
                  label={editId ? 'Make this a recurring event' : 'Recurring event'}
                />
                {form.recurring && (
                  <>
                    <div className="flex gap-1.5">
                      {WEEKDAYS.map((label, day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWeekday(day)}
                          className="flex-1 py-2 rounded-lg font-body text-[12px] font-semibold border transition-colors"
                          style={{
                            background: form.weekdays.includes(day) ? '#103457' : 'transparent',
                            color: form.weekdays.includes(day) ? 'white' : '#9ca3af',
                            borderColor: form.weekdays.includes(day) ? '#103457' : '#e5e7eb',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <FormField label="Repeat until">
                      <input type="date" value={form.recurrenceEnd} onChange={e => setForm(f => ({ ...f, recurrenceEnd: e.target.value }))}
                        className={inputClass} />
                    </FormField>
                    <p className="font-body text-[11px] text-gray-400">
                      {editId
                        ? "Creates additional events on matching days from this event's date through the end date, grouped with this one as a series."
                        : 'Creates one event per matching day from the date above through this end date.'}
                    </p>
                  </>
                )}
              </div>
            )}

            <Toggle checked={form.is_onsite} onChange={is_onsite => setForm(f => ({ ...f, is_onsite }))} label="On-site event" />

            {form.is_onsite ? (
              <FormField label="Venue">
                <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                  placeholder="e.g. Barn, Pavilion" className={inputClass} />
              </FormField>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="City">
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Ogunquit" className={inputClass} />
                </FormField>
                <FormField label="Distance (miles)">
                  <input type="number" step="0.1" value={form.distance_miles ?? ''}
                    onChange={e => setForm(f => ({ ...f, distance_miles: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="e.g. 3.5" className={inputClass} />
                </FormField>
                <FormField label="Address (optional)" className="sm:col-span-2">
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Shown on the event's detail page" className={inputClass} />
                </FormField>
              </div>
            )}

            <FormField label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                {['community', 'arts', 'food', 'fitness', 'auto', 'other'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Long Description (optional, shown on detail page)">
              <textarea value={form.long_description} onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))}
                rows={4} placeholder="Full details for the event's detail page" className={textareaClass} />
            </FormField>

            <FormField label="Web Link (optional)">
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://…" className={inputClass} />
            </FormField>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl font-body text-[14px] text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white disabled:opacity-60" style={{ background: '#103457' }}>
                {submitting ? 'Saving…' : editId ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {loading ? <p className="font-body text-gray-400 text-[14px]">Loading…</p> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {events.length === 0 ? (
            <p className="px-5 py-8 font-body text-gray-400 text-[14px] text-center">No events yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-display font-semibold text-gray-900 text-[14px] truncate">{ev.title}</div>
                      {!ev.is_active && (
                        <span className="font-body text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">Hidden</span>
                      )}
                    </div>
                    <div className="font-body text-gray-500 text-[12px] mt-0.5">
                      {format(parseISO(ev.date), 'EEE, MMM d')}
                      {ev.is_all_day ? ' · All day' : ev.time_start && ` · ${ev.time_start.slice(0, 5)}`}
                      {ev.is_onsite ? ` · ${ev.venue ?? 'On-site'}` : ` · ${ev.city ?? ''}${ev.distance_miles != null ? ` (~${ev.distance_miles} mi)` : ''}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleHidden(ev)} title={ev.is_active ? 'Hide' : 'Show'} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      {ev.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => startEdit(ev)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <ConfirmButton icon={Trash2} onConfirm={() => remove(ev.id)} />
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
