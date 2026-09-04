import { readPref, writePref } from '@/lib/prefs'
import { initialPrefs } from './settingsData'
import type { PrefKey } from './settingsData'

const PREFS_KEY = 'dutiva.settings.prefs.v1'

/** Device-local Settings preference toggles (notifications + AI chrome). */
export function readSettingsPrefs(): Record<PrefKey, boolean> {
  try {
    const raw = readPref(PREFS_KEY, '')
    if (!raw) return { ...initialPrefs }
    const parsed = JSON.parse(raw) as Partial<Record<PrefKey, boolean>>
    return { ...initialPrefs, ...parsed }
  } catch {
    return { ...initialPrefs }
  }
}

export function writeSettingsPrefs(prefs: Record<PrefKey, boolean>): void {
  writePref(PREFS_KEY, JSON.stringify(prefs))
}
