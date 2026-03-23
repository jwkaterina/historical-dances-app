import { View, StyleSheet } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import DifficultyStars from '@/components/DifficultyStars'
import FavoriteButton from '@/components/FavoriteButton'
import DanceListSelector from '@/components/DanceListSelector'
import type { Dance } from '@/types/database'

interface Props {
  dance: Dance
  onPress: () => void
}

export default function DanceCard({ dance, onPress }: Props) {
  const { t, language } = useLanguage()
  const name = (language === 'de' ? dance.name_de : dance.name_ru) ?? dance.name ?? ''

  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.topRow}>
          {dance.difficulty ? (
            <DifficultyStars difficulty={dance.difficulty} />
          ) : <View />}
          <View style={styles.actions}>
            <FavoriteButton danceId={dance.id} size={20} />
            <DanceListSelector danceId={dance.id} size={20} />
          </View>
        </View>
        <Text variant="titleMedium" style={styles.name}>{name}</Text>
        {dance.origin && (
          <Text variant="bodySmall" style={styles.origin}>{dance.origin}</Text>
        )}
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 8, backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  content: { paddingVertical: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground },
  origin: { color: Colors.mutedForeground, marginTop: 2 },
})
