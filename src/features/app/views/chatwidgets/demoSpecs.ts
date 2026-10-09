import type { WidgetSpec } from '@/components/chatWidgets/widgetSpec'
import {
  ontarioOvertimeSpec,
  ontarioTerminationPaySpec,
} from '@/components/chatWidgets/prebuiltWidgets'

/**
 * Demo specs for the chat-widgets showcase view (/app/chat-widgets).
 * Every label ships {en, fr} so the page demonstrates live re-localization;
 * a bot emitting these same objects in a ```dutiva-widget fence produces
 * the identical rendering.
 */

export const demoCalculators: WidgetSpec[] = [ontarioTerminationPaySpec(), ontarioOvertimeSpec()]

export const demoChartPie: WidgetSpec = {
  type: 'chart',
  title: { en: 'Payroll cost breakdown', fr: 'Répartition des coûts de paie' },
  data: {
    kind: 'pie',
    format: 'currency',
    items: [
      { label: { en: 'Gross wages', fr: 'Salaires bruts' }, value: 41200 },
      { label: { en: 'CPP / QPP employer', fr: 'RPC / RRQ employeur' }, value: 2300 },
      { label: { en: 'EI employer', fr: 'AE employeur' }, value: 1290 },
      { label: { en: 'Benefits', fr: 'Avantages sociaux' }, value: 3400 },
      { label: { en: 'WSIB / CNESST', fr: 'WSIB / CNESST' }, value: 810 },
    ],
  },
}

export const demoChartBar: WidgetSpec = {
  type: 'chart',
  title: { en: 'Open cases by jurisdiction', fr: 'Dossiers ouverts par juridiction' },
  data: {
    kind: 'bar',
    items: [
      { label: { en: 'Ontario', fr: 'Ontario' }, value: 6 },
      { label: { en: 'Québec', fr: 'Québec' }, value: 3 },
      { label: { en: 'Federal', fr: 'Fédéral' }, value: 1 },
    ],
  },
}

/* 60 generated rows — the demo exercises the acceptance case of a 50+ row
   table staying smooth (content-visibility does the heavy lifting). */
const demoTablePool = [
  { en: 'Policy review cycle', fr: 'Cycle de révision des politiques' },
  { en: 'Pay equity maintenance', fr: 'Maintien de l’équité salariale' },
  { en: 'Harassment prevention refresh', fr: 'Mise à jour prévention harcèlement' },
  { en: 'Vacation accrual audit', fr: 'Vérification des vacances accumulées' },
  { en: 'Records retention check', fr: 'Vérification de la conservation' },
  { en: 'Safety committee minutes', fr: 'Procès-verbaux du comité SST' },
] as const
const demoTableJurs = [
  { en: 'Ontario', fr: 'Ontario' },
  { en: 'Québec', fr: 'Québec' },
  { en: 'Federal', fr: 'Fédéral' },
] as const

export const demoTable: WidgetSpec = {
  type: 'table',
  title: { en: 'Compliance deadlines', fr: 'Échéances de conformité' },
  data: {
    columns: [
      { key: 'item', label: { en: 'Requirement', fr: 'Obligation' } },
      { key: 'jur', label: { en: 'Jurisdiction', fr: 'Juridiction' } },
      { key: 'due', label: { en: 'Due', fr: 'Échéance' }, align: 'right' },
    ],
    rows: Array.from({ length: 60 }, (_, i) => ({
      item: demoTablePool[i % demoTablePool.length]!,
      jur: demoTableJurs[i % demoTableJurs.length]!,
      due: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    })),
    searchable: true,
    sortable: true,
  },
}

export const demoChecklist: WidgetSpec = {
  type: 'checklist',
  title: { en: 'New-hire onboarding', fr: 'Intégration d’un nouvel employé' },
  data: {
    items: [
      {
        id: 'offer',
        label: { en: 'Signed offer letter on file', fr: 'Lettre d’offre signée au dossier' },
        done: true,
      },
      {
        id: 'sin',
        label: { en: 'SIN and TD1 collected', fr: 'NAS et TD1 recueillis' },
        done: true,
      },
      {
        id: 'policy',
        label: { en: 'Policy acknowledgement sent', fr: 'Accusé des politiques envoyé' },
      },
      {
        id: 'training',
        label: { en: 'Safety training scheduled', fr: 'Formation SST planifiée' },
      },
      {
        id: 'buddy',
        label: { en: 'First-week buddy assigned', fr: 'Jumeau de la première semaine assigné' },
      },
    ],
    showProgress: true,
    copySummary: true,
  },
}

export const demoTimeline: WidgetSpec = {
  type: 'timeline',
  title: { en: 'Probation and review schedule', fr: 'Calendrier de probation et d’évaluation' },
  data: {
    steps: [
      {
        label: { en: 'Start date', fr: 'Date d’embauche' },
        date: '2026-09-08',
        status: 'done',
        description: { en: 'Day-one paperwork complete', fr: 'Documents du premier jour remplis' },
      },
      {
        label: { en: '30-day check-in', fr: 'Point à 30 jours' },
        date: '2026-10-08',
        status: 'current',
        description: { en: 'Manager + HR touchpoint', fr: 'Point gestionnaire + RH' },
      },
      {
        label: { en: 'Probation review', fr: 'Évaluation de probation' },
        date: '2026-12-08',
        status: 'upcoming',
      },
      {
        label: { en: 'Annual review', fr: 'Évaluation annuelle' },
        date: '2027-09-08',
        status: 'upcoming',
      },
    ],
  },
}

export const demoComparison: WidgetSpec = {
  type: 'comparison',
  title: { en: 'Contractor or employee?', fr: 'Entrepreneur ou employé ?' },
  data: {
    options: [
      {
        name: { en: 'Employee', fr: 'Employé' },
        tagline: { en: 'On payroll, ESA-covered', fr: 'Sur la paie, couvert par la LNT' },
        recommended: true,
        rows: [
          { label: { en: 'Control over work', fr: 'Contrôle du travail' }, value: { en: 'Employer sets it', fr: 'Fixé par l’employeur' } },
          { label: { en: 'Tools provided', fr: 'Outils fournis' }, value: { en: 'Usually', fr: 'Généralement' } },
          { label: { en: 'Termination notice', fr: 'Préavis de licenciement' }, value: { en: 'ESA minimums', fr: 'Minimums LNT' } },
        ],
      },
      {
        name: { en: 'Contractor', fr: 'Entrepreneur' },
        tagline: { en: 'Independent business', fr: 'Entreprise indépendante' },
        rows: [
          { label: { en: 'Control over work', fr: 'Contrôle du travail' }, value: { en: 'Worker decides', fr: 'Décidé par le travailleur' } },
          { label: { en: 'Tools provided', fr: 'Outils fournis' }, value: { en: 'Own tools', fr: 'Propres outils' } },
          { label: { en: 'Termination notice', fr: 'Préavis de licenciement' }, value: { en: 'Contract terms', fr: 'Selon le contrat' } },
        ],
        footnote: {
          en: 'Labels don’t decide status — the working relationship does.',
          fr: 'L’étiquette ne décide pas du statut — la relation de travail, oui.',
        },
      },
    ],
  },
}

/** A single assistant reply mixing prose and two widget fences — the same
    shape a bot would emit mid-conversation. Rendered through WidgetContent,
    the production code path for the portal chats. */
export const demoMixedReply: string = [
  'Here’s the termination-pay floor at three years, and how it compares with the statutory cap:',
  '```dutiva-widget',
  JSON.stringify(ontarioTerminationPaySpec(), null, 2),
  '```',
  'And where overtime would land at 50 hours on a $20 rate:',
  '```dutiva-widget',
  JSON.stringify(ontarioOvertimeSpec(), null, 2),
  '```',
  'Both are ESA minimums — your policy can be more generous, never less.',
].join('\n')

/** A deliberately broken spec — demonstrates the graceful fallback. */
export const demoBrokenReply: string = [
  'Let me fetch that for you:',
  '```dutiva-widget',
  '{ "type": "calculator", "html": "<img src=x onerror=alert(1)>", "data": {} }',
  '```',
].join('\n')
