import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Alert {
  id: string
  message: string
  severity: 'info' | 'warning' | 'emergency'
}

export function useActiveAlert() {
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchAlert() {
      const { data, error } = await supabase
        .from('alerts')
        .select('id, message, severity')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!mounted) return
      if (!error && data) setAlert(data as Alert)
      setLoading(false)
    }

    fetchAlert()

    const channel = supabase
      .channel('alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => fetchAlert())
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { alert, loading }
}
