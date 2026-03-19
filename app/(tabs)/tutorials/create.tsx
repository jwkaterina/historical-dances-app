import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import TutorialForm from '@/components/forms/TutorialForm'

export default function CreateTutorialScreen() {
  const { t } = useLanguage()
  const { isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/(tabs)')
  }, [isAdmin, loading])

  if (loading || !isAdmin) return null

  return (
    <>
      <Stack.Screen options={{ title: t('createTutorial'), headerShown: true }} />
      <TutorialForm />
    </>
  )
}
