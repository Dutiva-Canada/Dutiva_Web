import type { Flow } from '../flowModel'
import { dutyToAccommodateFlow } from './dutyToAccommodate'
import { leaveOfAbsenceFlow } from './leaveOfAbsence'
import { leaveReturnTrackerFlow } from './leaveReturnTracker'
import { mentalHealthResponseFlow } from './mentalHealthResponse'
import { psychologicalSafetyFlow } from './psychologicalSafety'
import { roeFilingChecklistFlow } from './roeFilingChecklist'
import { severanceAmountOntarioFlow } from './severanceAmountOntario'
import { severanceEligibilityOntarioFlow } from './severanceEligibilityOntario'
import { statutoryNoticeFederalFlow } from './statutoryNoticeFederal'
import { statutoryNoticeOntarioFlow } from './statutoryNoticeOntario'
import { statutoryNoticeQuebecFlow } from './statutoryNoticeQuebec'
import { temporaryLayoffAwarenessFlow } from './temporaryLayoffAwareness'

/**
 * Every guided flow the product ships. Adding one here gives it a route at
 * `/app/workflows/<slug>` and a card on the Workflows view — see
 * docs/FOUR_RING_FRAMEWORK.md before authoring.
 *
 * Calculator-style entitlement gates (EF11) sit with the other flows: they
 * are decision trees that end in a documented outcome, not public marketing
 * tools that publish figures. QC/FED notice flows are hedge-only while
 * `NOTICE_SCHEDULES` bands stay null (notice-bands-decision.md).
 */
export const flows: Flow[] = [
  statutoryNoticeOntarioFlow,
  statutoryNoticeQuebecFlow,
  statutoryNoticeFederalFlow,
  severanceEligibilityOntarioFlow,
  severanceAmountOntarioFlow,
  roeFilingChecklistFlow,
  temporaryLayoffAwarenessFlow,
  leaveReturnTrackerFlow,
  dutyToAccommodateFlow,
  psychologicalSafetyFlow,
  leaveOfAbsenceFlow,
  mentalHealthResponseFlow,
]

export const flowBySlug = new Map(flows.map((f) => [f.slug, f]))

/** EF11 entitlement gates / amount tools — shown as "Calculators" on Workflows. */
const CALCULATOR_SLUGS = new Set([
  'statutory-notice-ontario',
  'statutory-notice-quebec',
  'statutory-notice-federal',
  'severance-eligibility-ontario',
  'severance-amount-ontario',
])

export function isCalculatorFlow(flow: Flow): boolean {
  return CALCULATOR_SLUGS.has(flow.slug)
}

export const calculatorFlows = flows.filter(isCalculatorFlow)
export const guideFlows = flows.filter((f) => !isCalculatorFlow(f))
