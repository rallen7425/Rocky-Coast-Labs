import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Amenity {
  id: string
  name: string
  status: 'open' | 'closed' | 'maintenance'
  hours_open: string | null
  hours_close: string | null
  location: string | null
  age_restriction: string | null
  notes: string | null
  sort_order: number
  parent_id: string | null
  description: string | null
  // Detail-only fields — present when fetched via useAmenity(id).
  long_description?: string | null
  photo_url?: string | null
  rules?: string | null
}

export interface AmenityGroup {
  parent: Amenity
  children: Amenity[]
}

const LIST_FIELDS = 'id, name, status, hours_open, hours_close, location, age_restriction, notes, sort_order, parent_id, description'
const DETAIL_FIELDS = `${LIST_FIELDS}, long_description, photo_url, rules`

export const AMENITY_PHOTO_BUCKET = 'village-summer-amenity-photos'

export function amenityPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(AMENITY_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Replaces the old hardcoded category==='pool'|'amenity' split with generic
 * parent_id grouping — top-level amenities are parent_id IS NULL, each with
 * its own (possibly empty) list of sub-amenities.
 */
export function useAmenities() {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchAmenities() {
      const { data, error } = await supabase
        .from('amenities')
        .select(LIST_FIELDS)
        .order('sort_order')

      if (!mounted) return
      if (!error && data) setAmenities(data as Amenity[])
      setLoading(false)
    }

    fetchAmenities()
    return () => { mounted = false }
  }, [])

  const groups: AmenityGroup[] = amenities
    .filter(a => !a.parent_id)
    .map(parent => ({
      parent,
      children: amenities.filter(a => a.parent_id === parent.id),
    }))

  return { groups, loading }
}

export function useAmenity(id: string | undefined) {
  const [amenity, setAmenity] = useState<Amenity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    let mounted = true

    async function fetchAmenity() {
      const { data, error } = await supabase
        .from('amenities')
        .select(DETAIL_FIELDS)
        .eq('id', id)
        .maybeSingle()

      if (!mounted) return
      if (!error && data) setAmenity(data as Amenity)
      setLoading(false)
    }

    fetchAmenity()
    return () => { mounted = false }
  }, [id])

  return { amenity, loading }
}
