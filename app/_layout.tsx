import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { lightTheme, darkTheme } from '@/lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [user, loading, segments])

  return <>{children}</>
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="dance/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="dance/create" options={{ headerShown: false }} />
                <Stack.Screen name="dance/edit/[id]" options={{ headerShown: false }} />
              </Stack>
            </AuthGuard>
          </SafeAreaProvider>
        </PaperProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
