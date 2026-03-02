import { useState, useCallback } from 'react'
import { ScrollView, StyleSheet, View, Text as RNText } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, Card, Divider, Button, ActivityIndicator, Snackbar, Chip, List } from 'react-native-paper'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDance, useDeleteDance } from '@/hooks/useDances'
import { useAuth } from '@/hooks/useAuth'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import AudioPlayer from '@/components/AudioPlayer'
import VideoPlayer from '@/components/VideoPlayer'
import ConfirmDialog from '@/components/ConfirmDialog'
import type { DanceVideo, DanceFigure, MusicTrack, Tutorial } from '@/types/database'


export default function DanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [snackbar, setSnackbar] = useState('')
  const [expandedFigures, setExpandedFigures] = useState<Set<string>>(new Set())

  const toggleFigure = useCallback((id: string) => {
    setExpandedFigures(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const { data: dance, isLoading } = useDance(id)
  const deleteMutation = useDeleteDance()

  const name = dance ? ((language === 'de' ? dance.name_de : dance.name_ru) ?? dance.name ?? '') : ''

  const headerOptions = {
    title: name,
    headerShown: true,
    headerStyle: { backgroundColor: Colors.foreground },
    headerTintColor: Colors.background,
    headerShadowVisible: false,
    headerTitle: ({ children, tintColor }: any) => (
      <RNText style={{ fontFamily: Fonts.heading, color: tintColor ?? Colors.background, fontSize: 17 }}>{children}</RNText>
    ),
  }

  if (isLoading) return (
    <>
      <Stack.Screen options={headerOptions} />
      <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
    </>
  )
  if (!dance) return (
    <>
      <Stack.Screen options={headerOptions} />
      <View style={styles.center}><Text style={{ color: Colors.mutedForeground }}>{t('noDancesFound')}</Text></View>
    </>
  )
  const description = (language === 'de' ? dance.description_de : dance.description_ru) ?? dance.description ?? ''
  const scheme = (language === 'de' ? dance.scheme_de : dance.scheme_ru) ?? dance.scheme ?? ''
  const videos = [...(dance.dance_videos ?? [])].sort((a, b) => a.order_index - b.order_index)
  const figures = [...(dance.dance_figures ?? [])].sort((a, b) => a.order_index - b.order_index)
  const musicTracks = (dance.dance_music ?? []).map((dm: any) => dm.music).filter(Boolean) as MusicTrack[]
  const tutorials = (dance.dance_tutorials ?? []).map((dt: any) => dt.tutorials).filter(Boolean) as Tutorial[]

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync(dance.id)
    if (!result.success) { setSnackbar(result.message ?? t('toastFailedDeleteDance')); setShowDelete(false); return }
    router.back()
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>{name}</Text>

        <View style={styles.meta}>
          {dance.difficulty && (
            <Chip style={styles.badge} textStyle={styles.badgeText}>
              {t(dance.difficulty as any)}
            </Chip>
          )}
          {dance.origin && <Text variant="bodySmall" style={styles.origin}>{t('origin')}: {dance.origin}</Text>}
        </View>

        {videos.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>{t('watchVideo')}</Text>
            <Divider style={styles.divider} />
            {videos.map((video: DanceVideo) => <VideoPlayer key={video.id} video={video} style={styles.videoPlayer} />)}
          </View>
        )}

        {description ? (
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>{t('description')}</Text>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.bodyText}>{description}</Text>
          </View>
        ) : null}

        {scheme ? (
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>{t('scheme')}</Text>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.schemeText}>{scheme}</Text>
          </View>
        ) : null}

        {figures.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>{t('figures')}</Text>
            <Divider style={styles.divider} />
            {figures.map((figure: DanceFigure, idx: number) => {
              const figScheme = (language === 'de' ? figure.scheme_de : figure.scheme_ru) ?? ''
              const figVideos = [...(figure.figure_videos ?? [])].sort((a, b) => a.order_index - b.order_index)
              const expanded = expandedFigures.has(figure.id)
              const hasContent = !!figScheme || figVideos.length > 0
              return (
                <Card key={figure.id} style={styles.figureCard} mode="outlined">
                  <List.Accordion
                    title={`${t('figure')} ${idx + 1}`}
                    expanded={expanded}
                    onPress={() => toggleFigure(figure.id)}
                    titleStyle={styles.figureTitle}
                    style={styles.figureAccordion}
                    right={props => hasContent
                      ? <List.Icon {...props} icon={expanded ? 'chevron-up' : 'chevron-down'} color={Colors.mutedForeground} />
                      : null}
                  >
                    <View style={styles.figureContent}>
                      {figScheme ? <Text variant="bodyMedium" style={styles.schemeText}>{figScheme}</Text> : null}
                      {figVideos.map(v => <VideoPlayer key={v.id} video={v} style={styles.videoPlayer} />)}
                      {!hasContent && <Text variant="bodySmall" style={styles.emptyText}>—</Text>}
                    </View>
                  </List.Accordion>
                </Card>
              )
            })}
          </View>
        )}

        {tutorials.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>{t('tutorials')}</Text>
            <Divider style={styles.divider} />
            {tutorials.map((tut: Tutorial) => {
              const title = (language === 'de' ? tut.title_de : tut.title_ru) ?? ''
              const icon = tut.type === 'pdf' ? 'file-pdf-box' : tut.type === 'image' ? 'image' : 'play-circle-outline'
              return (
                <Card key={tut.id} style={styles.tutorialCard} mode="outlined"
                  onPress={() => router.push({ pathname: '/webview', params: { url: encodeURIComponent(tut.url), title } })}>
                  <Card.Content style={styles.tutorialRow}>
                    <Chip compact style={styles.typeBadge} textStyle={styles.typeBadgeText}>
                      {tut.type}
                    </Chip>
                    <Text variant="bodyMedium" style={styles.tutorialTitle} numberOfLines={2}>{title}</Text>
                    <Button compact icon={icon} mode="text" textColor={Colors.primary}
                      onPress={() => router.push({ pathname: '/webview', params: { url: encodeURIComponent(tut.url), title } })}>
                      {t('open')}
                    </Button>
                  </Card.Content>
                </Card>
              )
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>{t('associatedMusic')}</Text>
          <Divider style={styles.divider} />
          {musicTracks.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>{t('noMusicAssociated')}</Text>
          ) : musicTracks.map((track: MusicTrack) => (
            <Card key={track.id} style={styles.musicCard} mode="outlined"
              onPress={() => setCurrentTrack(t => t?.id === track.id ? null : track)}>
              <Card.Content style={styles.musicCardContent}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall" style={styles.musicTitle}>{track.title}</Text>
                  {track.artist && <Text variant="bodySmall" style={styles.musicArtist}>{track.artist}</Text>}
                  {track.tempo && <Text variant="bodySmall" style={styles.musicMeta}>{track.tempo} BPM</Text>}
                </View>
                <Text style={{ fontSize: 20 }}>{currentTrack?.id === track.id ? '⏸' : '▶'}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {isAuthenticated && (
          <View style={styles.actions}>
            <Button mode="outlined" icon="pencil" onPress={() => router.push(`/dance/edit/${dance.id}`)}
              style={styles.actionBtn} textColor={Colors.primary}>
              {t('edit')}
            </Button>
            <Button mode="outlined" icon="delete" textColor={Colors.destructive}
              onPress={() => setShowDelete(true)} style={styles.actionBtn}>
              {t('deleteDance')}
            </Button>
          </View>
        )}
      </ScrollView>

      {currentTrack?.audio_url && (
        <View style={[styles.playerContainer, { paddingBottom: insets.bottom }]}>
          <AudioPlayer url={currentTrack.audio_url} title={currentTrack.title}
            artist={currentTrack.artist ?? undefined} onClose={() => setCurrentTrack(null)} />
        </View>
      )}

      <ConfirmDialog visible={showDelete} title={t('confirmDelete')} message={t('deleteConfirmMessage')}
        onConfirm={handleDelete} onDismiss={() => setShowDelete(false)} loading={deleteMutation.isPending} />
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={5000}>{snackbar}</Snackbar>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: Fonts.heading, color: Colors.foreground, marginBottom: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 },
  badge: { borderRadius: 6, backgroundColor: Colors.secondary },
  badgeText: { color: Colors.secondaryForeground, fontSize: 12, fontFamily: 'Lora_600SemiBold' },
  origin: { color: Colors.mutedForeground },
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.mutedForeground, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  divider: { backgroundColor: Colors.border, marginBottom: 10 },
  bodyText: { color: Colors.foreground, lineHeight: 22 },
  schemeText: { color: Colors.foreground, backgroundColor: Colors.muted, padding: 12, borderRadius: 6, lineHeight: 22, fontFamily: 'monospace' },
  videoPlayer: { marginBottom: 8 },
  figureCard: { marginBottom: 8, backgroundColor: Colors.card, borderColor: Colors.border, overflow: 'hidden' },
  figureAccordion: { backgroundColor: Colors.card, paddingVertical: 0 },
  figureTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground, fontSize: 14 },
  figureContent: { paddingHorizontal: 16, paddingBottom: 12 },
  musicCard: { marginBottom: 8, backgroundColor: Colors.card, borderColor: Colors.border },
  musicCardContent: { flexDirection: 'row', alignItems: 'center' },
  musicTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground },
  musicArtist: { color: Colors.mutedForeground },
  musicMeta: { color: Colors.mutedForeground },
  emptyText: { color: Colors.mutedForeground, fontStyle: 'italic' },
  tutorialCard: { marginBottom: 8, backgroundColor: Colors.card, borderColor: Colors.border },
  tutorialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  tutorialTitle: { flex: 1, color: Colors.foreground, fontFamily: Fonts.body },
  typeBadge: { backgroundColor: Colors.secondary, borderRadius: 4 },
  typeBadgeText: { color: Colors.secondaryForeground, fontSize: 11, fontFamily: Fonts.body },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, borderColor: Colors.border },
  playerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 8 },
})
