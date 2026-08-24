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

    async function fetchAnnouncements() {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, message, starts_at, ends_at')
        .order('starts_at')

      if (!mounted) return
      if (!error && data) setAnnouncements(data as Announcement[])
      setLoading(false)
    }

    fetchAnnouncements()

    const channel = supabase
      .channel('announcements')
      .on('postgres_changes', { event: '*', schema: 'village_summer', table: 'announcements' }, () => fetchAnnouncements())
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { announcements, loading }
}
