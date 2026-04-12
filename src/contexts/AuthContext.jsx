import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)   // supabase auth user
  const [profile, setProfile]   = useState(null)   // row from profiles table
  const [loading, setLoading]   = useState(true)   // initial session check
  const [profileMissing, setProfileMissing] = useState(false) // logged-in but no profile row
  const [lastAuthEvent, setLastAuthEvent] = useState(null)

  // Fetch the profile row for a given auth user id
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setProfile(data)
      setProfileMissing(false)
    } else {
      setProfile(null)
      setProfileMissing(true)
    }
  }

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setLastAuthEvent(event)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setProfileMissing(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, password, fullName, team, extra = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, team, ...extra },
      },
    })
    if (error) throw error
    // Profile row is created automatically by the handle_new_user DB trigger
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setProfileMissing(false)
  }

  const isSuperAdmin = profile?.role === 'superadmin'
  const isAdmin = profile?.role === 'admin' || isSuperAdmin
  // For team-scoped operations: null means "all teams" (superadmin); string means one team (admin)
  const adminTeam = isSuperAdmin ? null : profile?.team

  return (
    <AuthContext.Provider value={{ user, profile, profileMissing, loading, isAdmin, isSuperAdmin, adminTeam, lastAuthEvent, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
