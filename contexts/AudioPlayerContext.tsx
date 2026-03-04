import { createContext, useContext, useState, useCallback } from 'react'
import type { MusicTrack } from '@/types/database'
import { resolvePlayUrl } from '@/hooks/useTrackDownload'
import { toastService } from '@/lib/toastService'

export const PLAYER_HEIGHT = 96

interface AudioPlayerState {
  currentTrack: MusicTrack | null
  playUrl: string | null
  play: (track: MusicTrack) => Promise<void>
  stop: () => void
}

const AudioPlayerContext = createContext<AudioPlayerState | null>(null)

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [playUrl, setPlayUrl] = useState<string | null>(null)

  const play = useCallback(async (track: MusicTrack) => {
    if (currentTrack?.id === track.id) {
      setCurrentTrack(null); setPlayUrl(null); return
    }
    if (!track.audio_url) {
      setCurrentTrack(track); setPlayUrl(null); return
    }
    try {
      const url = await resolvePlayUrl(track.id, track.audio_url)
      setCurrentTrack(track); setPlayUrl(url)
    } catch {
      toastService.show('toastNoInternetForPlayback')
    }
  }, [currentTrack])

  const stop = useCallback(() => {
    setCurrentTrack(null); setPlayUrl(null)
  }, [])

  return (
    <AudioPlayerContext.Provider value={{ currentTrack, playUrl, play, stop }}>
      {children}
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  return ctx
}
