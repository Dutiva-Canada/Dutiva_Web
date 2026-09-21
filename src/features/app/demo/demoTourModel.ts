import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'

export interface DemoTourStop {
  id: string
  pathSuffix: string
  title: Bi
  blurb: Bi
}

/** Guided tour stops — deep-links into the public demo workspace. */
export const DEMO_TOUR_STOPS: readonly DemoTourStop[] = [
  {
    id: 'home',
    pathSuffix: 'home',
    title: bi('Command centre', 'Centre de commande'),
    blurb: bi(
      'See open cases, tasks, and what needs attention in one place.',
      'Voyez les dossiers ouverts, les tâches et ce qui demande attention au même endroit.',
    ),
  },
  {
    id: 'advisor',
    pathSuffix: 'advisor',
    title: bi('Dutiva Advisor', 'Conseiller Dutiva'),
    blurb: bi(
      'Browse sample threads — jurisdiction, risk, and suggested documents.',
      'Parcourez des fils types — compétence, risque et documents suggérés.',
    ),
  },
  {
    id: 'studio',
    pathSuffix: 'documents/studio',
    title: bi('Templates', 'Modèles'),
    blurb: bi(
      'Pick a template and preview how clauses assemble for Ontario employers.',
      'Choisissez un modèle et voyez comment les clauses s’assemblent pour les employeurs ontariens.',
    ),
  },
  {
    id: 'workflows',
    pathSuffix: 'workflows',
    title: bi('Guided workflows', 'Processus guidés'),
    blurb: bi(
      'Walk through multi-step HR processes with checklists and risk flags.',
      'Suivez des processus RH à plusieurs étapes avec listes et signaux de risque.',
    ),
  },
  {
    id: 'cases',
    pathSuffix: 'cases',
    title: bi('Cases', 'Dossiers'),
    blurb: bi(
      'Open a termination case with notes, documents, and Advisor context.',
      'Ouvrez un dossier de licenciement avec notes, documents et contexte du Conseiller.',
    ),
  },
  {
    id: 'analytics',
    pathSuffix: 'analytics',
    title: bi('Analytics', 'Analytique'),
    blurb: bi(
      'Compliance score, trend, and a queue of what needs attention.',
      'Score de conformité, tendance et file de ce qui demande attention.',
    ),
  },
  {
    id: 'comms',
    pathSuffix: 'comms',
    title: bi('Communications', 'Communications'),
    blurb: bi(
      'Plan initiatives, draft content, manage contacts, and track delivery.',
      'Planifiez des initiatives, rédigez du contenu, gérez les contacts et suivez la diffusion.',
    ),
  },
  {
    id: 'hiring',
    pathSuffix: 'hiring',
    title: bi('Hiring', 'Recrutement'),
    blurb: bi(
      'Evidence-based funnel — candidates, work samples, and defense interviews.',
      'Entonnoir fondé sur des preuves — candidats, échantillons et entretiens de défense.',
    ),
  },
  /* Business-ops stops — the tour ends on the wider-than-HR reveal. */
  {
    id: 'finance',
    pathSuffix: 'finance/overview',
    title: bi('Finance', 'Finances'),
    blurb: bi(
      'Entities, ledger transactions, and reconciliation status in one view.',
      'Entités, opérations du grand livre et état du rapprochement en une vue.',
    ),
  },
  {
    id: 'governance',
    pathSuffix: 'governance',
    title: bi('Governance', 'Gouvernance'),
    blurb: bi(
      'Records, decisions, officers, and shareholders — the corporate side.',
      'Registres, décisions, dirigeants et actionnaires — le volet corporatif.',
    ),
  },
  {
    id: 'planning',
    pathSuffix: 'planning/tasks',
    title: bi('Planning', 'Planification'),
    blurb: bi(
      'Tasks and calendar work spanning the whole workspace.',
      'Tâches et calendrier pour l’ensemble de l’espace.',
    ),
  },
  {
    id: 'specialists',
    pathSuffix: 'specialists',
    title: bi('Specialists', 'Spécialistes'),
    blurb: bi(
      'Your external bench — lawyers, accountants, and providers, with engagement tracking.',
      'Votre équipe externe — avocats, comptables et fournisseurs, avec suivi des engagements.',
    ),
  },
]
