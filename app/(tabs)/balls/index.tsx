import { useState, useCallback } from 'react'
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Searchbar, FAB, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBalls } from '@/hooks/useBalls'
import { useAuth } from '@/hooks/useAuth'
import BallCard from '@/components/BallCard'
import type { BallWithSections } from '@/types/database'

export default function BallsScreen() {
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: balls = [], isLoading, refetch, isRefetching } = useBalls()

  const filtered = (balls as BallWithSections[]).filter((b) => {
    if (!search) return true
    const name = (language === 'de' ? b.name_de : b.name_ru) ?? b.name ?? ''
    const place = (language === 'de' ? b.place_de : b.place_ru) ?? b.place ?? ''
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      place.toLowerCase().includes(search.toLowerCase())
    )
  })

  const renderItem = useCallback(({ item }: { item: BallWithSections }) => (
    <BallCard ball={item} onPress={() => router.push(`/(tabs)/balls/${item.id}`)} />
  ), [router, language])

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchBalls')}
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.center} size="large" />
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={styles.emptyText}>{t('noBallsFound')}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}

      {isAuthenticated && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/(tabs)/balls/create')}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f5' },
  searchbar: { margin: 12, elevation: 0 },
  list: { padding: 12, paddingTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { opacity: 0.6, textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#6750a4' },
})
