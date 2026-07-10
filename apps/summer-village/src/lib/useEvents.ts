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
}

export function useUpcomingEvents(limit = 6) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const today = new Date().toISOString().slice(0, 10)
    const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time_start, time_end, is_onsite, venue, distance_miles, city, category')
        .eq('is_active', true)
        .gte('date', today)
        .lte('date', inSevenDays)
        .order('date')
        .order('time_start')
        .limit(limit)

      if (!mounted) return
      if (!error && data) setEvents(data as Event[])
      setLoading(false)
    }

    fetchEvents()
    return () => { mounted = false }
  }, [limit])

  return { events, loading }
}
