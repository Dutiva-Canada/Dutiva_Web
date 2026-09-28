import { bi } from '@/i18n/core'
import type { Bi, LText } from '@/i18n/core'
import { cases, caseRiskAxesByType, riskLevelLabels } from '@/data'
import type { CaseRisk, CaseRiskAxis, CaseType, FixtureToneCard, RiskLevel, Tone } from '@/data'
import { casesMessages as M } from '@/i18n/messages/cases'

/**
 * Case-workspace view model — the port of the prototype's case state helpers
 * (`createCase`, `caseRiskFor` / `caseRecommendation` / `caseRiskAxes`
 * fallbacks, `statusChipStyle`, `sensitiveCaseTypes`). Fixture cases come
 * from '@/data'; cases created through the New case modal live in a small
 * in-memory store for the session (the prototype keeps them in component
 * state — nothing persists).
 */

/* ------------------------------------------------------------------ types */

/**
 * A case as the views consume it. Fixture `CaseFile`s satisfy this shape
 * structurally; created cases widen `type` beyond the four fixture types
 * (the intake modal offers twelve) and localize `empName` / `title`.
 */
export interface WorkspaceCase {
  id: string
  title: LText
  /** Raw prototype type key — drives risk/approval branching. */
  type: string
  typeLabel: Bi
  empId: string | null
  empName: LText
  province: Bi
  status: Bi
  tone: Tone
  opened: string
  owner: string
  due: string
  retention: Bi
  legalScope?: Bi
  chatId: string
  summary: Bi
  steps: { label: Bi; done: boolean }[]
}

const FIXTURE_CASE_TYPES = ['Termination', 'Performance', 'Accommodation', 'Onboarding'] as const

export function isFixtureCaseType(type: string): type is CaseType {
  return (FIXTURE_CASE_TYPES as readonly string[]).includes(type)
}

/* ---------------------------------------------------------- tone → styles */

/* The status chip lives in '@/components/chips' (statusChipClass). Only the
   case-specific dot ramps stay here — their fallbacks differ from the chip. */

/** Progress-bar / risk-factor dot fill (prototype: risk-dot | gold-dot | ok-fg). */
const BAR_TONE_CLASS: Record<Tone, string> = {
  risk: 'bg-risk-dot',
  warning: 'bg-gold-dot',
  success: 'bg-ok-fg',
  info: 'bg-ok-fg',
  suggestion: 'bg-ok-fg',
}
export function barToneClass(tone: Tone): string {
  return BAR_TONE_CLASS[tone] ?? 'bg-ok-fg'
}

/** Activity-feed dot fill (prototype: risk-dot | gold-dot | ok-fg | accent). */
const ACTIVITY_DOT_CLASS: Record<Tone, string> = {
  risk: 'bg-risk-dot',
  warning: 'bg-gold-dot',
  success: 'bg-ok-fg',
  info: 'bg-accent',
  suggestion: 'bg-accent',
}
export function activityDotClass(tone: Tone | undefined): string {
  return (tone && ACTIVITY_DOT_CLASS[tone]) ?? 'bg-accent'
}

/** Risk-axis chip tone (prototype `caseRiskAxes` chipStyle mapping). */
const RISK_LEVEL_TONE: Record<RiskLevel, Tone> = {
  High: 'risk',
  Medium: 'warning',
  Pending: 'info',
  Low: 'success',
}
export function riskLevelTone(level: RiskLevel): Tone {
  return RISK_LEVEL_TONE[level]
}

/* -------------------------------------------- unified timeline dot colours */

type TimelineTone = Tone | 'neutral'

/** Prototype `timelineKindMeta(kind).tone`. */
const TIMELINE_KIND_TONE: Record<string, TimelineTone> = {
  hire: 'info',
  review: 'info',
  comp: 'success',
  case: 'warning',
  wellbeing: 'warning',
  doc: 'neutral',
  comms: 'info',
  ack: 'success',
  compliance: 'warning',
}

/** Prototype `composeTimeline` dot fill (risk | gold | ok | text-faint | accent). */
const TIMELINE_DOT_CLASS: Record<TimelineTone, string> = {
  risk: 'bg-risk-dot',
  warning: 'bg-gold-dot',
  success: 'bg-ok-fg',
  neutral: 'bg-text-faint',
  info: 'bg-accent',
  suggestion: 'bg-accent',
}
export function timelineDotClass(kind: string, tone: Tone | undefined): string {
  const resolved: TimelineTone = tone ?? TIMELINE_KIND_TONE[kind] ?? 'info'
  return TIMELINE_DOT_CLASS[resolved]
}

/* ---------------------------------------- pending (not-yet-assessed) state */

/** Prototype `caseRiskFor` fallback for non-fixture case types. */
export const pendingRisk: CaseRisk = {
  level: 'Pending',
  levelLabel: riskLevelLabels.Pending,
  tone: 'info',
  factors: [M.cases_pending_factor],
}

/** Prototype `caseRecommendation` fallback. */
export const pendingRecommendation: FixtureToneCard = {
  tone: 'info',
  title: M.cases_rec_title,
  body: M.cases_pending_rec_body,
}

/**
 * Prototype `caseRiskAxes` fallback — the six axis names reuse the fixture
 * axes (same order as the prototype), each pending.
 */
export const pendingRiskAxes: CaseRiskAxis[] = caseRiskAxesByType.Termination.map((a) => ({
  axis: a.axis,
  level: 'Pending',
  levelLabel: riskLevelLabels.Pending,
  reason: M.cases_pending_axis_reason,
  mitigation: M.cases_pending_axis_mitigation,
}))

/* --------------------------------------------------- new-case intake flow */

/** Prototype `buildNewCaseView` types list (FR via `tr()` / frDict). */
export const newCaseTypes: { value: string; label: Bi }[] = [
  { value: 'Termination', label: bi('Termination', 'Cessation d’emploi') },
  { value: 'Discipline', label: bi('Discipline', 'Mesures disciplinaires') },
  { value: 'Accommodation', label: bi('Accommodation', 'Accommodement') },
  { value: 'Complaint', label: bi('Complaint', 'Plainte') },
  {
    value: 'Harassment / workplace investigation',
    label: bi('Harassment / workplace investigation', 'Harcèlement / enquête en milieu de travail'),
  },
  { value: 'Leave of absence', label: bi('Leave of absence', 'Congé autorisé') },
  { value: 'Performance management', label: bi('Performance management', 'Gestion du rendement') },
  {
    value: 'Compensation review',
    label: bi('Compensation review', 'Examen de la rémunération'),
  },
  { value: 'Policy breach', label: bi('Policy breach', 'Manquement à une politique') },
  { value: 'Onboarding issue', label: bi('Onboarding issue', 'Problème d’intégration') },
  { value: 'Offboarding issue', label: bi('Offboarding issue', 'Problème de départ') },
  { value: 'Workplace conflict', label: bi('Workplace conflict', 'Conflit en milieu de travail') },
]

/** Prototype `buildNewCaseView` jurisdictions (FR via frDict). */
export const newCaseJurisdictions: { value: string; label: Bi }[] = [
  { value: 'Ontario', label: bi('Ontario', 'Ontario') },
  { value: 'Quebec', label: bi('Quebec', 'Québec') },
  { value: 'British Columbia', label: bi('British Columbia', 'Colombie-Britannique') },
  { value: 'Alberta', label: bi('Alberta', 'Alberta') },
  { value: 'Federal', label: bi('Federal', 'Fédéral') },
]

/** Prototype `sensitiveCaseTypes()`. */
export const sensitiveCaseTypes = [
  'Termination',
  'Discipline',
  'Harassment / workplace investigation',
  'Complaint',
  'Compensation review',
]

export const workplaceWide = bi('Workplace-wide', 'À l’échelle du milieu de travail')

const intakeStatus = bi('Intake', 'Ouverture du dossier')

const intakeSummary = bi(
  'Intake started — record the key facts and Advisor will assess risk and recommend next steps.',
  'Ouverture du dossier — consignez les faits essentiels; le Conseiller évaluera le risque et recommandera les prochaines étapes.',
)

const intakeSteps: Bi[] = [
  bi('Record intake facts', 'Consigner les faits initiaux'),
  bi(
    'Confirm jurisdiction and applicable agreement',
    'Confirmer la compétence et le contrat applicable',
  ),
  bi('Advisor risk assessment', 'Évaluation du risque par le Conseiller'),
  bi('Plan next actions', 'Planifier les prochaines actions'),
]

const retentionSevenYears = bi(
  '7 years after employment ends (ESA/CRA records)',
  '7 ans après la fin de l’emploi (registres LNE/ARC)',
)

const retentionThreeYears = bi(
  '3 years after the case closes',
  '3 ans après la fermeture du dossier',
)

interface NewCaseInput {
  type: string
  typeLabel: Bi
  /** Employee, or null for a workplace-wide case. */
  empId: string | null
  empName: string | null
  jurLabel: Bi
  /** User-provided title; blank falls back to '{type} — {employee}'. */
  title: string
}

/** Prototype `createCase()` — builds the Intake-stage case record. */
export function buildCreatedCase(input: NewCaseInput): WorkspaceCase {
  const id = `case${Date.now()}`
  const empName: LText = input.empName ?? workplaceWide
  const trimmed = input.title.trim()
  const title: LText =
    trimmed ||
    bi(
      `${input.typeLabel.en} — ${input.empName ?? workplaceWide.en}`,
      `${input.typeLabel.fr} — ${input.empName ?? workplaceWide.fr}`,
    )
  return {
    id,
    title,
    type: input.type,
    typeLabel: input.typeLabel,
    empId: input.empId,
    empName,
    province: input.jurLabel,
    status: intakeStatus,
    tone: 'info',
    opened: 'Jul 8, 2026',
    owner: 'Riley Summers',
    due: '—',
    retention:
      input.type === 'Termination' || input.type === 'Offboarding issue'
        ? retentionSevenYears
        : retentionThreeYears,
    chatId: `nc-${id}`,
    summary: intakeSummary,
    steps: intakeSteps.map((label) => ({ label, done: false })),
  }
}

/* ------------------------------------------------- in-memory created cases */

let createdCases: WorkspaceCase[] = []

/** Newest first, ahead of the fixtures (prototype `[c, ...s.cases]`). */
export function listCases(): WorkspaceCase[] {
  return [...createdCases, ...cases]
}

export function findCase(caseId: string): WorkspaceCase | undefined {
  return listCases().find((c) => c.id === caseId)
}

export function addCreatedCase(c: WorkspaceCase): void {
  createdCases = [c, ...createdCases]
}

/** Test helper — the store is module-level session state. */
export function resetCreatedCases(): void {
  createdCases = []
}
