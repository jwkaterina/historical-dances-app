import { useState, useEffect } from 'react'
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, Divider, Card, IconButton, Snackbar, ActivityIndicator } from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCreateBall, useUpdateBall, useBall, useDancesForBall } from '@/hooks/useBalls'
import type { SectionFormData, SectionEntry } from '@/types/database'
import DancePickerModal from '@/components/DancePickerModal'

export default function BallFormScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const { t, language } = useLanguage()
  const router = useRouter()
  const isEdit = !!edit

  const { data: existing, isLoading: loadingExisting } = useBall(edit ?? '')
  const { data: dances = [] } = useDancesForBall()
  const createBall = useCreateBall()
  const updateBall = useUpdateBall()

  const [nameDe, setNameDe] = useState('')
  const [nameRu, setNameRu] = useState('')
  const [date, setDate] = useState('')
  const [placeDe, setPlaceDe] = useState('')
  const [placeRu, setPlaceRu] = useState('')
  const [sections, setSections] = useState<SectionFormData[]>([])
  const [error, setError] = useState('')
  const [showDancePicker, setShowDancePicker] = useState<{ sectionIdx: number } | null>(null)

  useEffect(() => {
    if (existing) {
      setNameDe(existing.name_de ?? '')
      setNameRu(existing.name_ru ?? '')
      setDate(existing.date ?? '')
      setPlaceDe(existing.place_de ?? '')
      setPlaceRu(existing.place_ru ?? '')
      const sects: SectionFormData[] = (existing.ball_sections ?? [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(s => ({
          id: s.id,
          name_de: s.name_de ?? '',
          name_ru: s.name_ru ?? '',
          entries: [
            ...(s.section_dances ?? []).map(sd => ({
              kind: 'dance' as const,
              order_index: sd.order_index,
              danceId: sd.dance_id,
              musicIds: sd.music_ids ?? [],
            })),
            ...(s.section_texts ?? []).map(st => ({
              kind: 'text' as const,
              order_index: st.order_index,
              content_de: st.content_de,
              content_ru: st.content_ru,
            })),
          ].sort((a, b) => a.order_index - b.order_index),
        }))
      setSections(sects)
    }
  }, [existing])

  const addSection = () => {
    setSections(prev => [...prev, { name_de: '', name_ru: '', entries: [] }])
  }

  const updateSection = (idx: number, field: 'name_de' | 'name_ru', val: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx))
  }

  const addTextEntry = (sectionIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      const nextIdx = s.entries.length
      return { ...s, entries: [...s.entries, { kind: 'text', order_index: nextIdx, content_de: '', content_ru: '' }] }
    }))
  }

  const addDanceEntry = (sectionIdx: number, danceId: string) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      const nextIdx = s.entries.length
      return { ...s, entries: [...s.entries, { kind: 'dance', order_index: nextIdx, danceId }] }
    }))
  }

  const removeEntry = (sectionIdx: number, entryIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      const newEntries = s.entries.filter((_, ei) => ei !== entryIdx)
        .map((e, newIdx) => ({ ...e, order_index: newIdx }))
      return { ...s, entries: newEntries }
    }))
  }

  const updateTextEntry = (sectionIdx: number, entryIdx: number, field: 'content_de' | 'content_ru', val: string) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      const newEntries = s.entries.map((e, ei) => {
        if (ei !== entryIdx || e.kind !== 'text') return e
        return { ...e, [field]: val }
      })
      return { ...s, entries: newEntries }
    }))
  }

  const handleSubmit = async () => {
    if (!nameDe || !nameRu || !date || !placeDe || !placeRu) {
      setError(t('fillAllFields'))
      return
    }
    try {
      const formData = { name_de: nameDe, name_ru: nameRu, date, place_de: placeDe, place_ru: placeRu, sections }
      if (isEdit && edit) {
        await updateBall.mutateAsync({ id: edit, data: formData })
        router.back()
      } else {
        await createBall.mutateAsync(formData)
        router.back()
      }
    } catch (e: any) {
      setError(e.message ?? t('error'))
    }
  }

  if (isEdit && loadingExisting) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />
  }

  const isSaving = createBall.isPending || updateBall.isPending

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={styles.sectionHeader}>{t('ballName')}</Text>
        <TextInput label={`${t('danceName')} (DE)`} value={nameDe} onChangeText={setNameDe} mode="outlined" style={styles.input} />
        <TextInput label={`${t('danceName')} (RU)`} value={nameRu} onChangeText={setNameRu} mode="outlined" style={styles.input} />

        <TextInput label={t('ballDate')} value={date} onChangeText={setDate} mode="outlined" style={styles.input}
          placeholder="YYYY-MM-DD" />

        <Text variant="titleMedium" style={styles.sectionHeader}>{t('ballPlace')}</Text>
        <TextInput label={`${t('ballPlace')} (DE)`} value={placeDe} onChangeText={setPlaceDe} mode="outlined" style={styles.input} />
        <TextInput label={`${t('ballPlace')} (RU)`} value={placeRu} onChangeText={setPlaceRu} mode="outlined" style={styles.input} />

        <Divider style={styles.divider} />
        <Text variant="titleMedium" style={styles.sectionHeader}>{t('sections')}</Text>

        {sections.map((section, sIdx) => (
          <Card key={sIdx} style={styles.sectionCard} mode="outlined">
            <Card.Content>
              <View style={styles.sectionCardHeader}>
                <Text variant="titleSmall">{t('section')} {sIdx + 1}</Text>
                <IconButton icon="delete" iconColor="red" size={18} onPress={() => removeSection(sIdx)} />
              </View>
              <TextInput label={`${t('sectionName')} (DE)`} value={section.name_de}
                onChangeText={v => updateSection(sIdx, 'name_de', v)} mode="outlined" style={styles.input} />
              <TextInput label={`${t('sectionName')} (RU)`} value={section.name_ru}
                onChangeText={v => updateSection(sIdx, 'name_ru', v)} mode="outlined" style={styles.input} />

              <Text variant="bodySmall" style={styles.entriesLabel}>Einträge / Записи</Text>
              {section.entries.map((entry, eIdx) => (
                <View key={eIdx} style={styles.entryRow}>
                  {entry.kind === 'dance' ? (
                    <View style={styles.danceEntry}>
                      <Text variant="bodyMedium" style={styles.danceEntryText}>
                        {(() => {
                          const d = (dances as any[]).find(d => d.id === (entry as any).danceId)
                          return d ? (language === 'de' ? d.name_de : d.name_ru) ?? d.name : (entry as any).danceId
                        })()}
                      </Text>
                      <IconButton icon="delete" iconColor="red" size={16} onPress={() => removeEntry(sIdx, eIdx)} />
                    </View>
                  ) : (
                    <View style={styles.textEntry}>
                      <TextInput
                        label="Text (DE)"
                        value={(entry as any).content_de}
                        onChangeText={v => updateTextEntry(sIdx, eIdx, 'content_de', v)}
                        mode="outlined"
                        multiline
                        style={styles.textInput}
                      />
                      <TextInput
                        label="Text (RU)"
                        value={(entry as any).content_ru}
                        onChangeText={v => updateTextEntry(sIdx, eIdx, 'content_ru', v)}
                        mode="outlined"
                        multiline
                        style={styles.textInput}
                      />
                      <IconButton icon="delete" iconColor="red" size={16} onPress={() => removeEntry(sIdx, eIdx)} />
                    </View>
                  )}
                </View>
              ))}

              <View style={styles.addEntryRow}>
                <Button icon="dance-ballroom" mode="outlined" compact onPress={() => setShowDancePicker({ sectionIdx: sIdx })} style={styles.addBtn}>
                  {t('addAnotherDance')}
                </Button>
                <Button icon="text" mode="outlined" compact onPress={() => addTextEntry(sIdx)} style={styles.addBtn}>
                  {t('addText')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}

        <Button icon="plus" mode="outlined" onPress={addSection} style={styles.addSectionBtn}>
          {t('addSection')}
        </Button>

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

      {showDancePicker && (
        <DancePickerModal
          dances={dances}
          onSelect={(danceId) => {
            addDanceEntry(showDancePicker.sectionIdx, danceId)
            setShowDancePicker(null)
          }}
          onDismiss={() => setShowDancePicker(null)}
        />
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}>{error}</Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  sectionHeader: { fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
  input: { marginBottom: 12 },
  divider: { marginVertical: 16 },
  sectionCard: { marginBottom: 16, backgroundColor: '#fff' },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entriesLabel: { opacity: 0.6, marginBottom: 8, marginTop: 4 },
  entryRow: { marginBottom: 8 },
  danceEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0edf6', borderRadius: 8, padding: 8 },
  danceEntryText: { flex: 1 },
  textEntry: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8 },
  textInput: { marginBottom: 8 },
  addEntryRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addBtn: { flex: 1 },
  addSectionBtn: { marginTop: 8, marginBottom: 16 },
  submitBtn: { marginTop: 8 },
})
