import type { TranslationKey } from '@/lib/translations'

export type ToastAction = { label: string; onPress: () => void }
type ShowFn = (key: TranslationKey, action?: ToastAction) => void
let showFn: ShowFn | null = null
let lastKey: TranslationKey | null = null
let lastAt = 0

export const toastService = {
  register: (fn: ShowFn | null) => { showFn = fn },
  show: (key: TranslationKey, action?: ToastAction) => {
    const now = Date.now()
    if (key === lastKey && now - lastAt < 5000) return
    lastKey = key
    lastAt = now
    showFn?.(key, action)
  },
}

export function isNetworkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()
  return (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('networkerror')
  )
}
