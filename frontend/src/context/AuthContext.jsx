import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
    console.log('🔍 fetchProfile llamado con:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('rol, nombre')
      .eq('id', userId)
      .single()
    console.log('📦 data:', data, '❌ error:', error)
    setProfile(data ?? null)
  } catch (e) {
    console.log('💥 catch:', e)
    setProfile(null)
  }
  }

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000)

  supabase.auth.refreshSession().then(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    clearTimeout(timeout)
    const u = session?.user ?? null
    setUser(u)
    if (u) {
      const rol = u.user_metadata?.rol ?? 'medico'
      setProfile({ rol, nombre: u.user_metadata?.nombre ?? u.email })
    }
    setLoading(false)
  }).catch(() => {
    clearTimeout(timeout)
    setLoading(false)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const rol = u.user_metadata?.rol ?? 'medico'
        setProfile({ rol, nombre: u.user_metadata?.nombre ?? u.email })
      } else {
        setProfile(null)
      }
    }
  )

  return () => {
    clearTimeout(timeout)
    subscription.unsubscribe()
  }
}, [])

  const signUp = async (email, password, nombre) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } }
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.rol ?? null,
      loading,
      signUp, signIn, signOut, resetPassword
    }}>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}