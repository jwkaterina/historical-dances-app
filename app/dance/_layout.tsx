import { Stack } from 'expo-router'

export default function DanceLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: true }} />
      <Stack.Screen name="create" options={{ headerShown: true }} />
      <Stack.Screen name="edit/[id]" options={{ headerShown: true }} />
    </Stack>
  )
}
