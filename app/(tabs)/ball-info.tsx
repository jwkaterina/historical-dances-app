import { useEffect } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '@/lib/colors'

/**
 * Legacy ball-info screen — replaced by the shared FAQ page.
 * Redirects to /faq in case any deep link still points here.
 */
export default function BallInfoScreen() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/(tabs)/balls/faq')
  }, [router])

  return <View style={{ flex: 1, backgroundColor: Colors.background }} />
}
