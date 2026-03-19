import { useEffect } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import TutorialForm from '@/components/forms/TutorialForm'

export default function EditTutorialScreen() {
  const { t } = useLanguage()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/(tabs)')
  }, [isAdmin, loading])

  if (loading || !isAdmin) return null

  return (
    <>
      <Stack.Screen options={{ title: t('editTutorial'), headerShown: true }} />
      <TutorialForm tutorialId={id} />
    </>
  )
}
