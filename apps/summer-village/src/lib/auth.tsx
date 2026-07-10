import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type UserRole = 'renter' | 'owner' | 'admin'

export interface UserProfile {
  role: UserRole
  cottageNumber: string | null
  checkIn: string | null   // ISO date
  checkOut: string | null  // ISO date
  firstName: string | null
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isGuest: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  enterGuestMode: () => void
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

const GUEST_KEY = 'svl_guest_mode'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === '1')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      // Clear guest mode when a real session starts
      if (session) {
        localStorage.removeItem(GUEST_KEY)
        setIsGuest(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null

  const profile: UserProfile | null = user ? {
    role: (user.user_metadata?.role as UserRole) ?? 'renter',
    cottageNumber: user.user_metadata?.cottage_number ?? null,
    checkIn: user.user_metadata?.check_in ?? null,
    checkOut: user.user_metadata?.check_out ?? null,
    firstName: user.user_metadata?.first_name ?? null,
  } : null

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    localStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    await supabase.auth.signOut()
  }

  const enterGuestMode = () => {
    localStorage.setItem(GUEST_KEY, '1')
    setIsGuest(true)
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const metaUpdates: Record<string, string | null> = {}
    if (updates.role !== undefined) metaUpdates.role = updates.role
    if (updates.cottageNumber !== undefined) metaUpdates.cottage_number = updates.cottageNumber
    if (updates.checkIn !== undefined) metaUpdates.check_in = updates.checkIn
    if (updates.checkOut !== undefined) metaUpdates.check_out = updates.checkOut
    if (updates.firstName !== undefined) metaUpdates.first_name = updates.firstName

    const { error } = await supabase.auth.updateUser({ data: metaUpdates })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isGuest, signIn, signOut, enterGuestMode, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useRole() {
  const { profile } = useAuth()
  return profile?.role ?? 'renter'
}
