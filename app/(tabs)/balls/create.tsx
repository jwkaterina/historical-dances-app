import { useState, useEffect } from 'react'
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, Divider, Card, IconButton, Snackbar, ActivityIndicator } from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCreateBall, useUpdateBall, useBall, useDancesForBall } from '@/hooks/useBalls'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import type { SectionFormData } from '@/types/database'
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

  const addSection = () => setSections(prev => [...prev, { name_de: '', name_ru: '', entries: [] }])

  const updateSection = (idx: number, field: 'name_de' | 'name_ru', val: string) =>
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))

  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx))

  const addTextEntry = (sectionIdx: number) =>
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      return { ...s, entries: [...s.entries, { kind: 'text', order_index: s.entries.length, content_de: '', content_ru: '' }] }
    }))

  const addDanceEntry = (sectionIdx: number, danceId: string) =>
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      return { ...s, entries: [...s.entries, { kind: 'dance', order_index: s.entries.length, danceId }] }
    }))

  const removeEntry = (sectionIdx: number, entryIdx: number) =>
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      return { ...s, entries: s.entries.filter((_, ei) => ei !== entryIdx).map((e, ni) => ({ ...e, order_index: ni })) }
    }))

  const updateTextEntry = (sectionIdx: number, entryIdx: number, field: 'content_de' | 'content_ru', val: string) =>
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      return { ...s, entries: s.entries.map((e, ei) => ei === entryIdx && e.kind === 'text' ? { ...e, [field]: val } : e) }
    }))

  const handleSubmit = async () => {
    if (!nameDe || !nameRu || !date || !placeDe || !placeRu) { setError(t('fillAllFields')); return }
    try {
      const formData = { name_de: nameDe, name_ru: nameRu, date, place_de: placeDe, place_ru: placeRu, sections }
      if (isEdit && edit) await updateBall.mutateAsync({ id: edit, data: formData })
      else await createBall.mutateAsync(formData)
      router.back()
    } catch (e: any) { setError(e.message ?? t('error')) }
  }

  if (isEdit && loadingExisting) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />

  const isSaving = createBall.isPending || updateBall.isPending

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.primary,
    textColor: Colors.foreground,
    style: styles.input,
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <Text style={styles.fieldLabel}>{t('ballName')}</Text>
        <TextInput label="DE" value={nameDe} onChangeText={setNameDe} {...inputProps} />
        <TextInput label="RU" value={nameRu} onChangeText={setNameRu} {...inputProps} />

        <Text style={styles.fieldLabel}>{t('ballDate')}</Text>
        <TextInput label="YYYY-MM-DD" value={date} onChangeText={setDate} {...inputProps} placeholder="2025-12-31" />

        <Text style={styles.fieldLabel}>{t('ballPlace')}</Text>
        <TextInput label="DE" value={placeDe} onChangeText={setPlaceDe} {...inputProps} />
        <TextInput label="RU" value={placeRu} onChangeText={setPlaceRu} {...inputProps} />

        <Divider style={styles.divider} />
        <Text style={styles.fieldLabel}>{t('sections')}</Text>

        {sections.map((section, sIdx) => (
          <Card key={sIdx} style={styles.sectionCard} mode="outlined">
            <Card.Content>
              <View style={styles.sectionCardHeader}>
                <Text variant="labelLarge" style={styles.sectionNum}>{t('section')} {sIdx + 1}</Text>
                <IconButton icon="delete" iconColor={Colors.destructive} size={18} onPress={() => removeSection(sIdx)} />
              </View>
              <TextInput label={`${t('sectionName')} (DE)`} value={section.name_de}
                onChangeText={v => updateSection(sIdx, 'name_de', v)} {...inputProps} />
              <TextInput label={`${t('sectionName')} (RU)`} value={section.name_ru}
                onChangeText={v => updateSection(sIdx, 'name_ru', v)} {...inputProps} />

              {section.entries.length > 0 && (
                <View style={styles.entriesList}>
                  {section.entries.map((entry, eIdx) => (
                    <View key={eIdx} style={entry.kind === 'dance' ? styles.danceEntry : styles.textEntry}>
                      {entry.kind === 'dance' ? (
                        <>
                          <Text variant="bodyMedium" style={styles.danceEntryText} numberOfLines={1}>
                            {(() => {
                              const d = (dances as any[]).find(d => d.id === (entry as any).danceId)
                              return d ? (language === 'de' ? d.name_de : d.name_ru) ?? d.name : (entry as any).danceId
                            })()}
                          </Text>
                          <IconButton icon="close" iconColor={Colors.mutedForeground} size={16} onPress={() => removeEntry(sIdx, eIdx)} />
                        </>
                      ) : (
                        <View style={{ flex: 1 }}>
                          <TextInput label="Text (DE)" value={(entry as any).content_de}
                            onChangeText={v => updateTextEntry(sIdx, eIdx, 'content_de', v)}
                            mode="outlined" outlineColor={Colors.border} activeOutlineColor={Colors.primary}
                            textColor={Colors.foreground} multiline style={[styles.input, { backgroundColor: Colors.background }]} />
                          <TextInput label="Text (RU)" value={(entry as any).content_ru}
                            onChangeText={v => updateTextEntry(sIdx, eIdx, 'content_ru', v)}
                            mode="outlined" outlineColor={Colors.border} activeOutlineColor={Colors.primary}
                            textColor={Colors.foreground} multiline style={[styles.input, { backgroundColor: Colors.background }]} />
                          <IconButton icon="close" iconColor={Colors.mutedForeground} size={16} onPress={() => removeEntry(sIdx, eIdx)} style={{ alignSelf: 'flex-end' }} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.addEntryRow}>
                <Button icon="dance-ballroom" mode="outlined" compact
                  onPress={() => setShowDancePicker({ sectionIdx: sIdx })}
                  style={styles.addBtn} textColor={Colors.primary}>
                  {t('addAnotherDance')}
                </Button>
                <Button icon="text" mode="outlined" compact
                  onPress={() => addTextEntry(sIdx)}
                  style={styles.addBtn} textColor={Colors.mutedForeground}>
                  {t('addText')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}

        <Button icon="plus" mode="outlined" onPress={addSection} style={styles.addSectionBtn} textColor={Colors.primary}>
          {t('addSection')}
        </Button>

        <Button mode="contained" onPress={handleSubmit} loading={isSaving} disabled={isSaving}
          style={styles.submitBtn} buttonColor={Colors.primary} textColor={Colors.primaryForeground}>
          {isSaving ? t('saving') : isEdit ? t('update') : t('create')}
        </Button>
      </ScrollView>

      {showDancePicker && (
        <DancePickerModal
          dances={dances}
          onSelect={danceId => { addDanceEntry(showDancePicker.sectionIdx, danceId); setShowDancePicker(null) }}
          onDismiss={() => setShowDancePicker(null)}
        />
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}
        style={{ backgroundColor: Colors.destructive }}>{error}</Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  fieldLabel: { fontSize: 11, fontFamily: Fonts.heading, color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  input: { marginBottom: 12, backgroundColor: Colors.card },
  divider: { backgroundColor: Colors.border, marginVertical: 16 },
  sectionCard: { marginBottom: 12, backgroundColor: Colors.card, borderColor: Colors.border },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionNum: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  entriesList: { marginBottom: 8, gap: 6 },
  danceEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.muted, borderRadius: 6, paddingLeft: 12, paddingVertical: 4 },
  danceEntryText: { flex: 1, color: Colors.foreground },
  textEntry: { backgroundColor: Colors.muted, borderRadius: 6, padding: 8 },
  addEntryRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  addBtn: { flex: 1, borderColor: Colors.border, borderRadius: 4 },
  addSectionBtn: { marginBottom: 16, borderColor: Colors.border, borderRadius: 4 },
  submitBtn: { borderRadius: 6 },
})
