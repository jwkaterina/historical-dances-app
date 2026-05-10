import { StyleSheet } from 'react-native'
import { IconButton } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useUserDanceStatuses, useToggleFavorite } from '@/hooks/useUserDanceStatus'
import { toastService } from '@/lib/toastService'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'

interface Props {
  danceId: string
  size?: number
}

export default function FavoriteButton({ danceId, size = 22 }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const { data: statuses = [] } = useUserDanceStatuses()
  const toggleMutation = useToggleFavorite()

  const status = statuses.find(s => s.dance_id === danceId)
  const isFavorite = status?.is_favorite ?? false

  const handlePress = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toastService.show('loginToFavorite', { label: t('login'), onPress: () => router.push('/(auth)/login') })
      return
    }
    toggleMutation.mutate(danceId)
  }

  return (
    <IconButton
      icon={isFavorite ? 'heart' : 'heart-outline'}
      iconColor={isFavorite ? Colors.destructive : Colors.mutedForeground}
      size={size}
      onPress={handlePress}
      style={styles.button}
    />
  )
}

const styles = StyleSheet.create({
  button: { margin: 0 },
})
