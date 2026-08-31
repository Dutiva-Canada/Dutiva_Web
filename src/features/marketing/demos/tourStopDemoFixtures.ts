import { bi } from '@/i18n/core'
import { LANDING_WORKSPACE_FIXTURES } from './workspaceDemoFixtures'

/**
 * Tour-stop preview extras — loaded with `TourStopPreviewBody`, not the
 * landing cards. Keep this file off the eager graph.
 */
export const TOUR_STOP_FIXTURES = {
  home: {
    org: bi('Northgate Logistics', 'Northgate Logistics'),
    briefTitle: bi('Advisor’s daily brief', 'Brief quotidien du Conseiller'),
    briefLead: bi(
      'Jordan Mensah’s termination file is the one that needs you first.',
      'Le dossier de licenciement de Jordan Mensah est celui qui vous attend en premier.',
    ),
    metrics: [
      {
        id: 'cases',
        value: '3',
        label: bi('Open cases', 'Dossiers ouverts'),
        detail: bi(
          'Termination — Jordan Mensah is in legal review.',
          'Licenciement — Jordan Mensah est en révision juridique.',
        ),
      },
      {
        id: 'tasks',
        value: '5',
        label: bi('Open tasks', 'Tâches ouvertes'),
        detail: bi(
          'Counsel response is the next step on the termination file.',
          'La réponse du conseiller est la prochaine étape du dossier de licenciement.',
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
  attentionDetail: {
    ob2: bi(
      'Annual review window is open. Training records are due with the program refresh.',
      'La fenêtre d’examen annuel est ouverte. Les dossiers de formation sont dus avec la mise à jour du programme.',
    ),
    ci1: bi(
      'Privacy impact assessment for the Quebec cohort has passed its review date.',
      'L’évaluation des facteurs relatifs à la vie privée pour la cohorte du Québec a dépassé sa date d’examen.',
    ),
  },
  cases: [
    {
      ...LANDING_WORKSPACE_FIXTURES.case,
      tabDocs: bi(
        'Termination letter draft on file — not sent. Release still with counsel.',
        'Ébauche de lettre de licenciement au dossier — non envoyée. La quittance est encore chez le conseiller.',
      ),
    },
    {
      id: 'case2',
      title: bi('Performance — Devon Clarke', 'Rendement — Devon Clarke'),
      status: bi('In progress', 'En cours'),
      tone: 'warning' as const,
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
  reviewNotes: {
    tone: bi(
      'Direct and professional — no change suggested.',
      'Direct et professionnel — aucun changement suggéré.',
    ),
    legal: bi(
      'RTO cadence can be a change to terms of employment in some provinces.',
      'La cadence de retour au bureau peut modifier les conditions d’emploi dans certaines provinces.',
    ),
    clarity: bi(
      'The ask and the date are easy to follow.',
      'La demande et la date sont faciles à suivre.',
    ),
    policy: bi(
      'The draft does not point at the hybrid-work policy on file.',
      'L’ébauche ne renvoie pas à la politique de travail hybride au dossier.',
    ),
  },
} as const
