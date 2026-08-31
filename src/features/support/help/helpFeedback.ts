/**
 * "Was this helpful?" state for Help Centre articles.
 *
 * This is deliberately local-only: a vote is remembered in `localStorage` so
 * the widget doesn't nag a returning reader, and that's the whole contract
 * today. There is no analytics backend wired yet — privacy-conscious support
 * analytics is a later phase — so nothing is transmitted. `recordHelpfulness`
 * is the single seam a future analytics sink would hook, without changing any
 * caller.
 *
 * Everything is guarded: prerender has no `window`, and Safari private mode
 * throws on `localStorage` access. In those cases the widget still works; it
 * just can't remember the vote across visits.
 */

export type Helpfulness = 'yes' | 'no'

const STORAGE_PREFIX = 'dutiva.help.feedback.'

export function feedbackStorageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`
}

/** The browser's localStorage, or null when it's unavailable/inaccessible. */
function defaultStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function isHelpfulness(value: unknown): value is Helpfulness {
  return value === 'yes' || value === 'no'
}

/** Any prior vote for this article, or null if none / storage unavailable. */
export function readHelpfulness(
  slug: string,
  storage: Storage | null = defaultStorage(),
): Helpfulness | null {
  if (!storage) return null
  try {
    const value = storage.getItem(feedbackStorageKey(slug))
    return isHelpfulness(value) ? value : null
  } catch {
    return null
  }
}

/**
 * Persist a vote for an article. Returns the recorded value regardless of
 * whether storage succeeded, so the widget can update immediately.
 */
export function recordHelpfulness(
  slug: string,
  value: Helpfulness,
  storage: Storage | null = defaultStorage(),
): Helpfulness {
  if (storage) {
    try {
      storage.setItem(feedbackStorageKey(slug), value)
    } catch {
      // Best-effort only — a full or blocked store must not break the UI.
    }
  }
  return value
}
