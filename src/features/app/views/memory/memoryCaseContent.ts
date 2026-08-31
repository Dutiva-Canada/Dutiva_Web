import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'

/**
 * Case-memory narrative content (Advisor Memory prototype `buildCase()`):
 * the resume banner, running summary, what-changed list, session timeline
 * and next steps for the two demonstrated cases. Keyed by the app's case
 * ids (case1 = Jordan termination, case3 = Amara accommodation).
 */

export interface CaseTimelineSession {
  kind: 'session'
  date: Bi
  label: Bi
  current?: boolean
  events: Bi[]
}

export interface CaseTimelineGap {
  kind: 'gap'
  label: Bi
}

export type CaseTimelineEntry = CaseTimelineSession | CaseTimelineGap

export interface MemoryCaseChip {
  tone: 'ok' | 'warn' | 'risk' | 'neutral'
  label: Bi
}

export interface MemoryCaseContent {
  chips: MemoryCaseChip[]
  resume: { last: Bi; ago: Bi; since: Bi }
  summary: Bi
  changed: Bi[]
  timeline: CaseTimelineEntry[]
  /** Person facts pulled into the What-I-know rail (memory fact ids). */
  personFactIds: string[]
  /** Case facts pulled into the What-I-know rail (memory fact ids). */
  caseFactIds: string[]
  nextSteps: Bi[]
}

export const memoryCaseContent: Record<string, MemoryCaseContent> = {
  case1: {
    chips: [
      { tone: 'risk', label: bi('Open · high risk', 'Ouvert · risque élevé') },
      { tone: 'warn', label: bi('Awaiting counsel', 'En attente du conseiller juridique') },
      { tone: 'neutral', label: bi('Ontario · ESA, 2000', 'Ontario · LNE, 2000') },
    ],
    resume: {
      last: bi('Jul 5', 'le 5 juill.'),
      ago: bi('6 days ago', 'il y a 6 jours'),
      since: bi(
        'counsel hasn’t responded, and nothing has been sent to Jordan.',
        'le conseiller juridique n’a pas répondu, et rien n’a été envoyé à Jordan.',
      ),
    },
    summary: bi(
      'Full-time Ontario employee, 8 years’ service, no termination clause on file. Terminating without cause. ESA minimum: 8 weeks’ termination notice/pay; statutory severance may apply if eligibility requirements are met. Preliminary common-law exposure estimated at 9–12 months. Counsel review requested Jul 5, still outstanding. No offer issued.',
      'Employé à temps plein en Ontario, 8 ans de service, aucune clause de licenciement au dossier. Licenciement sans motif. Minimum LNE : 8 semaines de préavis ou d’indemnité de licenciement; une indemnité de cessation d’emploi peut s’appliquer si les conditions d’admissibilité sont remplies. Exposition préliminaire en common law estimée à 9–12 mois. Révision juridique demandée le 5 juill., toujours en attente. Aucune offre émise.',
    ),
    changed: [
      bi(
        'Counsel review has been outstanding for 6 days.',
        'La révision juridique est en attente depuis 6 jours.',
      ),
      bi(
        'Jordan booked vacation Jul 14–18 — a decision window is closing.',
        'Jordan a réservé des vacances du 14 au 18 juill. — une fenêtre de décision se referme.',
      ),
      bi(
        'Nothing has been sent; the drafted letter is still on hold.',
        'Rien n’a été envoyé; la lettre rédigée est toujours retenue.',
      ),
    ],
    timeline: [
      {
        kind: 'session',
        date: bi('Jul 2, 2026', '2 juill. 2026'),
        label: bi('Case opened', 'Dossier ouvert'),
        events: [
          bi(
            'Riley Summers opened the case and uploaded Employment Agreement.pdf.',
            'Riley Summers a ouvert le dossier et téléversé Employment Agreement.pdf.',
          ),
          bi(
            'Advisor flagged: employment agreement contains no termination clause.',
            'Le Conseiller a signalé : le contrat de travail ne comporte aucune clause de licenciement.',
          ),
          bi(
            'Jurisdiction confirmed — Ontario. ESA termination notice/pay minimum computed.',
            'Compétence confirmée — Ontario. Minimum LNE de préavis ou d’indemnité de licenciement calculé.',
          ),
        ],
      },
      {
        kind: 'session',
        date: bi('Jul 5, 2026', '5 juill. 2026'),
        label: bi('Analysis & counsel request', 'Analyse et demande juridique'),
        events: [
          bi(
            'Advisor estimated common-law reasonable notice at 9–12 months.',
            'Le Conseiller a estimé le préavis raisonnable de common law à 9–12 mois.',
          ),
          bi(
            'Employment-counsel review requested.',
            'Révision par un conseiller juridique en droit du travail demandée.',
          ),
          bi(
            'Termination letter drafted — held, not sent.',
            'Lettre de licenciement rédigée — retenue, non envoyée.',
          ),
        ],
      },
      { kind: 'gap', label: bi('6 days — no activity', '6 jours — aucune activité') },
      {
        kind: 'session',
        date: bi('Today · Jul 11, 2026', 'Aujourd’hui · 11 juill. 2026'),
        label: bi('Resumed', 'Repris'),
        current: true,
        events: [
          bi(
            'You reopened the case. Advisor reloaded 8 memories for Jordan and this case.',
            'Vous avez rouvert le dossier. Le Conseiller a rechargé 8 mémoires pour Jordan et ce dossier.',
          ),
          bi(
            'No counsel response since Jul 5. Nothing has been sent.',
            'Aucune réponse juridique depuis le 5 juill. Rien n’a été envoyé.',
          ),
        ],
      },
    ],
    personFactIds: ['p2', 'p4', 'p8'],
    caseFactIds: ['c1', 'c2', 'c3'],
    nextSteps: [
      bi(
        'Chase counsel before Jordan’s Jul 14 vacation.',
        'Relancer le conseiller juridique avant les vacances de Jordan le 14 juill.',
      ),
      bi(
        'Keep the drafted letter on hold until reviewed.',
        'Garder la lettre rédigée en attente jusqu’à la révision.',
      ),
      bi(
        'Recompute severance once payroll size is confirmed.',
        'Recalculer l’indemnité une fois la masse salariale confirmée.',
      ),
    ],
  },
  case3: {
    chips: [
      { tone: 'warn', label: bi('Open · monitoring', 'Ouvert · suivi') },
      { tone: 'neutral', label: bi('BC · Human Rights Code', 'C.-B. · Human Rights Code') },
    ],
    resume: {
      last: bi('Jun 28', 'le 28 juin'),
      ago: bi('2 weeks ago', 'il y a 2 semaines'),
      since: bi(
        'the 90-day review window is approaching (Jul 14).',
        'la fenêtre de révision de 90 jours approche (14 juill.).',
      ),
    },
    summary: bi(
      'Active modified-duties accommodation for an Operations Analyst in BC. Functional limitations on file; duty to accommodate to undue hardship. 90-day review due Jul 14.',
      'Accommodement actif en tâches modifiées pour une analyste des opérations en C.-B. Limitations fonctionnelles au dossier; obligation d’accommodement jusqu’à la contrainte excessive. Révision de 90 jours le 14 juill.',
    ),
    changed: [
      bi(
        'The 90-day functional review is due Jul 14.',
        'La révision fonctionnelle de 90 jours est due le 14 juill.',
      ),
      bi(
        'No change to restrictions reported since April.',
        'Aucun changement aux restrictions signalé depuis avril.',
      ),
    ],
    timeline: [
      {
        kind: 'session',
        date: bi('Apr 3, 2026', '3 avr. 2026'),
        label: bi('Accommodation opened', 'Accommodement ouvert'),
        events: [
          bi(
            'Doctor’s note received; functional limitations recorded.',
            'Billet médical reçu; limitations fonctionnelles consignées.',
          ),
        ],
      },
      {
        kind: 'session',
        date: bi('Apr 3, 2026', '3 avr. 2026'),
        label: bi('Plan set', 'Plan établi'),
        events: [
          bi(
            'Modified-duties plan agreed with a 90-day review.',
            'Plan de tâches modifiées convenu avec révision à 90 jours.',
          ),
        ],
      },
      { kind: 'gap', label: bi('~3 months — plan in effect', '~3 mois — plan en vigueur') },
      {
        kind: 'session',
        date: bi('Today · Jul 11, 2026', 'Aujourd’hui · 11 juill. 2026'),
        label: bi('Review approaching', 'Révision qui approche'),
        current: true,
        events: [
          bi(
            'Advisor surfaced the Jul 14 review date from case memory.',
            'Le Conseiller a fait ressortir la date de révision du 14 juill. depuis la mémoire du dossier.',
          ),
        ],
      },
    ],
    personFactIds: ['a1', 'a2'],
    caseFactIds: [],
    nextSteps: [
      bi(
        'Hold the functional review by Jul 14.',
        'Tenir la révision fonctionnelle d’ici le 14 juill.',
      ),
      bi('Confirm restrictions are unchanged.', 'Confirmer que les restrictions sont inchangées.'),
    ],
  },
}
