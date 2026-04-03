import { useState, useEffect } from 'react'
import { Audio } from 'expo-av'

const cache = new Map<string, number>()

export function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function useTrackDuration(trackId: string, audioUrl: string | null) {
  const [duration, setDuration] = useState<number | null>(cache.get(trackId) ?? null)

  useEffect(() => {
    if (!audioUrl || cache.has(trackId)) return
    let cancelled = false

    Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: false })
      .then(async ({ sound }) => {
        const status = await sound.getStatusAsync()
        if (!cancelled && status.isLoaded && status.durationMillis) {
          cache.set(trackId, status.durationMillis)
          setDuration(status.durationMillis)
        }
        await sound.unloadAsync()
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [trackId, audioUrl])

  return duration
}
