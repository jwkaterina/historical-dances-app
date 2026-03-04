import { Text, View } from 'react-native'
import { Tabs } from 'expo-router'
import AudioPlayer from '@/components/AudioPlayer'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { usePrefetchAll } from '@/hooks/usePrefetchAll'

export default function TabsLayout() {
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const { currentTrack, playUrl, stop } = useAudioPlayer()
  usePrefetchAll()

  const tabBarHeight = 62 + insets.bottom

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.background,
        tabBarInactiveTintColor: 'rgba(245, 241, 230, 0.45)',
        tabBarStyle: {
          backgroundColor: Colors.foreground,
          borderTopWidth: 0,
          elevation: 16,
          shadowColor: '#1a1209',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          height: 62 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: Fonts.body, fontSize: 11 },
        tabBarIconStyle: { marginBottom: -2 },
        headerStyle: { backgroundColor: Colors.foreground },
        headerTintColor: Colors.background,
        headerTitle: ({ children, tintColor }) => (
          <Text style={{ fontFamily: Fonts.heading, color: tintColor ?? Colors.background, fontSize: 17 }}>
            {children}
          </Text>
        ),
        headerShadowVisible: false,
        headerShown: true,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="dances"
        options={{
          title: t('dances'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dance-ballroom" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="balls"
        options={{
          title: t('balls'),
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="music-note" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tutorials"
        options={{
          title: t('tutorials'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="school" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ball-info"
        options={{ href: null, headerShown: false }}
      />
    </Tabs>
    {currentTrack && playUrl && (
      <View style={{
        position: 'absolute',
        bottom: tabBarHeight,
        left: 0, right: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <AudioPlayer
          url={playUrl}
          title={currentTrack.title}
          artist={currentTrack.artist ?? undefined}
          onClose={stop}
        />
      </View>
    )}
    </View>
  )
}
