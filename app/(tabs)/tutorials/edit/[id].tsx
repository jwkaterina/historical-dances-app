import { Stack, useLocalSearchParams } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import TutorialForm from '@/components/forms/TutorialForm'

export default function EditTutorialScreen() {
  const { t } = useLanguage()
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <>
      <Stack.Screen options={{ title: t('editTutorial'), headerShown: true }} />
      <TutorialForm tutorialId={id} />
    </>
  )
}
