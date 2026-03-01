import { StyleSheet, View } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { format } from 'date-fns'
import { useLanguage } from '@/contexts/LanguageContext'
import type { BallWithSections } from '@/types/database'

interface Props {
  ball: BallWithSections
  onPress: () => void
}

export default function BallCard({ ball, onPress }: Props) {
  const { language } = useLanguage()
  const name = (language === 'de' ? ball.name_de : ball.name_ru) ?? ball.name ?? ''
  const place = (language === 'de' ? ball.place_de : ball.place_ru) ?? ball.place ?? ''
  const formattedDate = ball.date ? format(new Date(ball.date), 'dd.MM.yyyy') : ''

  const danceCount = (ball.ball_sections ?? [])
    .flatMap(s => s.section_dances ?? []).length

  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.name}>{name}</Text>
        <View style={styles.meta}>
          {formattedDate ? <Text variant="bodySmall" style={styles.metaText}>{formattedDate}</Text> : null}
          {place ? <Text variant="bodySmall" style={styles.metaText}>{place}</Text> : null}
          {danceCount > 0 ? <Text variant="bodySmall" style={styles.metaText}>{danceCount} Tänze</Text> : null}
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 8, backgroundColor: '#fff' },
  name: { fontWeight: 'bold', marginBottom: 4 },
  meta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaText: { opacity: 0.6 },
})
