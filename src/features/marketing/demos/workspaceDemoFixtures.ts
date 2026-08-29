import { bi } from '@/i18n/core'

type PreviewTone = 'risk' | 'warning' | 'info' | 'success' | 'neutral'

/** Marketing-owned Northgate preview slices — mirrors demo fixtures without importing @/data. */
export const LANDING_WORKSPACE_FIXTURES = {
  score: 82,
  scoreDelta: { current: 82, baseline: 74, delta: 8, baselineMonthISO: '2026-02-01' as const },
  home: {
    org: bi('Northgate Logistics', 'Northgate Logistics'),
    briefTitle: bi('Advisor’s daily brief', 'Brief quotidien du Conseiller'),
    briefLead: bi(
      'Jordan Mensah’s termination file is the one that needs you first.',
      'Le dossier de cessation de Jordan Mensah est celui qui vous attend en premier.',
    ),
    metrics: [
      {
        id: 'cases',
        value: '3',
        label: bi('Open cases', 'Dossiers ouverts'),
        detail: bi(
          'Termination — Jordan Mensah is in legal review.',
          'Cessation d’emploi — Jordan Mensah est en révision juridique.',
        ),
      },
      {
        id: 'tasks',
        value: '5',
        label: bi('Open tasks', 'Tâches ouvertes'),
        detail: bi(
          'Counsel response is the next step on the termination file.',
          'La réponse du conseiller est la prochaine étape du dossier de cessation.',
        ),
      },
      {
        id: 'score',
        value: '82',
        suffix: '/100',
        label: bi('Compliance score', 'Score de conformité'),
        detail: bi(
          'Up 8 points vs February — Law 25 PIA is still overdue.',
          'En hausse de 8 points par rapport à février — l’EIP de la Loi 25 est encore en retard.',
        ),
      },
    ],
  },
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
      detail: bi(
        'Annual review window is open. Training records are due with the program refresh.',
        'La fenêtre d’examen annuel est ouverte. Les dossiers de formation sont dus avec la mise à jour du programme.',
      ),
    },
    {
      id: 'ci1',
      title: bi('Law 25 PIA — francization review overdue', 'LPRPDE loi 25 — revue de francisation en retard'),
      secondary: bi('12 employees · Quebec', '12 employés · Québec'),
      status: 'overdue' as const,
      chipLabel: bi('Overdue', 'En retard'),
      detail: bi(
        'Privacy impact assessment for the Quebec cohort has passed its review date.',
        'L’évaluation des facteurs relatifs à la vie privée pour la cohorte du Québec a dépassé sa date d’examen.',
      ),
    },
  ],
  cases: [
    {
      id: 'case1',
      title: bi('Termination — Jordan Mensah', 'Cessation d’emploi — Jordan Mensah'),
      status: bi('Legal review recommended', 'Révision juridique recommandée'),
      tone: 'risk' as PreviewTone,
      summary: bi(
        'Without-cause termination during a restructuring. No termination clause on file — preliminary common-law estimate: 9–12 months. Legal review requested.',
        'Cessation d’emploi sans motif lors d’une restructuration. Aucune clause de cessation au dossier — estimation préliminaire en common law : 9 à 12 mois. Examen juridique demandé.',
      ),
      nextStep: bi('Counsel response', 'Réponse du conseiller'),
      tabDocs: bi(
        'Termination letter draft on file — not sent. Release still with counsel.',
        'Ébauche de lettre de cessation au dossier — non envoyée. La quittance est encore chez le conseiller.',
      ),
    },
    {
      id: 'case2',
      title: bi('Performance — Devon Clarke', 'Rendement — Devon Clarke'),
      status: bi('In progress', 'En cours'),
      tone: 'warning' as PreviewTone,
      summary: bi(
        'Attendance-related PIP. Advisor flagged the need to rule out a medical or accommodation cause before treating this as misconduct.',
        'PAR lié à l’assiduité. Le Conseiller a signalé la nécessité d’écarter une cause médicale ou d’accommodement avant de traiter la situation comme une inconduite.',
      ),
      nextStep: bi('30-day check-in', 'Suivi à 30 jours'),
      tabDocs: bi(
        'PIP letter and attendance log attached. Accommodation screen completed.',
        'Lettre de PAR et registre d’assiduité joints. Vérification d’accommodement terminée.',
      ),
    },
  ],
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
    reviewNotes: {
      tone: bi('Direct and professional — no change suggested.', 'Direct et professionnel — aucun changement suggéré.'),
      legal: bi(
        'RTO cadence can be a change to terms of employment in some provinces.',
        'La cadence de retour au bureau peut modifier les conditions d’emploi dans certaines provinces.',
      ),
      clarity: bi('The ask and the date are easy to follow.', 'La demande et la date sont faciles à suivre.'),
      policy: bi(
        'The draft does not point at the hybrid-work policy on file.',
        'L’ébauche ne renvoie pas à la politique de travail hybride au dossier.',
      ),
    },
  },
} as const

export type LandingAttentionStatus = (typeof LANDING_WORKSPACE_FIXTURES.attention)[number]['status']
export type LandingHomeMetric = (typeof LANDING_WORKSPACE_FIXTURES.home.metrics)[number]
export type LandingCasePreview = (typeof LANDING_WORKSPACE_FIXTURES.cases)[number]
export type LandingCommDim = keyof (typeof LANDING_WORKSPACE_FIXTURES.comm.review)
