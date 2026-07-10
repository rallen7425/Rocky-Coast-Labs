import { useEffect, useState, FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AdminPageTitle } from './AdminLayout'
import { format, parseISO } from 'date-fns'

interface Alert {
  id: string
  message: string
  severity: 'info' | 'warning' | 'emergency'
  is_active: boolean
  created_at: string
  expires_at: string | null
}

const SEVERITY_STYLES = {
  info:      { bg: '#f0f6ff', color: '#103457', dot: '#a9c9f3' },
  warning:   { bg: '#fffbf0', color: '#7a4f00', dot: '#f0a500' },
  emergency: { bg: '#fff5f5', color: '#ba1a1a', dot: '#ba1a1a' },
}

export function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ message: '', severity: 'warning' as Alert['severity'], expires_at: '' })

  const load = async () => {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
    setAlerts((data ?? []) as Alert[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const dismiss = async (id: string) => {
    await supabase.from('alerts').update({ is_active: false }).eq('id', id)
    load()
  }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('alerts').insert({
      message: form.message,
      severity: form.severity,
      is_active: true,
      expires_at: form.expires_at || null,
    })
    setForm({ message: '', severity: 'warning', expires_at: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <AdminPageTitle>Alerts</AdminPageTitle>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white transition-colors"
          style={{ background: '#103457' }}
        >
          <Plus size={16} />
          New Alert
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5 flex flex-col gap-4">
          <h3 className="font-display font-semibold text-gray-900 text-[16px]">Post New Alert</h3>

          <div>
            <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Message</label>
            <textarea
              required
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={2}
              placeholder="e.g. Adult Pool closed until 11am — maintenance"
              className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Severity</label>
              <select
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value as Alert['severity'] }))}
                className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Expires (optional)</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl font-body text-[14px] text-gray-600 border border-gray-200 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white disabled:opacity-60" style={{ background: '#103457' }}>
              {saving ? 'Posting…' : 'Post Alert'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="font-body text-gray-400 text-[14px]">Loading…</p>
      ) : alerts.length === 0 ? (
        <p className="font-body text-gray-400 text-[14px]">No alerts yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map(alert => {
            const s = SEVERITY_STYLES[alert.severity]
            return (
              <div key={alert.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                <div className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot, marginTop: 6 }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-body font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {alert.severity}
                    </span>
                    {!alert.is_active && (
                      <span className="font-body text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Dismissed</span>
                    )}
                  </div>
                  <p className="font-body text-gray-900 text-[14px]">{alert.message}</p>
                  <p className="font-body text-gray-400 text-[11px] mt-1">
                    {format(parseISO(alert.created_at), 'MMM d, h:mm a')}
                    {alert.expires_at && ` · Expires ${format(parseISO(alert.expires_at), 'MMM d, h:mm a')}`}
                  </p>
                </div>
                {alert.is_active && (
                  <button
                    onClick={() => dismiss(alert.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-[12px] text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <X size={12} />
                    Dismiss
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
