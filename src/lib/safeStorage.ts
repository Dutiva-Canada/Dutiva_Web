/** localStorage when available; null under SSR / private mode / disabled storage. */
export function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}
