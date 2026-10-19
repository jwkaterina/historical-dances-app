import { Audio } from 'expo-av'

/**
 * Length of a picked audio file in ms, read from the local copy before upload
 * (no download). Null if it can't be read; the song then shows no length.
 */
export async function localAudioDurationMs(localUri: string): Promise<number | null> {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri: localUri }, { shouldPlay: false })
    const status = await sound.getStatusAsync()
    await sound.unloadAsync()
    return status.isLoaded && status.durationMillis ? Math.round(status.durationMillis) : null
  } catch {
    return null
  }
}
