/**
 * § Advisor golden-eval — the versioned compliance question set (~46 cases).
 *
 * Every case names a real compliance question a Canadian employer asks, the
 * jurisdiction the engine must read from the question text, the corpus topic
 * that must ground the answer, the statute-section refs the answer leans on,
 * and the propositions the grounding chunk must actually contain. Case kinds:
 *
 * - `answer` — a well-formed question the corpus should ground; propositions
 *   and required citations must hold (a miss is a regression, not a gap).
 * - `gap` — a legitimate question the live corpus does NOT cover (documented
 *   coverage hole). Gaps never fail the build; they're reported so the weak
 *   spots are visible and the corpus grows deliberately. `gapReason` is
 *   required so a gap is a decision, not an oversight.
 * - `guardrail` — engine/safety behaviour: unknown or conflicted
 *   jurisdiction closes the legal-basis gate, escalation routes to counsel,
 *   crisis short-circuits every surface.
 * - `adversarial` — a wrong statutory figure the notice cross-check must
 *   flag (`expectedFigureVerdict: 'mismatch'`).
 *
 * Questions are written so `detectJurisdictions` reads them the way a user
 * intends — ON cases say Ontario/ESA, QC say Quebec/CNESST/LNT, FED say
 * federally regulated/Canada Labour Code. Bump `v` when a case's meaning
 * changes so result history stays comparable.
 */

export type GoldenJurisdiction = 'ON' | 'QC' | 'FED'

export interface GoldenFigureCheck {
  /** Reply prose fed to the notice-figure cross-check. */
  reply: string
  /** 'consistent' for encoded-schedule jurisdictions (ON), 'unverifiable'
      where the schedule is intentionally unpopulated (QC/FED), 'mismatch'
      for adversarial wrong-figure replies. */
  expectedVerdict: 'consistent' | 'mismatch' | 'unverifiable'
  /** Tenure the case states — supplied inside `question` in natural form
      (e.g. "4-year employee"); asserted here so the check is explicit. */
  tenureMonths: number
  /** The figure the encoded schedule expects (ON only). */
  expectedWeeks?: number
}

export interface GoldenCase {
  id: string
  v: number
  kind: 'answer' | 'gap' | 'guardrail' | 'adversarial'
  question: string
  /** Single jurisdiction the engine must read, or null when the question
      deliberately withholds it (expect `unknown`). */
  jurisdiction: GoldenJurisdiction | null
  /** Expected jurisdiction read: defaults 'known' / 'unknown' by the field
      above; 'conflict' must be declared. */
  expectJurisdictionStatus?: 'known' | 'unknown' | 'conflict'
  /** Corpus topic that must have an active chunk for this jurisdiction
      (answer/gap cases). */
  topic?: string
  /** Statute refs the answer leans on. Every ref must exist in the
      registry; corpus-cited entries must also appear in the grounding
      chunk's text (hard check). */
  requiredCitations: readonly string[]
  /** Propositions the grounding chunk must contain (normalized substrings). */
  expectedPropositions: readonly string[]
  /** Registry refs that SHOULD be cited but are expected to be absent from
      chunk text — recorded as citation-coverage gaps, never failures. */
  expectedCitations?: readonly string[]
  /** Why this case is a documented gap (required for kind 'gap'). */
  gapReason?: string
  /** Optional notice-figure scenario run through the cross-check. */
  figureCheck?: GoldenFigureCheck
  /** Expected engine payload facts asserted in the harness. */
  expect?: {
    legalBasisAllowed?: boolean
    responseMode?: 'hr' | 'escalation' | 'supportive'
    isCrisis?: boolean
    professionalReview?: boolean
    /** Backstop actions that must fire — 'figure-mismatch' on wrong-figure
        cases, 'figure-unverified' where no encoded schedule vouches for a
        stated figure (QC/FED today). */
    safetyActions?: readonly (
      | 'crisis-intercept'
      | 'legal-basis-withheld'
      | 'figure-mismatch'
      | 'figure-unverified'
    )[]
  }
}


import { GOLDEN_CASES_ON } from './goldenCases.on'
import { GOLDEN_CASES_QC } from './goldenCases.qc'
import { GOLDEN_CASES_FED } from './goldenCases.fed'
import { GOLDEN_CASES_X } from './goldenCases.x'

export const GOLDEN_CASES: readonly GoldenCase[] = [
  ...GOLDEN_CASES_ON,
  ...GOLDEN_CASES_QC,
  ...GOLDEN_CASES_FED,
  ...GOLDEN_CASES_X,
]

export const GOLDEN_SET_VERSION = '2026-09-30.v1'
