import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native'
import {
  Text, TextInput, Button, SegmentedButtons, Card,
  IconButton, Snackbar, ActivityIndicator, Menu,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDance, useCreateDance, useUpdateDance, useSyncDanceVideos } from '@/hooks/useDances'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const

interface VideoEntry {
  id?: string
  video_type: 'youtube' | 'uploaded'
  url: string
}

interface Props {
  danceId?: string
}

export default function DanceForm({ danceId }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const isEdit = !!danceId

  const { data: existing, isLoading } = useDance(danceId ?? '')
  const createDance = useCreateDance()
  const updateDance = useUpdateDance()
  const syncVideos = useSyncDanceVideos()

  const [nameDe, setNameDe] = useState('')
  const [nameRu, setNameRu] = useState('')
  const [descDe, setDescDe] = useState('')
  const [descRu, setDescRu] = useState('')
  const [schemeDe, setSchemeDe] = useState('')
  const [schemeRu, setSchemeRu] = useState('')
  const [difficulty, setDifficulty] = useState<string>('')
  const [origin, setOrigin] = useState('')
  const [videos, setVideos] = useState<VideoEntry[]>([])
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoType, setNewVideoType] = useState<'youtube' | 'uploaded'>('youtube')
  const [error, setError] = useState('')
  const [diffMenuVisible, setDiffMenuVisible] = useState(false)

  useEffect(() => {
    if (existing) {
      setNameDe(existing.name_de ?? '')
      setNameRu(existing.name_ru ?? '')
      setDescDe(existing.description_de ?? '')
      setDescRu(existing.description_ru ?? '')
      setSchemeDe(existing.scheme_de ?? '')
      setSchemeRu(existing.scheme_ru ?? '')
      setDifficulty(existing.difficulty ?? '')
      setOrigin(existing.origin ?? '')
      setVideos((existing.dance_videos ?? [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(v => ({ id: v.id, video_type: v.video_type, url: v.url })))
    }
  }, [existing])

  const addVideo = () => {
    if (!newVideoUrl.trim()) return
    setVideos(prev => [...prev, { video_type: newVideoType, url: newVideoUrl.trim() }])
    setNewVideoUrl('')
  }

  const removeVideo = (idx: number) => {
    setVideos(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!nameDe || !nameRu) {
      setError(t('toastNameRequiredBothLanguages'))
      return
    }

    const danceData = {
      name: nameDe,
      name_de: nameDe,
      name_ru: nameRu,
      description_de: descDe || null,
      description_ru: descRu || null,
      scheme_de: schemeDe || null,
      scheme_ru: schemeRu || null,
      difficulty: (difficulty as any) || null,
      origin: origin || null,
    }

    try {
      if (isEdit && danceId) {
        await updateDance.mutateAsync({ id: danceId, data: danceData })
        await syncVideos.mutateAsync({ danceId, videos })
        router.back()
      } else {
        const created = await createDance.mutateAsync(danceData)
        if (videos.length > 0) {
          await syncVideos.mutateAsync({ danceId: created.id, videos })
        }
        router.back()
      }
    } catch (e: any) {
      setError(e.message ?? t('error'))
    }
  }

  if (isEdit && isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />
  }

  const isSaving = createDance.isPending || updateDance.isPending || syncVideos.isPending

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="titleSmall" style={styles.sectionLabel}>DE</Text>
        <TextInput
          label={t('danceName')}
          value={nameDe}
          onChangeText={setNameDe}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label={t('descriptionLabel')}
          value={descDe}
          onChangeText={setDescDe}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />
        <TextInput
          label={t('schemeLabel')}
          value={schemeDe}
          onChangeText={setSchemeDe}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Text variant="titleSmall" style={styles.sectionLabel}>RU</Text>
        <TextInput
          label={t('danceName')}
          value={nameRu}
          onChangeText={setNameRu}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label={t('descriptionLabel')}
          value={descRu}
          onChangeText={setDescRu}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />
        <TextInput
          label={t('schemeLabel')}
          value={schemeRu}
          onChangeText={setSchemeRu}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Text variant="titleSmall" style={styles.sectionLabel}>{t('difficulty')}</Text>
        <Menu
          visible={diffMenuVisible}
          onDismiss={() => setDiffMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setDiffMenuVisible(true)} style={styles.input}>
              {difficulty ? t(difficulty as any) : t('selectDifficulty')}
            </Button>
          }
        >
          <Menu.Item title={t('selectDifficulty')} onPress={() => { setDifficulty(''); setDiffMenuVisible(false) }} />
          {DIFFICULTIES.map(d => (
            <Menu.Item key={d} title={t(d)} onPress={() => { setDifficulty(d); setDiffMenuVisible(false) }} />
          ))}
        </Menu>

        <TextInput
          label={t('originLabel')}
          value={origin}
          onChangeText={setOrigin}
          mode="outlined"
          style={styles.input}
          placeholder={t('originPlaceholder')}
        />

        <Text variant="titleSmall" style={styles.sectionLabel}>{t('watchVideo')}</Text>
        {videos.map((v, idx) => (
          <Card key={idx} style={styles.videoCard} mode="outlined">
            <Card.Content style={styles.videoCardContent}>
              <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={1}>{v.url}</Text>
              <IconButton icon="delete" iconColor="red" size={16} onPress={() => removeVideo(idx)} />
            </Card.Content>
          </Card>
        ))}

        <View style={styles.addVideoRow}>
          <SegmentedButtons
            value={newVideoType}
            onValueChange={v => setNewVideoType(v as any)}
            buttons={[
              { value: 'youtube', label: 'YouTube' },
              { value: 'uploaded', label: 'URL' },
            ]}
            style={styles.segmented}
          />
          <TextInput
            label={newVideoType === 'youtube' ? t('youtubeUrl') : t('videoUrl')}
            value={newVideoUrl}
            onChangeText={setNewVideoUrl}
            mode="outlined"
            style={styles.videoInput}
            placeholder={newVideoType === 'youtube' ? t('youtubePlaceholder') : t('videoPlaceholder')}
          />
          <Button mode="outlined" onPress={addVideo} disabled={!newVideoUrl.trim()}>
            +
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSaving}
          disabled={isSaving}
          style={styles.submitBtn}
        >
          {isSaving ? t('saving') : isEdit ? t('update') : t('create')}
        </Button>
      </ScrollView>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}>{error}</Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  sectionLabel: { fontWeight: 'bold', color: '#6750a4', marginTop: 12, marginBottom: 4 },
  input: { marginBottom: 12 },
  videoCard: { marginBottom: 8, backgroundColor: '#fff' },
  videoCardContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  addVideoRow: { gap: 8, marginBottom: 16 },
  segmented: { marginBottom: 8 },
  videoInput: { marginBottom: 8 },
  submitBtn: { marginTop: 8 },
})
