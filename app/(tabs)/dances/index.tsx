import { useState, useCallback, useEffect } from 'react'
import { FlatList, ScrollView, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Searchbar, Chip, FAB, ActivityIndicator } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDances } from '@/hooks/useDances'
import { useAuth } from '@/hooks/useAuth'
import { useUserDanceStatuses } from '@/hooks/useUserDanceStatus'
import { supabase } from '@/lib/supabase'
import { toastService } from '@/lib/toastService'
import { Colors } from '@/lib/colors'
import DanceCard from '@/components/DanceCard'
import type { Dance } from '@/types/database'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const
const DANCE_TYPES = ['waltz', 'polka', 'contredanse', 'quadrille', 'cotillion', 'other'] as const
type DanceType = typeof DANCE_TYPES[number]

type UserFilter = 'favorites' | 'already_learned' | 'learning' | 'plan_to_learn'

const USER_FILTERS: { value: UserFilter; icon: string; labelKey: string }[] = [
  { value: 'favorites', icon: 'heart', labelKey: 'favorites' },
  { value: 'already_learned', icon: 'school', labelKey: 'alreadyLearned' },
  { value: 'learning', icon: 'book-open-variant', labelKey: 'learning' },
  { value: 'plan_to_learn', icon: 'lightbulb-outline', labelKey: 'planToLearn' },
]

export default function DancesScreen() {
  const { t, language } = useLanguage()
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<DanceType | null>(null)
  const [userFilter, setUserFilter] = useState<UserFilter | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAuthenticated(!!session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session)
      if (!session) setUserFilter(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const { data: dances = [], isLoading, refetch, isRefetching } = useDances()
  const { data: statuses = [] } = useUserDanceStatuses()

  useFocusEffect(useCallback(() => { refetch() }, []))

  const statusMap = Object.fromEntries(statuses.map(s => [s.dance_id, s]))

  const filtered = dances.filter((d: Dance) => {
    const name = (language === 'de' ? d.name_de : d.name_ru) ?? d.name ?? ''
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    const matchesDiff = !diffFilter || d.difficulty === diffFilter
    const matchesType = !typeFilter || d.dance_type === typeFilter
    if (!matchesSearch || !matchesDiff || !matchesType) return false
    if (!userFilter) return true
    const status = statusMap[d.id]
    if (userFilter === 'favorites') return !!status?.is_favorite
    return status?.list_type === userFilter
  })

  const renderItem = useCallback(({ item }: { item: Dance }) => (
    <DanceCard dance={item} onPress={() => router.push(`/dances/${item.id}`)} />
  ), [router, language])

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchDances')}
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={{ color: Colors.foreground }}
        iconColor={Colors.mutedForeground}
        placeholderTextColor={Colors.mutedForeground}
      />

      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="always">
          <Chip
            selected={!diffFilter}
            onPress={() => setDiffFilter(null)}
            style={[styles.chip, !diffFilter && styles.chipSelected]}
            textStyle={{ color: !diffFilter ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
            compact
          >
            {t('allDifficulties')}
          </Chip>
          {DIFFICULTIES.map((d, idx) => {
            const level = idx + 1
            const active = diffFilter === d
            const stars = '★'.repeat(level) + '☆'.repeat(4 - level)
            return (
              <Chip
                key={d}
                onPress={() => setDiffFilter(d === diffFilter ? null : d)}
                style={[styles.chip, active && styles.chipSelected]}
                textStyle={{ color: active ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 13, letterSpacing: 1 }}
                compact
              >
                {stars}
              </Chip>
            )
          })}
        </ScrollView>
      </View>

      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="always">
          <Chip
            selected={!typeFilter}
            onPress={() => setTypeFilter(null)}
            style={[styles.chip, !typeFilter && styles.chipSelected]}
            textStyle={{ color: !typeFilter ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
            compact
          >
            {t('allDanceTypes')}
          </Chip>
          {DANCE_TYPES.map(type => {
            const active = typeFilter === type
            return (
              <Chip
                key={type}
                onPress={() => setTypeFilter(active ? null : type)}
                style={[styles.chip, active && styles.chipSelected]}
                textStyle={{ color: active ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
                compact
              >
                {t(type as any)}
              </Chip>
            )
          })}
        </ScrollView>
      </View>

      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="always">
          {USER_FILTERS.map(f => {
            const active = userFilter === f.value
            return (
              <Chip
                key={f.value}
                selected={active}
                onPress={() => {
                  if (!isAuthenticated) { toastService.show(f.value === 'favorites' ? 'loginToFavorite' : 'loginToUseLists', { label: t('login'), onPress: () => router.push('/(auth)/login') }); return }
                  setUserFilter(active ? null : f.value)
                }}
                style={[styles.chip, active && styles.chipSelected]}
                textStyle={{ color: active ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
                compact
                icon={({ size }) => (
                  <MaterialCommunityIcons name={f.icon as any} size={14} color={active ? Colors.primaryForeground : Colors.mutedForeground} />
                )}
              >
                {t(f.labelKey as any)}
              </Chip>
            )
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {search ? `${t('noDancesForQuery')} "${search}"` : t('noDancesFound')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          extraData={[diffFilter, typeFilter, userFilter]}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="always"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />}
        />
      )}

      {isAdmin && (
        <FAB icon="plus" style={styles.fab} onPress={() => router.push('/dances/create')} color={Colors.primaryForeground} />
      )}


    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchbar: { margin: 12, elevation: 0, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 6 },
  chipsRow: { height: 44 },
  chips: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  chip: { borderRadius: 4, backgroundColor: Colors.muted },
  chipSelected: { backgroundColor: Colors.primary },
  list: { padding: 12, paddingTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: Colors.mutedForeground, textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: Colors.primary },
})
