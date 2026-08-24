import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Event {
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
  description: string | null
  is_all_day: boolean
  // Detail-only fields — present when fetched via useEvent(id), not included
  // in the lean list query useUpcomingEvents uses for cards/carousels.
  long_description?: string | null
  url?: string | null
  address?: string | null
  recurrence_id?: string | null
}

const LIST_FIELDS = 'id, title, date, time_start, time_end, is_onsite, venue, distance_miles, city, category, description, is_all_day'
const DETAIL_FIELDS = `${LIST_FIELDS}, long_description, url, address, recurrence_id`

export function useUpcomingEvents(limit = 6, days = 7) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const today = new Date().toISOString().slice(0, 10)
    const windowEnd = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select(LIST_FIELDS)
        .eq('is_active', true)
        .gte('date', today)
        .lte('date', windowEnd)
        .order('date')
        .order('time_start')
        .limit(limit)

      if (!mounted) return
      if (!error && data) setEvents(data as Event[])
      setLoading(false)
    }

    fetchEvents()
    return () => { mounted = false }
  }, [limit, days])

  return { events, loading }
}

export function useEvent(id: string | undefined) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    let mounted = true

    async function fetchEvent() {
      const { data, error } = await supabase
        .from('events')
        .select(DETAIL_FIELDS)
        .eq('id', id)
        .maybeSingle()

      if (!mounted) return
      if (!error && data) setEvent(data as Event)
      setLoading(false)
    }

    fetchEvent()
    return () => { mounted = false }
  }, [id])

  return { event, loading }
}
