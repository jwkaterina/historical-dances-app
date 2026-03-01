import { StyleSheet, TouchableOpacity } from 'react-native'
import { Card, Text, Chip } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Dance } from '@/types/database'

interface Props {
  dance: Dance
  onPress: () => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#4caf50',
  intermediate: '#2196f3',
  advanced: '#ff9800',
  expert: '#f44336',
}

export default function DanceCard({ dance, onPress }: Props) {
  const { t, language } = useLanguage()
  const name = (language === 'de' ? dance.name_de : dance.name_ru) ?? dance.name ?? ''
  const diffColor = dance.difficulty ? DIFFICULTY_COLORS[dance.difficulty] : undefined

  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={styles.name}>{name}</Text>
        <Card.Actions style={styles.actions}>
          {dance.origin && (
            <Text variant="bodySmall" style={styles.origin}>{dance.origin}</Text>
          )}
          {dance.difficulty && diffColor && (
            <Chip
              compact
              style={[styles.chip, { backgroundColor: diffColor + '22' }]}
              textStyle={{ color: diffColor, fontSize: 11 }}
            >
              {t(dance.difficulty as any)}
            </Chip>
          )}
        </Card.Actions>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 8, backgroundColor: '#fff' },
  content: { paddingBottom: 4 },
  name: { fontWeight: 'bold' },
  actions: { paddingHorizontal: 0, paddingTop: 4, justifyContent: 'space-between' },
  origin: { opacity: 0.6, flex: 1 },
  chip: { height: 24, borderRadius: 12 },
})
