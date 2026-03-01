import { ScrollView, StyleSheet, View } from 'react-native'
import { Text, Card, Divider, Button, ActivityIndicator, Chip } from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { format } from 'date-fns'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBall, useDeleteBall } from '@/hooks/useBalls'
import { useAuth } from '@/hooks/useAuth'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useState } from 'react'
import type { BallSection, SectionDance, SectionText } from '@/types/database'

type SectionEntry =
  | { type: 'dance'; data: SectionDance; order_index: number }
  | { type: 'text'; data: SectionText; order_index: number }

function buildEntries(section: BallSection): SectionEntry[] {
  const danceEntries: SectionEntry[] = (section.section_dances || []).map(d => ({
    type: 'dance',
    data: d,
    order_index: d.order_index,
  }))
  const textEntries: SectionEntry[] = (section.section_texts || []).map(t => ({
    type: 'text',
    data: t,
    order_index: t.order_index,
  }))
  return [...danceEntries, ...textEntries].sort((a, b) => a.order_index - b.order_index)
}

export default function BallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)

  const { data: ball, isLoading } = useBall(id)
  const deleteMutation = useDeleteBall()

  if (isLoading) {
    return <ActivityIndicator style={styles.center} size="large" />
  }

  if (!ball) {
    return (
      <View style={styles.center}>
        <Text>{t('ballNotFound')}</Text>
      </View>
    )
  }

  const name = (language === 'de' ? ball.name_de : ball.name_ru) ?? ball.name ?? ''
  const place = (language === 'de' ? ball.place_de : ball.place_ru) ?? ball.place ?? ''
  const formattedDate = ball.date ? format(new Date(ball.date), 'dd.MM.yyyy') : ''
  const sections = [...(ball.ball_sections || [])].sort((a, b) => a.order_index - b.order_index)

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(ball.id)
    router.back()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>{name}</Text>

      <View style={styles.meta}>
        {formattedDate ? <Text variant="bodyMedium" style={styles.metaText}>{formattedDate}</Text> : null}
        {place ? <Text variant="bodyMedium" style={styles.metaText}>{place}</Text> : null}
      </View>

      {sections.map((section) => {
        const sectionName = (language === 'de' ? section.name_de : section.name_ru) ?? section.name ?? ''
        const entries = buildEntries(section)

        return (
          <View key={section.id} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>{sectionName}</Text>
            <Divider style={styles.divider} />

            {entries.map((entry, idx) => {
              if (entry.type === 'dance') {
                const dance = (entry.data as SectionDance).dances
                const danceName = dance
                  ? (language === 'de' ? dance.name_de : dance.name_ru) ?? dance.name ?? ''
                  : '—'
                return (
                  <View key={idx} style={styles.entryRow}>
                    <View style={styles.entryNum}>
                      <Text variant="bodySmall" style={styles.num}>{idx + 1}</Text>
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={styles.danceName}
                      onPress={() => dance && router.push(`/dance/${dance.id}`)}
                    >
                      {danceName}
                    </Text>
                    {dance?.difficulty && (
                      <Chip compact style={styles.diffChip}>
                        {t(dance.difficulty as any)}
                      </Chip>
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
          <Button
            mode="outlined"
            icon="pencil"
            onPress={() => router.push(`/(tabs)/balls/create?edit=${ball.id}`)}
            style={styles.actionBtn}
          >
            {t('edit')}
          </Button>
          <Button
            mode="outlined"
            icon="delete"
            textColor="red"
            onPress={() => setShowDelete(true)}
            style={styles.actionBtn}
          >
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8 },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 16, opacity: 0.7 },
  metaText: {},
  section: { marginBottom: 24 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 4 },
  divider: { marginBottom: 8 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  entryNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6750a4', justifyContent: 'center', alignItems: 'center' },
  num: { color: '#fff', fontWeight: 'bold' },
  danceName: { flex: 1, color: '#6750a4' },
  diffChip: { height: 24 },
  textCard: { marginVertical: 4, backgroundColor: '#f0edf6' },
  textContent: { opacity: 0.8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, justifyContent: 'center' },
  actionBtn: { flex: 1 },
})
