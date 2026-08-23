import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Weather {
  temp_f: number | null
  feels_like_f: number | null
  wind_mph: number | null
  beach_status: 'Ideal' | 'Fair' | 'Poor' | null
  next_tide_at: string | null
  next_tide_type: 'Low' | 'High' | null
}

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchWeather() {
      const { data, error } = await supabase
        .from('weather_cache')
        .select('temp_f, feels_like_f, wind_mph, beach_status, next_tide_at, next_tide_type')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!mounted) return
      if (!error && data) setWeather(data as Weather)
      setLoading(false)
    }

    fetchWeather()
    return () => { mounted = false }
  }, [])

  return { weather, loading }
}
