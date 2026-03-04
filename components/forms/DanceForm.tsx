import { useEffect, useState } from 'react'
import { Modal, FlatList, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, SegmentedButtons, Card, IconButton, Snackbar, ActivityIndicator, Menu, Divider, Searchbar, List, Icon } from 'react-native-paper'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  useDance, useCreateDance, useUpdateDance,
  useSyncDanceVideos, useSyncDanceFigures, useSyncDanceMusicLinks,
  useDanceTutorials, useSyncDanceTutorials,
} from '@/hooks/useDances'
import { useMusic } from '@/hooks/useMusic'
import { useTutorials } from '@/hooks/useTutorials'
import { createMusicTrack } from '@/lib/api/music'
import { uploadFile, generateFileName } from '@/lib/upload'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import type { Tutorial } from '@/types/database'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const

interface VideoEntry {
  id?: string
  video_type: 'youtube' | 'uploaded'
  url: string
  localUri?: string
  mimeType?: string
}

interface FigureEntry {
  scheme_de: string
  scheme_ru: string
  videoType: 'youtube' | 'uploaded'
  videoUrl: string
  videoLocalUri?: string
  videoMimeType?: string
}

interface MusicEntry {
  id?: string
  title: string
  artist: string
  tempo: string
  audioUrl: string
  audioLocalUri?: string
  audioMimeType?: string
}

interface Props {
  danceId?: string
}

export default function DanceForm({ danceId }: Props) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const isEdit = !!danceId

  // Data queries
  const { data: existing, isLoading } = useDance(danceId ?? '')
  const { data: allTutorials = [] } = useTutorials()
  const { data: danceTutorialIds = [] } = useDanceTutorials(danceId ?? '')
  const { data: allMusic = [] } = useMusic()

  // Mutations
  const createDance = useCreateDance()
  const updateDance = useUpdateDance()
  const syncVideos = useSyncDanceVideos()
  const syncFigures = useSyncDanceFigures()
  const syncMusicLinks = useSyncDanceMusicLinks()
  const syncTutorials = useSyncDanceTutorials()

  // Core fields
  const [nameDe, setNameDe] = useState('')
  const [nameRu, setNameRu] = useState('')
  const [descDe, setDescDe] = useState('')
  const [descRu, setDescRu] = useState('')
  const [schemeDe, setSchemeDe] = useState('')
  const [schemeRu, setSchemeRu] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [diffMenuVisible, setDiffMenuVisible] = useState(false)

  // Videos — unified list (youtube + uploaded)
  const [videos, setVideos] = useState<VideoEntry[]>([])
  const [newVideoType, setNewVideoType] = useState<'youtube' | 'uploaded'>('youtube')
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('')

  // Figures
  const [figures, setFigures] = useState<FigureEntry[]>([])
  const [expandedFigures, setExpandedFigures] = useState<Set<number>>(new Set())

  const toggleFigure = (idx: number) => {
    setExpandedFigures(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  // Tutorials
  const [selectedTutorials, setSelectedTutorials] = useState<Tutorial[]>([])
  const [showTutorialPicker, setShowTutorialPicker] = useState(false)
  const [tutorialSearch, setTutorialSearch] = useState('')

  // Music
  const [music, setMusic] = useState<MusicEntry[]>([])
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const [musicSearch, setMusicSearch] = useState('')

  // Form state
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  // Load existing dance
  useEffect(() => {
    if (existing) {
      setNameDe(existing.name_de ?? '')
      setNameRu(existing.name_ru ?? '')
      setDescDe(existing.description_de ?? '')
      setDescRu(existing.description_ru ?? '')
      setSchemeDe(existing.scheme_de ?? '')
      setSchemeRu(existing.scheme_ru ?? '')
      setDifficulty(existing.difficulty ?? '')

      setVideos(
        [...(existing.dance_videos ?? [])].sort((a, b) => a.order_index - b.order_index)
          .map(v => ({ id: v.id, video_type: v.video_type, url: v.url }))
      )

      setFigures(
        [...(existing.dance_figures ?? [])].sort((a, b) => a.order_index - b.order_index)
          .map(f => {
            const firstVideo = [...(f.figure_videos ?? [])].sort((a, b) => a.order_index - b.order_index)[0]
            return {
              scheme_de: f.scheme_de ?? '',
              scheme_ru: f.scheme_ru ?? '',
              videoType: (firstVideo?.video_type ?? 'youtube') as 'youtube' | 'uploaded',
              videoUrl: firstVideo?.url ?? '',
            }
          })
      )

      setMusic(
        (existing.dance_music ?? []).map((dm: any) => ({
          id: dm.music.id,
          title: dm.music.title ?? '',
          artist: dm.music.artist ?? '',
          tempo: dm.music.tempo?.toString() ?? '',
          audioUrl: dm.music.audio_url ?? '',
        }))
      )
    }
  }, [existing])

  // Load existing tutorial links
  useEffect(() => {
    if (danceTutorialIds.length > 0 && allTutorials.length > 0) {
      const linked = danceTutorialIds
        .map((id: string) => allTutorials.find(t => t.id === id))
        .filter(Boolean) as Tutorial[]
      setSelectedTutorials(linked)
    }
  }, [danceTutorialIds, allTutorials])

  const pickVideoFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/*'] })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setVideos(prev => [...prev, {
        video_type: 'uploaded',
        url: asset.name ?? 'video',
        localUri: asset.uri,
        mimeType: asset.mimeType ?? 'video/mp4',
      }])
    }
  }

  const addYoutubeVideo = () => {
    const url = newYoutubeUrl.trim()
    if (!url) return
    setVideos(prev => [...prev, { video_type: 'youtube', url }])
    setNewYoutubeUrl('')
  }

  const addFigure = () => {
    setExpandedFigures(prev => { const next = new Set(prev); next.add(figures.length); return next })
    setFigures(prev => [...prev, { scheme_de: '', scheme_ru: '', videoType: 'youtube', videoUrl: '' }])
  }

  const updateFigure = (idx: number, updates: Partial<FigureEntry>) => {
    setFigures(prev => prev.map((f, i) => i === idx ? { ...f, ...updates } : f))
  }

  const pickFigureVideo = async (idx: number) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/*'] })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      updateFigure(idx, {
        videoUrl: asset.name ?? 'video',
        videoLocalUri: asset.uri,
        videoMimeType: asset.mimeType ?? 'video/mp4',
      })
    }
  }

  const updateMusic = (idx: number, field: keyof MusicEntry, value: string) => {
    setMusic(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }

  const pickAudio = async (idx: number) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*'] })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setMusic(prev => prev.map((m, i) => i === idx ? {
        ...m,
        audioUrl: asset.name ?? 'audio',
        audioLocalUri: asset.uri,
        audioMimeType: asset.mimeType ?? 'audio/mpeg',
      } : m))
    }
  }

  const handleSubmit = async () => {
    if (!nameDe || !nameRu) { setError(t('toastNameRequiredBothLanguages')); return }
    const danceData = {
      name: nameDe, name_de: nameDe, name_ru: nameRu,
      description_de: descDe || null, description_ru: descRu || null,
      scheme_de: schemeDe || null, scheme_ru: schemeRu || null,
      difficulty: (difficulty as any) || null,
    }
    let step = ''
    try {
      setUploading(true)

      // Upload figure video files
      step = 'upload figure videos'
      const resolvedFigures = await Promise.all(figures.map(async (f) => {
        if (f.videoLocalUri && f.videoMimeType) {
          const ext = f.videoMimeType.split('/')[1] ?? 'mp4'
          const videoUrl = await uploadFile('videos', generateFileName('figure', ext), f.videoLocalUri, f.videoMimeType)
          return { ...f, videoUrl, videoType: 'uploaded' as const }
        }
        return f
      }))

      // Upload new video files, keep existing ones as-is
      step = 'upload dance videos'
      const allVideos = await Promise.all(videos.map(async (v) => {
        if (v.localUri && v.mimeType) {
          const ext = v.mimeType.split('/')[1] ?? 'mp4'
          const url = await uploadFile('videos', generateFileName('video', ext), v.localUri, v.mimeType)
          return { id: v.id, video_type: 'uploaded' as const, url }
        }
        return { id: v.id, video_type: v.video_type, url: v.url }
      }))

      let finalDanceId: string
      if (isEdit && danceId) {
        step = 'update dance'
        await updateDance.mutateAsync({ id: danceId, data: danceData })
        finalDanceId = danceId
      } else {
        step = 'create dance'
        const created = await createDance.mutateAsync(danceData)
        finalDanceId = created.id
      }

      step = 'sync videos'
      await syncVideos.mutateAsync({ danceId: finalDanceId, videos: allVideos })

      step = 'sync figures'
      await syncFigures.mutateAsync({
        danceId: finalDanceId,
        figures: resolvedFigures.map(f => ({
          scheme_de: f.scheme_de,
          scheme_ru: f.scheme_ru,
          videoType: f.videoType,
          videoUrl: f.videoUrl,
        })),
      })

      step = 'sync tutorials'
      await syncTutorials.mutateAsync({
        danceId: finalDanceId,
        tutorialIds: selectedTutorials.map(t => t.id),
      })

      step = 'upload audio'
      const resolvedMusic = await Promise.all(music.map(async (m) => {
        if (m.id) return m
        if (m.audioLocalUri && m.audioMimeType) {
          const ext = m.audioMimeType.split('/')[1] ?? 'mp3'
          const audioUrl = await uploadFile('audio', generateFileName('audio', ext), m.audioLocalUri, m.audioMimeType)
          return { ...m, audioUrl }
        }
        return m
      }))

      step = 'create music tracks'
      const musicIds = await Promise.all(resolvedMusic.map(async (m) => {
        if (m.id) return m.id
        const track = await createMusicTrack({
          title: m.title || 'Untitled',
          artist: m.artist || null,
          tempo: m.tempo ? parseInt(m.tempo, 10) : null,
          audio_url: m.audioUrl || null,
        })
        return track.id
      }))

      step = 'sync music links'
      await syncMusicLinks.mutateAsync({ danceId: finalDanceId, musicIds })
      router.back()
    } catch (e: any) {
      setError(`[${step}] ${e.message ?? t('error')}`)
    } finally {
      setUploading(false)
    }
  }

  if (isEdit && isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />

  const isSaving = uploading || createDance.isPending || updateDance.isPending ||
    syncVideos.isPending || syncFigures.isPending || syncMusicLinks.isPending || syncTutorials.isPending

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.primary,
    textColor: Colors.foreground,
    style: styles.input,
  }

  const filteredTutorials = allTutorials.filter(tut => {
    if (!tutorialSearch) return true
    const title = (language === 'de' ? tut.title_de : tut.title_ru) ?? ''
    return title.toLowerCase().includes(tutorialSearch.toLowerCase())
  })

  const filteredMusic = allMusic.filter(track => {
    if (!musicSearch) return true
    const term = musicSearch.toLowerCase()
    return track.title.toLowerCase().includes(term) || (track.artist ?? '').toLowerCase().includes(term)
  })

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* DE block */}
        <View style={styles.langBlock}>
          <Text style={styles.langLabel}>DE</Text>
          <TextInput label={t('danceName')} value={nameDe} onChangeText={setNameDe} {...inputProps} />
          <TextInput label={t('descriptionLabel')} value={descDe} onChangeText={setDescDe}
            multiline numberOfLines={3} {...inputProps} />
          <TextInput label={t('schemeLabel')} value={schemeDe} onChangeText={setSchemeDe}
            multiline {...inputProps} style={[styles.input, styles.schemeInput]} />
        </View>

        <Divider style={styles.divider} />

        {/* RU block */}
        <View style={styles.langBlock}>
          <Text style={styles.langLabel}>RU</Text>
          <TextInput label={t('danceName')} value={nameRu} onChangeText={setNameRu} {...inputProps} />
          <TextInput label={t('descriptionLabel')} value={descRu} onChangeText={setDescRu}
            multiline numberOfLines={3} {...inputProps} />
          <TextInput label={t('schemeLabel')} value={schemeRu} onChangeText={setSchemeRu}
            multiline {...inputProps} style={[styles.input, styles.schemeInput]} />
        </View>

        <Divider style={styles.divider} />

        {/* Difficulty */}
        <Text style={styles.fieldLabel}>{t('difficulty')}</Text>
        <Menu
          visible={diffMenuVisible}
          onDismiss={() => setDiffMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setDiffMenuVisible(true)}
              style={styles.menuBtn} textColor={difficulty ? Colors.foreground : Colors.mutedForeground}>
              {difficulty ? t(difficulty as any) : t('selectDifficulty')}
            </Button>
          }
        >
          <Menu.Item title={t('selectDifficulty')} onPress={() => { setDifficulty(''); setDiffMenuVisible(false) }}
            titleStyle={{ color: Colors.mutedForeground }} />
          {DIFFICULTIES.map(d => (
            <Menu.Item key={d} title={t(d)} onPress={() => { setDifficulty(d); setDiffMenuVisible(false) }}
              titleStyle={{ color: Colors.foreground }} />
          ))}
        </Menu>

        <Divider style={styles.divider} />

        {/* Videos */}
        <Text style={styles.sectionHeader}>{t('watchVideo')}</Text>
        {videos.map((v, idx) => (
          <Card key={idx} style={styles.itemCard} mode="outlined">
            <Card.Content style={styles.itemCardRow}>
              <Icon source={v.video_type === 'youtube' ? 'youtube' : 'video'} size={16} color={Colors.mutedForeground} />
              <Text variant="bodySmall" style={[styles.itemUrl, { marginLeft: 8 }]} numberOfLines={1}>
                {v.localUri ? `📎 ${v.url}` : v.url}
              </Text>
              <IconButton icon="delete" iconColor={Colors.destructive} size={16}
                onPress={() => setVideos(prev => prev.filter((_, i) => i !== idx))} />
            </Card.Content>
          </Card>
        ))}
        <SegmentedButtons
          value={newVideoType}
          onValueChange={v => setNewVideoType(v as any)}
          buttons={[
            { value: 'youtube', label: 'YouTube', style: newVideoType === 'youtube' ? styles.segActive : styles.segInactive },
            { value: 'uploaded', label: t('videoFile'), style: newVideoType === 'uploaded' ? styles.segActive : styles.segInactive },
          ]}
          style={styles.segmented}
        />
        {newVideoType === 'youtube' ? (
          <>
            <TextInput
              label={t('youtubeUrl')}
              value={newYoutubeUrl}
              onChangeText={setNewYoutubeUrl}
              placeholder={t('youtubePlaceholder')}
              {...inputProps}
            />
            <Button mode="outlined" icon="plus" onPress={addYoutubeVideo}
              style={styles.addSectionBtn} textColor={Colors.primary}>
              {t('addYoutubeVideo')}
            </Button>
          </>
        ) : (
          <Button mode="outlined" icon="folder-open" onPress={pickVideoFile}
            style={[styles.pickBtn, { marginBottom: 0 }]} textColor={Colors.primary}>
            {t('selectVideo')}
          </Button>
        )}

        <Divider style={styles.divider} />

        {/* Figures */}
        <Text style={styles.sectionHeader}>{t('figures')}</Text>
        {figures.map((fig, idx) => {
          const isExpanded = expandedFigures.has(idx)
          return (
            <Card key={idx} style={styles.figureCard} mode="outlined">
              <View style={styles.figureAccordionHeader}>
                <Text style={styles.figureAccordionTitle}>{t('figure')} {idx + 1}</Text>
                <IconButton icon="delete" iconColor={Colors.destructive} size={20}
                  onPress={() => setFigures(prev => prev.filter((_, i) => i !== idx))} />
                <IconButton icon={isExpanded ? 'chevron-up' : 'chevron-down'} iconColor={Colors.mutedForeground} size={20}
                  onPress={() => toggleFigure(idx)} />
              </View>
              {isExpanded && (
                <View style={styles.figureContent}>
                  <TextInput
                    label={`${t('schemeLabel')} (DE)`}
                    value={fig.scheme_de}
                    onChangeText={v => updateFigure(idx, { scheme_de: v })}
                    multiline
                    {...inputProps}
                    style={[styles.input, styles.schemeInput]}
                  />
                  <TextInput
                    label={`${t('schemeLabel')} (RU)`}
                    value={fig.scheme_ru}
                    onChangeText={v => updateFigure(idx, { scheme_ru: v })}
                    multiline
                    {...inputProps}
                    style={[styles.input, styles.schemeInput]}
                  />
                  <SegmentedButtons
                    value={fig.videoType}
                    onValueChange={v => updateFigure(idx, { videoType: v as any, videoUrl: '', videoLocalUri: undefined, videoMimeType: undefined })}
                    buttons={[
                      { value: 'youtube', label: 'YouTube', style: fig.videoType === 'youtube' ? styles.segActive : styles.segInactive },
                      { value: 'uploaded', label: t('videoFile'), style: fig.videoType === 'uploaded' ? styles.segActive : styles.segInactive },
                    ]}
                    style={styles.segmented}
                  />
                  {fig.videoType === 'youtube' ? (
                    <TextInput
                      label={t('youtubeUrl')}
                      value={fig.videoUrl}
                      onChangeText={v => updateFigure(idx, { videoUrl: v })}
                      placeholder={t('youtubePlaceholder')}
                      {...inputProps}
                      style={[styles.input, { marginBottom: 0 }]}
                    />
                  ) : (
                    <>
                      {fig.videoLocalUri ? (
                        <Text style={styles.uploadedNote}>📎 {fig.videoUrl}</Text>
                      ) : null}
                      <Button mode="outlined" icon="folder-open" onPress={() => pickFigureVideo(idx)}
                        style={[styles.pickBtn, { marginBottom: 0 }]} textColor={Colors.primary}>
                        {fig.videoLocalUri ? t('videoUploaded') : t('selectVideo')}
                      </Button>
                    </>
                  )}
                </View>
              )}
            </Card>
          )
        })}
        <Button mode="outlined" icon="plus" onPress={addFigure}
          style={styles.addSectionBtn} textColor={Colors.primary}>
          {t('addFigure')}
        </Button>

        <Divider style={styles.divider} />

        {/* Tutorials */}
        <Text style={styles.sectionHeader}>{t('tutorials')}</Text>
        {selectedTutorials.map((tut, idx) => (
          <Card key={tut.id} style={styles.itemCard} mode="outlined">
            <Card.Content style={styles.itemCardRow}>
              <Text variant="bodySmall" style={styles.itemUrl} numberOfLines={1}>
                {(language === 'de' ? tut.title_de : tut.title_ru) ?? ''}
              </Text>
              <IconButton icon="delete" iconColor={Colors.destructive} size={16}
                onPress={() => setSelectedTutorials(prev => prev.filter((_, i) => i !== idx))} />
            </Card.Content>
          </Card>
        ))}
        <Button mode="outlined" icon="magnify" onPress={() => setShowTutorialPicker(true)}
          style={styles.addSectionBtn} textColor={Colors.primary}>
          {t('chooseTutorial')}
        </Button>

        <Divider style={styles.divider} />

        {/* Music tracks */}
        <Text style={styles.sectionHeader}>{t('musicTracks')}</Text>
        {music.map((track, idx) => (
          <Card key={idx} style={styles.figureCard} mode="outlined">
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{track.title || t('addMusicTrack')}</Text>
                <IconButton icon="delete" iconColor={Colors.destructive} size={16}
                  onPress={() => setMusic(prev => prev.filter((_, i) => i !== idx))} />
              </View>
              <TextInput label={t('title')} value={track.title}
                onChangeText={v => updateMusic(idx, 'title', v)} {...inputProps} />
              {track.audioLocalUri ? (
                <Text style={styles.uploadedNote}>📎 {track.audioUrl}</Text>
              ) : null}
              <Button mode="outlined" icon="music" onPress={() => pickAudio(idx)}
                style={styles.pickBtn} textColor={Colors.primary}>
                {track.audioLocalUri ? t('audioUploaded') : t('selectAudio')}
              </Button>
            </Card.Content>
          </Card>
        ))}
        <Button mode="outlined" icon="music" onPress={() => setShowMusicPicker(true)}
          style={styles.addSectionBtn} textColor={Colors.primary}>
          {t('chooseMusicTrack')}
        </Button>
        <Button mode="outlined" icon="plus"
          onPress={() => setMusic(prev => [...prev, { title: '', artist: '', tempo: '', audioUrl: '' }])}
          style={styles.addSectionBtn} textColor={Colors.primary}>
          {t('addMusicTrack')}
        </Button>

        <Button mode="contained" onPress={handleSubmit} loading={isSaving} disabled={isSaving}
          style={styles.submitBtn} buttonColor={Colors.primary} textColor={Colors.primaryForeground}>
          {isSaving ? (uploading ? t('uploading') : t('saving')) : isEdit ? t('update') : t('create')}
        </Button>
      </ScrollView>

      {/* Tutorial Picker Modal */}
      <Modal
        visible={showTutorialPicker}
        animationType="slide"
        onRequestClose={() => { setShowTutorialPicker(false); setTutorialSearch('') }}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{t('tutorials')}</Text>
            <IconButton icon="close"
              onPress={() => { setShowTutorialPicker(false); setTutorialSearch('') }} />
          </View>
          <Searchbar
            value={tutorialSearch}
            onChangeText={setTutorialSearch}
            style={styles.pickerSearch}
            placeholder={t('searchTutorials')}
            inputStyle={{ color: Colors.foreground }}
            iconColor={Colors.mutedForeground}
            placeholderTextColor={Colors.mutedForeground}
          />
          <FlatList
            data={filteredTutorials}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const title = (language === 'de' ? item.title_de : item.title_ru) ?? ''
              const already = selectedTutorials.some(s => s.id === item.id)
              return (
                <List.Item
                  title={title}
                  description={item.type}
                  titleStyle={{ color: already ? Colors.primary : Colors.foreground, fontFamily: Fonts.body }}
                  descriptionStyle={{ color: Colors.mutedForeground }}
                  onPress={() => {
                    if (!already) setSelectedTutorials(prev => [...prev, item])
                    setShowTutorialPicker(false)
                    setTutorialSearch('')
                  }}
                  right={() => already ? <List.Icon icon="check" color={Colors.primary} /> : null}
                  style={styles.pickerItem}
                />
              )
            }}
            ItemSeparatorComponent={() => <Divider style={{ backgroundColor: Colors.border }} />}
          />
        </View>
      </Modal>

      {/* Music Picker Modal */}
      <Modal
        visible={showMusicPicker}
        animationType="slide"
        onRequestClose={() => { setShowMusicPicker(false); setMusicSearch('') }}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{t('musicTracks')}</Text>
            <IconButton icon="close"
              onPress={() => { setShowMusicPicker(false); setMusicSearch('') }} />
          </View>
          <Searchbar
            value={musicSearch}
            onChangeText={setMusicSearch}
            style={styles.pickerSearch}
            placeholder={t('searchMusic')}
            inputStyle={{ color: Colors.foreground }}
            iconColor={Colors.mutedForeground}
            placeholderTextColor={Colors.mutedForeground}
          />
          <FlatList
            data={filteredMusic}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const already = music.some(m => m.id === item.id)
              return (
                <List.Item
                  title={item.title}
                  description={item.artist ?? undefined}
                  titleStyle={{ color: already ? Colors.primary : Colors.foreground, fontFamily: Fonts.body }}
                  descriptionStyle={{ color: Colors.mutedForeground }}
                  onPress={() => {
                    if (!already) setMusic(prev => [...prev, { id: item.id, title: item.title, artist: item.artist ?? '', tempo: item.tempo?.toString() ?? '', audioUrl: item.audio_url ?? '' }])
                    setShowMusicPicker(false)
                    setMusicSearch('')
                  }}
                  right={() => already ? <List.Icon icon="check" color={Colors.primary} /> : null}
                  style={styles.pickerItem}
                />
              )
            }}
            ItemSeparatorComponent={() => <Divider style={{ backgroundColor: Colors.border }} />}
          />
        </View>
      </Modal>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}
        style={{ backgroundColor: Colors.destructive }}>{error}</Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  langBlock: { marginBottom: 4 },
  langLabel: { fontSize: 11, fontFamily: Fonts.heading, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  fieldLabel: { fontSize: 11, fontFamily: Fonts.heading, color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  sectionHeader: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.foreground, marginBottom: 10 },
  input: { marginBottom: 12, backgroundColor: Colors.card },
  divider: { backgroundColor: Colors.border, marginVertical: 16 },
  menuBtn: { borderColor: Colors.border, borderRadius: 4, justifyContent: 'flex-start' },
  itemCard: { marginBottom: 8, backgroundColor: Colors.card, borderColor: Colors.border },
  itemCardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  itemUrl: { flex: 1, color: Colors.mutedForeground },
  segmented: { marginBottom: 8 },
  segActive: { backgroundColor: Colors.primary },
  segInactive: { backgroundColor: Colors.card },
  pickBtn: { borderColor: Colors.border, borderRadius: 4, marginBottom: 8 },
  figureCard: { marginBottom: 12, backgroundColor: Colors.card, borderColor: Colors.border, overflow: 'hidden' },
  figureAccordionHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  figureAccordionTitle: { flex: 1, fontFamily: Fonts.bodySemiBold, color: Colors.foreground, fontSize: 13 },
  figureContent: { paddingHorizontal: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground, fontSize: 13 },
  schemeInput: { minHeight: 80 },
  addSectionBtn: { borderColor: Colors.primary, borderRadius: 4, marginBottom: 4 },
  uploadedNote: { color: Colors.mutedForeground, fontSize: 12, marginBottom: 8 },

  submitBtn: { marginTop: 24, borderRadius: 6 },
  // Pickers
  pickerContainer: { flex: 1, backgroundColor: Colors.background },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 16, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 17, color: Colors.foreground },
  pickerSearch: { margin: 12, elevation: 0, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 6 },
  pickerItem: { backgroundColor: Colors.background },
})
