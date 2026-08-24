export function formatTime(t: string | null): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Converts a UTC ISO timestamp to the `YYYY-MM-DDTHH:mm` shape a `<input type="datetime-local">` expects, in local time. */
export function toDateTimeLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Converts a `<input type="datetime-local">` value (local time, no timezone) to a UTC ISO timestamp for Supabase. */
export function fromDateTimeLocalInput(value: string): string {
  return new Date(value).toISOString()
}

/** Midnight at the end of the local day containing `iso` — i.e. the start of the next calendar day. */
export function midnightOfDay(iso: string): string {
  const d = new Date(iso)
  d.setHours(24, 0, 0, 0)
  return d.toISOString()
}
