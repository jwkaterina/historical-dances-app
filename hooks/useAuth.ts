import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }
      // Fetch fresh user from server to get latest user_metadata (e.g. is_admin)
      // session.user comes from the JWT and may be stale if metadata was updated after login
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (mounted) {
          setUser(user)
          setLoading(false)
        }
      }).catch(() => {
        if (mounted) {
          setUser(session.user)
          setLoading(false)
        }
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = () => supabase.auth.signOut()

  const isAdmin = !!user?.user_metadata?.is_admin

  return { user, loading, isAuthenticated: !!user, isAdmin, signOut }
}
