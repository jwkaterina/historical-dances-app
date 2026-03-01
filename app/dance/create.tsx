import { Stack } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import DanceForm from '@/components/forms/DanceForm'

export default function CreateDanceScreen() {
  const { t } = useLanguage()
  return (
    <>
      <Stack.Screen options={{ title: t('createDance'), headerShown: true }} />
      <DanceForm />
    </>
  )
}
