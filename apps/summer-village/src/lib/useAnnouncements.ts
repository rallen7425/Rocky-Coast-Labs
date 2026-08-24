import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Announcement {
  id: string
  message: string
  starts_at: string
  ends_at: string
}

/**
 * List-capable (unlike useActiveAlert's single-alert `.limit(1)`) — multiple
 * announcements can be live at once. No client-side time-window filtering:
 * the public RLS policy already enforces `starts_at <= now() AND ends_at >
 * now()`, so a plain select is correct by construction.
 */
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let expiryTimer: ReturnType<typeof setTimeout> | null = null

    // The public RLS window only re-filters on each fetch -- without this,
    // an announcement fetched while live keeps showing in the UI straight
    // through its own `ends_at`, until some unrelated DB write happens to
    // trigger a realtime re-fetch. Schedule a re-fetch for exactly when the
    // soonest-ending announcement we're currently holding expires.
    function scheduleExpiryRefetch(data: Announcement[]) {
      if (expiryTimer) clearTimeout(expiryTimer)
      if (data.length === 0) return
      const nextEndsAt = Math.min(...data.map(a => new Date(a.ends_at).getTime()))
      const delay = nextEndsAt - Date.now()
      if (delay <= 0) return
      expiryTimer = setTimeout(fetchAnnouncements, delay)
    }

    async function fetchAnnouncements() {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, message, starts_at, ends_at')
        .order('starts_at')

      if (!mounted) return
      if (!error && data) {
        setAnnouncements(data as Announcement[])
        scheduleExpiryRefetch(data as Announcement[])
      }
      setLoading(false)
    }

    fetchAnnouncements()

    const channel = supabase
      .channel('announcements')
      .on('postgres_changes', { event: '*', schema: 'village_summer', table: 'announcements' }, () => fetchAnnouncements())
      .subscribe()

    return () => {
      mounted = false
      if (expiryTimer) clearTimeout(expiryTimer)
      supabase.removeChannel(channel)
    }
  }, [])

  return { announcements, loading }
}
