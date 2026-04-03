import { useState, useEffect, useMemo, useCallback } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text, Card, Divider, Button, ActivityIndicator, Snackbar, TextInput, IconButton } from 'react-native-paper'
import { useLocalSearchParams } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBall } from '@/hooks/useBalls'
import { useBallPartners, useSaveBallPartner } from '@/hooks/useBallPartners'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import type { SectionDance } from '@/types/database'

export default function PartnersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, language } = useLanguage()

  const { data: ball, isLoading: ballLoading } = useBall(id)
  const { data: existingPartners = {}, isLoading: partnersLoading } = useBallPartners(id)
  const saveMutation = useSaveBallPartner()
  const [snackbar, setSnackbar] = useState('')

  // savedMap = what's persisted, draftMap = current input values, editingSet = which are in edit mode
  const [savedMap, setSavedMap] = useState<Record<string, string>>({})
  const [draftMap, setDraftMap] = useState<Record<string, string>>({})
  const [editingSet, setEditingSet] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!partnersLoading && !initialized) {
      setSavedMap(existingPartners)
      setDraftMap(existingPartners)
      setInitialized(true)
    }
  }, [existingPartners, partnersLoading, initialized])

  const sections = useMemo(() => {
    if (!ball) return []
    return [...(ball.ball_sections || [])].sort((a, b) => a.order_index - b.order_index)
  }, [ball])

  const getSectionName = (index: number) =>
    language === 'ru' ? `Отделение ${index + 1}` : `Abteilung ${index + 1}`

  const handleSaveOne = useCallback(async (sectionDanceId: string) => {
    const partnerName = draftMap[sectionDanceId] ?? ''
    try {
      await saveMutation.mutateAsync({ ballId: id, sectionDanceId, partnerName })
      const trimmed = partnerName.trim()
      setSavedMap(prev => {
        const next = { ...prev }
        if (trimmed) next[sectionDanceId] = trimmed
        else delete next[sectionDanceId]
        return next
      })
      setDraftMap(prev => ({ ...prev, [sectionDanceId]: trimmed }))
      setEditingSet(prev => { const next = new Set(prev); next.delete(sectionDanceId); return next })
      setSnackbar(t('partnersSaved'))
    } catch {
      setSnackbar(t('partnersSaveFailed'))
    }
  }, [draftMap, id, saveMutation, t])

  const startEditing = useCallback((sectionDanceId: string) => {
    setEditingSet(prev => new Set(prev).add(sectionDanceId))
  }, [])

  const cancelEditing = useCallback((sectionDanceId: string) => {
    setDraftMap(prev => ({ ...prev, [sectionDanceId]: savedMap[sectionDanceId] ?? '' }))
    setEditingSet(prev => { const next = new Set(prev); next.delete(sectionDanceId); return next })
  }, [savedMap])

  if (ballLoading || partnersLoading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
  }

  if (!ball) {
    return <View style={styles.center}><Text style={{ color: Colors.mutedForeground }}>{t('ballNotFound')}</Text></View>
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {sections.map((section, sectionIndex) => {
          const dances = [...(section.section_dances || [])].sort((a, b) => a.order_index - b.order_index)
          if (dances.length === 0) return null

          let danceCount = 0
          return (
            <Card key={section.id} style={styles.sectionCard} mode="outlined">
              <Card.Title title={getSectionName(sectionIndex)} titleVariant="titleMedium" titleStyle={styles.sectionTitle} />
              <Divider style={styles.divider} />
              {dances.map((sd: SectionDance) => {
                danceCount++
                const dance = sd.dances
                const danceName = dance
                  ? (language === 'de' ? dance.name_de : dance.name_ru) ?? dance.name ?? ''
                  : '—'

                const savedName = savedMap[sd.id] ?? ''
                const draftName = draftMap[sd.id] ?? ''
                const hasSaved = !!savedName
                const isEditing = editingSet.has(sd.id)
                const isDirty = draftName.trim() !== savedName

                return (
                  <View key={sd.id} style={styles.danceRow}>
                    <View style={styles.danceInfo}>
                      <View style={styles.entryNum}>
                        <Text variant="bodySmall" style={styles.num}>{danceCount}</Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.danceName} numberOfLines={2}>{danceName}</Text>
                    </View>

                    {hasSaved && !isEditing ? (
                      <View style={styles.savedRow}>
                        <View style={styles.savedInfo}>
                          <IconButton icon="account" size={18} iconColor={Colors.primary} style={styles.partnerIcon} />
                          <Text variant="bodyMedium" style={styles.partnerText}>{savedName}</Text>
                        </View>
                        <Button
                          compact
                          mode="text"
                          icon="pencil"
                          textColor={Colors.primary}
                          onPress={() => startEditing(sd.id)}
                        >
                          {t('edit')}
                        </Button>
                      </View>
                    ) : (
                      <View style={styles.editRow}>
                        <TextInput
                          mode="outlined"
                          dense
                          placeholder={t('partnerName')}
                          value={draftName}
                          onChangeText={text => setDraftMap(prev => ({ ...prev, [sd.id]: text }))}
                          style={styles.input}
                          outlineColor={Colors.border}
                          activeOutlineColor={Colors.primary}
                          textColor={Colors.foreground}
                        />
                        {hasSaved && (
                          <Button compact mode="text" textColor={Colors.mutedForeground} onPress={() => cancelEditing(sd.id)}>
                            {t('cancel')}
                          </Button>
                        )}
                        <Button
                          compact
                          mode="contained"
                          buttonColor={Colors.primary}
                          textColor={Colors.primaryForeground}
                          disabled={!isDirty && hasSaved}
                          onPress={() => handleSaveOne(sd.id)}
                        >
                          {t('save')}
                        </Button>
                      </View>
                    )}
                  </View>
                )
              })}
            </Card>
          )
        })}
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionCard: { marginBottom: 16, backgroundColor: Colors.card, borderColor: Colors.border, paddingBottom: 4 },
  sectionTitle: { fontFamily: Fonts.heading, color: Colors.foreground },
  divider: { marginBottom: 4, backgroundColor: Colors.border },
  danceRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  danceInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  entryNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  num: { color: Colors.primaryForeground, fontFamily: Fonts.heading, fontSize: 11 },
  danceName: { flex: 1, color: Colors.foreground, fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  savedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.muted, borderRadius: 8, paddingVertical: 4, paddingLeft: 4, paddingRight: 8 },
  savedInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  partnerIcon: { margin: 0 },
  partnerText: { color: Colors.foreground, fontFamily: Fonts.body },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { backgroundColor: Colors.card, fontSize: 14, flex: 1 },
})
