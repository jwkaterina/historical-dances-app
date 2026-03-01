import { useLocalSearchParams, Stack } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import DanceForm from '@/components/forms/DanceForm'

export default function EditDanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useLanguage()
  return (
    <>
      <Stack.Screen options={{ title: t('editDance'), headerShown: true }} />
      <DanceForm danceId={id} />
    </>
  )
}
