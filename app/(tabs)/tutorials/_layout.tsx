import { Text } from 'react-native'
import { Stack, useNavigation, useFocusEffect } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { StackActions } from '@react-navigation/native'
import { useCallback } from 'react'

export default function TutorialsLayout() {
  const { t } = useLanguage()
  const navigation = useNavigation()

  useFocusEffect(useCallback(() => {
    const state = navigation.getState()
    const tabRoute = state?.routes?.find((r: any) => r.name === 'tutorials')
    if (tabRoute?.state?.key && (tabRoute.state as any).index > 0) {
      navigation.dispatch({ ...StackActions.popToTop(), target: tabRoute.state.key })
    }
  }, [navigation]))

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
      <Stack.Screen name="create" options={{ title: t('createTutorial') }} />
      <Stack.Screen name="edit/[id]" options={{ title: t('editTutorial') }} />
      <Stack.Screen name="categories" options={{ title: t('categories') }} />
    </Stack>
  )
}
