import { bi } from '@/i18n/core'
import type { Bi, Lang } from '@/i18n/core'
export { isCanonicalMemoryDate } from '@/data/memoryDates'

/**
 * Localized memory date labels. Renders "Today / Aujourd'hui" when the stored
 * ISO value falls on the reference calendar day; otherwise a short date.
 */
export function formatMemoryDate(iso: string, lang: Lang, referenceDateISO: string): string {
  const valueDay = iso.slice(0, 10)
  const referenceDay = referenceDateISO.slice(0, 10)
  if (valueDay === referenceDay) {
    return lang === 'fr' ? 'Aujourd’hui' : 'Today'
  }

  const parsed = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return iso

  if (lang === 'fr') {
    return parsed.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
  }
  return parsed.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

export function memoryDateReferenceISO(scenarioReferenceISO?: string): string {
  return scenarioReferenceISO ?? new Date().toISOString().slice(0, 10)
}

/** Derives a conversation nav subtitle from a stored resume date — never persist relative labels. */
export function formatMemoryResumedSub(resumedAtISO: string, referenceDateISO: string): Bi {
  const resumedDay = resumedAtISO.slice(0, 10)
  const referenceDay = referenceDateISO.slice(0, 10)
  if (resumedDay === referenceDay) {
    return bi('Resumed today', 'Repris aujourd’hui')
  }
  return bi(
    `Resumed ${formatMemoryDate(resumedAtISO, 'en', referenceDateISO)}`,
    `Repris le ${formatMemoryDate(resumedAtISO, 'fr', referenceDateISO)}`,
  )
}
