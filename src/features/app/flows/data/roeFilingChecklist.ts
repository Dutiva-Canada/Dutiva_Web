import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Deadline / milestone tracker — ROE filing checklist (TODO.md EF11,
 * handoff T29). All FR is [FR self-authored].
 *
 * Process shape only. Does **not** hardcode Service Canada filing-day
 * counts — T29 records the deadline the employer computed from current
 * rules. Inventing a day count here would become a compliance defect when
 * the regulation moves.
 */

export const roeFilingChecklistFlow: Flow = {
  slug: 'roe-filing-checklist',
  ring: 1,
  jurisdictions: ['ON', 'QC', 'FED'],
  estMinutes: 5,
  title: bi('ROE filing checklist', 'Liste de contrôle — REE'),
  summary: bi(
    'Assemble what the Record of Employment needs before you file — reason code, pay data, and a deadline you confirm from Service Canada, not from this product.',
    'Rassemblez ce dont le relevé d’emploi a besoin avant le dépôt — code de raison, données de paie et un délai que vous confirmez auprès de Service Canada, pas dans ce produit.',
  ),
  start: 'trigger',
  steps: [
    {
      id: 'trigger',
      kind: 'choice',
      title: bi('Has earnings been interrupted so an ROE is required?', 'Les gains ont-ils été interrompus de façon à exiger un REE?'),
      body: bi(
        'An ROE is a federal Employment Insurance Act obligation for every employer when there is an interruption of earnings. Provincial employment standards do not replace it.',
        'Le REE est une obligation fédérale de la Loi sur l’assurance-emploi pour tout employeur lorsqu’il y a interruption de rémunération. Les normes d’emploi provinciales ne le remplacent pas.',
      ),
      caution: bi(
        'This checklist never states a filing-day count. Confirm the current Service Canada deadline from official guidance for how you file (electronic or paper), then record that date on T29.',
        'Cette liste n’énonce jamais un nombre de jours de dépôt. Confirmez le délai actuel de Service Canada dans les consignes officielles selon votre mode de dépôt (électronique ou papier), puis consignez cette date sur le T29.',
      ),
      options: [
        {
          id: 'yes',
          label: bi('Yes — interruption of earnings / separation in progress', 'Oui — interruption de rémunération / départ en cours'),
          to: 'gather',
        },
        {
          id: 'no',
          label: bi('Not yet — no interruption', 'Pas encore — aucune interruption'),
          to: 'not_yet',
        },
        {
          id: 'unsure',
          label: bi('Not sure whether an ROE is required', 'Pas certain qu’un REE soit requis'),
          to: 'unsure',
        },
      ],
    },
    {
      id: 'gather',
      kind: 'task',
      title: bi('Gather pay and reason-code facts first', 'Rassemblez d’abord paie et faits du code de raison'),
      body: bi(
        'Wrong inputs make a wrong ROE. Finish final pay and vacation figures before you file.',
        'De mauvaises entrées produisent un mauvais REE. Terminez la paie finale et les vacances avant de déposer.',
      ),
      points: [
        bi(
          'Confirm last day paid, insurable earnings, and any amounts that still feed the ROE (final wages, vacation pay owed under the applicable employment standards act).',
          'Confirmez le dernier jour payé, la rémunération assurable et les montants qui alimentent encore le REE (salaire final, vacances dues sous la loi sur les normes applicable).',
        ),
        bi(
          'Choose the ROE reason code from the facts on the file — the code drives the EI claim. A code that implies misconduct beside a without-cause notice payment is a contradiction on the record.',
          'Choisissez le code de raison du REE d’après les faits au dossier — le code oriente la demande d’AE. Un code suggérant une inconduite à côté d’un préavis sans motif est une contradiction au dossier.',
        ),
        bi(
          'Look up the current Service Canada filing deadline for your filing method. Write that date into the preparation record — do not copy a day count from memory or from this workflow.',
          'Repérez le délai de dépôt actuel de Service Canada pour votre mode de dépôt. Inscrivez cette date dans le dossier de préparation — ne recopiez pas un nombre de jours de mémoire ni de ce processus.',
        ),
      ],
      to: 'file',
    },
    {
      id: 'file',
      kind: 'task',
      title: bi('File, then keep the preparation record', 'Déposez, puis conservez le dossier de préparation'),
      body: bi(
        'The ROE itself goes to Service Canada. Your internal preparation guide is not the ROE.',
        'Le REE lui-même va à Service Canada. Votre guide de préparation interne n’est pas le REE.',
      ),
      points: [
        bi(
          'File electronically or on paper per current Service Canada instructions. Where you file electronically, the employee typically retrieves the ROE through their own account — you do not hand them a copy.',
          'Déposez par voie électronique ou papier selon les consignes actuelles de Service Canada. En dépôt électronique, l’employé récupère généralement le REE via son propre compte — vous ne lui remettez pas une copie.',
        ),
        bi(
          'Keep the reason-code rationale and the filing deadline you confirmed on the internal preparation record (T29) so the file shows how the ROE was assembled.',
          'Conservez le raisonnement du code de raison et le délai de dépôt confirmé sur le dossier de préparation interne (T29) pour que le dossier montre comment le REE a été assemblé.',
        ),
      ],
      to: 'done',
    },
    {
      id: 'done',
      kind: 'outcome',
      tone: 'ok',
      title: bi('Open the ROE preparation guide', 'Ouvrez le guide de préparation du REE'),
      body: bi(
        'Document Studio T29 assembles pay inputs, reason code, and the filing deadline you recorded. It does not invent the deadline for you.',
        'Le T29 du Studio de documents rassemble les entrées de paie, le code de raison et le délai de dépôt que vous avez consignés. Il n’invente pas le délai à votre place.',
      ),
      documents: ['T29'],
    },
    {
      id: 'not_yet',
      kind: 'outcome',
      tone: 'caution',
      title: bi('No ROE yet — wait for an interruption of earnings', 'Pas de REE encore — attendre une interruption de rémunération'),
      body: bi(
        'If earnings have not been interrupted, filing an ROE is usually premature. Revisit this checklist when a separation, leave, or other interruption is actually underway.',
        'Si la rémunération n’a pas été interrompue, déposer un REE est généralement prématuré. Revenez à cette liste lorsqu’une cessation, un congé ou une autre interruption est réellement en cours.',
      ),
      noDocument: bi(
        'No ROE preparation record is needed until an interruption of earnings is real. Opening T29 now would ask you to invent a filing deadline.',
        'Aucun dossier de préparation de REE n’est nécessaire tant que l’interruption de rémunération n’est pas réelle. Ouvrir le T29 maintenant vous ferait inventer un délai de dépôt.',
      ),
    },
    {
      id: 'unsure',
      kind: 'outcome',
      tone: 'caution',
      title: bi('Confirm the interruption with Service Canada guidance', 'Confirmez l’interruption avec les consignes de Service Canada'),
      body: bi(
        'Whether an ROE is required turns on the Employment Insurance Act rules for interruption of earnings — not on provincial notice alone. Check current Service Canada employer guidance or payroll counsel before filing or skipping.',
        'L’obligation de REE dépend des règles de la Loi sur l’assurance-emploi sur l’interruption de rémunération — pas du seul préavis provincial. Vérifiez les consignes employeur actuelles de Service Canada ou un conseiller en paie avant de déposer ou d’omettre.',
      ),
      documents: ['T29'],
    },
  ],
}
