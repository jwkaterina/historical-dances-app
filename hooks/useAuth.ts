import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string>('user')
  const [loading, setLoading] = useState(true)

  const fetchRole = async (): Promise<string> => {
    const { data } = await supabase.rpc('get_my_role')
    return (data as string) ?? 'user'
  }

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session?.user) {
        setUser(null)
        setRole('user')
        setLoading(false)
        return
      }
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!mounted) return
        setUser(user)
        if (user) {
          const r = await fetchRole()
          if (mounted) setRole(r)
        }
        setLoading(false)
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
  const deleteAccount = async () => { await supabase.rpc('delete_my_account') }
  const isAdmin = role === 'admin'

  return { user, loading, isAuthenticated: !!user, isAdmin, signOut, deleteAccount }
}
