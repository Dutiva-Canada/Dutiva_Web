import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { homePriorities } from '@/features/app/views/home/homeData'

/**
 * Advisor home (empty state) — the daily brief, ported from the prototype's
 * `buildAdvisorHomeWidgets()`. The watch list itself is the canonical
 * `homePriorities` fixture, rendered as conversation starters (each row's
 * `ask` prompt) rather than Home's action queue; the prototype's metric
 * tiles were dropped when the two surfaces were differentiated.
 *
 * EN verbatim; FR from the prototype's inline `L(en, fr)` pairs.
 */

/* ------------------------------------------------------------- daily brief */

/** Prototype `buildAdvisorHomeWidgets()` brief sentence, both languages. */
export function buildDailyBrief(): Bi {
  const highCount = homePriorities.filter((p) => p.severity === 'High').length
  const total = homePriorities.length
  if (highCount === 0) {
    return bi(
      `${total} signals are on my radar today. Nothing is high-risk right now — compliance is holding at 82.`,
      `${total} signaux sont sur mon radar aujourd’hui. Rien n’est à risque élevé pour l’instant — la conformité se maintient à 82.`,
    )
  }
  const enItem = highCount === 1 ? ' item needs' : ' items need'
  const frItem = highCount === 1 ? ' élément requiert' : ' éléments requièrent'
  const en = `${highCount}${enItem} action today, and ${total} signals are on my radar. Compliance is holding at 82 — the biggest lever is the overdue Remote Work Policy.`
  const fr = `${highCount}${frItem} une action aujourd’hui, et ${total} signaux sont sur mon radar. La conformité se maintient à 82 — le plus grand levier est la politique de télétravail en retard.`
  return bi(en, fr)
}
