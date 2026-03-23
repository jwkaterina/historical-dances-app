import { useState, useCallback, useEffect } from 'react'
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Chip, ActivityIndicator, Button } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { useUserDances } from '@/hooks/useUserDanceStatus'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import DanceCard from '@/components/DanceCard'
import type { Dance } from '@/types/database'

type Filter = 'all' | 'favorites' | 'already_learned' | 'learning' | 'plan_to_learn'

const FILTERS: { value: Filter; icon: string; labelKey: string }[] = [
  { value: 'all', icon: 'format-list-bulleted', labelKey: 'allMyDances' },
  { value: 'favorites', icon: 'heart', labelKey: 'favorites' },
  { value: 'already_learned', icon: 'school', labelKey: 'alreadyLearned' },
  { value: 'learning', icon: 'book-open-variant', labelKey: 'learning' },
  { value: 'plan_to_learn', icon: 'lightbulb-outline', labelKey: 'planToLearn' },
]

export default function MyDancesScreen() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session ? 'authenticated' : 'unauthenticated')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? 'authenticated' : 'unauthenticated')
    })
    return () => subscription.unsubscribe()
  }, [])

  const { data: dances = [], isLoading, refetch, isRefetching } = useUserDances()

  useFocusEffect(useCallback(() => {
    if (authState === 'authenticated') refetch()
  }, [authState]))

  const filtered = dances.filter(dance => {
    switch (filter) {
      case 'favorites':
        return dance.is_favorite
      case 'already_learned':
      case 'learning':
      case 'plan_to_learn':
        return dance.list_type === filter
      default:
        return true
    }
  })

  const renderItem = useCallback(({ item }: { item: typeof dances[0] }) => (
    <DanceCard dance={item as unknown as Dance} onPress={() => router.push(`/dances/${item.id}`)} />
  ), [router, language])

  if (authState === 'loading') {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
  }

  if (authState === 'unauthenticated') {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="book-open-variant" size={48} color={Colors.mutedForeground} />
        <Text variant="bodyLarge" style={styles.loginText}>{t('loginToSeeMyDances')}</Text>
        <Button mode="text" textColor={Colors.primary} onPress={() => router.push('/login')}>
          {t('login')}
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {FILTERS.map(f => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
            style={[styles.chip, filter === f.value && styles.chipSelected]}
            textStyle={{ color: filter === f.value ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
            compact
            icon={({ size, color }) => (
              <MaterialCommunityIcons name={f.icon as any} size={14} color={filter === f.value ? Colors.primaryForeground : Colors.mutedForeground} />
            )}
          >
            {t(f.labelKey as any)}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {filter === 'all' ? t('noMyDancesYet') : t('noMyDancesInCategory')}
          </Text>
          <Text variant="bodySmall" style={styles.emptySubtext}>{t('addDancesFromCatalog')}</Text>
          <Button mode="text" textColor={Colors.primary} onPress={() => router.push('/dances')}>
            {t('goToCatalog')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          extraData={filter}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chips: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  chip: { borderRadius: 4, backgroundColor: Colors.muted },
  chipSelected: { backgroundColor: Colors.primary },
  list: { padding: 12, paddingTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loginText: { color: Colors.mutedForeground, textAlign: 'center', marginTop: 12, marginBottom: 8 },
  emptyText: { color: Colors.mutedForeground, textAlign: 'center' },
  emptySubtext: { color: Colors.mutedForeground, textAlign: 'center', marginTop: 4 },
})
