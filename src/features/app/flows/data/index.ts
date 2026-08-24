import type { Flow } from '../flowModel'
import { dutyToAccommodateFlow } from './dutyToAccommodate'
import { leaveOfAbsenceFlow } from './leaveOfAbsence'
import { mentalHealthResponseFlow } from './mentalHealthResponse'
import { psychologicalSafetyFlow } from './psychologicalSafety'
import { severanceEligibilityOntarioFlow } from './severanceEligibilityOntario'
import { statutoryNoticeOntarioFlow } from './statutoryNoticeOntario'

/**
 * Every guided flow the product ships. Adding one here gives it a route at
 * `/app/workflows/<slug>` and a card on the Workflows view — see
 * docs/FOUR_RING_FRAMEWORK.md before authoring.
 *
 * Calculator-style entitlement gates (EF11) sit with the other flows: they
 * are decision trees that end in a documented outcome, not public marketing
 * tools that publish figures.
 */
export const flows: Flow[] = [
  statutoryNoticeOntarioFlow,
  severanceEligibilityOntarioFlow,
  dutyToAccommodateFlow,
  psychologicalSafetyFlow,
  leaveOfAbsenceFlow,
  mentalHealthResponseFlow,
]

export const flowBySlug = new Map(flows.map((f) => [f.slug, f]))
