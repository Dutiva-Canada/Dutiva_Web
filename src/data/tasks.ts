import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { Task, TaskPriority, Tone } from './types'

/** Tasks, transcribed from the prototype's `buildTasks()`. */

export const tasks: Task[] = [
  {
    id: 'tk1',
    title: bi(
      'Review termination notice exposure — Jordan Mensah',
      'Examiner l’exposition au préavis de licenciement — Jordan Mensah',
    ),
    due: bi('Today', 'Aujourd’hui'),
    priority: 'high',
    done: false,
    chatId: 'c1',
    owner: 'Riley Summers',
    jur: bi('Ontario', 'Ontario'),
  },
  {
    id: 'tk2',
    title: bi(
      'Confirm ESA severance payroll threshold',
      'Confirmer le seuil de masse salariale pour l’indemnité de cessation d’emploi prévue par la LNE',
    ),
    due: bi('Done', 'Fait'),
    priority: 'high',
    done: true,
    chatId: 'c1',
    owner: 'Marcus Bell',
    jur: bi('Ontario', 'Ontario'),
    evidence: bi(
      'Finance confirmed the ESA severance payroll threshold is met',
      'Les Finances ont confirmé que le seuil de masse salariale de la LNE est atteint',
    ),
  },
  {
    id: 'tk3',
    title: bi(
      'Send onboarding package — Marc-Étienne Roy',
      'Envoyer la trousse d’intégration — Marc-Étienne Roy',
    ),
    due: bi('Done yesterday', 'Fait hier'),
    priority: 'low',
    done: true,
    chatId: 'c6',
    owner: 'Fatima Haddad',
    jur: bi('Quebec', 'Québec'),
    evidence: bi(
      'Evidence: French onboarding package filed to the case',
      'Preuve : trousse d’accueil française versée au dossier',
    ),
  },
  {
    id: 'tk4',
    title: bi('PIP check-in — Devon Clarke', 'Suivi du PAR — Devon Clarke'),
    due: bi('In 11 days', 'Dans 11 jours'),
    priority: 'medium',
    done: false,
    chatId: 'c4',
    owner: 'Riley Summers',
    jur: bi('Ontario', 'Ontario'),
  },
  {
    id: 'tk5',
    title: bi('Accommodation review — Amara Okafor', 'Examen d’accommodement — Amara Okafor'),
    due: bi('In 3 days', 'Dans 3 jours'),
    priority: 'medium',
    done: false,
    chatId: 'c5',
    owner: 'Morgan Chen',
    jur: bi('Ontario', 'Ontario'),
  },
  {
    id: 'tk6',
    title: bi(
      'Review Remote Work Policy draft',
      'Réviser l’ébauche de la politique de télétravail',
    ),
    due: bi('In 6 days', 'Dans 6 jours'),
    priority: 'low',
    done: false,
    chatId: 'c3',
    owner: 'Riley Summers',
    jur: bi('Multi-jurisdiction', 'Multijuridictionnel'),
  },
]

/** Priority chip labels (prototype `tr(t.priority)` via frDict). */
export const taskPriorityLabels: Record<TaskPriority, Bi> = {
  high: bi('high', 'élevée'),
  medium: bi('medium', 'moyenne'),
  low: bi('low', 'faible'),
}

/** Chip tone the prototype maps each priority to. */
export const taskPriorityTones: Record<TaskPriority, Tone> = {
  high: 'risk',
  medium: 'warning',
  low: 'success',
}
