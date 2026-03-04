import { useState, useEffect, useRef } from 'react'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '@/lib/supabase'
import { canDownloadNow } from '@/lib/downloadPrefs'
import { toastService } from '@/lib/toastService'

export type DownloadState = 'idle' | 'downloading' | 'downloaded'

const TRACKS_DIR = (FileSystem.documentDirectory ?? '') + 'tracks/'

export function trackFilePath(trackId: string) {
  return TRACKS_DIR + trackId
}

async function isDownloaded(trackId: string) {
  const info = await FileSystem.getInfoAsync(trackFilePath(trackId))
  return info.exists
}

/** Thrown by resolvePlayUrl when a non-downloaded track cannot be streamed (no internet). */
export class TrackNotAvailableOfflineError extends Error {
  constructor() { super('Track not available offline') }
}

/** Parse a Supabase public storage URL into { bucket, path }. */
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
  if (!match) return null
  return { bucket: match[1], path: match[2] }
}

/**
 * Returns the local file path if downloaded, otherwise a short-lived
 * signed URL for streaming (avoids auth/redirect issues on Android).
 * Throws TrackNotAvailableOfflineError if the track is not downloaded
 * and a signed URL cannot be obtained (no internet / auth failure).
 */
export async function resolvePlayUrl(trackId: string, audioUrl: string): Promise<string> {
  const local = await isDownloaded(trackId)
  if (local) return trackFilePath(trackId)

  const parsed = parseStorageUrl(audioUrl)
  if (parsed) {
    try {
      const { data } = await supabase.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, 3600)
      if (data?.signedUrl) return data.signedUrl
    } catch {
      // network error — fall through to throw below
    }
  }

  throw new TrackNotAvailableOfflineError()
}

export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(trackFilePath(trackId))
  return info.exists
}

/** Deletes all downloaded track files. */
export async function deleteAllTrackFiles(): Promise<void> {
  try { await FileSystem.deleteAsync(TRACKS_DIR, { idempotent: true }) } catch {}
}

/** Downloads a single track file. Returns true on success. */
export async function downloadTrackFile(trackId: string, audioUrl: string): Promise<boolean> {
  try {
    await FileSystem.makeDirectoryAsync(TRACKS_DIR, { intermediates: true })
    const result = await FileSystem.downloadAsync(audioUrl, trackFilePath(trackId))
    if (result?.status === 200) return true
    await FileSystem.deleteAsync(trackFilePath(trackId), { idempotent: true })
    return false
  } catch {
    return false
  }
}

export function useTrackDownload(trackId: string, audioUrl: string | null) {
  const [state, setState] = useState<DownloadState>('idle')
  const [progress, setProgress] = useState(0)
  const dlRef = useRef<FileSystem.DownloadResumable | null>(null)

  useEffect(() => {
    isDownloaded(trackId).then(exists => {
      if (exists) setState('downloaded')
    })
  }, [trackId])

  const download = async () => {
    if (!audioUrl || state !== 'idle') return
    if (!await canDownloadNow()) {
      toastService.show('wifiRequiredForDownload')
      return
    }
    setState('downloading')
    setProgress(0)
    try {
      await FileSystem.makeDirectoryAsync(TRACKS_DIR, { intermediates: true })
      const dl = FileSystem.createDownloadResumable(
        audioUrl,
        trackFilePath(trackId),
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100))
          }
        },
      )
      dlRef.current = dl
      const result = await dl.downloadAsync()
      dlRef.current = null
      if (result?.status === 200) {
        setState('downloaded')
      } else {
        await FileSystem.deleteAsync(trackFilePath(trackId), { idempotent: true })
        setState('idle')
      }
    } catch {
      dlRef.current = null
      setState('idle')
    }
  }

  const remove = async () => {
    try { await FileSystem.deleteAsync(trackFilePath(trackId), { idempotent: true }) } catch {}
    setState('idle')
    setProgress(0)
  }

  return {
    state,
    progress,
    download,
    remove,
    localPath: state === 'downloaded' ? trackFilePath(trackId) : null,
  }
}
