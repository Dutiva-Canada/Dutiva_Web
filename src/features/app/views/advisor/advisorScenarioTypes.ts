import type { Bi } from '@/i18n/core'
import type { AdvisorResponse } from '@/features/app/advisor/contract'

/**
 * The six demonstrated response modes from the Advisor chat handoff
 * (`docs/design-handoff-advisor-chat/` — `Advisor Response Experience.dc.html`
 * `scenarios()`; `AGENT.md` is the normative spec these turns follow): HR
 * compliance (termination), high-risk escalation, HR accommodation,
 * jurisdiction-unknown, supportive triage, and current-info with live web
 * sources.
 *
 * These are the signed-out / engine-unavailable preview conversations and the
 * reference fixtures for the response contract — the live engine returns the
 * same `AdvisorResponse` shape (see `advisor/contract.ts`). EN verbatim from
 * the prototype; FR [self-authored] (the prototype's FR toggle is decorative).
 */

export type ScenarioId = 's1' | 's2' | 's3' | 's4' | 's5' | 's6'

export type ScenarioBannerTone = 'risk' | 'info' | 'support'

export interface ScenarioBanner {
  tone: ScenarioBannerTone
  title: Bi
  text: Bi
}

/** One advisor reply plus the structured payload the engine returned for it. */
export interface ScenarioTurn {
  reply: Bi
  banner?: ScenarioBanner
  /** Suggested-document chips — keys into `documentTemplatesByKey`. */
  docs?: string[]
  /** Follow-up chip labels — EN strings keyed into `followupReplies`. */
  followups?: string[]
  /** Ask-for-province chips render under this turn (jurisdiction unknown). */
  provincePrompt?: boolean
  /** Jurisdiction context pill above the transcript. */
  jurisdictionLine: Bi
  response: AdvisorResponse
}

export interface AdvisorScenario {
  id: ScenarioId
  title: Bi
  pinned: boolean
  user: Bi
  turn: ScenarioTurn
  /** s4 only — the turn after the user confirms a province. */
  resolved?: ScenarioTurn
  /** s6 only — the bounded, safe turn when web search is toggled off. */
  webOff?: ScenarioTurn
}
