/**
 * Daily-rotated opaque visitor id for anonymous Help Centre analytics
 * (docs/SUPPORT_ANALYTICS.md §2). A random id is generated once per day per
 * browser and stored in localStorage under `dutiva.analytics.visitor`. It
 * lets us deduplicate helpfulness votes and stitch a single visit's search
 * → article → vote sequence without identifying a person — the id rotates
 * daily, carries no user or workspace information, and is never sent to a
 * third party.
 *
 * Same storage-availability guard as helpFeedback.ts: prerender has no
 * `window`, Safari private mode throws on `localStorage` access, and both
 * are handled by returning `null` — the widget still works, the event just
 * doesn't carry a visitor id.
 */

import { safeLocalStorage } from '@/lib/safeStorage'

const STORAGE_KEY = 'dutiva.analytics.visitor'
const DATE_KEY = 'dutiva.analytics.visitor.date'

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function randomId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    // Fallback for non-secure contexts — enough randomness for dedup, not for security
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

/**
 * The current daily visitor id, creating one if none exists or the stored one
 * is from a previous day. Returns `null` when localStorage is unavailable.
 */
export function getVisitorId(storage: Storage | null = safeLocalStorage()): string | null {
  if (!storage) return null
  try {
    const storedDate = storage.getItem(DATE_KEY)
    const today = todayUtc()
    if (storedDate !== today) {
      const id = randomId()
      storage.setItem(STORAGE_KEY, id)
      storage.setItem(DATE_KEY, today)
      return id
    }
    const id = storage.getItem(STORAGE_KEY)
    if (!id) {
      const newId = randomId()
      storage.setItem(STORAGE_KEY, newId)
      return newId
    }
    return id
  } catch {
    return null
  }
}
