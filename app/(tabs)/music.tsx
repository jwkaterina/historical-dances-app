import { useState, useCallback } from 'react'
import { resolvePlayUrl } from '@/hooks/useTrackDownload'
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, Searchbar, ActivityIndicator, Snackbar } from 'react-native-paper'
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
  const [playUrl, setPlayUrl] = useState<string | null>(null)

  const { data: allTracks = [], isLoading, refetch, isRefetching } = useMusic()
  const [snackbar, setSnackbar] = useState('')


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

  const handlePress = useCallback(async (item: MusicTrack) => {
    if (currentTrack?.id === item.id) {
      setCurrentTrack(null)
      setPlayUrl(null)
      return
    }
    if (item.audio_url) {
      try {
        const url = await resolvePlayUrl(item.id, item.audio_url)
        setCurrentTrack(item)
        setPlayUrl(url)
      } catch {
        setSnackbar(t('toastNoInternetForPlayback'))
      }
    } else {
      setCurrentTrack(item)
      setPlayUrl(null)
    }
  }, [currentTrack, t])

  const renderItem = useCallback(({ item }: { item: MusicTrack }) => (
    <MusicCard
      track={item}
      isPlaying={currentTrack?.id === item.id}
      language={language}
      onPress={() => handlePress(item)}
    />
  ), [currentTrack, language, handlePress])

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

      {currentTrack && playUrl && (
        <View style={styles.playerContainer}>
          <AudioPlayer
            url={playUrl}
            title={currentTrack.title}
            artist={currentTrack.artist ?? undefined}
            onClose={() => { setCurrentTrack(null); setPlayUrl(null) }}
          />
        </View>
      )}

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={4000}
      >
        {snackbar}
      </Snackbar>
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
