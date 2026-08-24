import { useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Every admin write in this app previously ignored `{ error }` from Supabase
 * and proceeded as if it succeeded (closing forms, optimistically updating
 * state even on failure). This hook makes that impossible to do by accident:
 * `mutate` always surfaces the error, and callers only get `ok: true` when
 * the write actually succeeded.
 */
export function useSupabaseMutation() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function mutate<T>(
    fn: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>
  ): Promise<{ data: T | null; ok: boolean }> {
    setSaving(true)
    setError(null)
    const { data, error: err } = await fn()
    setSaving(false)
    if (err) {
      setError(err.message)
      return { data: null, ok: false }
    }
    return { data, ok: true }
  }

  return { mutate, saving, error, setError }
}
