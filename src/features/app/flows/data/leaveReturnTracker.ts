import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Deadline / milestone tracker — leave return (TODO.md EF11). All FR is
 * [FR self-authored].
 *
 * Focused on the return window the leave-of-absence flow already names as
 * the failure point. No statutory leave-length figures — those differ by
 * leave type and jurisdiction. Hands off to T27.
 */

export const leaveReturnTrackerFlow: Flow = {
  slug: 'leave-return-tracker',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  estMinutes: 5,
  title: bi('Leave return tracker', 'Suivi du retour de congé'),
  summary: bi(
    'Bring someone back from leave without inventing durations — position, pay, confirmation in writing, and accommodation if needed.',
    'Réintégrez quelqu’un après un congé sans inventer de durées — poste, rémunération, confirmation écrite et accommodement au besoin.',
  ),
  start: 'timing',
  steps: [
    {
      id: 'timing',
      kind: 'choice',
      title: bi('Where are you in the return?', 'Où en êtes-vous dans le retour?'),
      body: bi(
        'Leave lengths and notice-to-return rules differ by leave type and statute. Confirm those dates from the leave you approved and the current employment standards text — not from this checklist.',
        'Les durées de congé et les règles de préavis de retour diffèrent selon le type de congé et la loi. Confirmez ces dates d’après le congé approuvé et le texte actuel des normes d’emploi — pas d’après cette liste.',
      ),
      caution: bi(
        'Do not invent a return deadline here. If the expected return moved, update the diary and the written terms before you treat someone as late.',
        'N’inventez pas de délai de retour ici. Si le retour prévu a bougé, mettez à jour l’agenda et les conditions écrites avant de traiter quelqu’un comme en retard.',
      ),
      options: [
        {
          id: 'upcoming',
          label: bi('Return is upcoming — prepare the role', 'Retour à venir — préparer le poste'),
          to: 'prepare',
        },
        {
          id: 'day_of',
          label: bi('They are returning now', 'Ils reviennent maintenant'),
          to: 'restore',
        },
        {
          id: 'issues',
          label: bi(
            'Return is contested or needs adjustments',
            'Retour contesté ou besoin d’ajustements',
          ),
          to: 'hard',
        },
      ],
    },
    {
      id: 'prepare',
      kind: 'task',
      title: bi('Prepare before the return date', 'Préparer avant la date de retour'),
      body: bi(
        'Most return failures start before the employee walks in — a role that quietly changed, or a check-in that never happened.',
        'La plupart des échecs de retour commencent avant l’arrivée de l’employé — un poste qui a changé en silence, ou un point de contact jamais fait.',
      ),
      points: [
        bi(
          'Confirm the expected return date on the leave record. If it extended, write the new date down and move the diarised check-in.',
          'Confirmez la date de retour prévue au dossier de congé. S’il s’est prolongé, inscrivez la nouvelle date et reportez le rappel au calendrier.',
        ),
        bi(
          'Check that the position still exists as left, or document why a comparable role is being offered instead.',
          'Vérifiez que le poste existe encore tel qu’il a été quitté, ou documentez pourquoi un poste comparable est offert à la place.',
        ),
        bi(
          'Confirm what benefits and service accrual continued while they were away so payroll does not guess on day one.',
          'Confirmez ce qui s’est poursuivi en avantages et en accumulation de service pendant l’absence pour que la paie ne devine pas le premier jour.',
        ),
      ],
      to: 'restore',
    },
    {
      id: 'restore',
      kind: 'task',
      title: bi(
        'Restore the job and confirm in writing',
        'Rétablir le poste et confirmer par écrit',
      ),
      body: bi(
        'The return obligation is where a well-handled leave can still go wrong.',
        'C’est l’obligation de retour qui peut faire échouer un congé pourtant bien géré.',
      ),
      points: [
        bi(
          'Return them to the position they left, or a genuinely comparable one if it no longer exists — and write down why if it does not.',
          'Réintégrez-les dans le poste quitté ou, s’il n’existe vraiment plus, dans un poste comparable — et consignez-en la raison le cas échéant.',
        ),
        bi(
          'Apply any pay increase the role received while they were away.',
          'Appliquez toute augmentation dont le poste a bénéficié pendant leur absence.',
        ),
        bi(
          'Bring them up to date on what changed, with a named person responsible for the briefing.',
          'Mettez-les au fait des changements, avec une personne nommée responsable du point.',
        ),
        bi(
          'Confirm the return in writing with the return-from-leave confirmation (T27).',
          'Confirmez le retour par écrit au moyen de la confirmation de retour de congé (T27).',
        ),
      ],
      to: 'done',
    },
    {
      id: 'hard',
      kind: 'task',
      title: bi(
        'When the return needs more than a confirmation',
        'Quand le retour demande plus qu’une confirmation',
      ),
      body: bi(
        'Adjustments, disputes, or a role that disappeared are not improvisation problems — they are process problems.',
        'Les ajustements, les différends ou un poste disparu ne sont pas des problèmes d’improvisation — ce sont des problèmes de processus.',
      ),
      points: [
        bi(
          'If they need adjustments to come back, that is an accommodation — run the duty-to-accommodate workflow rather than bargaining informally.',
          'S’ils ont besoin d’ajustements pour revenir, il s’agit d’un accommodement — suivez le processus d’obligation d’accommodement plutôt que de négocier de façon informelle.',
        ),
        bi(
          'If the position was eliminated, document the business reason and the comparable offer (or why none exists) before the return date.',
          'Si le poste a été aboli, documentez la raison d’affaires et l’offre comparable (ou pourquoi aucune n’existe) avant la date de retour.',
        ),
        bi(
          'Still confirm whatever return terms you reach in writing on T27 so the file shows the outcome.',
          'Confirmez quand même par écrit sur le T27 les conditions de retour convenues pour que le dossier montre le résultat.',
        ),
      ],
      caution: bi(
        'Contact during leave stays limited to what was agreed. Do not use the return dispute to reopen medical questions you were not entitled to ask.',
        'Les contacts pendant le congé restent limités à ce qui a été convenu. Ne vous servez pas du différend sur le retour pour rouvrir des questions médicales que vous n’aviez pas le droit de poser.',
      ),
      to: 'done',
    },
    {
      id: 'done',
      kind: 'outcome',
      tone: 'ok',
      title: bi(
        'Open the return-from-leave confirmation',
        'Ouvrez la confirmation de retour de congé',
      ),
      body: bi(
        'Document Studio T27 puts the return on the file. Enter the dates and role facts you confirmed from the leave record and the statute — this tracker does not invent leave lengths.',
        'Le T27 du Studio de documents verse le retour au dossier. Inscrivez les dates et les faits de poste confirmés d’après le dossier de congé et la loi — ce suivi n’invente pas de durées de congé.',
      ),
      documents: ['T27'],
    },
  ],
}
