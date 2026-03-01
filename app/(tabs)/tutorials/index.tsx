import { useState, useCallback } from 'react'
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Searchbar, Chip, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTutorials, useTutorialCategories } from '@/hooks/useTutorials'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import type { Tutorial } from '@/types/database'

const TYPE_ICONS: Record<string, string> = {
  video: 'play-circle',
  pdf: 'file-pdf-box',
  image: 'image',
}

export default function TutorialsScreen() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const { data: tutorials = [], isLoading, refetch, isRefetching } = useTutorials()
  const { data: categories = [] } = useTutorialCategories()

  const filtered = tutorials.filter((item: Tutorial) => {
    const title = (language === 'de' ? item.title_de : item.title_ru) ?? ''
    const matchesSearch = !search || title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || item.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  const renderItem = useCallback(({ item }: { item: Tutorial }) => {
    const title = (language === 'de' ? item.title_de : item.title_ru) ?? ''
    const category = item.tutorial_categories
      ? (language === 'de' ? item.tutorial_categories.name_de : item.tutorial_categories.name_ru)
      : null
    const typeLabel = t(('type' + item.type.charAt(0).toUpperCase() + item.type.slice(1)) as any)

    return (
      <View style={styles.item} onTouchEnd={() => router.push(`/(tabs)/tutorials/${item.id}`)}>
        <View style={styles.itemContent}>
          <Text variant="titleSmall" style={styles.itemTitle} numberOfLines={2}>{title}</Text>
          {category ? <Text variant="bodySmall" style={styles.itemCategory}>{category}</Text> : null}
        </View>
        <Chip
          compact
          icon={TYPE_ICONS[item.type] ?? 'file'}
          style={[styles.typeBadge, styles[`type_${item.type}` as keyof typeof styles] as any]}
          textStyle={styles.typeBadgeText}
        >
          {typeLabel}
        </Chip>
      </View>
    )
  }, [language, router])

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchTutorials')}
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={{ color: Colors.foreground }}
        iconColor={Colors.mutedForeground}
        placeholderTextColor={Colors.mutedForeground}
      />

      {categories.length > 0 && (
        <View style={styles.chips}>
          <Chip
            selected={!categoryFilter}
            onPress={() => setCategoryFilter(null)}
            style={[styles.chip, !categoryFilter && styles.chipSelected]}
            textStyle={{ color: !categoryFilter ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
            compact
          >
            {t('allCategories')}
          </Chip>
          {categories.map(cat => {
            const name = language === 'de' ? cat.name_de : cat.name_ru
            const active = categoryFilter === cat.id
            return (
              <Chip
                key={cat.id}
                selected={active}
                onPress={() => setCategoryFilter(active ? null : cat.id)}
                style={[styles.chip, active && styles.chipSelected]}
                textStyle={{ color: active ? Colors.primaryForeground : Colors.mutedForeground, fontSize: 12 }}
                compact
              >
                {name}
              </Chip>
            )
          })}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={styles.emptyText}>{t('noTutorialsFound')}</Text>
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground, marginBottom: 2 },
  itemCategory: { color: Colors.mutedForeground },
  typeBadge: { borderRadius: 4 },
  typeBadgeText: { fontSize: 11 },
  type_video: { backgroundColor: Colors.diffIntermediate + '22' },
  type_pdf: { backgroundColor: Colors.destructive + '22' },
  type_image: { backgroundColor: Colors.diffBeginner + '22' },
})
