import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, IconButton, ProgressBar } from 'react-native-paper'
import { Audio } from 'expo-av'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

interface Props {
  url: string
  title: string
  artist?: string
  onClose?: () => void
}

export default function AudioPlayer({ url, title, artist, onClose }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    let sound: Audio.Sound | null = null

    const load = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPosition(status.positionMillis)
              setDuration(status.durationMillis ?? 0)
              setIsPlaying(status.isPlaying)
              if (status.didJustFinish) setIsPlaying(false)
            }
          }
        )
        sound = s
        soundRef.current = s
        setIsPlaying(true)
      } catch (e) {
        console.error('Audio load error', e)
      }
    }

    load()
    return () => { sound?.unloadAsync(); soundRef.current = null }
  }, [url])

  const togglePlay = async () => {
    if (!soundRef.current) return
    if (isPlaying) await soundRef.current.pauseAsync()
    else await soundRef.current.playAsync()
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const progress = duration > 0 ? position / duration : 0

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="bodyMedium" style={styles.title} numberOfLines={1}>{title}</Text>
          {artist && <Text variant="bodySmall" style={styles.artist}>{artist}</Text>}
        </View>
        <View style={styles.buttons}>
          <IconButton icon={isPlaying ? 'pause' : 'play'} size={28} onPress={togglePlay} iconColor={Colors.primary} />
          {onClose && <IconButton icon="close" size={20} onPress={onClose} iconColor={Colors.mutedForeground} />}
        </View>
      </View>
      <View style={styles.progressRow}>
        <Text variant="bodySmall" style={styles.time}>{formatTime(position)}</Text>
        <ProgressBar progress={progress} style={styles.progress} color={Colors.primary} />
        <Text variant="bodySmall" style={styles.time}>{formatTime(duration)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  title: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground },
  artist: { color: Colors.mutedForeground },
  buttons: { flexDirection: 'row' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progress: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  time: { color: Colors.mutedForeground, minWidth: 36, fontSize: 11 },
})
