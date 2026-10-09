import { bi } from '@/i18n/core'
import type { Flow } from '../flowModel'

/**
 * Ring 2, Pillar B — the duty to accommodate workflow
 * (docs/FOUR_RING_FRAMEWORK.md). All FR is [FR self-authored].
 *
 * The framework describes it as "receive disclosure → assess → explore
 * options → implement → document", and the branching is the content: the
 * whole point is that an employer who jumps from disclosure to a decision
 * has already breached the procedural duty, whatever the decision was.
 *
 * Two design choices worth knowing before editing:
 *
 *   - **Undue hardship is reachable, and it is not a shortcut.** The only
 *     route to it runs through canvassing options and documenting why each
 *     fails. That mirrors the law and it mirrors T24, which asks for the
 *     options before the conclusion.
 *   - **Every outcome hands off to a document.** A flow that ends in advice
 *     leaves nothing on the file, and the file is what an employer is asked
 *     to produce.
 */
export const dutyToAccommodateFlow: Flow = {
  slug: 'duty-to-accommodate',
  ring: 2,
  jurisdictions: ['ON', 'QC', 'FED'],
  estMinutes: 12,
  title: bi('Duty to accommodate', 'Obligation d’accommodement'),
  summary: bi(
    'From the moment someone tells you they are struggling, to a documented arrangement — or a documented refusal that can withstand being challenged.',
    'Du moment où une personne vous dit qu’elle éprouve des difficultés jusqu’à un arrangement documenté — ou un refus documenté capable de résister à une contestation.',
  ),
  start: 'disclosure',
  steps: [
    {
      id: 'disclosure',
      kind: 'choice',
      title: bi('What has happened so far?', 'Où en êtes-vous ?'),
      body: bi(
        'The duty starts when you know, or reasonably should know, that someone needs an adjustment. It does not wait for a form, a diagnosis, or the word “accommodation”.',
        'L’obligation naît dès que vous savez, ou devriez raisonnablement savoir, qu’une personne a besoin d’un ajustement. Elle n’attend ni formulaire, ni diagnostic, ni l’emploi du mot « accommodement ».',
      ),
      caution: bi(
        'A manager who has noticed a pattern and said nothing has still triggered the duty for the employer. Knowledge sits with the organization, not with whoever happened to hear it.',
        'Un gestionnaire qui a remarqué une tendance sans rien dire a tout de même déclenché l’obligation pour l’employeur. La connaissance appartient à l’organisation, non à la personne qui en a été témoin.',
      ),
      options: [
        {
          id: 'asked',
          label: bi('Someone has asked for a change', 'Une personne a demandé un changement'),
          detail: bi(
            'In writing or in conversation — either counts.',
            'Par écrit ou de vive voix — les deux comptent.',
          ),
          to: 'gather',
        },
        {
          id: 'noticed',
          label: bi(
            'Nobody has asked, but something is visibly wrong',
            'Personne n’a rien demandé, mais quelque chose ne va manifestement pas',
          ),
          detail: bi(
            'Absence, a drop in work, or difficulty with tasks that used to be routine.',
            'Absences, baisse de rendement ou difficulté avec des tâches auparavant courantes.',
          ),
          to: 'open_conversation',
        },
        {
          id: 'injury',
          label: bi(
            'It follows a workplace injury',
            'La situation fait suite à une lésion professionnelle',
          ),
          to: 'injury_path',
        },
      ],
    },
    {
      id: 'open_conversation',
      kind: 'task',
      title: bi('Open the conversation', 'Amorcer la conversation'),
      body: bi(
        'You are allowed to ask whether someone needs support. You are not allowed to ask what is wrong with them. Keep to what you have observed at work.',
        'Vous pouvez demander à une personne si elle a besoin de soutien. Vous ne pouvez pas lui demander ce dont elle souffre. Tenez-vous-en à ce que vous avez observé au travail.',
      ),
      points: [
        bi(
          'Name what you have seen, in terms of the work — not the person.',
          'Nommez ce que vous avez observé, en parlant du travail — non de la personne.',
        ),
        bi(
          'Ask whether anything would help them do the job.',
          'Demandez si quelque chose l’aiderait à accomplir son travail.',
        ),
        bi(
          'Say that asking has no consequence for their standing.',
          'Précisez que cette demande n’a aucune conséquence sur son statut.',
        ),
        bi('Write down the date you had the conversation.', 'Notez la date de cette conversation.'),
      ],
      caution: bi(
        'If they decline, the duty does not end — it pauses. Revisit it if the pattern continues.',
        'En cas de refus, l’obligation ne prend pas fin — elle se met en pause. Reprenez-la si la situation persiste.',
      ),
      to: 'gather',
    },
    {
      id: 'injury_path',
      kind: 'task',
      title: bi('Run the injury process alongside', 'Mener le processus de lésion en parallèle'),
      body: bi(
        'A workplace injury brings its own return-to-work process, with its own timelines and its own decision-maker. It runs alongside the duty to accommodate; it does not replace it.',
        'Une lésion professionnelle déclenche son propre processus de retour au travail, avec ses délais et son décideur. Il se déroule parallèlement à l’obligation d’accommodement ; il ne s’y substitue pas.',
      ),
      points: [
        bi(
          'Open the compensation-board file and follow its process.',
          'Ouvrez le dossier auprès de l’organisme d’indemnisation et suivez son processus.',
        ),
        bi(
          'Keep accommodating in parallel — human rights obligations continue regardless of the claim.',
          'Poursuivez l’accommodement en parallèle — les obligations en droits de la personne subsistent, quel que soit le sort de la réclamation.',
        ),
        bi(
          'Do not let a disputed claim stall the workplace arrangement.',
          'Ne laissez pas une réclamation contestée bloquer l’arrangement en milieu de travail.',
        ),
      ],
      to: 'gather',
    },
    {
      id: 'gather',
      kind: 'task',
      title: bi('Gather what you are entitled to', 'Recueillir ce à quoi vous avez droit'),
      body: bi(
        'You are entitled to know what the person can and cannot do, and for how long. You are not entitled to know why.',
        'Vous avez le droit de savoir ce que la personne peut ou ne peut pas faire, et pour combien de temps. Vous n’avez pas le droit d’en connaître la cause.',
      ),
      points: [
        bi(
          'Issue the accommodation request form (T21) so the ask is on the record in their words.',
          'Remettez le formulaire de demande d’accommodement (T21) pour consigner la demande dans ses mots.',
        ),
        bi(
          'Where you need medical input, request functional limitations only (T20).',
          'Si un avis médical est nécessaire, demandez uniquement les limitations fonctionnelles (T20).',
        ),
        bi(
          'Store what you receive separately from the general personnel file.',
          'Conservez ce que vous recevez séparément du dossier d’employé général.',
        ),
      ],
      caution: bi(
        'Asking for a diagnosis is the most common privacy failure in this process, and it is rarely necessary — limitations are what you act on.',
        'Demander un diagnostic est le manquement à la vie privée le plus fréquent dans ce processus, et c’est rarement nécessaire — ce sont les limitations qui guident l’action.',
      ),
      to: 'explore',
    },
    {
      id: 'explore',
      kind: 'task',
      title: bi('Canvass the options', 'Envisager les options'),
      body: bi(
        'Work through what could be changed, with the employee in the conversation. This step is assessed on its own — an employer who reached the right answer without looking has still breached the procedural duty.',
        'Examinez ce qui pourrait être modifié, avec la participation de l’employé(e). Cette étape est évaluée pour elle-même : un employeur qui arrive à la bonne réponse sans avoir cherché manque tout de même à l’obligation procédurale.',
      ),
      points: [
        bi(
          'Modified duties, or redistributing the difficult ones.',
          'Tâches modifiées ou redistribution des tâches difficiles.',
        ),
        bi('Schedule, hours, or a phased return.', 'Horaire, heures ou retour progressif.'),
        bi('Equipment, workspace, or location.', 'Équipement, poste de travail ou lieu.'),
        bi(
          'Leave, where nothing at work would help yet.',
          'Congé, lorsque rien au travail ne peut encore aider.',
        ),
        bi(
          'Another role, where the current one cannot be adjusted.',
          'Un autre poste, lorsque le poste actuel ne peut être adapté.',
        ),
        bi(
          'Write down each option and what you concluded about it — including the ones you set aside.',
          'Consignez chaque option et votre conclusion à son sujet — y compris celles que vous avez écartées.',
        ),
      ],
      to: 'workable',
    },
    {
      id: 'workable',
      kind: 'choice',
      title: bi('Is any of it workable?', 'Une option est-elle réalisable ?'),
      body: bi(
        'Workable means it lets the person do the job and the organization can carry it. Inconvenient is not the same as unworkable.',
        'Réalisable signifie que l’option permet à la personne d’accomplir son travail et que l’organisation peut l’assumer. Contraignant n’est pas synonyme d’irréalisable.',
      ),
      options: [
        {
          id: 'yes',
          label: bi('Yes — we have something that works', 'Oui — nous avons une option viable'),
          to: 'implement',
        },
        {
          id: 'partial',
          label: bi(
            'Partly — it helps, but not with everything',
            'En partie — cela aide, mais pas pour tout',
          ),
          detail: bi(
            'Partial accommodation is still accommodation. Put it in place and keep looking.',
            'Un accommodement partiel demeure un accommodement. Mettez-le en place et poursuivez la recherche.',
          ),
          to: 'implement',
        },
        {
          id: 'no',
          label: bi('No — nothing we found works', 'Non — aucune option trouvée ne convient'),
          to: 'hardship_test',
        },
      ],
    },
    {
      id: 'implement',
      kind: 'task',
      title: bi('Put it in place and write it down', 'Mettre en place et consigner'),
      body: bi(
        'An arrangement nobody recorded is one that quietly lapses the next time the schedule gets tight.',
        'Un arrangement que personne n’a consigné s’éteint discrètement à la première semaine chargée.',
      ),
      points: [
        bi(
          'Write the accommodation plan (T23) with the employee, and both sign it.',
          'Rédigez le plan d’accommodement (T23) avec l’employé(e) et signez-le tous les deux.',
        ),
        bi(
          'Send the written answer to the request (T22), with your reasons.',
          'Transmettez la réponse écrite à la demande (T22), motifs à l’appui.',
        ),
        bi(
          'Tell managers what changes, not why it changed.',
          'Informez les gestionnaires de ce qui change, non des motifs.',
        ),
        bi('Book the review date now.', 'Fixez dès maintenant la date de révision.'),
      ],
      to: 'done_accommodated',
    },
    {
      id: 'hardship_test',
      kind: 'choice',
      title: bi(
        'Test it before you call it hardship',
        'Vérifier avant de conclure à la contrainte',
      ),
      body: bi(
        'Undue hardship is the outer limit of the duty and the threshold is high — the employer has to prove it on evidence. Which of these describes your position?',
        'La contrainte excessive est la limite ultime de l’obligation et le seuil en est élevé : il revient à l’employeur de la prouver par une preuve. Laquelle de ces situations correspond à la vôtre ?',
      ),
      caution: bi(
        'Business inconvenience will not carry a refusal, and neither will customer or co-worker preference or “we have never done that here”. Which further factors count is jurisdictional — Ontario and the federal regime name theirs in statute, Québec weighs the whole of the circumstances — so read the undue hardship assessment (T24) for the test that applies to you before concluding.',
        'Les inconvénients d’affaires ne soutiennent pas un refus, pas plus que les préférences de la clientèle ou des collègues, ni « cela ne s’est jamais fait ici ». Les autres facteurs pertinents varient selon la juridiction — l’Ontario et le régime fédéral énumèrent les leurs dans la loi, le Québec apprécie l’ensemble des circonstances — consultez donc l’évaluation de la contrainte excessive (T24) pour connaître le test applicable avant de conclure.',
      ),
      options: [
        {
          id: 'evidence',
          label: bi(
            'We can show cost or a safety risk, with evidence',
            'Nous pouvons démontrer un coût ou un risque pour la sécurité, preuve à l’appui',
          ),
          detail: bi(
            'Quantified, measured against the whole organization — not one department’s budget.',
            'Chiffré et apprécié au regard de l’ensemble de l’organisation — non du budget d’un seul service.',
          ),
          to: 'done_hardship',
        },
        {
          id: 'unfunded',
          label: bi(
            'It is a cost question and we have not checked for funding',
            'C’est une question de coût et nous n’avons pas vérifié les sources de financement',
          ),
          to: 'check_funding',
        },
        {
          id: 'assertion',
          label: bi(
            'It would be difficult, but we could not evidence it',
            'Ce serait difficile, mais nous ne pourrions pas le démontrer',
          ),
          to: 'back_to_options',
        },
      ],
    },
    {
      id: 'check_funding',
      kind: 'task',
      title: bi('Check outside funding first', 'Vérifier d’abord le financement externe'),
      body: bi(
        'Not having looked is not the same as there being nothing available, and only one of those helps you if the refusal is challenged.',
        'Ne pas avoir cherché n’équivaut pas à l’absence de ressources disponibles, et une seule de ces situations vous aide si le refus est contesté.',
      ),
      points: [
        bi(
          'Government and provincial disability-employment programs.',
          'Programmes gouvernementaux et provinciaux d’emploi des personnes handicapées.',
        ),
        bi('Insurer or benefit-plan support.', 'Soutien de l’assureur ou du régime d’avantages.'),
        bi(
          'Tax measures for workplace adaptation.',
          'Mesures fiscales pour l’adaptation du milieu de travail.',
        ),
        bi(
          'Record what you checked and what each one said.',
          'Consignez vos vérifications et leurs résultats.',
        ),
      ],
      to: 'hardship_test',
    },
    {
      id: 'back_to_options',
      kind: 'task',
      title: bi('Go back to the options', 'Revenir aux options'),
      body: bi(
        'A difficulty you cannot evidence will not carry a refusal. That is not a technicality — it is the point at which most refusals fail, because the record shows an assertion rather than an analysis.',
        'Une difficulté que vous ne pouvez démontrer ne soutiendra pas un refus. Ce n’est pas un détail de procédure : c’est là que la plupart des refus échouent, le dossier révélant une affirmation plutôt qu’une analyse.',
      ),
      points: [
        bi(
          'Widen the search — other roles, other locations, other schedules.',
          'Élargissez la recherche — autres postes, autres lieux, autres horaires.',
        ),
        bi(
          'Ask the employee what they think would work; they often know.',
          'Demandez à l’employé(e) ce qui fonctionnerait selon lui ou elle ; c’est souvent la personne la mieux placée.',
        ),
        bi(
          'Consider a trial period rather than deciding in the abstract.',
          'Envisagez une période d’essai plutôt qu’une décision en théorie.',
        ),
      ],
      to: 'workable',
    },
    {
      id: 'done_accommodated',
      kind: 'outcome',
      tone: 'ok',
      title: bi('Accommodation in place', 'Accommodement en place'),
      body: bi(
        'Keep the review date. The duty is ongoing, and an arrangement that stops fitting without anyone noticing is the same failure as never having made one.',
        'Respectez la date de révision. L’obligation est continue, et un arrangement qui cesse de convenir sans que personne ne le remarque équivaut à ne jamais en avoir mis un en place.',
      ),
      documents: ['T22', 'T23'],
    },
    {
      id: 'done_hardship',
      kind: 'outcome',
      tone: 'caution',
      title: bi(
        'Undue hardship — document it properly',
        'Contrainte excessive — à documenter rigoureusement',
      ),
      body: bi(
        'This is the decision most often challenged, and it is decided on the record you kept rather than on how reasonable it felt at the time. Complete the assessment before you send the answer, and have both reviewed.',
        'C’est la décision la plus souvent contestée, et elle se tranche sur le dossier constitué plutôt que sur le caractère raisonnable ressenti sur le moment. Complétez l’évaluation avant d’envoyer la réponse, et faites réviser les deux.',
      ),
      documents: ['T24', 'T22'],
    },
  ],
}
