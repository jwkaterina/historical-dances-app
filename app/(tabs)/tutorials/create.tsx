import { Stack } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import TutorialForm from '@/components/forms/TutorialForm'

export default function CreateTutorialScreen() {
  const { t } = useLanguage()
  return (
    <>
      <Stack.Screen options={{ title: t('createTutorial'), headerShown: true }} />
      <TutorialForm />
    </>
  )
}
