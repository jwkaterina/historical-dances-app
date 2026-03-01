import { useState, useCallback, useRef } from 'react'
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMusic } from '@/hooks/useMusic'
import MusicCard from '@/components/MusicCard'
import AudioPlayer from '@/components/AudioPlayer'
import type { MusicTrack } from '@/types/database'

export default function MusicScreen() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)

  const { data: tracks = [], isLoading, refetch, isRefetching } = useMusic(search)

  const renderItem = useCallback(({ item }: { item: MusicTrack }) => (
    <MusicCard
      track={item}
      isPlaying={currentTrack?.id === item.id}
      onPress={() => setCurrentTrack(prev => prev?.id === item.id ? null : item)}
    />
  ), [currentTrack])

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchMusic')}
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.center} size="large" />
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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}

      {currentTrack && currentTrack.audio_url && (
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
  container: { flex: 1, backgroundColor: '#f6f5f5' },
  searchbar: { margin: 12, elevation: 0 },
  list: { padding: 12, paddingTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { opacity: 0.6, textAlign: 'center' },
  playerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
})
