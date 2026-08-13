/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Layoff & restructuring (docs/FOUR_RING_FRAMEWORK.md).

   A script, not a letter, and the distinction carries the whole document.
   T03, T15 and T32 are the notices — individual, written, and the things that
   actually satisfy a statutory obligation. This is what is said out loud in
   the room, and nothing said in that room is notice. An employer who treats
   the announcement as having discharged anything has given no notice at all.

   Written for the group meeting only. The individual conversations happen
   first and separately, because a person should never learn they are affected
   in front of their team — which is also why no name appears in this
   document and no merge field can put one there. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT35: DocTemplate = {
  id: 'tpl_t35',
  tid: 'T35',
  key: 'layoff_announcement_script',
  kind: 'notice',
  category: 'communications',
  core: false,
  name: {
    en: 'Layoff announcement script',
    fr: 'Script d’annonce de licenciements',
  },
  desc: {
    en: 'What to say to the team, in what order — for the meeting after the individual conversations, never instead of them.',
    fr: 'Ce qu’il faut dire à l’équipe, et dans quel ordre — pour la rencontre qui suit les entretiens individuels, jamais à leur place.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 6,
  usageCount: 0,
  statutory: [
    {
      en: 'An announcement is not notice — notice is individual and in writing',
      fr: 'Une annonce ne constitue pas un préavis — le préavis est individuel et écrit',
    },
    {
      en: 'Group termination thresholds may add notice to the ministry and a longer period',
      fr: 'Les seuils de licenciement collectif peuvent ajouter un avis au ministère et un délai plus long',
    },
    {
      en: 'Privacy — no affected employee is identified to the group',
      fr: 'Vie privée — aucune personne visée n’est identifiée devant le groupe',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Individual notice under the Employment Standards Act, 2000 is what the affected employees are owed, and this meeting does not provide it. Where the number terminated at one establishment in a four-week period reaches the mass-termination threshold, additional obligations apply, including notice to the Director — confirm the current threshold and form before relying on the ordinary rules. Common-law reasonable notice may exceed the statutory minimum.',
      fr: 'Le préavis individuel prévu par la Loi de 2000 sur les normes d’emploi est ce qui est dû aux personnes visées, et la présente rencontre ne le fournit pas. Lorsque le nombre de cessations dans un même établissement sur quatre semaines atteint le seuil de licenciement collectif, des obligations additionnelles s’appliquent, dont un avis au directeur — vérifiez le seuil et le formulaire en vigueur avant de vous fier aux règles ordinaires. Le préavis raisonnable de common law peut dépasser le minimum légal.',
    },
    QC: {
      en: 'The Act respecting labour standards requires individual notice, and a collective dismissal triggers a separate notice to the Minister whose length scales with the number of employees affected. Québec is a civil-law jurisdiction: the framework here is the Civil Code and the Act, not the common law of reasonable notice, and the meeting must be held in French where French is the language of work.',
      fr: 'La Loi sur les normes du travail exige un avis individuel, et un licenciement collectif déclenche un avis distinct au ministre dont la durée varie selon le nombre de personnes visées. Le Québec est une juridiction de droit civil : le cadre applicable est le Code civil et la Loi, non la common law du préavis raisonnable, et la rencontre doit se tenir en français lorsque le français est la langue du travail.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III sets individual notice and, where the number of employees terminated in a four-week period reaches the group-termination threshold, requires notice to the Minister and the establishment of a joint planning committee. Those steps have their own timing and cannot be started by an announcement.',
      fr: 'Le Code canadien du travail, Partie III fixe le préavis individuel et, lorsque le nombre de cessations sur quatre semaines atteint le seuil de licenciement collectif, exige un avis au ministre et la constitution d’un comité mixte de planification. Ces étapes ont leur propre échéancier et ne peuvent être amorcées par une annonce.',
    },
  },
  includes: [
    {
      en: 'The opening sentence, said first',
      fr: 'La phrase d’ouverture, dite en premier',
    },
    {
      en: 'What is changing and when',
      fr: 'Ce qui change et quand',
    },
    {
      en: 'What affected colleagues are receiving',
      fr: 'Ce que reçoivent les personnes visées',
    },
    {
      en: 'What happens for the rest of the team',
      fr: 'Ce qui se passe pour le reste de l’équipe',
    },
    {
      en: 'What you will not answer, and why',
      fr: 'Ce à quoi vous ne répondrez pas, et pourquoi',
    },
  ],
  questions: [
    {
      id: 'scope',
      section: {
        en: 'The decision',
        fr: 'La décision',
      },
      label: {
        en: 'What is changing, in one sentence',
        fr: 'Ce qui change, en une phrase',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'e.g. We are closing the Hamilton depot and reducing the operations team.',
        fr: 'p. ex. Nous fermons le dépôt de Hamilton et réduisons l’équipe des opérations.',
      },
      hint: {
        en: 'Write it as you would say it. If it takes more than a sentence, the room will hear the preamble and not the news.',
        fr: 'Rédigez-le comme vous le direz. S’il faut plus d’une phrase, la salle entendra le préambule et non la nouvelle.',
      },
    },
    {
      id: 'effective_date',
      section: {
        en: 'The decision',
        fr: 'La décision',
      },
      label: {
        en: 'Date the change takes effect',
        fr: 'Date de prise d’effet',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'affected_count',
      section: {
        en: 'The decision',
        fr: 'La décision',
      },
      label: {
        en: 'Number of roles affected',
        fr: 'Nombre de postes visés',
      },
      type: 'number',
      required: true,
      hint: {
        en: 'A number, never names. Everyone affected has already been told individually before this meeting starts.',
        fr: 'Un nombre, jamais des noms. Chaque personne visée a déjà été informée individuellement avant le début de cette rencontre.',
      },
    },
    {
      id: 'support',
      section: {
        en: 'What is being offered',
        fr: 'Ce qui est offert',
      },
      label: {
        en: 'Support being provided to affected colleagues',
        fr: 'Soutien offert aux personnes visées',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Notice or pay in lieu, severance where owed, benefits continuation, outplacement, references.',
        fr: 'Préavis ou indemnité tenant lieu de préavis, indemnité de départ le cas échéant, maintien des avantages, aide au reclassement, références.',
      },
      hint: {
        en: 'Describe it in general terms only. What any individual receives is in their own letter and is not the group’s business.',
        fr: 'Décrivez-le en termes généraux seulement. Ce que reçoit chaque personne figure dans sa propre lettre et ne regarde pas le groupe.',
      },
    },
    {
      id: 'whats_next',
      section: {
        en: 'What is being offered',
        fr: 'Ce qui est offert',
      },
      label: {
        en: 'What happens next for the people staying',
        fr: 'Ce qui se passe ensuite pour les personnes qui restent',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Reporting lines, workload, the date they will hear more, and who to ask before then.',
        fr: 'Liens hiérarchiques, charge de travail, date à laquelle ils en sauront plus, et à qui s’adresser d’ici là.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Layoff announcement — speaking notes',
        fr: 'Annonce de licenciements — notes d’allocution',
      },
    },
    {
      type: 'meta',
      text: {
        en: 'Prepared for {{org}} · {{today}} · For the person leading the meeting. Not to be circulated.',
        fr: 'Préparé pour {{org}} · {{today}} · À l’intention de la personne qui anime la rencontre. Ne pas diffuser.',
      },
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'Before this meeting: every affected employee has been told individually, in private, and has their written notice in hand. If that is not true, stop — this meeting cannot go ahead. Nothing said here is notice, and saying it to a group does not give it to anyone.',
        fr: 'Avant cette rencontre : chaque personne visée a été informée individuellement, en privé, et a son préavis écrit en main. Si ce n’est pas le cas, arrêtez — la rencontre ne peut avoir lieu. Rien de ce qui est dit ici ne constitue un préavis, et le dire à un groupe ne le donne à personne.',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'Open with it',
        fr: 'Commencez par là',
      },
      text: {
        en: '"I have difficult news, and I am going to give it to you first. {{scope}} This takes effect {{effective_date}}, and it affects {{affected_count}} roles." Say this before any explanation. A room that senses bad news coming stops listening while it waits, and everything you say before the news is heard as evasion.',
        fr: '« J’ai une nouvelle difficile à vous annoncer, et je vais commencer par elle. {{scope}} Cela prend effet le {{effective_date}} et touche {{affected_count}} postes. » Dites-le avant toute explication. Une salle qui pressent une mauvaise nouvelle cesse d’écouter en l’attendant, et tout ce qui précède l’annonce est reçu comme une dérobade.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'Then the reason, briefly',
        fr: 'Ensuite la raison, brièvement',
      },
      text: {
        en: 'Give the actual reason in two or three sentences and stop. Do not describe the decision as difficult for you, do not call it a journey, and do not say it was made after careful consideration — the room is not evaluating your process. If the reason is financial, say so plainly; a vague reason is heard as a hidden one, and what fills the gap is a rumour you will spend a month correcting.',
        fr: 'Donnez la raison réelle en deux ou trois phrases, puis arrêtez-vous. Ne décrivez pas la décision comme difficile pour vous, n’en faites pas un « parcours » et ne dites pas qu’elle a été prise après mûre réflexion — la salle n’évalue pas votre processus. Si la raison est financière, dites-le clairement ; une raison vague est perçue comme une raison cachée, et ce qui comble le vide est une rumeur que vous passerez un mois à corriger.',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'Say what is being done for them',
        fr: 'Dites ce qui est fait pour elles',
      },
      text: {
        en: '"Everyone affected has already been spoken to individually and has their details in writing. {{support}}" Keep it general. Do not describe any individual package, do not compare one to another, and do not answer a question about what a specific person received — that is their information, not the group’s, and the person asking usually knows that.',
        fr: '« Chaque personne visée a déjà été rencontrée individuellement et a reçu ses modalités par écrit. {{support}} » Restez général. Ne décrivez aucune indemnité individuelle, n’en comparez pas, et ne répondez pas à une question sur ce qu’une personne précise a reçu — cette information lui appartient et ne regarde pas le groupe, ce que la personne qui pose la question sait généralement.',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'Name no one',
        fr: 'Ne nommez personne',
      },
      text: {
        en: 'Do not read a list, confirm a name, or answer "is so-and-so affected?". Say: "I am not going to name anyone. People will tell their own colleagues in their own time, and that is theirs to decide." This holds even when the answer is obvious to everyone in the room. Naming someone turns their departure into an announcement about them, and it is the part people remember years later.',
        fr: 'Ne lisez aucune liste, ne confirmez aucun nom et ne répondez pas à « est-ce que untel est touché ? ». Dites : « Je ne nommerai personne. Chacun en parlera à ses collègues au moment qui lui convient, et cela lui appartient. » Cela vaut même lorsque la réponse est évidente pour toute la salle. Nommer quelqu’un transforme son départ en une annonce à son sujet, et c’est ce dont les gens se souviennent des années plus tard.',
      },
    },
    {
      type: 'clause',
      n: 5,
      heading: {
        en: 'What happens to the rest of you',
        fr: 'Ce qui arrive au reste de l’équipe',
      },
      text: {
        en: '"{{whats_next}}" The question underneath every question in this room is whether more is coming. Answer it honestly. If you do not know, say you do not know and say when you will — a promise that this is the end, made to calm a room and broken in March, costs more than the layoff did.',
        fr: '« {{whats_next}} » La question qui sous-tend toutes les autres dans cette salle est de savoir si d’autres suivront. Répondez honnêtement. Si vous l’ignorez, dites-le et précisez quand vous saurez — une promesse que c’est terminé, faite pour apaiser une salle et rompue en mars, coûte plus cher que le licenciement lui-même.',
      },
    },
    {
      type: 'clause',
      n: 6,
      heading: {
        en: 'Take questions, and be allowed not to answer',
        fr: 'Prenez les questions, et accordez-vous le droit de ne pas répondre',
      },
      text: {
        en: 'Stay in the room for questions even if there are none, and let the silence sit. Three answers are always available and all three are better than improvising: "I do not know", "I know, and it is not mine to share", and "I will find out and tell you by Friday" — which then obliges you to. Do not speculate about anything, and end by saying where to go next.',
        fr: 'Restez dans la salle pour les questions même s’il n’y en a pas, et laissez le silence s’installer. Trois réponses sont toujours disponibles et valent mieux que l’improvisation : « je ne sais pas », « je sais, mais ce n’est pas à moi de le divulguer » et « je vais me renseigner et vous répondre d’ici vendredi » — ce qui vous y oblige ensuite. Ne spéculez sur rien et terminez en indiquant où s’adresser.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'After the meeting: the written follow-up goes out the same day, because a room reconstructs from memory and the reconstruction is always worse. The team restructuring announcement (T36) is that follow-up, and the employee FAQ (T37) is what to publish alongside it.',
        fr: 'Après la rencontre : le suivi écrit part le jour même, car une salle reconstitue de mémoire et la reconstitution est toujours pire. L’annonce de réorganisation (T36) constitue ce suivi, et la FAQ (T37) est ce qu’il faut publier en parallèle.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'This document is guidance for the person speaking. It creates no entitlement, states no individual terms, and is not the notice any employee is owed — that is T03, T15 or T32 depending on the situation, and it is in writing and individual.',
        fr: 'Le présent document est un guide pour la personne qui prend la parole. Il ne crée aucun droit, n’énonce aucune modalité individuelle et ne constitue pas le préavis dû à quiconque — celui-ci relève de T03, T15 ou T32 selon la situation, et il est écrit et individuel.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'org',
}
