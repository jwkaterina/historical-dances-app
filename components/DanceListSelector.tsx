import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { IconButton, Menu } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useUserDanceStatuses, useSetDanceListType } from '@/hooks/useUserDanceStatus'
import { useLanguage } from '@/contexts/LanguageContext'
import { toastService } from '@/lib/toastService'
import { Colors } from '@/lib/colors'

type ListType = 'already_learned' | 'learning' | 'plan_to_learn'

const LIST_OPTIONS: { value: ListType; icon: string; labelKey: string }[] = [
  { value: 'already_learned', icon: 'school', labelKey: 'alreadyLearned' },
  { value: 'learning', icon: 'book-open-variant', labelKey: 'learning' },
  { value: 'plan_to_learn', icon: 'lightbulb-outline', labelKey: 'planToLearn' },
]

interface Props {
  danceId: string
  size?: number
}

export default function DanceListSelector({ danceId, size = 22 }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const { data: statuses = [] } = useUserDanceStatuses()
  const setListMutation = useSetDanceListType()
  const [visible, setVisible] = useState(false)

  const status = statuses.find(s => s.dance_id === danceId)
  const currentList = status?.list_type as ListType | null

  const handleOpen = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toastService.show('loginToUseLists', { label: t('login'), onPress: () => router.push('/(auth)/login') })
      return
    }
    setVisible(true)
  }

  const handleSelect = (listType: ListType | null) => {
    setVisible(false)
    setListMutation.mutate({ danceId, listType })
  }

  const iconName = currentList
    ? LIST_OPTIONS.find(o => o.value === currentList)?.icon ?? 'bookmark-outline'
    : 'bookmark-outline'

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <IconButton
          icon={iconName}
          iconColor={currentList ? Colors.primary : Colors.mutedForeground}
          size={size}
          onPress={handleOpen}
          style={styles.button}
        />
      }
      contentStyle={styles.menu}
    >
      {LIST_OPTIONS.map(opt => (
        <Menu.Item
          key={opt.value}
          onPress={() => handleSelect(currentList === opt.value ? null : opt.value)}
          title={t(opt.labelKey as any)}
          leadingIcon={({ size: s, color }) => (
            <MaterialCommunityIcons name={opt.icon as any} size={s} color={currentList === opt.value ? Colors.primary : color} />
          )}
          titleStyle={currentList === opt.value ? { color: Colors.primary } : undefined}
        />
      ))}
      {currentList && (
        <Menu.Item
          onPress={() => handleSelect(null)}
          title={t('removeFromList')}
          leadingIcon="close"
        />
      )}
    </Menu>
  )
}

const styles = StyleSheet.create({
  button: { margin: 0 },
  menu: { backgroundColor: Colors.card },
})
