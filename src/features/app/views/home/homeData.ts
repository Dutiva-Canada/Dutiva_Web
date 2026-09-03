import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { cases, employeeDetails, employees, tasks } from '@/data'
import type { FlowKeyOrFallback } from '@/features/app/views/advisor/advisorFlows'

/**
 * Home — Command Centre view-model data, ported from `App v2.dc.html`:
 * `buildPriorities()` (4716–4735), `buildHomeView()` chips (4804–4810),
 * `workflowsInFlight()` (4754–4761) and `workflowCatalog()` (4763–4776).
 *
 * Strings are EN verbatim / FR from the prototype's inline `fr ? … : …`
 * pairs. Live counts (open cases, open tasks, support signals) derive from
 * the `@/data` fixtures exactly as the prototype derives them from state.
 */

/* ------------------------------------------------------------ shared bits */

/** Declarative action — resolved to navigation / rail / doc-studio calls by `useHomeActions`. */
export type HomeAction =
  | { kind: 'route'; to: string }
  | { kind: 'chat'; chatId: string }
  | { kind: 'doc'; templateKey: string }
  | { kind: 'comp-rail'; employeeId: string }
  | { kind: 'wellbeing-rail'; employeeId: string }
  /** Prototype `startFlow(key, text)` — opens the Advisor on a fresh conversation.
      The explicit flow key must ride along (the keyword router is EN-only). */
  | { kind: 'flow'; prompt: Bi; flowKey: FlowKeyOrFallback }

export type PriorityTone = 'risk' | 'warning' | 'info'
export type PrioritySeverity = 'High' | 'Medium' | 'Low'

/* --------------------------------------------------------- derived counts */

/** Prototype: `s.cases.filter(c => c.status !== 'Resolved').length`. */
export const openCaseCount = cases.filter((c) => c.status.en !== 'Resolved').length

/** Prototype: `s.tasks.filter(t => !t.done).length`. */
export const openTaskCount = tasks.filter((t) => !t.done).length

/** Prototype `buildWellbeingView().attention` — employees with sentiment < 55. */
export const supportSignalCount = employees.filter((e) => {
  const sentiment = employeeDetails[e.id]?.sentiment
  return sentiment != null && sentiment < 55
}).length

/* ------------------------------------------------------------- priorities */

export const severityLabels: Record<PrioritySeverity, Bi> = {
  High: bi('High', 'Élevé'),
  Medium: bi('Medium', 'Moyen'),
  Low: bi('Low', 'Faible'),
}

export interface HomePriority {
  id: string
  severity: PrioritySeverity
  tone: PriorityTone
  title: Bi
  meta: Bi
  why: Bi
  actionLabel: Bi
  action: HomeAction
  /** "Ask Advisor" prompt (Act now items only) — prototype `onAsk`. */
  ask?: Bi
  /** Explicit flow key for `ask` — prototype 4784–4786 (pr1 fallback, pr2 policy). */
  askFlowKey?: FlowKeyOrFallback
  /** Due pill for This-week rows (prototype `dueMap`). */
  due?: { label: Bi; warn: boolean }
}

/** Prototype `buildPriorities()` — already in severity order (High → Low). */
export const homePriorities: HomePriority[] = [
  {
    id: 'pr1',
    severity: 'High',
    tone: 'risk',
    title: bi(
      'Jordan Mensah — counsel response outstanding',
      'Jordan Mensah — réponse du conseiller juridique en attente',
    ),
    meta: bi(
      'Termination · Ontario · Due today · Owner: Riley Summers',
      'Cessation d’emploi · Ontario · Échéance : aujourd’hui · Resp. : Riley Summers',
    ),
    why: bi(
      'A legal-review request has been open since Jul 5. The preliminary notice estimate (9–12 months) remains unreviewed until counsel replies.',
      'Une demande d’examen juridique est ouverte depuis le 5 juillet. L’estimation préliminaire du préavis (9 à 12 mois) reste non révisée tant que le conseiller n’a pas répondu.',
    ),
    actionLabel: bi('Open case', 'Ouvrir le dossier'),
    action: { kind: 'route', to: '/app/cases/case1' },
    ask: bi(
      "What's our exposure if counsel doesn't reply this week on Jordan Mensah's termination?",
      'Quelle est notre exposition si le conseiller juridique ne répond pas cette semaine au sujet de Jordan Mensah?',
    ),
    askFlowKey: 'fallback',
  },
  {
    id: 'pr2',
    severity: 'High',
    tone: 'risk',
    title: bi(
      'Remote Work Policy overdue by 14 months',
      'Politique de télétravail en retard de 14 mois',
    ),
    meta: bi(
      'Policy · Multi-jurisdiction · Due Jul 11 · Owner: Riley Summers',
      'Politique · Multijuridictionnel · Échéance : 11 juillet · Resp. : Riley Summers',
    ),
    why: bi(
      'OHS and expense obligations changed as you added employment jurisdictions. An overdue policy is the largest single drag on your compliance score.',
      'Les obligations en SST et en dépenses ont changé à mesure que vous ajoutiez des compétences. Une politique en retard est le plus grand frein à votre score de conformité.',
    ),
    actionLabel: bi('Draft refresh', 'Rédiger une mise à jour'),
    action: { kind: 'doc', templateKey: 'T10' },
    ask: bi(
      'What should the refreshed Remote Work Policy cover across our employment jurisdictions?',
      'Que doit couvrir la politique de télétravail mise à jour selon nos compétences d’emploi?',
    ),
    askFlowKey: 'policy',
  },
  {
    id: 'pr3',
    severity: 'Medium',
    tone: 'warning',
    title: bi(
      'Amara Okafor — accommodation review due Jul 14',
      'Amara Okafor — examen d’accommodement dû le 14 juillet',
    ),
    meta: bi(
      'Accommodation · Ontario · Due Jul 14 · Owner: Morgan Chen',
      'Accommodement · Ontario · Échéance : 14 juillet · Resp. : Morgan Chen',
    ),
    why: bi(
      'The 90-day modified-duties review is approaching. Confirm functional limitations are unchanged before the date.',
      'L’examen des tâches modifiées à 90 jours approche. Confirmez que les limitations fonctionnelles sont inchangées avant la date.',
    ),
    actionLabel: bi('Open case', 'Ouvrir le dossier'),
    action: { kind: 'route', to: '/app/cases/case3' },
    due: { label: bi('7d', '7 j'), warn: true },
  },
  {
    id: 'pr4',
    severity: 'Medium',
    tone: 'warning',
    title: bi(
      'Devon Clarke — PIP 30-day check-in Jul 22',
      'Devon Clarke — suivi du PAR à 30 jours le 22 juillet',
    ),
    meta: bi(
      'Performance · Ontario · Due Jul 22 · Owner: Riley Summers',
      'Rendement · Ontario · Échéance : 22 juillet · Resp. : Riley Summers',
    ),
    why: bi(
      'The documented check-in must be held against measurable attendance expectations to stay defensible.',
      'Le suivi documenté doit être tenu par rapport à des attentes d’assiduité mesurables pour rester défendable.',
    ),
    actionLabel: bi('Open case', 'Ouvrir le dossier'),
    action: { kind: 'route', to: '/app/cases/case2' },
    due: { label: bi('15d', '15 j'), warn: false },
  },
  {
    id: 'pr5',
    severity: 'Medium',
    tone: 'warning',
    title: bi(
      'Théo Lavoie — pay 10% below market midpoint',
      'Théo Lavoie — salaire 10 % sous le point milieu du marché',
    ),
    meta: bi(
      'Compensation · Quebec · Next comp cycle · Owner: Finance + HR',
      'Rémunération · Québec · Prochain cycle · Resp. : Finances + RH',
    ),
    why: bi(
      'Sustained below-midpoint pay for a comparable role is a retention risk. Model an adjustment at the next cycle.',
      'Un salaire soutenu sous le point milieu pour un poste comparable présente un risque de rétention. Modélisez un ajustement au prochain cycle.',
    ),
    actionLabel: bi('Review pay', 'Réviser le salaire'),
    action: { kind: 'comp-rail', employeeId: 'e10' },
    due: { label: bi('Cycle', 'Cycle'), warn: false },
  },
  {
    id: 'pr6',
    severity: 'Low',
    tone: 'info',
    title: bi('Grace Osei — wellbeing trending down', 'Grace Osei — bien-être en baisse'),
    meta: bi(
      'Support · Alberta · Follow-up this month · Owner: Morgan Chen',
      'Soutien · Alberta · Suivi ce mois-ci · Resp. : Morgan Chen',
    ),
    why: bi(
      'Two consecutive check-ins mention sustained overtime. A workload conversation now can prevent burnout later.',
      'Deux suivis consécutifs mentionnent des heures supplémentaires soutenues. Une conversation sur la charge de travail dès maintenant peut prévenir l’épuisement.',
    ),
    actionLabel: bi('Support', 'Soutenir'),
    action: { kind: 'wellbeing-rail', employeeId: 'e11' },
  },
]

export const actNowPriorities = homePriorities.filter((p) => p.severity === 'High')
export const thisWeekPriorities = homePriorities.filter((p) => p.severity === 'Medium')
export const watchingPriorities = homePriorities.filter((p) => p.severity === 'Low')

/* ------------------------------------------------------------ metric chips */

export interface HomeMetricChip {
  value: string
  suffix: string
  label: Bi
  delta: Bi
  /** Montserrat value colour (prototype `valueColor`). */
  valueClass: string
  /** Delta colour (prototype `deltaColor`). */
  deltaClass: string
  action: HomeAction
}

/** Prototype `buildHomeView()` chips — Compliance / Open cases / Overdue tasks / Docs / Support. */
export const homeMetricChips: HomeMetricChip[] = [
  {
    value: '82',
    suffix: '/100',
    label: bi('Compliance', 'Conformité'),
    delta: bi('→ 88 predicted', '→ 88 prévu'),
    valueClass: 'text-gold-dot',
    deltaClass: 'text-ok-fg',
    action: { kind: 'route', to: '/app/compliance' },
  },
  {
    value: String(openCaseCount),
    suffix: '',
    label: bi('Open cases', 'Dossiers ouverts'),
    delta: bi('1 legal review required', '1 révision juridique requise'),
    valueClass: 'text-risk-dot',
    deltaClass: 'text-risk-fg',
    action: { kind: 'route', to: '/app/cases' },
  },
  {
    value: '2',
    suffix: '',
    label: bi('Overdue tasks', 'Tâches en retard'),
    delta: bi(`of ${openTaskCount} open`, `sur ${openTaskCount} ouvertes`),
    valueClass: 'text-gold-dot',
    deltaClass: 'text-warn-fg',
    action: { kind: 'route', to: '/app/planning/tasks' },
  },
  {
    value: '3',
    suffix: '',
    label: bi('Docs awaiting review', 'Documents à réviser'),
    delta: bi('1 high-risk', '1 à risque élevé'),
    valueClass: 'text-accent',
    deltaClass: 'text-risk-fg',
    action: { kind: 'route', to: '/app/documents/studio' },
  },
  {
    value: String(supportSignalCount),
    suffix: '',
    label: bi('Support signals', 'Signaux de soutien'),
    delta: bi('supportive follow-up only', 'suivi de soutien seulement'),
    valueClass: 'text-ok-fg',
    deltaClass: 'text-text-muted',
    action: { kind: 'route', to: '/app/wellbeing' },
  },
]

/* Workflows-in-flight rows live in the workflows feature (workflowsData.ts);
   HomeWorkflowsCard renders that canonical list. */

/** Prototype `onAskBrief` — "Ask about this brief" flow prompt (explicit 'fallback' key, 4826). */
export const askBriefPrompt: Bi = bi(
  'Walk me through today’s brief — what should I do first?',
  'Explique-moi le résumé d’aujourd’hui — par quoi devrais-je commencer?',
)
