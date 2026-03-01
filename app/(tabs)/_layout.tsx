import { Tabs } from 'expo-router'
import { useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLanguage } from '@/contexts/LanguageContext'

export default function TabsLayout() {
  const { t } = useLanguage()
  const theme = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: { backgroundColor: theme.colors.surface },
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dances'),
          tabBarLabel: t('dances'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dance-ballroom" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="balls"
        options={{
          title: t('balls'),
          tabBarLabel: t('balls'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-star" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: t('music'),
          tabBarLabel: t('music'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="music-note" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
