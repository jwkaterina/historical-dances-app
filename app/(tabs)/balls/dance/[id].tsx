import { Stack, useLocalSearchParams } from 'expo-router'
import DanceDetailScreen from '../../dances/[id]'

export default function BallDanceDetailScreen() {
  const { ballName } = useLocalSearchParams<{ ballName?: string }>()
  return (
    <>
      <Stack.Screen options={{ title: ballName ?? '' }} />
      <DanceDetailScreen />
    </>
  )
}
