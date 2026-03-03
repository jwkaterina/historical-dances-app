import { useState, useCallback, useMemo } from 'react'
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Searchbar, FAB, ActivityIndicator, Chip } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBalls } from '@/hooks/useBalls'
import { useAuth } from '@/hooks/useAuth'
import { Colors } from '@/lib/colors'
import BallCard from '@/components/BallCard'
import type { BallWithSections } from '@/types/database'

export default function BallsScreen() {
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)

  const { data: balls = [], isLoading, refetch, isRefetching } = useBalls()

  const years = useMemo(() => {
    const set = new Set<string>()
    ;(balls as BallWithSections[]).forEach(b => { if (b.date) set.add(b.date.substring(0, 4)) })
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [balls])

  const cities = useMemo(() => {
    const set = new Set<string>()
    ;(balls as BallWithSections[]).forEach(b => {
      const city = (language === 'de' ? b.place_de : b.place_ru) ?? b.place
      if (city) set.add(city)
    })
    return Array.from(set).sort()
  }, [balls, language])

  const filtered = (balls as BallWithSections[]).filter(b => {
    if (search) {
      const name = (language === 'de' ? b.name_de : b.name_ru) ?? b.name ?? ''
      const place = (language === 'de' ? b.place_de : b.place_ru) ?? b.place ?? ''
      if (!name.toLowerCase().includes(search.toLowerCase()) && !place.toLowerCase().includes(search.toLowerCase())) return false
    }
    if (yearFilter && (!b.date || !b.date.startsWith(yearFilter))) return false
    if (cityFilter) {
      const place = (language === 'de' ? b.place_de : b.place_ru) ?? b.place ?? ''
      if (place !== cityFilter) return false
    }
    return true
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
        inputStyle={{ color: Colors.foreground }}
        iconColor={Colors.mutedForeground}
        placeholderTextColor={Colors.mutedForeground}
      />

      {years.length > 0 && (
        <View style={styles.chips}>
          <Chip
            selected={!yearFilter}
            onPress={() => setYearFilter(null)}
            style={[styles.chip, !yearFilter && styles.chipSelected]}
            textStyle={{ color: !yearFilter ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
            compact
          >
            {t('allYears')}
          </Chip>
          {years.map(year => {
            const active = yearFilter === year
            return (
              <Chip key={year} selected={active} onPress={() => setYearFilter(active ? null : year)}
                style={[styles.chip, active && styles.chipSelected]}
                textStyle={{ color: active ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
                compact>
                {year}
              </Chip>
            )
          })}
        </View>
      )}

      {cities.length > 0 && (
        <View style={styles.chips}>
          <Chip
            selected={!cityFilter}
            onPress={() => setCityFilter(null)}
            style={[styles.chip, !cityFilter && styles.chipSelected]}
            textStyle={{ color: !cityFilter ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
            compact
          >
            {t('allCities')}
          </Chip>
          {cities.map(city => {
            const active = cityFilter === city
            return (
              <Chip key={city} selected={active} onPress={() => setCityFilter(active ? null : city)}
                style={[styles.chip, active && styles.chipSelected]}
                textStyle={{ color: active ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
                compact>
                {city}
              </Chip>
            )
          })}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />}
        />
      )}

      {isAuthenticated && (
        <FAB icon="plus" style={styles.fab} onPress={() => router.push('/(tabs)/balls/create')} color={Colors.primaryForeground} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchbar: { margin: 12, marginBottom: 6, elevation: 0, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 6, gap: 6 },
  chip: { borderRadius: 4, backgroundColor: Colors.muted },
  chipSelected: { backgroundColor: Colors.primary },
  list: { padding: 12, paddingTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: Colors.mutedForeground, textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: Colors.primary },
})
