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
    detail: bi(
      'The notice period on file is shorter than what Jordan’s tenure likely requires under the ESA. Confirm his start date and any contractual cap, then compare against the statutory minimums and common-law exposure before the letter goes out. Finance has already confirmed the severance payroll threshold — if the package includes severance, have the calculation reviewed before Friday.',
      'Le préavis au dossier est plus court que ce que l’ancienneté de Jordan exige probablement selon la LNE. Confirmez sa date d’embauche et tout plafond prévu au contrat, puis comparez avec les minimums prévus par la loi et l’exposition en common law avant l’envoi de la lettre. Les Finances ont déjà confirmé le seuil de masse salariale pour l’indemnité de cessation — si l’offre comprend une indemnité, faites réviser le calcul d’ici vendredi.', // [FR self-authored]
    ),
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
    detail: bi(
      'Finance confirmed the Ontario payroll exceeds the ESA severance threshold, so severance eligibility applies to the Mensah file. Keep the confirmation with the case record.',
      'Les Finances ont confirmé que la masse salariale en Ontario dépasse le seuil prévu par la LNE pour l’indemnité de cessation; l’admissibilité s’applique donc au dossier Mensah. Conservez la confirmation avec le dossier.', // [FR self-authored]
    ),
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
    detail: bi(
      'The French onboarding package was sent and filed to the case. Roy’s start date is confirmed and IT access is already provisioned.',
      'La trousse d’accueil française a été envoyée et versée au dossier. La date d’entrée en fonction de Roy est confirmée et l’accès TI est déjà en place.', // [FR self-authored]
    ),
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
    detail: bi(
      'Mid-point check-in on Devon’s performance plan. Review the two milestones due this month, note where he is still behind, and decide whether the plan continues as-is or needs a documented adjustment. Bring specific examples — the review file will need them if this escalates.',
      'Point d’étape du plan d’amélioration du rendement de Devon. Passez en revue les deux jalons prévus ce mois-ci, notez où il accuse encore du retard, et décidez si le plan se poursuit tel quel ou s’il faut un ajustement documenté. Apportez des exemples précis — le dossier en aura besoin si la situation s’aggrave.', // [FR self-authored]
    ),
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
    detail: bi(
      'Amara’s accommodation request needs a documented review this week. Confirm what medical documentation is on file, map the request against the duty to accommodate, and draft the interim arrangement while the review completes. Morgan owns the file — coordinate before committing to dates.',
      'La demande d’accommodement d’Amara doit faire l’objet d’un examen documenté cette semaine. Confirmez quels documents médicaux sont au dossier, comparez la demande à l’obligation d’accommodement, et rédigez l’entente provisoire pendant que l’examen se poursuit. Morgan est responsable du dossier — coordonnez-vous avant d’annoncer des dates.', // [FR self-authored]
    ),
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
    detail: bi(
      'The refreshed Remote Work Policy draft is waiting in Documents. Check the eligibility and equipment sections against the current workforce — Quebec staff weren’t in scope last round — then mark it for legal review. Target: approved before month-end.',
      'L’ébauche révisée de la politique de télétravail vous attend dans Documents. Vérifiez les sections sur l’admissibilité et l’équipement par rapport à l’effectif actuel — le personnel du Québec n’était pas couvert la dernière fois — puis marquez-la pour révision juridique. Objectif : approbation avant la fin du mois.', // [FR self-authored]
    ),
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
