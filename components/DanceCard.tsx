import { View, StyleSheet } from 'react-native'
import { Card, Text, Chip } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
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
        <View style={styles.row}>
          <View style={styles.left}>
            <Text variant="titleMedium" style={styles.name}>{name}</Text>
            {dance.origin && (
              <Text variant="bodySmall" style={styles.origin}>{dance.origin}</Text>
            )}
          </View>
          {dance.difficulty && (
            <Chip
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {t(dance.difficulty as any)}
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 8, backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  content: { paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  left: { flex: 1 },
  name: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground },
  origin: { color: Colors.mutedForeground, marginTop: 2 },
  chip: { height: 32, borderRadius: 6, backgroundColor: Colors.secondary },
  chipText: { color: Colors.secondaryForeground, fontSize: 12, fontFamily: Fonts.bodySemiBold },
})
