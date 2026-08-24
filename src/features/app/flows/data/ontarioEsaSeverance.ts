/**
 * Ontario ESA s. 64 severance amount — formula only (TODO.md EF11 Option A).
 *
 * Source shape: ontario.ca ESA guide (see notice-bands-review-pack §3):
 * regular weekly wages × (completed years + months in incomplete year ÷ 12),
 * capped at 26 weeks. Confirm against ESA ss. 63–65 before relying on a figure.
 *
 * Eligibility (5 years + payroll / mass-closure) is a separate gate — this
 * module never answers "is severance owed?".
 */

/** Weeks of ESA severance from completed tenure, capped at 26. */
export function ontarioEsaSeveranceWeeks(
  completedYears: number,
  monthsInIncompleteYear: number,
): number | null {
  if (
    !Number.isFinite(completedYears) ||
    !Number.isFinite(monthsInIncompleteYear) ||
    completedYears < 0 ||
    monthsInIncompleteYear < 0 ||
    monthsInIncompleteYear > 11 ||
    !Number.isInteger(completedYears) ||
    !Number.isInteger(monthsInIncompleteYear)
  ) {
    return null
  }
  const raw = completedYears + monthsInIncompleteYear / 12
  return Math.min(26, raw)
}

/** Dollar amount = weekly wages × weeks. Null when inputs are unusable. */
export function ontarioEsaSeveranceAmount(
  regularWeeklyWagesCad: number,
  weeks: number,
): number | null {
  if (
    !Number.isFinite(regularWeeklyWagesCad) ||
    !Number.isFinite(weeks) ||
    regularWeeklyWagesCad < 0 ||
    weeks < 0
  ) {
    return null
  }
  return regularWeeklyWagesCad * weeks
}

export function formatCad(amount: number, locale: 'en' | 'fr'): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount)
}

export function formatWeeks(weeks: number, locale: 'en' | 'fr'): string {
  const rounded = Number.isInteger(weeks) ? String(weeks) : weeks.toFixed(2).replace(/\.?0+$/, '')
  if (locale === 'fr') {
    return weeks === 1 ? `${rounded} semaine` : `${rounded} semaines`
  }
  return weeks === 1 ? `${rounded} week` : `${rounded} weeks`
}
