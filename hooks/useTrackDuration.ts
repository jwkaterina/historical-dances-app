// Song lengths come from music.duration_ms. Never work them out by opening the
// audio file: that downloads it, and a list of songs would fetch every one.
export function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
