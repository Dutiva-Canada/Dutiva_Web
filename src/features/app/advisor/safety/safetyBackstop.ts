import type { Bi } from '@/i18n/core'
import type { AdvisorResponse, JurisdictionStatus } from '../contract'
import type { Jurisdiction } from '@/features/app/documents/data/types'
import { detectCrisisSignal } from './crisisSignals'
import { crossCheckNoticeFigure } from './statutoryCrossCheck'
import { mentionsStatutoryFigure } from './statutoryFigures'

/**
 * The deterministic safety backstop (docs/AI_USAGE_STRATEGY.md §5) — a rule
 * layer that hardens the engine's structured `AdvisorResponse` on the client,
 * as defense-in-depth. The rules are **monotonic: they can only ever tighten**
 * a gate, never loosen one. So the worst case is an over-cautious turn, never a
 * leaked figure or a dropped crisis intercept.
 *
 * It runs after the engine and before the Compliance Workspace reads the
 * payload (wired in `advisor/chatApi.ts`). It does not replace the engine's own
 * routing/gating — the engine remains the primary control; this is the belt to
 * its braces ("the client gates too").
 */

export type SafetyAction =
  | 'crisis-intercept'
  | 'legal-basis-withheld'
  | 'figure-mismatch'
  | 'figure-unverified'

export interface SafetyBackstopInput {
  /** The user's message this turn — the crisis pre-classifier reads it. */
  userMessage: string
  /** The Advisor's conversational reply — the figure gate inspects it. */
  reply: string
  /** The engine's structured response for this turn. */
  response: AdvisorResponse
}

export interface SafetyBackstopResult {
  /** The hardened response (same object when no rule fired). */
  response: AdvisorResponse
  /** Which rules fired — for telemetry/tests; empty when the input passed. */
  actions: SafetyAction[]
}

/** Jurisdiction is "settled enough" to allow statutory figures. */
const JURISDICTION_CONFIRMED: ReadonlySet<JurisdictionStatus> = new Set<JurisdictionStatus>([
  'known',
  'assumed',
  'not_applicable',
])

const WITHHELD_REASON: Bi = {
  en: 'Legal basis withheld — jurisdiction is not confirmed.',
  fr: 'Fondement juridique retenu — la compétence n’est pas confirmée.',
}

/* Accurate about what actually happened: the prose above this warning may
   still contain the figure — a client cannot un-say it. What is withheld is
   the citation surface; the figure itself needs verifying. (The previous
   text claimed "figures were withheld", which the 2026-08-08 review flagged
   as misdescribing a figure sitting fully visible in the chat bubble.) */
const WITHHELD_WARNING: Bi = {
  en: 'This reply may state a statutory figure although the jurisdiction is not confirmed — verify any figure against the official source before relying on it. Statutory citations are withheld.',
  fr: 'Cette réponse peut énoncer un chiffre prévu par la loi alors que la compétence n’est pas confirmée — vérifiez tout chiffre auprès de la source officielle avant de vous y fier. Les citations légales sont retenues.',
}

const MISMATCH_REASON: Bi = {
  en: 'Legal basis withheld — a stated notice figure disagrees with the statutory schedule.',
  fr: 'Fondement juridique retenu — un chiffre de préavis énoncé contredit le barème légal.',
}

function mismatchWarning(expectedWeeks: number, statedWeeks: number): Bi {
  return {
    en: `A notice figure in this reply (${statedWeeks} weeks) disagrees with the encoded statutory schedule (${expectedWeeks} weeks for the stated tenure). Verify against the official source before relying on either.`,
    fr: `Un chiffre de préavis dans cette réponse (${statedWeeks} semaines) contredit le barème légal encodé (${expectedWeeks} semaines pour l’ancienneté indiquée). Vérifiez auprès de la source officielle avant de vous fier à l’un ou l’autre.`,
  }
}

/* §2d — the "decline to guess" half. Québec and federal schedules are
   deliberately unencoded pending legal review (docs/notice-bands-decision.md),
   so a reply asserting a specific notice figure for a specific tenure there
   states something no encoded rule vouches for. The figure may be right — the
   corpus often grounds it — but "cannot verify" must be said out loud rather
   than left confident. Warning only: the corpus citation stays visible, it is
   exactly where the reader should verify. */
const UNVERIFIED_WARNING: Bi = {
  en: 'A notice figure in this reply could not be checked against the encoded statutory schedule for this jurisdiction — verify it against the official source before relying on it.',
  fr: 'Un chiffre de préavis dans cette réponse n’a pas pu être vérifié contre le barème légal encodé pour cette compétence — vérifiez-le auprès de la source officielle avant de vous y fier.',
}

/**
 * The engine's jurisdiction read, mapped to the schedule vocabulary. The
 * contract carries a display value rather than a code, so this reads the
 * stable English label the engine authors (responsePayload.ts
 * JURISDICTION_VALUE) — a drift there fails the backstop test, not silently.
 */
function scheduleJurisdiction(response: AdvisorResponse): Jurisdiction | null {
  if (response.jurisdiction.status !== 'known') return null
  const value = response.jurisdiction.value
  const label = typeof value === 'string' ? value : value.en
  if (label.startsWith('Ontario')) return 'ON'
  if (label.startsWith('Quebec')) return 'QC'
  if (label.startsWith('Federally')) return 'FED'
  return null
}

/**
 * Apply the safety backstop to one turn. Pure: it returns a new response only
 * when a rule fires, and returns the input object untouched otherwise.
 */
export function applySafetyBackstop(input: SafetyBackstopInput): SafetyBackstopResult {
  const { userMessage, reply, response } = input
  const actions: SafetyAction[] = []
  let next = response

  // §5.1 Crisis intercept — OR the maintained signal with the engine's flag.
  // Monotonic: can only raise `isCrisis`, never clear it. Crisis gates every
  // structured surface off via `allowedSurfaces`, so it takes precedence.
  const crisis = detectCrisisSignal(userMessage) || response.isCrisis
  if (crisis && !response.isCrisis) {
    actions.push('crisis-intercept')
    next = { ...next, isCrisis: true }
  }

  // §5.2 Jurisdiction / statutory-figure gate — fail-safe-closed. Skipped under
  // crisis (everything is already gated off). If a figure surfaces before
  // jurisdiction is confirmed, force the legal-basis gate off and warn the
  // operator.
  const jurisdictionConfirmed = JURISDICTION_CONFIRMED.has(response.jurisdiction.status)
  if (!crisis && !jurisdictionConfirmed && mentionsStatutoryFigure(reply)) {
    actions.push('legal-basis-withheld')
    next = {
      ...next,
      route: { ...next.route, legalBasisAllowed: false },
      legalBasis: {
        ...next.legalBasis,
        withheldReason: next.legalBasis.withheldReason ?? WITHHELD_REASON,
      },
      warnings: [...next.warnings, WITHHELD_WARNING],
    }
  }

  // §5.2b Notice-figure cross-check — the verification half. When the
  // jurisdiction is known and its schedule is encoded, a notice figure the
  // reply states is compared against statutoryNotice.ts for the tenure the
  // turn itself provides. A mismatch tightens the legal-basis gate and puts
  // an exact, actionable warning in front of the operator. Monotonic:
  // 'consistent' and 'unverifiable' change nothing.
  if (!crisis) {
    const jurisdiction = scheduleJurisdiction(response)
    if (jurisdiction !== null) {
      const check = crossCheckNoticeFigure({ jurisdiction, userMessage, reply })
      if (
        check.verdict === 'mismatch' &&
        check.expectedWeeks !== undefined &&
        check.statedWeeks !== undefined
      ) {
        actions.push('figure-mismatch')
        next = {
          ...next,
          route: { ...next.route, legalBasisAllowed: false },
          legalBasis: {
            ...next.legalBasis,
            withheldReason: next.legalBasis.withheldReason ?? MISMATCH_REASON,
          },
          warnings: [...next.warnings, mismatchWarning(check.expectedWeeks, check.statedWeeks)],
        }
      } else if (check.verdict === 'unverifiable' && check.reason === 'no-schedule') {
        actions.push('figure-unverified')
        next = { ...next, warnings: [...next.warnings, UNVERIFIED_WARNING] }
      }
    }
  }

  return { response: next, actions }
}
