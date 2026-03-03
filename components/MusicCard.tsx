import { StyleSheet, View } from 'react-native'
import { Card, Text, IconButton } from 'react-native-paper'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import type { MusicTrack } from '@/types/database'

interface Props {
  track: MusicTrack
  isPlaying: boolean
  language: string
  onPress: () => void
}

export default function MusicCard({ track, isPlaying, language, onPress }: Props) {
  const dances = (track.dance_music ?? [])
    .map(dm => dm.dances)
    .filter(Boolean)
  const danceNames = dances
    .map(d => (language === 'de' ? d!.name_de : d!.name_ru) ?? '')
    .filter(Boolean)
    .join(', ')

  return (
    <Card
      style={[styles.card, isPlaying && styles.playing]}
      mode="elevated"
      onPress={onPress}
    >
      <Card.Content style={styles.content}>
        <View style={styles.info}>
          {danceNames ? (
            <>
              <Text variant="titleSmall" style={styles.title}>{danceNames}</Text>
              <Text variant="bodySmall" style={styles.trackName}>{track.title}</Text>
            </>
          ) : (
            <Text variant="titleSmall" style={styles.title}>{track.title}</Text>
          )}
          <View style={styles.meta}>
            {track.tempo && <Text variant="bodySmall" style={styles.metaText}>{track.tempo} BPM</Text>}
            {track.genre && <Text variant="bodySmall" style={styles.metaText}>{track.genre}</Text>}
          </View>
        </View>
        <IconButton
          icon={isPlaying ? 'pause-circle' : 'play-circle'}
          iconColor={isPlaying ? Colors.primary : Colors.accent}
          size={36}
          onPress={onPress}
        />
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 8, marginHorizontal: 12, backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  playing: { borderColor: Colors.primary, borderWidth: 2 },
  content: { flexDirection: 'row', alignItems: 'center', paddingRight: 0 },
  info: { flex: 1 },
  title: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground },
  trackName: { color: Colors.mutedForeground, marginTop: 1 },
  meta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  metaText: { color: Colors.mutedForeground },
})
