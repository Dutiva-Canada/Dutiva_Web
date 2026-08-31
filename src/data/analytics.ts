import { bi } from '@/i18n/core'
import type {
  JurisdictionHeadcount,
  JurisdictionScore,
  PolicyAcknowledgmentCampaign,
  ScoreHistoryPoint,
  TrendPoint,
  TurnoverStat,
} from './types'
import { demoTodayISO } from './calendar'
import { complianceScore } from './compliance'

export { demoTodayISO }

/**
 * Analytics fixtures — the workspace-level aggregates the prototype carried
 * as viewmodel constants inside `buildReportsView()` (App v2.dc.html lines
 * 1204–1231), moved here so the Analytics view imports data like every other
 * view instead of inlining it.
 */

/**
 * Six-month compliance-score history ending at the current score
 * (`complianceScore`, the same 82 the Home compliance panel and the Advisor
 * home tile show). The first five points are the prototype's `scoreTrend`
 * constants.
 */
export const scoreHistory: ScoreHistoryPoint[] = [
  { monthISO: '2026-02-01', score: 74 },
  { monthISO: '2026-03-01', score: 76 },
  { monthISO: '2026-04-01', score: 79 },
  { monthISO: '2026-05-01', score: 78 },
  { monthISO: '2026-06-01', score: 81 },
  { monthISO: '2026-07-01', score: complianceScore },
]

/**
 * Headcount by jurisdiction (prototype viewmodel constants — the diorama
 * company is larger than the individually-modelled employee fixtures).
 * 'Federal' means federally regulated roles under the Canada Labour Code,
 * not a province — the view carries that footnote.
 */
export const headcountByJurisdiction: JurisdictionHeadcount[] = [
  { key: 'ON', label: bi('ON', 'ON'), value: 34 },
  { key: 'BC', label: bi('BC', 'BC'), value: 21 },
  { key: 'QC', label: bi('QC', 'QC'), value: 12 },
  { key: 'AB', label: bi('AB', 'AB'), value: 9 },
  { key: 'Federal', label: bi('Federal', 'Fédéral'), value: 6 },
]

export const headcountTotal = headcountByJurisdiction.reduce((sum, row) => sum + row.value, 0)

/**
 * Current policy-acknowledgment campaign: the annual Code of Conduct
 * attestation (policy p3 — up to date; the yearly re-acknowledgment run is
 * still collecting signatures across the 82-person company).
 */
export const policyAcknowledgment: PolicyAcknowledgmentCampaign = {
  policyId: 'p3',
  title: bi('Code of Conduct — annual attestation', 'Code de conduite — attestation annuelle'),
  signed: 74,
  total: headcountTotal,
}

/**
 * Compliance score by jurisdiction. Headcount-weighted, these blend back to
 * the overall score (Σ score×headcount / 82 ≈ 82): Quebec sits 11 points
 * below the blended score — the weak jurisdiction a strong overall number
 * would otherwise hide (its Law 25 PIA and francization review are the
 * open obligations behind it).
 */
export const jurisdictionScores: JurisdictionScore[] = [
  { key: 'ON', label: bi('ON', 'ON'), score: 83 },
  { key: 'BC', label: bi('BC', 'BC'), score: 86 },
  { key: 'QC', label: bi('QC', 'QC'), score: 71 },
  { key: 'AB', label: bi('AB', 'AB'), score: 88 },
  { key: 'Federal', label: bi('Federal', 'Fédéral'), score: 75 },
]

/**
 * Six-month headcount history ending at the current total — the company
 * added six people over the window.
 */
export const headcountHistory: TrendPoint[] = [
  { monthISO: '2026-02-01', value: 76 },
  { monthISO: '2026-03-01', value: 77 },
  { monthISO: '2026-04-01', value: 79 },
  { monthISO: '2026-05-01', value: 80 },
  { monthISO: '2026-06-01', value: 81 },
  { monthISO: '2026-07-01', value: headcountTotal },
]

/** Rolling 12-month turnover, improving month over month. */
export const turnover: TurnoverStat = {
  ratePct: 9.8,
  priorRatePct: 11.2,
  priorMonthISO: '2026-06-01',
}
