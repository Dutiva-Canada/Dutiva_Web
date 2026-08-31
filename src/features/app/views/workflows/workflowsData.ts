import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  ClipboardCheck,
  FileText,
  Heart,
  Search,
  TrendingUp,
  UserPlus,
  UserX,
} from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'
import type { FlowKeyOrFallback } from '@/features/app/views/advisor/advisorFlows'

/**
 * Workflows-view content — typed transcription of the prototype's
 * `workflowsInFlight()` (App v2.dc.html 4754–4761), `workflowCatalog()`
 * (4763–4776) and the `buildTerminationMap()` stages (4862–4872). These rows
 * exist only in the view builders (not in the shared entity fixtures), so
 * they live beside the view. All strings EN/FR verbatim from the prototype.
 */

/* ------------------------------------------------------------- chip tones */

/** `statusChipStyle(tone)` ramp plus the map's flat 'neutral' chip. */
export type WorkflowChipTone = 'risk' | 'warning' | 'success' | 'info' | 'neutral'

/* ---------------------------------------------------------- in-flight rows */

/** Where a row's "Continue" navigates (prototype `openCase` / `selectChat`). */
export type WorkflowNav = { kind: 'case'; caseId: string } | { kind: 'chat'; chatId: string }

export interface InFlightWorkflow {
  id: string
  name: Bi
  person: Bi
  where: Bi
  step: number
  of: number
  /** "Step 4/9" / « Étape 4/9 ». */
  stepLabel: Bi
  currentStep: Bi
  next: Bi
  /** "Owner Riley Summers" / « Resp. Riley Summers ». */
  ownerLabel: Bi
  /** "Due Jul 11" / « Éch. 11 juil. ». */
  dueLabel: Bi
  /** "2 of 4 docs" / « 2 doc. sur 4 ». */
  docsLabel: Bi
  impact: Bi
  riskLabel: Bi | null
  riskTone: WorkflowChipTone
  open: WorkflowNav
}

/* Label builders — replicate the prototype's derived-label concatenations. */
const stepLabel = (step: number, of: number): Bi => bi(`Step ${step}/${of}`, `Étape ${step}/${of}`)
const docsLabel = (done: number, total: number): Bi =>
  bi(`${done} of ${total} docs`, `${done} doc. sur ${total}`)
const ownerLabel = (owner: string): Bi => bi(`Owner ${owner}`, `Resp. ${owner}`)
const dueLabel = (due: Bi): Bi => bi(`Due ${due.en}`, `Éch. ${due.fr}`)

export const inFlightWorkflows: readonly InFlightWorkflow[] = [
  {
    id: 'wf1',
    name: bi('Termination', 'Cessation d’emploi'),
    person: bi('Jordan Mensah', 'Jordan Mensah'),
    where: bi('Ontario', 'Ontario'),
    step: 4,
    of: 9,
    stepLabel: stepLabel(4, 9),
    currentStep: bi('Notice & severance risk', 'Risque de préavis et d’indemnité'),
    next: bi('Legal review of notice', 'Examen juridique du préavis'),
    ownerLabel: ownerLabel('Riley Summers'),
    dueLabel: dueLabel(bi('Jul 11', '11 juil.')),
    docsLabel: docsLabel(2, 4),
    impact: bi('+2 score on close', '+2 au score à la clôture'),
    riskLabel: bi('High', 'Élevé'),
    riskTone: 'risk',
    open: { kind: 'case', caseId: 'case1' },
  },
  {
    id: 'wf2',
    name: bi('Accommodation', 'Accommodement'),
    person: bi('Amara Okafor', 'Amara Okafor'),
    where: bi('British Columbia', 'Colombie-Britannique'),
    step: 3,
    of: 6,
    stepLabel: stepLabel(3, 6),
    currentStep: bi('Modified duties in place', 'Tâches modifiées en place'),
    next: bi('90-day review meeting', 'Réunion d’examen — 90 jours'),
    ownerLabel: ownerLabel('Riley Summers'),
    dueLabel: dueLabel(bi('Jul 14', '14 juil.')),
    docsLabel: docsLabel(1, 2),
    impact: bi('Keeps review defensible', 'Examen défendable'),
    riskLabel: bi('Due Jul 14', 'Éch. 14 juil.'),
    riskTone: 'warning',
    open: { kind: 'case', caseId: 'case3' },
  },
  {
    id: 'wf3',
    name: bi('Hiring', 'Embauche'),
    person: bi('Senior Analyst', 'Analyste principal'),
    where: bi('British Columbia', 'Colombie-Britannique'),
    step: 2,
    of: 7,
    stepLabel: stepLabel(2, 7),
    currentStep: bi('Role & comp band', 'Poste et échelle salariale'),
    next: bi('Generate offer letter', 'Générer la lettre d’offre'),
    ownerLabel: ownerLabel('Riley Summers'),
    dueLabel: dueLabel(bi('Jul 18', '18 juil.')),
    docsLabel: docsLabel(0, 3),
    impact: bi('BC written-offer rules', 'Règles d’offre écrite C.-B.'),
    riskLabel: null,
    riskTone: 'info',
    open: { kind: 'chat', chatId: 'c2' },
  },
]

/* ---------------------------------------------------------------- catalog */

export interface WorkflowCatalogItem {
  key: string
  label: Bi
  sub: Bi
  /** lucide match for the prototype's inline 15px / 1.8-stroke tile icon. */
  icon: LucideIcon
  /** The prototype's `startFlow` opening query. */
  query: Bi
  /** Explicit Advisor flow key — prototype `start(key, en, frq)` (4763–4776). */
  flowKey: FlowKeyOrFallback
  /**
   * A guided flow (`src/features/app/flows/`) that covers this tile's subject.
   * Where one exists it wins: a real step-by-step process that ends in a
   * document beats opening an Advisor conversation about the same thing.
   * Tiles without one keep the prototype's Advisor behaviour.
   */
  flowSlug?: string
}

/** Catalogue tile key → guided flow slug, where the flow exists. */
const CATALOG_FLOW_SLUGS: Record<string, string> = {
  accommodation: 'duty-to-accommodate',
  leave: 'leave-of-absence',
}

/** Prototype tile key → startFlow key (leave/investigation/promotion → 'fallback'). */
const CATALOG_FLOW_KEYS: Record<string, FlowKeyOrFallback> = {
  hiring: 'hiring',
  termination: 'termination',
  accommodation: 'accommodation',
  performance: 'performance',
  leave: 'fallback',
  investigation: 'fallback',
  promotion: 'fallback',
  policy: 'policy',
}

const catalogEntries: readonly Omit<WorkflowCatalogItem, 'flowKey'>[] = [
  {
    key: 'hiring',
    label: bi('Hiring', 'Embauche'),
    sub: bi('Offer → onboarding', 'Offre → intégration'),
    icon: UserPlus,
    query: bi('I need to hire for a new role.', 'Je dois embaucher pour un nouveau poste.'),
  },
  {
    key: 'termination',
    label: bi('Termination', 'Cessation d’emploi'),
    sub: bi('Notice → final pay', 'Préavis → paie finale'),
    icon: UserX,
    query: bi('I need to terminate an employee.', 'Je dois mettre fin à l’emploi d’un employé.'),
  },
  {
    key: 'accommodation',
    label: bi('Accommodation', 'Accommodement'),
    sub: bi('Duty to accommodate', 'Obligation d’adaptation'),
    icon: Heart,
    query: bi(
      'An employee has requested an accommodation.',
      'Un employé a demandé un accommodement.',
    ),
  },
  {
    key: 'performance',
    label: bi('Performance', 'Rendement'),
    sub: bi('PIP & check-ins', 'PAR et suivis'),
    icon: ClipboardCheck,
    query: bi(
      'I have performance concerns about an employee.',
      'J’ai des préoccupations de rendement au sujet d’un employé.',
    ),
  },
  {
    key: 'leave',
    label: bi('Leave', 'Congé'),
    sub: bi('Request → return', 'Demande → retour'),
    icon: Calendar,
    query: bi(
      'An employee is requesting a leave of absence — walk me through it.',
      'Un employé demande un congé — guidez-moi.',
    ),
  },
  {
    key: 'investigation',
    label: bi('Investigation', 'Enquête'),
    sub: bi('Intake → findings', 'Signalement → conclusions'),
    icon: Search,
    query: bi(
      'I received a workplace complaint and need to run an investigation.',
      'J’ai reçu une plainte et je dois mener une enquête.',
    ),
  },
  {
    key: 'promotion',
    label: bi('Promotion', 'Promotion'),
    sub: bi('Comp & letter', 'Rémunération et lettre'),
    icon: TrendingUp,
    query: bi(
      'I want to promote an employee — what should the package cover?',
      'Je veux promouvoir un employé — que doit couvrir l’offre?',
    ),
  },
  {
    key: 'policy',
    label: bi('Policy update', 'Politique'),
    sub: bi('Draft → acknowledge', 'Rédaction → accusés'),
    icon: FileText,
    query: bi('We need to refresh a workplace policy.', 'Nous devons mettre à jour une politique.'),
  },
]

/** Shared catalog — the Home view's "Start a workflow" grid renders this same list. */
export const workflowCatalog: readonly WorkflowCatalogItem[] = catalogEntries.map((entry) => ({
  ...entry,
  flowKey: CATALOG_FLOW_KEYS[entry.key] ?? 'fallback',
  ...(CATALOG_FLOW_SLUGS[entry.key] !== undefined && { flowSlug: CATALOG_FLOW_SLUGS[entry.key] }),
}))

/* -------------------------------------------------------- termination map */

export type TerminationStageState =
  'done' | 'current' | 'partial' | 'waiting' | 'upcoming' | 'always'

export interface TerminationStage {
  n: number
  title: Bi
  sub: Bi
  state: TerminationStageState
}

export const terminationStages: readonly TerminationStage[] = [
  {
    n: 1,
    title: bi('Intake', 'Prise en charge'),
    sub: bi(
      'Case opened from the Advisor conversation · Jul 5',
      'Dossier ouvert depuis la conversation avec le Conseiller · 5 juil.',
    ),
    state: 'done',
  },
  {
    n: 2,
    title: bi('Jurisdiction', 'Juridiction'),
    sub: bi(
      'Ontario · Employment Standards Act, 2000 is the statutory floor',
      'Ontario · la LNE de 2000 est le plancher légal',
    ),
    state: 'done',
  },
  {
    n: 3,
    title: bi('Employment details', 'Détails d’emploi'),
    sub: bi(
      'Full-time · 8 yrs · non-union · no termination clause on file',
      'Temps plein · 8 ans · non syndiqué · aucune clause de licenciement au dossier',
    ),
    state: 'done',
  },
  {
    n: 4,
    title: bi('Notice & severance risk', 'Risque de préavis et d’indemnité'),
    sub: bi(
      'Preliminary estimate: 9–12 months common-law notice · legal review requested',
      'Estimation préliminaire : 9 à 12 mois en common law · examen juridique demandé',
    ),
    state: 'current',
  },
  {
    n: 5,
    title: bi('Documents', 'Documents'),
    sub: bi(
      'Termination Letter ✓ · Full & Final Release ✓ · ROE pending · Offboarding Checklist pending',
      'Lettre de licenciement ✓ · Quittance ✓ · RE en attente · Liste de départ en attente',
    ),
    state: 'partial',
  },
  {
    n: 6,
    title: bi('Approval & legal review', 'Approbation et examen juridique'),
    sub: bi(
      'Awaiting counsel reply (requested Jul 5) · offer held until then',
      'En attente du conseiller (demande du 5 juil.) · offre retenue d’ici là',
    ),
    state: 'waiting',
  },
  {
    n: 7,
    title: bi('Meeting checklist', 'Liste de contrôle de la rencontre'),
    sub: bi(
      'Script, logistics, and same-day access plan',
      'Scénario, logistique et plan d’accès le jour même',
    ),
    state: 'upcoming',
  },
  {
    n: 8,
    title: bi('Final pay & offboarding', 'Paie finale et départ'),
    sub: bi(
      'Final pay + accrued vacation · benefits end date · ROE filing',
      'Paie finale + vacances · fin des avantages · dépôt du RE',
    ),
    state: 'upcoming',
  },
  {
    n: 9,
    title: bi('Audit trail', 'Piste de vérification'),
    sub: bi(
      'Every step, document, and approval is logged',
      'Chaque étape, document et approbation est consigné',
    ),
    state: 'always',
  },
]
