import { useState, useCallback } from 'react'
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Searchbar, Chip, FAB, ActivityIndicator } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDances } from '@/hooks/useDances'
import { useAuth } from '@/hooks/useAuth'
import { Colors } from '@/lib/colors'
import DanceCard from '@/components/DanceCard'
import type { Dance } from '@/types/database'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const

export default function DancesScreen() {
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState<string | null>(null)

  const { data: dances = [], isLoading, refetch, isRefetching } = useDances()

  useFocusEffect(useCallback(() => { refetch() }, []))

  const filtered = dances.filter((d: Dance) => {
    const name = (language === 'de' ? d.name_de : d.name_ru) ?? d.name ?? ''
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase())
    const matchesDiff = !diffFilter || d.difficulty === diffFilter
    return matchesSearch && matchesDiff
  })

  const renderItem = useCallback(({ item }: { item: Dance }) => (
    <DanceCard dance={item} onPress={() => router.push(`/dance/${item.id}`)} />
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

      <View style={styles.chips}>
        <Chip
          selected={!diffFilter}
          onPress={() => setDiffFilter(null)}
          style={[styles.chip, !diffFilter && styles.chipSelected]}
          textStyle={{ color: !diffFilter ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
          compact
        >
          {t('allDifficulties')}
        </Chip>
        {DIFFICULTIES.map(d => (
          <Chip
            key={d}
            selected={diffFilter === d}
            onPress={() => setDiffFilter(d === diffFilter ? null : d)}
            style={[styles.chip, diffFilter === d && styles.chipSelected]}
            textStyle={{ color: diffFilter === d ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
            compact
          >
            {t(d)}
          </Chip>
        ))}
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
          extraData={diffFilter}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />}
        />
      )}

      {isAuthenticated && (
        <FAB icon="plus" style={styles.fab} onPress={() => router.push('/dance/create')} color={Colors.primaryForeground} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchbar: { margin: 12, elevation: 0, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  chip: { borderRadius: 4, backgroundColor: Colors.muted },
  chipSelected: { backgroundColor: Colors.primary },
  list: { padding: 12, paddingTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: Colors.mutedForeground, textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: Colors.primary },
})
