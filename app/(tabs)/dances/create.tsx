import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import DanceForm from '@/components/forms/DanceForm'

export default function CreateDanceScreen() {
  const { isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/(tabs)')
  }, [isAdmin, loading])

  if (loading || !isAdmin) return null

  return <DanceForm />
}
