import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Amenity {
  id: string
  name: string
  category: 'pool' | 'amenity'
  status: 'open' | 'closed' | 'maintenance'
  hours_open: string | null
  hours_close: string | null
  location: string | null
  age_restriction: string | null
  notes: string | null
  sort_order: number
}

export function useAmenities() {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchAmenities() {
      const { data, error } = await supabase
        .from('amenities')
        .select('id, name, category, status, hours_open, hours_close, location, age_restriction, notes, sort_order')
        .order('category')
        .order('sort_order')

      if (!mounted) return
      if (!error && data) setAmenities(data as Amenity[])
      setLoading(false)
    }

    fetchAmenities()
    return () => { mounted = false }
  }, [])

  return {
    pools: amenities.filter(a => a.category === 'pool'),
    other: amenities.filter(a => a.category === 'amenity'),
    loading,
  }
}
