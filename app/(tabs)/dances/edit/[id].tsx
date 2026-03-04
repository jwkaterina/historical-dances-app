import { useLocalSearchParams } from 'expo-router'
import DanceForm from '@/components/forms/DanceForm'

export default function EditDanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DanceForm danceId={id} />
}
