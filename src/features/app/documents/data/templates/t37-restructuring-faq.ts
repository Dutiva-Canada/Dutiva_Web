/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Layoff & restructuring (docs/FOUR_RING_FRAMEWORK.md).

   The third of the set: T35 is said, T36 is sent, this is published. It
   exists because the questions people actually have are not the ones an
   announcement answers, and because the alternative to answering them is not
   silence — it is a manager improvising a different answer in each of six
   conversations, which is how an employer ends up bound by something nobody
   decided to say.

   Two of the answers below are deliberately refusals, and they are written
   out rather than left to judgement. "Who is leaving" and "is my job safe"
   are the questions that get answered badly under pressure, and a refusal
   that was drafted in advance is easier to hold than one improvised in
   front of a worried team. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT37: DocTemplate = {
  id: 'tpl_t37',
  tid: 'T37',
  key: 'restructuring_faq',
  kind: 'notice',
  category: 'communications',
  core: false,
  name: {
    en: 'Employee FAQ — layoff & restructuring',
    fr: 'FAQ pour les employés — licenciements et réorganisation',
  },
  desc: {
    en: 'The questions the team will actually ask, with answers agreed in advance — including the ones you are not going to answer.',
    fr: 'Les questions que l’équipe posera réellement, avec des réponses convenues d’avance — y compris celles auxquelles vous ne répondrez pas.',
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
      en: 'Privacy — no individual’s situation, package or reason is disclosed',
      fr: 'Vie privée — aucune situation, indemnité ou raison individuelle n’est divulguée',
    },
    {
      en: 'An answer given to the team can become a term the employer is held to',
      fr: 'Une réponse donnée à l’équipe peut devenir une condition opposable à l’employeur',
    },
    {
      en: 'Reprisal prohibition — asking a question is never held against anyone',
      fr: 'Interdiction de représailles — poser une question ne peut jamais être reproché',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Be careful with answers about pay and benefits: what the Employment Standards Act, 2000 requires as a minimum is not the whole of what an employee may be owed, and common-law reasonable notice can substantially exceed it. Saying "everyone receives the statutory minimum" in an FAQ both understates the position and reads as the employer’s final answer.',
      fr: 'Soyez prudent dans les réponses portant sur la rémunération et les avantages : le minimum exigé par la Loi de 2000 sur les normes d’emploi ne représente pas tout ce qui peut être dû, et le préavis raisonnable de common law peut le dépasser largement. Écrire « chacun reçoit le minimum prévu par la loi » dans une FAQ sous-estime la situation et se lit comme la réponse finale de l’employeur.',
    },
    QC: {
      en: 'The Act respecting labour standards governs the minimum, and Québec is a civil-law jurisdiction — do not answer a question about entitlements using the common-law reasonable-notice framework. Where French is the language of work the FAQ must be available in French, and a translated FAQ published later than the English one is its own problem.',
      fr: 'La Loi sur les normes du travail fixe le minimum, et le Québec est une juridiction de droit civil — ne répondez pas à une question sur les droits en recourant au cadre du préavis raisonnable de common law. Lorsque le français est la langue du travail, la FAQ doit être disponible en français, et une FAQ traduite publiée après la version anglaise pose un problème en soi.',
    },
    FED: {
      en: 'Under the Canada Labour Code, Part III, group terminations engage a joint planning committee whose role includes considering alternatives — so an FAQ that presents the outcome as settled can be inaccurate as well as unwise where that process is still running. In a unionised workplace, direct answers to employees about terms the collective agreement covers can amount to bargaining around the union.',
      fr: 'Sous le régime du Code canadien du travail, Partie III, un licenciement collectif met en place un comité mixte de planification dont le rôle comprend l’examen de solutions de rechange — une FAQ présentant l’issue comme arrêtée peut donc être inexacte autant qu’imprudente tant que ce processus se poursuit. En milieu syndiqué, répondre directement aux employés sur des conditions visées par la convention collective peut équivaloir à négocier en contournant le syndicat.',
    },
  },
  includes: [
    {
      en: 'Why this is happening',
      fr: 'Pourquoi cela se produit',
    },
    {
      en: 'Whether more is coming',
      fr: 'Si d’autres changements suivront',
    },
    {
      en: 'What happens to the work',
      fr: 'Ce qu’il advient du travail',
    },
    {
      en: 'The questions that will not be answered, and why',
      fr: 'Les questions sans réponse, et pourquoi',
    },
    {
      en: 'Where to take a question or a concern',
      fr: 'Où adresser une question ou une préoccupation',
    },
  ],
  questions: [
    {
      id: 'reason',
      section: {
        en: 'The decision',
        fr: 'La décision',
      },
      label: {
        en: 'Why this happened',
        fr: 'Pourquoi cela s’est produit',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The same reason given in the meeting, in the same words.',
        fr: 'La même raison que celle donnée en rencontre, dans les mêmes termes.',
      },
      hint: {
        en: 'It must match what was said out loud. A written reason that differs from the spoken one is the discrepancy people notice first.',
        fr: 'Elle doit correspondre à ce qui a été dit de vive voix. Un motif écrit qui diffère du motif énoncé est l’écart que les gens remarquent en premier.',
      },
    },
    {
      id: 'more_coming',
      section: {
        en: 'The decision',
        fr: 'La décision',
      },
      label: {
        en: 'Is further change expected?',
        fr: 'D’autres changements sont-ils prévus ?',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'no_plans',
          label: {
            en: 'No further changes are planned',
            fr: 'Aucun autre changement n’est prévu',
          },
        },
        {
          value: 'under_review',
          label: {
            en: 'Other areas are still under review',
            fr: 'D’autres secteurs sont encore à l’étude',
          },
        },
        {
          value: 'cannot_say',
          label: {
            en: 'We cannot say yet',
            fr: 'Nous ne pouvons pas encore le dire',
          },
        },
      ],
      hint: {
        en: 'Answer this as it actually is. "No further changes are planned" said to settle a room, and contradicted in two months, is the single most expensive sentence in a restructuring.',
        fr: 'Répondez selon la réalité. « Aucun autre changement n’est prévu », dit pour apaiser une salle puis démenti deux mois plus tard, est la phrase la plus coûteuse d’une réorganisation.',
      },
    },
    {
      id: 'workload',
      section: {
        en: 'The work',
        fr: 'Le travail',
      },
      label: {
        en: 'What happens to the work that was being done',
        fr: 'Ce qu’il advient du travail qui était accompli',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'What stops, what moves, what is being decided and by when.',
        fr: 'Ce qui cesse, ce qui est transféré, ce qui reste à décider et d’ici quand.',
      },
      hint: {
        en: 'If the honest answer is that the same work now has fewer people and nothing has been dropped, say so. The team already knows, and pretending otherwise costs you the rest of the document.',
        fr: 'Si la réponse honnête est que le même travail repose désormais sur moins de personnes et que rien n’a été retiré, dites-le. L’équipe le sait déjà, et prétendre le contraire vous coûte la crédibilité du reste du document.',
      },
    },
    {
      id: 'contact',
      section: {
        en: 'Support',
        fr: 'Soutien',
      },
      label: {
        en: 'Who to contact with a question',
        fr: 'À qui adresser une question',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'A named person and how to reach them.',
        fr: 'Une personne nommée et ses coordonnées.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Questions and answers',
        fr: 'Questions et réponses',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · Published to everyone in the affected teams',
        fr: '{{org}} · {{today}} · Publié à l’ensemble des équipes visées',
      },
    },
    {
      type: 'para',
      text: {
        en: 'These are the questions we expect, answered in one place so that everyone gets the same answer. If your question is not here, ask it — we would rather add it than have it answered by guesswork.',
        fr: 'Voici les questions auxquelles nous nous attendons, réunies afin que chacun obtienne la même réponse. Si la vôtre ne s’y trouve pas, posez-la — nous préférons l’ajouter plutôt que la laisser trouver réponse dans les suppositions.',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'Why did this happen?',
        fr: 'Pourquoi cela s’est-il produit ?',
      },
      text: {
        en: '{{reason}}',
        fr: '{{reason}}',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'Who is affected?',
        fr: 'Qui est visé ?',
      },
      text: {
        en: 'We are not naming anyone, and we will not confirm or deny whether a particular person is affected. Everyone affected has been told individually, and telling colleagues is theirs to do, in their own words and their own time. This is not us being evasive with you — it is the same protection each of you would want if it were your situation.',
        fr: 'Nous ne nommons personne et nous ne confirmerons ni n’infirmerons si une personne en particulier est visée. Chaque personne visée a été informée individuellement, et il lui revient d’en parler à ses collègues, dans ses mots et à son rythme. Ce n’est pas une dérobade : c’est la protection que chacun de vous souhaiterait dans la même situation.',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'Is my job safe?',
        fr: 'Mon poste est-il en sécurité ?',
      },
      text: {
        en: 'If you have not been spoken to individually, your role is not affected by this decision. On whether anything further is coming: {{more_coming}}. We would rather give you an uncomfortable answer you can rely on than a reassuring one we might have to withdraw.',
        fr: 'Si vous n’avez pas été rencontré individuellement, votre poste n’est pas visé par cette décision. Quant à savoir si d’autres changements suivront : {{more_coming}}. Nous préférons vous donner une réponse inconfortable sur laquelle vous pouvez compter plutôt qu’une réponse rassurante que nous pourrions devoir retirer.',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'What happens to the work?',
        fr: 'Qu’advient-il du travail ?',
      },
      text: {
        en: '{{workload}} If your workload becomes unmanageable, raise it early rather than absorbing it. A team that quietly absorbs the gap is how a restructuring turns into resignations six months later.',
        fr: '{{workload}} Si votre charge de travail devient ingérable, signalez-le tôt plutôt que de l’absorber. Une équipe qui comble discrètement l’écart est la façon dont une réorganisation se transforme en démissions six mois plus tard.',
      },
    },
    {
      type: 'clause',
      n: 5,
      heading: {
        en: 'What are our departing colleagues receiving?',
        fr: 'Que reçoivent les collègues qui partent ?',
      },
      text: {
        en: 'That is between each of them and us, and we will not discuss it — including with the best of intentions. What we can say is that everyone affected has received their entitlements in writing, and has been told where to get advice on them.',
        fr: 'Cela relève de chacune de ces personnes et de nous, et nous n’en discuterons pas — même avec les meilleures intentions. Ce que nous pouvons dire, c’est que chaque personne visée a reçu ses droits par écrit et sait où obtenir des conseils à leur sujet.',
      },
    },
    {
      type: 'clause',
      n: 6,
      heading: {
        en: 'Can I stay in touch with people who are leaving?',
        fr: 'Puis-je rester en contact avec les personnes qui partent ?',
      },
      text: {
        en: 'Yes. They are colleagues, and nothing about this changes that. If someone asks you for a reference, give an honest one — this decision was about roles, and it says nothing about anyone’s work.',
        fr: 'Oui. Ce sont des collègues, et rien dans tout cela n’y change quoi que ce soit. Si l’une de ces personnes vous demande une référence, donnez-en une honnête — cette décision portait sur des postes et ne dit rien du travail de qui que ce soit.',
      },
    },
    {
      type: 'clause',
      n: 7,
      heading: {
        en: 'Where do I go with a question or a concern?',
        fr: 'Où adresser une question ou une préoccupation ?',
      },
      text: {
        en: '{{contact}} Asking a question here is not held against anyone, and neither is saying that you are finding this difficult.',
        fr: '{{contact}} Poser une question ici ne sera reproché à personne, pas plus que de dire que la situation est difficile à vivre.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'This document answers questions in general terms for a whole team. It states no individual’s entitlements, is not notice of anything, and does not vary any employment agreement. Anyone affected should rely on what they received in writing.',
        fr: 'Le présent document répond à des questions en termes généraux pour l’ensemble d’une équipe. Il n’énonce les droits d’aucune personne en particulier, ne constitue un préavis de quoi que ce soit et ne modifie aucun contrat de travail. Toute personne visée doit se fier à ce qu’elle a reçu par écrit.',
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
