import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View, GestureResponderEvent, TouchableOpacity } from 'react-native'
import { Text, IconButton, Modal, Portal, TouchableRipple } from 'react-native-paper'
import { Audio } from 'expo-av'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { toastService } from '@/lib/toastService'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]

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
  const [speedIndex, setSpeedIndex] = useState(2) // default: 1x
  const [speedSheetVisible, setSpeedSheetVisible] = useState(false)
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
          { shouldPlay: true, rate: SPEEDS[speedIndex], shouldCorrectPitch: true },
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

  const selectSpeed = async (index: number) => {
    setSpeedIndex(index)
    setSpeedSheetVisible(false)
    if (soundRef.current) {
      await soundRef.current.setRateAsync(SPEEDS[index], true)
    }
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
        <TouchableOpacity onPress={() => setSpeedSheetVisible(true)} style={styles.speedBtn}>
          <Text style={styles.speedText}>{SPEEDS[speedIndex]}×</Text>
        </TouchableOpacity>
      </View>
      <Portal>
        <Modal visible={speedSheetVisible} onDismiss={() => setSpeedSheetVisible(false)} contentContainerStyle={styles.sheet}>
          {SPEEDS.map((speed, i) => (
            <TouchableRipple key={speed} onPress={() => selectSpeed(i)} style={styles.speedOption}>
              <Text style={[styles.speedOptionText, i === speedIndex && styles.speedOptionActive]}>
                {speed}×
              </Text>
            </TouchableRipple>
          ))}
        </Modal>
      </Portal>
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
  speedBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  speedText: { color: Colors.primary, fontSize: 12, fontFamily: Fonts.bodySemiBold, minWidth: 32, textAlign: 'center' },
  sheet: { backgroundColor: Colors.background, marginHorizontal: 80, borderRadius: 12, paddingVertical: 8 },
  speedOption: { paddingVertical: 14, paddingHorizontal: 24 },
  speedOptionText: { fontSize: 16, textAlign: 'center', color: Colors.foreground, fontFamily: Fonts.body },
  speedOptionActive: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
})
