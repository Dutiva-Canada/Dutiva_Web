import { bi } from '@/i18n/core'

type PreviewTone = 'risk' | 'warning' | 'info' | 'success' | 'neutral'

/** Marketing-owned Northgate preview slices — mirrors demo fixtures without importing @/data. */
export const LANDING_WORKSPACE_FIXTURES = {
  score: 82,
  scoreDelta: { current: 82, baseline: 74, delta: 8, baselineMonthISO: '2026-02-01' as const },
  attention: [
    {
      id: 'ob2',
      title: bi(
        'Workplace violence & harassment program — annual review and training refresh',
        'Programme contre la violence et le harcèlement — examen annuel et formation',
      ),
      secondary: bi('Ontario', 'Ontario'),
      status: 'due_soon' as const,
      chipLabel: bi('Due in 18 days', 'Dans 18 jours'),
    },
    {
      id: 'ci1',
      title: bi('Law 25 PIA — francization review overdue', 'LPRPDE loi 25 — revue de francisation en retard'),
      secondary: bi('12 employees · Quebec', '12 employés · Québec'),
      status: 'overdue' as const,
      chipLabel: bi('Overdue', 'En retard'),
    },
  ],
  case: {
    id: 'case1',
    title: bi('Termination — Jordan Mensah', 'Cessation d’emploi — Jordan Mensah'),
    status: bi('Legal review recommended', 'Révision juridique recommandée'),
    tone: 'risk' as PreviewTone,
    summary: bi(
      'Without-cause termination during a restructuring. No termination clause on file — preliminary common-law estimate: 9–12 months. Legal review requested.',
      'Cessation d’emploi sans motif lors d’une restructuration. Aucune clause de cessation au dossier — estimation préliminaire en common law : 9 à 12 mois. Examen juridique demandé.',
    ),
    nextStep: bi('Counsel response', 'Réponse du conseiller'),
  },
  comm: {
    title: bi(
      'Return-to-office cadence — company-wide',
      'Cadence de retour au bureau — à l’échelle de l’entreprise',
    ),
    status: bi('Draft', 'Brouillon'),
    tone: 'warning' as PreviewTone,
    note: bi(
      'Advisor flagged that RTO changes can constitute a change to terms of employment in some provinces. Review before sending.',
      'Le Conseiller a signalé que les changements de retour au bureau peuvent constituer une modification des conditions d’emploi dans certaines provinces. À réviser avant l’envoi.',
    ),
    review: { tone: true, legal: false, clarity: true, policy: false },
  },
} as const

export type LandingAttentionStatus = (typeof LANDING_WORKSPACE_FIXTURES.attention)[number]['status']
