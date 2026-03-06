import { Text } from 'react-native'
import { Stack, useNavigation } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { StackActions } from '@react-navigation/native'
import { useEffect } from 'react'

export default function DancesLayout() {
  const { t } = useLanguage()
  const navigation = useNavigation()

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      const state = navigation.getState()
      const tabRoute = state?.routes?.find((r: any) => r.name === 'dances')
      if (tabRoute?.state?.key && (tabRoute.state as any).index > 0) {
        navigation.dispatch({ ...StackActions.popToTop(), target: tabRoute.state.key })
      }
    })
    return unsubscribe
  }, [navigation])

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
      <Stack.Screen name="index" options={{ title: t('dances') }} />
      <Stack.Screen name="[id]" options={{ title: t('dances') }} />
      <Stack.Screen name="create" options={{ title: t('createDance') }} />
      <Stack.Screen name="edit/[id]" options={{ title: t('editDance') }} />
    </Stack>
  )
}
