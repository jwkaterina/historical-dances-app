import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, IconButton, ProgressBar } from 'react-native-paper'
import { Audio } from 'expo-av'

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

    return () => {
      sound?.unloadAsync()
      soundRef.current = null
    }
  }, [url])

  const togglePlay = async () => {
    if (!soundRef.current) return
    if (isPlaying) {
      await soundRef.current.pauseAsync()
    } else {
      await soundRef.current.playAsync()
    }
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const progress = duration > 0 ? position / duration : 0

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text variant="bodyMedium" style={styles.title} numberOfLines={1}>{title}</Text>
        {artist && <Text variant="bodySmall" style={styles.artist}>{artist}</Text>}
      </View>
      <View style={styles.controls}>
        <Text variant="bodySmall" style={styles.time}>{formatTime(position)}</Text>
        <ProgressBar progress={progress} style={styles.progress} color="#6750a4" />
        <Text variant="bodySmall" style={styles.time}>{formatTime(duration)}</Text>
      </View>
      <View style={styles.buttons}>
        <IconButton
          icon={isPlaying ? 'pause' : 'play'}
          size={28}
          onPress={togglePlay}
          iconColor="#6750a4"
        />
        {onClose && (
          <IconButton icon="close" size={20} onPress={onClose} iconColor="#aaa" />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  info: { marginBottom: 8 },
  title: { fontWeight: 'bold' },
  artist: { opacity: 0.7 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progress: { flex: 1, height: 4, borderRadius: 2 },
  time: { opacity: 0.5, minWidth: 36 },
  buttons: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
})
