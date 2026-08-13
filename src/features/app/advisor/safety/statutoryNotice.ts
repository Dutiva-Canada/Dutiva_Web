import type { Bi } from '@/i18n/core'
import type { Jurisdiction } from '@/features/app/documents/data/types'

/**
 * §5.2 (grounding half) — the structured source statutory notice figures are
 * *looked up* from, so a number the Advisor states is grounded in a table, not
 * produced from the model's parametric memory (docs/AI_USAGE_STRATEGY.md §5.2).
 *
 * Scope + safety:
 * - **Statutory floors only.** These encode the employment-standards minimum
 *   notice of individual termination — never common-law reasonable notice
 *   (which is fact-dependent and not tabular).
 * - **Ontario is seeded** from the Employment Standards Act, 2000 s.57, which
 *   is stable and unambiguous. **Québec and Federal are intentionally `null`**
 *   pending qualified legal review — the lookup then returns `null`, and the
 *   Advisor must hedge and point to the primary source rather than emit a
 *   figure. Not legal advice; verify against the statute before relying on it.
 *
 *   The research for that review is done and waiting on a signature:
 *   **`docs/notice-bands-review-pack.md`** carries LNT s.82 and CLC s.230(1.1)
 *   quoted verbatim in both languages, proposed band arrays in this file's
 *   exact shape with their derivations, every carve-out a flat table cannot
 *   express, and a sign-off block. Read it before touching the two `null`s.
 *   Two findings there decide the question and are not visible from this file:
 *   Québec's s.82 band is only a *floor* because CCQ art. 2091 reasonable
 *   notice sits on top of it and is non-renounceable (art. 2092), so a
 *   technically correct QC table can still be misleading; and the federal
 *   picture is due to change under 2018, c. 27, ss. 479–484, enacted but not
 *   yet in force, which would make group termination *displace* this band
 *   table rather than add to it.
 * - **Fail-safe.** An unknown/negative tenure or an unpopulated schedule yields
 *   `null`, never a guessed number.
 */

export interface NoticeBand {
  /** Minimum completed tenure in months for this band (inclusive). */
  minMonths: number
  /** Statutory notice weeks that apply at or above `minMonths`. */
  weeks: number
}

export interface StatutoryNoticeSchedule {
  jurisdiction: Jurisdiction
  /** The statute section this schedule encodes. */
  statute: Bi
  /** Ascending bands, or `null` when not yet encoded for this jurisdiction. */
  bands: NoticeBand[] | null
  note: Bi
}

/** Ontario ESA, 2000 s.57 — statutory notice of individual termination. */
const ONTARIO_BANDS: NoticeBand[] = [
  { minMonths: 0, weeks: 0 }, // < 3 months completed: no statutory notice
  { minMonths: 3, weeks: 1 }, // 3 months to < 1 year
  { minMonths: 12, weeks: 2 }, // 1 to < 3 years
  { minMonths: 36, weeks: 3 }, // 3 to < 4 years
  { minMonths: 48, weeks: 4 }, // 4 to < 5 years
  { minMonths: 60, weeks: 5 }, // 5 to < 6 years
  { minMonths: 72, weeks: 6 }, // 6 to < 7 years
  { minMonths: 84, weeks: 7 }, // 7 to < 8 years
  { minMonths: 96, weeks: 8 }, // 8+ years (statutory maximum)
]

export const NOTICE_SCHEDULES: readonly StatutoryNoticeSchedule[] = [
  {
    jurisdiction: 'ON',
    statute: {
      en: 'Employment Standards Act, 2000 (s. 57)',
      fr: 'Loi de 2000 sur les normes d’emploi (art. 57)',
    },
    bands: ONTARIO_BANDS,
    note: {
      en: 'Statutory minimum notice of individual termination. Not common-law reasonable notice; verify against the ESA and confirm the employee’s exact tenure.',
      fr: 'Préavis minimal prévu par la loi pour une cessation individuelle. Ce n’est pas le préavis raisonnable de common law ; vérifiez auprès de la LNE et confirmez l’ancienneté exacte.',
    },
  },
  {
    jurisdiction: 'QC',
    statute: {
      en: 'Act respecting labour standards (s. 82)',
      fr: 'Loi sur les normes du travail (art. 82)',
    },
    bands: null, // pending qualified legal review
    note: {
      en: 'Not yet encoded — the Advisor must hedge and point to the primary source rather than state a figure.',
      fr: 'Pas encore encodé — le Conseiller doit nuancer et renvoyer à la source primaire plutôt que d’avancer un chiffre.',
    },
  },
  {
    jurisdiction: 'FED',
    statute: {
      en: 'Canada Labour Code, Part III (s. 230)',
      fr: 'Code canadien du travail, Partie III (art. 230)',
    },
    bands: null, // pending qualified legal review
    note: {
      en: 'Not yet encoded — the Advisor must hedge and point to the primary source rather than state a figure.',
      fr: 'Pas encore encodé — le Conseiller doit nuancer et renvoyer à la source primaire plutôt que d’avancer un chiffre.',
    },
  },
]

/**
 * Statutory minimum notice **weeks** for `completedMonths` of service in
 * `jurisdiction`, or `null` when the schedule is unpopulated or the input is
 * invalid. `null` means "no grounded figure available — hedge", never zero.
 */
export function lookupStatutoryNoticeWeeks(
  jurisdiction: Jurisdiction,
  completedMonths: number,
): number | null {
  if (!Number.isFinite(completedMonths) || completedMonths < 0) return null
  const schedule = NOTICE_SCHEDULES.find((s) => s.jurisdiction === jurisdiction)
  if (!schedule || schedule.bands === null) return null
  let weeks: number | null = null
  for (const band of schedule.bands) {
    if (completedMonths >= band.minMonths) weeks = band.weeks
    else break
  }
  return weeks
}
