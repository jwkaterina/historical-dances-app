import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text, Card, Divider, Button, ActivityIndicator, Snackbar } from 'react-native-paper'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDance, useDeleteDance } from '@/hooks/useDances'
import { useAuth } from '@/hooks/useAuth'
import AudioPlayer from '@/components/AudioPlayer'
import VideoPlayer from '@/components/VideoPlayer'
import ConfirmDialog from '@/components/ConfirmDialog'
import type { DanceVideo, DanceFigure, MusicTrack } from '@/types/database'

export default function DanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [snackbar, setSnackbar] = useState('')

  const { data: dance, isLoading } = useDance(id)
  const deleteMutation = useDeleteDance()

  if (isLoading) {
    return <ActivityIndicator style={styles.center} size="large" />
  }

  if (!dance) {
    return (
      <View style={styles.center}>
        <Text>{t('noDancesFound')}</Text>
      </View>
    )
  }

  const name = (language === 'de' ? dance.name_de : dance.name_ru) ?? dance.name ?? ''
  const description = (language === 'de' ? dance.description_de : dance.description_ru) ?? dance.description ?? ''
  const scheme = (language === 'de' ? dance.scheme_de : dance.scheme_ru) ?? dance.scheme ?? ''
  const videos = [...(dance.dance_videos ?? [])].sort((a, b) => a.order_index - b.order_index)
  const figures = [...(dance.dance_figures ?? [])].sort((a, b) => a.order_index - b.order_index)
  const musicTracks = (dance.dance_music ?? []).map((dm: any) => dm.music).filter(Boolean) as MusicTrack[]

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync(dance.id)
    if (!result.success) {
      setSnackbar(result.message ?? t('toastFailedDeleteDance'))
      setShowDelete(false)
      return
    }
    router.back()
  }

  return (
    <>
      <Stack.Screen options={{ title: name, headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>{name}</Text>

        <View style={styles.meta}>
          {dance.difficulty && (
            <Text variant="bodySmall" style={styles.badge}>{t(dance.difficulty as any)}</Text>
          )}
          {dance.origin && (
            <Text variant="bodySmall" style={styles.origin}>{t('origin')}: {dance.origin}</Text>
          )}
        </View>

        {videos.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>{t('watchVideo')}</Text>
            {videos.map((video: DanceVideo) => (
              <VideoPlayer key={video.id} video={video} style={styles.videoPlayer} />
            ))}
          </View>
        )}

        {description ? (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>{t('description')}</Text>
            <Text variant="bodyMedium" style={styles.bodyText}>{description}</Text>
          </View>
        ) : null}

        {scheme ? (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>{t('scheme')}</Text>
            <Text variant="bodyMedium" style={[styles.bodyText, styles.schemeText]}>{scheme}</Text>
          </View>
        ) : null}

        {figures.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>{t('figures')}</Text>
            {figures.map((figure: DanceFigure, idx: number) => {
              const figScheme = (language === 'de' ? figure.scheme_de : figure.scheme_ru) ?? ''
              const figVideos = [...(figure.videos ?? [])].sort((a, b) => a.order_index - b.order_index)
              return (
                <Card key={figure.id} style={styles.figureCard} mode="outlined">
                  <Card.Content>
                    <Text variant="titleSmall" style={styles.figureTitle}>{t('figure')} {idx + 1}</Text>
                    {figScheme ? <Text variant="bodyMedium" style={styles.schemeText}>{figScheme}</Text> : null}
                    {figVideos.map(v => (
                      <VideoPlayer key={v.id} video={v} style={styles.videoPlayer} />
                    ))}
                  </Card.Content>
                </Card>
              )
            })}
          </View>
        )}

        {musicTracks.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>{t('associatedMusic')}</Text>
            {musicTracks.map((track: MusicTrack) => (
              <Card key={track.id} style={styles.musicCard} mode="outlined" onPress={() => setCurrentTrack(t => t?.id === track.id ? null : track)}>
                <Card.Content>
                  <Text variant="titleSmall">{track.title}</Text>
                  {track.artist && <Text variant="bodySmall" style={{ opacity: 0.7 }}>{track.artist}</Text>}
                  {track.tempo && <Text variant="bodySmall" style={{ opacity: 0.7 }}>{track.tempo} BPM</Text>}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {musicTracks.length === 0 && (
          <View style={styles.section}>
            <Text variant="bodyMedium" style={styles.emptyText}>{t('noMusicAssociated')}</Text>
          </View>
        )}

        {isAuthenticated && (
          <View style={styles.actions}>
            <Button mode="outlined" icon="pencil" onPress={() => router.push(`/dance/edit/${dance.id}`)} style={styles.actionBtn}>
              {t('edit')}
            </Button>
            <Button mode="outlined" icon="delete" textColor="red" onPress={() => setShowDelete(true)} style={styles.actionBtn}>
              {t('deleteDance')}
            </Button>
          </View>
        )}
      </ScrollView>

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

      <ConfirmDialog
        visible={showDelete}
        title={t('confirmDelete')}
        message={t('deleteConfirmMessage')}
        onConfirm={handleDelete}
        onDismiss={() => setShowDelete(false)}
        loading={deleteMutation.isPending}
      />
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={5000}>{snackbar}</Snackbar>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge: { backgroundColor: '#e8def8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  origin: { opacity: 0.7 },
  section: { marginBottom: 24 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  bodyText: { lineHeight: 22, opacity: 0.85 },
  schemeText: { fontFamily: 'monospace', backgroundColor: '#f0edf6', padding: 12, borderRadius: 8, lineHeight: 22 },
  videoPlayer: { marginBottom: 12, borderRadius: 8, overflow: 'hidden' },
  figureCard: { marginBottom: 12 },
  figureTitle: { fontWeight: 'bold', marginBottom: 4 },
  musicCard: { marginBottom: 8, backgroundColor: '#fff' },
  emptyText: { opacity: 0.5, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8, justifyContent: 'center' },
  actionBtn: { flex: 1 },
  playerContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    elevation: 8,
  },
})
