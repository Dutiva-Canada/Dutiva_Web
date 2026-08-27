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
    title: bi('Document Studio', 'Studio de documents'),
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
      'Ouvrez un dossier de cessation avec notes, documents et contexte du Conseiller.',
    ),
  },
]
