import { Text } from 'react-native'
import { Stack } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

export default function TutorialsLayout() {
  const { t } = useLanguage()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.foreground },
        headerTintColor: Colors.background,
        headerTitle: ({ children, tintColor }) => (
          <Text style={{ fontFamily: Fonts.heading, color: tintColor ?? Colors.background, fontSize: 17 }}>
            {children}
          </Text>
        ),
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('tutorials') }} />
      <Stack.Screen name="[id]" options={{ title: t('tutorials') }} />
    </Stack>
  )
}
