import { StyleSheet, View } from 'react-native'
import { Card, Text, IconButton } from 'react-native-paper'
import type { MusicTrack } from '@/types/database'

interface Props {
  track: MusicTrack
  isPlaying: boolean
  onPress: () => void
}

export default function MusicCard({ track, isPlaying, onPress }: Props) {
  return (
    <Card
      style={[styles.card, isPlaying && styles.playing]}
      mode="elevated"
      onPress={onPress}
    >
      <Card.Content style={styles.content}>
        <View style={styles.info}>
          <Text variant="titleSmall" style={styles.title}>{track.title}</Text>
          {track.artist && <Text variant="bodySmall" style={styles.artist}>{track.artist}</Text>}
          <View style={styles.meta}>
            {track.tempo && <Text variant="bodySmall" style={styles.metaText}>{track.tempo} BPM</Text>}
            {track.genre && <Text variant="bodySmall" style={styles.metaText}>{track.genre}</Text>}
          </View>
        </View>
        <IconButton
          icon={isPlaying ? 'pause-circle' : 'play-circle'}
          iconColor={isPlaying ? '#6750a4' : '#aaa'}
          size={36}
          onPress={onPress}
        />
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 8, marginHorizontal: 12, backgroundColor: '#fff' },
  playing: { borderWidth: 2, borderColor: '#6750a4' },
  content: { flexDirection: 'row', alignItems: 'center', paddingRight: 0 },
  info: { flex: 1 },
  title: { fontWeight: 'bold' },
  artist: { opacity: 0.7 },
  meta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  metaText: { opacity: 0.5 },
})
