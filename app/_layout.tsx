import 'react-native-gesture-handler'
import { useColorScheme, View, LogBox } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useState, useEffect } from 'react'
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PaperProvider, Snackbar } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext'
import { toastService, isNetworkError } from '@/lib/toastService'
import { useAuth } from '@/hooks/useAuth'
import { lightTheme, darkTheme } from '@/lib/theme'
import { Colors } from '@/lib/colors'
import {
  useFonts,
  LibreBaskerville_400Regular,
  LibreBaskerville_400Regular_Italic,
  LibreBaskerville_700Bold,
} from '@expo-google-fonts/libre-baskerville'
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()
LogBox.ignoreLogs(['Network request failed', 'TypeError: Network request failed'])

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isNetworkError(error)) toastService.show('toastNetworkError')
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isNetworkError(error)) toastService.show('toastNetworkError')
    },
  }),
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, gcTime: SEVEN_DAYS, retry: 2 },
  },
})

function GlobalSnackbar() {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')

  useEffect(() => {
    toastService.register((key) => setMessage(t(key)))
    return () => { toastService.register(null) }
  }, [t])

  return (
    <Snackbar visible={!!message} onDismiss={() => setMessage('')} duration={4000}>
      {message}
    </Snackbar>
  )
}

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'rq-cache',
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    // Redirect logged-in users away from auth screens; unauthenticated users can browse freely
    if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [user, loading, segments])

  return <>{children}</>
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  const [fontsLoaded] = useFonts({
    LibreBaskerville_400Regular,
    LibreBaskerville_400Regular_Italic,
    LibreBaskerville_700Bold,
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: SEVEN_DAYS }}>
      <LanguageProvider>
        <AudioPlayerProvider>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="webview" />
                <Stack.Screen name="pdf-viewer" />
              </Stack>
            </AuthGuard>
            <GlobalSnackbar />
          </SafeAreaProvider>
        </PaperProvider>
        </AudioPlayerProvider>
      </LanguageProvider>
    </PersistQueryClientProvider>
    </GestureHandlerRootView>
  )
}
