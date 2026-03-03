import { useState, useCallback } from 'react'
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMusic } from '@/hooks/useMusic'
import { Colors } from '@/lib/colors'
import MusicCard from '@/components/MusicCard'
import AudioPlayer from '@/components/AudioPlayer'
import type { MusicTrack } from '@/types/database'

export default function MusicScreen() {
  const { t, language } = useLanguage()
  const [search, setSearch] = useState('')
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)

  const { data: allTracks = [], isLoading, refetch, isRefetching } = useMusic()

  const tracks = allTracks.filter(track => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    if (track.title.toLowerCase().includes(term)) return true
    if (track.artist?.toLowerCase().includes(term)) return true
    return (track.dance_music ?? []).some(dm => {
      const d = dm.dances
      if (!d) return false
      return (d.name_de ?? '').toLowerCase().includes(term) ||
             (d.name_ru ?? '').toLowerCase().includes(term)
    })
  })

  const renderItem = useCallback(({ item }: { item: MusicTrack }) => (
    <MusicCard
      track={item}
      isPlaying={currentTrack?.id === item.id}
      language={language}
      onPress={() => setCurrentTrack(prev => prev?.id === item.id ? null : item)}
    />
  ), [currentTrack, language])

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchMusic')}
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={{ color: Colors.foreground }}
        iconColor={Colors.mutedForeground}
        placeholderTextColor={Colors.mutedForeground}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
      ) : tracks.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {search ? `${t('noMusicForQuery')} "${search}"` : t('noMusicFound')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={currentTrack ? { paddingBottom: 100 } : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />}
        />
      )}

      {currentTrack?.audio_url && (
        <View style={styles.playerContainer}>
          <AudioPlayer
            url={currentTrack.audio_url}
            title={currentTrack.title}
            artist={currentTrack.artist ?? undefined}
            onClose={() => setCurrentTrack(null)}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchbar: { margin: 12, elevation: 0, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 6 },
  list: { padding: 0, paddingTop: 4, paddingBottom: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: Colors.mutedForeground, textAlign: 'center' },
  playerContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
})
