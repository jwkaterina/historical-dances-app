import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native'
import { Text, Card, Divider, Button, ActivityIndicator, Chip, Icon } from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { format } from 'date-fns'
import { useState, useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBall, useDeleteBall, useDancesForBall } from '@/hooks/useBalls'
import { useAuth } from '@/hooks/useAuth'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import ConfirmDialog from '@/components/ConfirmDialog'
import DownloadButton from '@/components/DownloadButton'
import { useAudioPlayer, PLAYER_HEIGHT } from '@/contexts/AudioPlayerContext'
import type { BallSection, SectionDance, SectionText, MusicTrack } from '@/types/database'

type SectionEntry =
  | { type: 'dance'; data: SectionDance; order_index: number }
  | { type: 'text'; data: SectionText; order_index: number }

function buildEntries(section: BallSection): SectionEntry[] {
  const danceEntries: SectionEntry[] = (section.section_dances || []).map(d => ({ type: 'dance', data: d, order_index: d.order_index }))
  const textEntries: SectionEntry[] = (section.section_texts || []).map(t => ({ type: 'text', data: t, order_index: t.order_index }))
  return [...danceEntries, ...textEntries].sort((a, b) => a.order_index - b.order_index)
}


export default function BallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const { currentTrack, play } = useAudioPlayer()

  const { data: ball, isLoading, isError } = useBall(id)
  const deleteMutation = useDeleteBall()
  const { data: dances = [] } = useDancesForBall()

  const trackById = useMemo(() => {
    const map: Record<string, MusicTrack> = {}
    ;(dances as any[]).forEach(dance => {
      ;(dance.musicTracks ?? []).forEach((t: MusicTrack) => { map[t.id] = t })
    })
    return map
  }, [dances])


  if (isLoading) return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
  if (isError && !ball) return <View style={styles.center}><Text style={{ color: Colors.mutedForeground, textAlign: 'center', padding: 24 }}>{t('dataUnavailableOffline')}</Text></View>
  if (!ball) return <View style={styles.center}><Text style={{ color: Colors.mutedForeground }}>{t('ballNotFound')}</Text></View>

  const name = (language === 'de' ? ball.name_de : ball.name_ru) ?? ball.name ?? ''
  const place = (language === 'de' ? ball.place_de : ball.place_ru) ?? ball.place ?? ''
  const formattedDate = ball.date ? format(new Date(ball.date), 'dd.MM.yyyy') : ''
  const sections = [...(ball.ball_sections || [])].sort((a, b) => a.order_index - b.order_index)
  const rawInfo = language === 'de' ? ball.info_de : ball.info_ru

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(ball.id)
    router.back()
  }

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, currentTrack && { paddingBottom: PLAYER_HEIGHT + 48 }]}>
      <Text variant="headlineMedium" style={styles.title}>{name}</Text>

      <View style={styles.meta}>
        {formattedDate ? <Text variant="bodySmall" style={styles.metaText}>{formattedDate}</Text> : null}
        {place ? <Text variant="bodySmall" style={styles.metaText}>{place}</Text> : null}
      </View>

      {rawInfo ? (
        <TouchableOpacity style={styles.infoLink} onPress={() => router.push({ pathname: '/ball-info', params: { id: ball.id } })}>
          <Icon source="information-outline" size={20} color={Colors.primary} />
          <Text variant="bodyMedium" style={styles.infoLinkText}>{t('ballRules')}</Text>
          <Icon source="chevron-right" size={20} color={Colors.mutedForeground} />
        </TouchableOpacity>
      ) : null}

      {sections.map(section => {
        const sectionName = (language === 'de' ? section.name_de : section.name_ru) ?? section.name ?? ''
        const entries = buildEntries(section)
        let danceCount = 0
        return (
          <View key={section.id} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>{sectionName}</Text>
            <Divider style={styles.divider} />
            {entries.map((entry, idx) => {
              if (entry.type === 'dance') {
                danceCount++
                const num = danceCount
                const sd = entry.data as SectionDance
                const dance = sd.dances
                const danceName = dance ? (language === 'de' ? dance.name_de : dance.name_ru) ?? dance.name ?? '' : '—'
                const musicIds = sd.music_ids ?? []
                const tracks = musicIds.map(tid => trackById[tid]).filter(Boolean) as MusicTrack[]
                return (
                  <View key={idx}>
                    <View style={styles.entryRow}>
                      <View style={styles.entryNum}>
                        <Text variant="bodySmall" style={styles.num}>{num}</Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.danceName}
                        onPress={() => dance && router.push(`/dances/${dance.id}`)}>
                        {danceName}
                      </Text>
                    </View>
                    {tracks.length > 0 && (
                      <View style={styles.musicRow}>
                        {tracks.map(track => {
                          const isActive = currentTrack?.id === track.id
                          return (
                            <View key={track.id} style={styles.trackChipRow}>
                              <Chip
                                compact
                                icon={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                                selected={isActive}
                                onPress={() => play(track)}
                                style={[styles.musicChip, isActive && styles.musicChipActive]}
                                textStyle={{ fontSize: 11, color: isActive ? Colors.primaryForeground : Colors.mutedForeground }}
                              >
                                {track.title}
                              </Chip>
                              <DownloadButton trackId={track.id} audioUrl={track.audio_url ?? null} />
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </View>
                )
              } else {
                const textData = entry.data as SectionText
                const content = (language === 'de' ? textData.content_de : textData.content_ru) ?? ''
                return (
                  <Card key={idx} style={styles.textCard} mode="outlined">
                    <Card.Content>
                      <Text variant="bodySmall" style={styles.textContent}>{content}</Text>
                    </Card.Content>
                  </Card>
                )
              }
            })}
          </View>
        )
      })}

      {isAuthenticated && (
        <View style={styles.actions}>
          <Button mode="outlined" icon="pencil"
            onPress={() => router.push(`/(tabs)/balls/create?edit=${ball.id}`)}
            style={styles.actionBtn} textColor={Colors.primary}
            contentStyle={{ borderColor: Colors.border }}>
            {t('edit')}
          </Button>
          <Button mode="outlined" icon="delete" textColor={Colors.destructive}
            onPress={() => setShowDelete(true)} style={styles.actionBtn}>
            {t('deleteBall')}
          </Button>
        </View>
      )}

      <ConfirmDialog
        visible={showDelete}
        title={t('deleteConfirmBall')}
        message={t('deleteConfirmMessageBall')}
        onConfirm={handleDelete}
        onDismiss={() => setShowDelete(false)}
        loading={deleteMutation.isPending}
      />
    </ScrollView>
</>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: Fonts.heading, color: Colors.foreground, marginBottom: 8 },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaText: { color: Colors.mutedForeground },
  infoLink: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  infoLinkText: { flex: 1, color: Colors.primary },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground, marginBottom: 4 },
  divider: { marginBottom: 8, backgroundColor: Colors.border },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  entryNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  num: { color: Colors.primaryForeground, fontFamily: Fonts.heading, fontSize: 11 },
  danceName: { flex: 1, color: '#3d2b1f', fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  musicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 34, paddingBottom: 6 },
  trackChipRow: { flexDirection: 'row', alignItems: 'center' },
  musicChip: { borderRadius: 4, backgroundColor: Colors.muted },
  musicChipActive: { backgroundColor: Colors.primary },
  textCard: { marginVertical: 4, backgroundColor: Colors.cardSecondary, borderColor: Colors.border },
  textContent: { color: Colors.mutedForeground },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, justifyContent: 'center' },
  actionBtn: { flex: 1, borderColor: Colors.border },
})
