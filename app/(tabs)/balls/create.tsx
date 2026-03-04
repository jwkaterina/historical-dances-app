import { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Text, TextInput, Button, Divider, Card, IconButton, Snackbar, ActivityIndicator, Chip } from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCreateBall, useUpdateBall, useBall, useDancesForBall } from '@/hooks/useBalls'
import { Colors } from '@/lib/colors'
import { isNetworkError } from '@/lib/toastService'
import { Fonts } from '@/lib/fonts'
import type { SectionFormData } from '@/types/database'
import DancePickerModal from '@/components/DancePickerModal'
import DragSortList, { type SortItem } from '@/components/DragSortList'

type FormEntry =
  | { kind: 'dance'; order_index: number; danceId: string; musicIds?: string[]; _key: string }
  | { kind: 'text'; order_index: number; content_de: string; content_ru: string; _key: string }

type FormSection = {
  id?: string
  name_de: string
  name_ru: string
  entries: FormEntry[]
}

export default function BallFormScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const { t, language } = useLanguage()
  const router = useRouter()
  const isEdit = !!edit
  const keyRef = useRef(0)
  const genKey = () => `k${++keyRef.current}`

  const { data: existing, isLoading: loadingExisting } = useBall(edit ?? '')
  const { data: dances = [] } = useDancesForBall()
  const createBall = useCreateBall()
  const updateBall = useUpdateBall()

  const [nameDe, setNameDe] = useState('')
  const [nameRu, setNameRu] = useState('')
  const [date, setDate] = useState('')
  const [placeDe, setPlaceDe] = useState('')
  const [placeRu, setPlaceRu] = useState('')
  const [sections, setSections] = useState<FormSection[]>([])
  const [globalEditOrder, setGlobalEditOrder] = useState(false)
  const [error, setError] = useState('')
  const [showDancePicker, setShowDancePicker] = useState<{ sectionIdx: number } | null>(null)

  const scrollRef = useRef<ScrollView>(null)
  const scrollOffsetRef = useRef(0)

  useEffect(() => {
    if (existing) {
      setNameDe(existing.name_de ?? '')
      setNameRu(existing.name_ru ?? '')
      setDate(existing.date ?? '')
      setPlaceDe(existing.place_de ?? '')
      setPlaceRu(existing.place_ru ?? '')
      const sects: FormSection[] = (existing.ball_sections ?? [])
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
              _key: sd.id ?? genKey(),
            })),
            ...(s.section_texts ?? []).map(st => ({
              kind: 'text' as const,
              order_index: st.order_index,
              content_de: st.content_de,
              content_ru: st.content_ru,
              _key: st.id ?? genKey(),
            })),
          ].sort((a, b) => a.order_index - b.order_index),
        }))
      setSections(sects)
    }
  }, [existing])

  const addSection = () => setSections(prev => [...prev, { name_de: '', name_ru: '', entries: [] }])
  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx))

  const addTextEntry = (sectionIdx: number) =>
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      return { ...s, entries: [...s.entries, { kind: 'text', order_index: s.entries.length, content_de: '', content_ru: '', _key: genKey() }] }
    }))

  const addDanceEntry = (sectionIdx: number, danceId: string) =>
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      return { ...s, entries: [...s.entries, { kind: 'dance', order_index: s.entries.length, danceId, musicIds: [], _key: genKey() }] }
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

  const toggleMusicId = (sectionIdx: number, entryIdx: number, trackId: string) =>
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s
      return {
        ...s,
        entries: s.entries.map((e, ei) => {
          if (ei !== entryIdx || e.kind !== 'dance') return e
          const current = (e as any).musicIds ?? []
          const next = current.includes(trackId)
            ? current.filter((id: string) => id !== trackId)
            : [...current, trackId]
          return { ...e, musicIds: next }
        }),
      }
    }))

  const getDanceName = (danceId: string) => {
    const d = (dances as any[]).find(d => d.id === danceId)
    return d ? (language === 'de' ? d.name_de : d.name_ru) ?? d.name : danceId
  }

  // Build a flat list of section separators + all entries for the reorder UI.
  const buildFlatItems = (): SortItem[] => {
    const result: SortItem[] = []
    sections.forEach((section, sIdx) => {
      result.push({ key: `__sep__${sIdx}`, label: `${t('section')} ${sIdx + 1}`, separator: true })
      section.entries.forEach(entry => {
        const label = entry.kind === 'dance'
          ? getDanceName((entry as Extract<FormEntry, { kind: 'dance' }>).danceId)
          : (language === 'de' ? entry.content_de : entry.content_ru)?.trim().slice(0, 50) || '[Text]'
        result.push({ key: entry._key, label })
      })
    })
    return result
  }

  // Reconstruct sections from a reordered flat list.
  const handleGlobalReorder = (sorted: SortItem[]) => {
    const newSections: FormSection[] = []
    let current: FormSection | null = null
    const allEntries = sections.flatMap(s => s.entries)
    for (const item of sorted) {
      if (item.separator) {
        if (current !== null) newSections.push(current)
        const sIdx = parseInt(item.key.replace('__sep__', ''), 10)
        const orig = sections[sIdx]
        current = { id: orig?.id, name_de: orig?.name_de ?? '', name_ru: orig?.name_ru ?? '', entries: [] }
      } else {
        const entry = allEntries.find(e => e._key === item.key)
        if (entry && current) current.entries.push(entry)
      }
    }
    if (current !== null) newSections.push(current)
    setSections(newSections.map(s => ({ ...s, entries: s.entries.map((e, i) => ({ ...e, order_index: i })) })))
  }

  const handleSubmit = async () => {
    if (!nameDe || !nameRu || !date || !placeDe || !placeRu) { setError(t('fillAllFields')); return }
    try {
      const formData: SectionFormData[] = sections.map(s => ({
        ...s,
        entries: s.entries.map(({ _key, ...rest }) => rest) as SectionFormData['entries'],
      }))
      if (isEdit && edit) await updateBall.mutateAsync({ id: edit, data: { name_de: nameDe, name_ru: nameRu, date, place_de: placeDe, place_ru: placeRu, sections: formData } })
      else await createBall.mutateAsync({ name_de: nameDe, name_ru: nameRu, date, place_de: placeDe, place_ru: placeRu, sections: formData })
      router.back()
    } catch (e: any) { if (!isNetworkError(e)) setError(t('toastFailedSaveBall')) }
  }

  if (isEdit && loadingExisting) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />

  const isSaving = createBall.isPending || updateBall.isPending
  const totalEntries = sections.reduce((n, s) => n + s.entries.length, 0)

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.primary,
    textColor: Colors.foreground,
    style: styles.input,
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y }}
      >

        <Text style={styles.fieldLabel}>{t('ballName')}</Text>
        <TextInput label="DE" value={nameDe} onChangeText={setNameDe} {...inputProps} />
        <TextInput label="RU" value={nameRu} onChangeText={setNameRu} {...inputProps} />

        <Text style={styles.fieldLabel}>{t('ballDate')}</Text>
        <TextInput label="YYYY-MM-DD" value={date} onChangeText={setDate} {...inputProps} placeholder="2025-12-31" />

        <Text style={styles.fieldLabel}>{t('ballPlace')}</Text>
        <TextInput label="DE" value={placeDe} onChangeText={setPlaceDe} {...inputProps} />
        <TextInput label="RU" value={placeRu} onChangeText={setPlaceRu} {...inputProps} />

        <Divider style={styles.divider} />
        <View style={styles.sectionsHeader}>
          <Text style={styles.fieldLabel}>{t('sections')}</Text>
          {totalEntries >= 2 && (
            globalEditOrder
              ? <Button compact mode="contained" buttonColor={Colors.primary}
                  textColor={Colors.primaryForeground} style={styles.editOrderBtn}
                  onPress={() => setGlobalEditOrder(false)}>{t('done')}</Button>
              : <Button compact mode="text" textColor={Colors.primary}
                  onPress={() => setGlobalEditOrder(true)}>{t('editOrder')}</Button>
          )}
        </View>

        {globalEditOrder ? (
          <Card style={styles.sectionCard} mode="outlined">
            <Card.Content>
              <DragSortList
                items={buildFlatItems()}
                onReorder={handleGlobalReorder}
                scrollRef={scrollRef}
                scrollOffsetRef={scrollOffsetRef}
              />
            </Card.Content>
          </Card>
        ) : (
          <>
            {sections.map((section, sIdx) => (
              <Card key={sIdx} style={styles.sectionCard} mode="outlined">
                <Card.Content>
                  <View style={styles.sectionCardHeader}>
                    <Text variant="labelLarge" style={styles.sectionNum}>{t('section')} {sIdx + 1}</Text>
                    <IconButton icon="delete" iconColor={Colors.destructive} size={18} onPress={() => removeSection(sIdx)} />
                  </View>

                  {section.entries.length > 0 && (
                    <View style={styles.entriesList}>
                      {section.entries.map((entry, eIdx) => {
                        if (entry.kind === 'dance') {
                          const d = (dances as any[]).find(d => d.id === entry.danceId)
                          const danceName = getDanceName(entry.danceId)
                          const tracks = (d as any)?.musicTracks ?? []
                          const selectedIds = entry.musicIds ?? []
                          return (
                            <View key={entry._key} style={styles.danceEntry}>
                              <View style={styles.danceEntryRow}>
                                <Text variant="bodyMedium" style={styles.danceEntryText} numberOfLines={1}>{danceName}</Text>
                                <IconButton icon="close" iconColor={Colors.mutedForeground} size={16}
                                  onPress={() => removeEntry(sIdx, eIdx)} style={styles.entryCloseBtn} />
                              </View>
                              {tracks.length > 0 && (
                                <View style={styles.musicChips}>
                                  {tracks.map((track: any) => {
                                    const active = selectedIds.includes(track.id)
                                    return (
                                      <Chip key={track.id} compact selected={active}
                                        onPress={() => toggleMusicId(sIdx, eIdx, track.id)}
                                        icon={active ? 'check' : 'music-note'}
                                        style={[styles.musicChip, active && styles.musicChipSelected]}
                                        textStyle={{ fontSize: 11, color: active ? Colors.primaryForeground : Colors.mutedForeground }}>
                                        {track.title}
                                      </Chip>
                                    )
                                  })}
                                </View>
                              )}
                            </View>
                          )
                        } else {
                          return (
                            <View key={entry._key} style={styles.textEntry}>
                              <View style={styles.textEntryHeader}>
                                <View style={{ flex: 1 }} />
                                <IconButton icon="close" iconColor={Colors.mutedForeground} size={16}
                                  onPress={() => removeEntry(sIdx, eIdx)} style={styles.entryCloseBtn} />
                              </View>
                              <TextInput label="Text (DE)" value={entry.content_de}
                                onChangeText={v => updateTextEntry(sIdx, eIdx, 'content_de', v)}
                                mode="outlined" outlineColor={Colors.border} activeOutlineColor={Colors.primary}
                                textColor={Colors.foreground} multiline
                                style={[styles.input, { backgroundColor: Colors.background }]} />
                              <TextInput label="Text (RU)" value={entry.content_ru}
                                onChangeText={v => updateTextEntry(sIdx, eIdx, 'content_ru', v)}
                                mode="outlined" outlineColor={Colors.border} activeOutlineColor={Colors.primary}
                                textColor={Colors.foreground} multiline
                                style={[styles.input, { backgroundColor: Colors.background }]} />
                            </View>
                          )
                        }
                      })}
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
          </>
        )}

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
  sectionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  editOrderBtn: { borderRadius: 6 },
  entriesList: { marginBottom: 8, gap: 6 },
  danceEntry: { backgroundColor: Colors.muted, borderRadius: 6, paddingVertical: 4, paddingRight: 4 },
  danceEntryRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  danceEntryText: { flex: 1, color: Colors.foreground },
  textEntry: { backgroundColor: Colors.muted, borderRadius: 6, padding: 8, paddingBottom: 0 },
  textEntryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  entryCloseBtn: { margin: 0 },
  musicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingBottom: 8, paddingLeft: 12, paddingRight: 8 },
  musicChip: { borderRadius: 4, backgroundColor: Colors.border },
  musicChipSelected: { backgroundColor: Colors.primary },
  addEntryRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  addBtn: { flex: 1, borderColor: Colors.border, borderRadius: 4 },
  addSectionBtn: { marginBottom: 16, borderColor: Colors.border, borderRadius: 4 },
  submitBtn: { borderRadius: 6 },
})
