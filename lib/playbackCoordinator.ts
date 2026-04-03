type Listener = () => void
const listeners = new Set<Listener>()

export function onVideoPauseRequest(fn: Listener) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export function requestPauseAllVideos() {
  listeners.forEach(fn => fn())
}
