import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View, GestureResponderEvent } from 'react-native'
import { Text, IconButton } from 'react-native-paper'
import { Audio } from 'expo-av'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { toastService } from '@/lib/toastService'

interface Props {
  url: string
  title: string
  artist?: string
  onClose?: () => void
}

export default function AudioPlayer({ url, title, artist, onClose }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const isSeeking = useRef(false)
  const pendingSeekPos = useRef(0)  // stores seek target set during drag/tap

  useEffect(() => {
    let sound: Audio.Sound | null = null

    const load = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: true,
        })
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              if (!isSeeking.current) setPosition(status.positionMillis)
              setDuration(status.durationMillis ?? 0)
              setIsPlaying(status.isPlaying)
              if (status.didJustFinish) { setIsPlaying(false); setEnded(true) }
            }
          }
        )
        sound = s
        soundRef.current = s
        setIsPlaying(true)
      } catch (e) {
        toastService.show('toastAudioLoadError')
      }
    }

    load()
    return () => { sound?.unloadAsync(); soundRef.current = null }
  }, [url])

  const togglePlay = async () => {
    if (!soundRef.current) return
    if (ended) {
      await soundRef.current.setPositionAsync(0)
      await soundRef.current.playAsync()
      setEnded(false)
    } else if (isPlaying) {
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
  const trackWidthRef = useRef(0)
  const [trackWidth, setTrackWidth] = useState(0)
  const containerRef = useRef<View>(null)
  const containerPageXRef = useRef(0)

  const calcPosition = (event: GestureResponderEvent) => {
    const relX = event.nativeEvent.pageX - containerPageXRef.current
    const ratio = Math.max(0, Math.min(1, relX / trackWidthRef.current))
    return ratio * duration
  }

  const handleSeekStart = (event: GestureResponderEvent) => {
    if (!trackWidthRef.current || !duration) return
    isSeeking.current = true
    const pos = calcPosition(event)
    pendingSeekPos.current = pos
    setPosition(pos)
  }

  const handleSeekMove = (event: GestureResponderEvent) => {
    if (!trackWidthRef.current || !duration) return
    const pos = calcPosition(event)
    pendingSeekPos.current = pos
    setPosition(pos)
  }

  const handleSeekEnd = async () => {
    if (!soundRef.current) return
    const pos = pendingSeekPos.current
    await soundRef.current.setPositionAsync(pos)
    // keep isSeeking true briefly so status callback doesn't overwrite with stale value
    setTimeout(() => { isSeeking.current = false }, 300)
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.info}>
          <Text variant="bodyMedium" style={styles.title} numberOfLines={1}>{title}</Text>
          {artist && <Text variant="bodySmall" style={styles.artist}>{artist}</Text>}
        </View>
        {onClose && <IconButton icon="close" size={18} onPress={onClose} iconColor={Colors.mutedForeground} style={styles.closeBtn} />}
      </View>
      <View style={styles.progressRow}>
        <Text variant="bodySmall" style={styles.time}>{formatTime(position)}</Text>
        <View
          ref={containerRef}
          style={styles.progressContainer}
          onLayout={e => {
            const w = e.nativeEvent.layout.width
            trackWidthRef.current = w
            setTrackWidth(w)
            containerRef.current?.measure((_x, _y, _w, _h, pageX) => {
              containerPageXRef.current = pageX
            })
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onStartShouldSetResponderCapture={() => true}
          onMoveShouldSetResponderCapture={() => true}
          onResponderGrant={handleSeekStart}
          onResponderMove={handleSeekMove}
          onResponderRelease={handleSeekEnd}
          onResponderTerminationRequest={() => false}
        >
          <View style={styles.progressTrack} pointerEvents="none">
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          {trackWidth > 0 && (
            <View style={[styles.progressThumb, { left: progress * trackWidth - 9 }]} pointerEvents="none" />
          )}
        </View>
        <Text variant="bodySmall" style={styles.time}>{formatTime(duration)}</Text>
        <IconButton icon={isPlaying ? 'pause' : ended ? 'replay' : 'play'} size={28} onPress={togglePlay} iconColor={Colors.primary} style={styles.playBtn} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: Colors.secondary, borderTopWidth: 2, borderTopColor: Colors.primary },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  info: { flex: 1 },
  title: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground },
  artist: { color: Colors.mutedForeground },
  closeBtn: { margin: 0, marginLeft: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  playBtn: { margin: 0, marginLeft: 4 },
  progressContainer: { flex: 1, height: 36, justifyContent: 'center' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  progressThumb: { position: 'absolute', top: 9, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.secondary },
  time: { color: Colors.mutedForeground, minWidth: 36, fontSize: 11 },
})
