/**
 * Locale-aware date formatting for the careers surface. The app language —
 * not the browser locale — drives the output: a French page must render
 * French dates even on an English OS.
 */

/** Format an ISO timestamp as a localized date in the page's language. */
export function formatCareersDate(iso: string, lang: string): string {
  try {
    // Postgres date columns arrive as 'YYYY-MM-DD'. Parsing that as UTC
    // midnight shifts the day back for every timezone west of UTC, so anchor
    // date-only values at local noon where the calendar day is unambiguous.
    const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    return date.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
