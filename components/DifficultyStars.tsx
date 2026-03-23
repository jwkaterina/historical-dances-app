import { View, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '@/lib/colors'

const DIFFICULTY_MAP: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
}

interface Props {
  difficulty: string
  size?: number
}

export default function DifficultyStars({ difficulty, size = 14 }: Props) {
  const level = DIFFICULTY_MAP[difficulty] ?? 0
  if (level === 0) return null

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4].map(i => (
        <MaterialCommunityIcons
          key={i}
          name={i <= level ? 'star' : 'star-outline'}
          size={size}
          color={Colors.primary}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
})
