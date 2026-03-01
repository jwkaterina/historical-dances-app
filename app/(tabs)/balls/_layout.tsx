import { Stack } from 'expo-router'
import { useTheme } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BallsLayout() {
  const { t } = useLanguage()
  const theme = useTheme()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="index" options={{ title: t('balls') }} />
      <Stack.Screen name="[id]" options={{ title: t('balls') }} />
      <Stack.Screen name="create" options={{ title: t('createBall') }} />
    </Stack>
  )
}
