/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 4, Compensation & Financial Literacy (docs/FOUR_RING_FRAMEWORK.md).

   **Not T26, and the difference is the whole reason this exists.** T26
   confirms a change — it requires a new title or a new rate, and it varies
   the contract. This reports the outcome of a review, and the outcome is
   frequently that nothing changed. Running a no-increase year through T26
   produces a promotion letter with its fields empty; running it through
   nothing at all is what most employers do, which is worse.

   **The no-increase letter is the one this document is really for.** It is
   the hardest of the three to write and the one written worst: employers
   either say nothing and let the silence land in a pay period, or bury it in
   a paragraph about business conditions that reads as a preamble to bad news
   the reader has already guessed. Say it in the first line, give the actual
   reason, and say what would change it.

   Where a review does produce an increase this letter reports it and hands
   off to T26 for anything that varies the terms — a new title, a new
   reporting line, a change to the contract itself. Reporting a rate and
   varying a contract are different acts. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT46: DocTemplate = {
  id: 'tpl_t46',
  tid: 'T46',
  key: 'salary_review_letter',
  kind: 'letter',
  category: 'compensation',
  core: false,
  name: {
    en: 'Salary review letter',
    fr: 'Lettre de révision salariale',
  },
  desc: {
    en: 'The outcome of a pay review, including the year there is no increase — said in the first line, with the actual reason and what would change it.',
    fr: 'Le résultat d’une révision salariale, y compris l’année sans augmentation — annoncé dès la première ligne, avec le motif réel et ce qui pourrait changer la donne.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 5,
  usageCount: 0,
  statutory: [
    {
      en: 'Pay differences must rest on the work, not on a protected ground',
      fr: 'Les écarts de rémunération doivent reposer sur le travail, non sur un motif protégé',
    },
    {
      en: 'A review outcome is not a variation of the contract — that is a separate document',
      fr: 'Un résultat de révision ne modifie pas le contrat — cela relève d’un document distinct',
    },
    {
      en: 'A leave, a complaint or an accommodation can never be the reason for an outcome',
      fr: 'Un congé, une plainte ou un accommodement ne peut jamais motiver un résultat',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Human Rights Code prohibits a pay decision resting on a protected ground, and the Employment Standards Act, 2000 separately bars paying differently on the basis of sex for substantially the same work. Two practical cautions. Someone who was on a statutory leave for part of the review period cannot be scored down for the absence — proration of a formula-based amount is a different question from a lower rating, and the two get confused. And where the employee has raised a complaint or requested an accommodation, an outcome that lands worse than their peers’ needs a reason on file that predates it.',
      fr: 'Le Code des droits de la personne interdit une décision salariale fondée sur un motif protégé, et la Loi de 2000 sur les normes d’emploi interdit distinctement une rémunération différente fondée sur le sexe pour un travail essentiellement similaire. Deux mises en garde pratiques. Une personne ayant été en congé légal pendant une partie de la période visée ne peut être pénalisée dans l’évaluation en raison de l’absence — la répartition proportionnelle d’un montant calculé par formule est une question distincte d’une cote inférieure, et les deux se confondent aisément. Et lorsqu’une personne a formulé une plainte ou demandé un accommodement, un résultat moins favorable que celui de ses pairs exige un motif au dossier qui lui soit antérieur.',
    },
    QC: {
      en: 'The Charter of human rights and freedoms carries the prohibition, and the Pay Equity Act imposes a separate and ongoing obligation on enterprises above its threshold — an individual review outcome should not cut across the pay equity plan, and where it appears to, resolve that before the letter goes out. The Act respecting labour standards bars any sanction connected to taking a leave, which includes a review outcome. The letter must be in French where French is the language of work.',
      fr: 'La Charte des droits et libertés de la personne porte l’interdiction, et la Loi sur l’équité salariale impose une obligation distincte et continue aux entreprises dépassant son seuil — un résultat de révision individuel ne devrait pas contredire le plan d’équité salariale et, s’il semble le faire, réglez cette question avant l’envoi de la lettre. La Loi sur les normes du travail interdit toute sanction liée à la prise d’un congé, ce qui comprend un résultat de révision. La lettre doit être en français lorsque le français est la langue du travail.',
    },
    FED: {
      en: 'The Canadian Human Rights Act carries the prohibition, and federally regulated employers above the applicable thresholds have proactive pay equity obligations of their own — an individual outcome should be consistent with the pay equity plan rather than assessed in isolation. The Canada Labour Code, Part III bars reprisal for taking a leave. In a unionised workplace, pay is set by the collective agreement and a letter that appears to negotiate an individual rate around it is a problem in itself.',
      fr: 'La Loi canadienne sur les droits de la personne porte l’interdiction, et les employeurs de compétence fédérale dépassant les seuils applicables ont leurs propres obligations proactives en matière d’équité salariale — un résultat individuel devrait concorder avec le plan d’équité salariale plutôt que d’être apprécié isolément. Le Code canadien du travail, Partie III interdit les représailles liées à la prise d’un congé. En milieu syndiqué, la rémunération est fixée par la convention collective, et une lettre qui paraît négocier un taux individuel en marge de celle-ci pose problème en soi.',
    },
  },
  includes: [
    {
      en: 'The outcome, in the first line',
      fr: 'Le résultat, dès la première ligne',
    },
    {
      en: 'The reason it landed there',
      fr: 'La raison de ce résultat',
    },
    {
      en: 'What it applies from',
      fr: 'Sa date d’effet',
    },
    {
      en: 'What would change it next time',
      fr: 'Ce qui pourrait le modifier la prochaine fois',
    },
    {
      en: 'What is not changing',
      fr: 'Ce qui ne change pas',
    },
  ],
  questions: [
    {
      id: 'employee_name',
      section: {
        en: 'Employee',
        fr: 'Employé',
      },
      label: {
        en: 'Employee full name',
        fr: 'Nom complet de l’employé(e)',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'outcome',
      section: {
        en: 'The outcome',
        fr: 'Le résultat',
      },
      label: {
        en: 'What the review decided',
        fr: 'Ce qu’a décidé la révision',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'increase',
          label: {
            en: 'An increase to your base pay',
            fr: 'Une augmentation de votre rémunération de base',
          },
        },
        {
          value: 'one_time',
          label: {
            en: 'A one-time payment rather than a change to base pay',
            fr: 'Un versement ponctuel plutôt qu’une modification de la rémunération de base',
          },
        },
        {
          value: 'no_change',
          label: {
            en: 'No change to your pay this year',
            fr: 'Aucun changement à votre rémunération cette année',
          },
        },
      ],
      hint: {
        en: 'Whichever it is, it goes in the first line of the letter. A no-change outcome buried under a paragraph about business conditions is the version people forward to each other.',
        fr: 'Quel qu’il soit, il figure dès la première ligne. Un résultat sans changement enfoui sous un paragraphe sur la conjoncture est la version que les gens se transmettent entre eux.',
      },
    },
    {
      id: 'detail',
      section: {
        en: 'The outcome',
        fr: 'Le résultat',
      },
      label: {
        en: 'The amounts, if there are any',
        fr: 'Les montants, s’il y en a',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'New rate and the change from the old one, or the one-time amount — or say plainly that the rate is unchanged.',
        fr: 'Nouveau taux et écart avec l’ancien, ou montant ponctuel — ou indiquez clairement que le taux demeure inchangé.',
      },
    },
    {
      id: 'effective_date',
      section: {
        en: 'The outcome',
        fr: 'Le résultat',
      },
      label: {
        en: 'Effective from',
        fr: 'En vigueur à compter du',
      },
      type: 'date',
      required: true,
      hint: {
        en: 'Say the date even where nothing changed — "your rate is unchanged from 1 April" answers the question the reader is actually asking.',
        fr: 'Indiquez la date même en l’absence de changement — « votre taux demeure inchangé à compter du 1er avril » répond à la question que le lecteur se pose réellement.',
      },
    },
    {
      id: 'reason',
      section: {
        en: 'The reasoning',
        fr: 'Le raisonnement',
      },
      label: {
        en: 'Why the review landed here',
        fr: 'Pourquoi la révision a abouti à ce résultat',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The actual reason — performance against what was set, the position of the role in the market, the budget available.',
        fr: 'La raison réelle — le rendement au regard de ce qui avait été fixé, le positionnement du poste sur le marché, le budget disponible.',
      },
      hint: {
        en: 'Give the real one. "Business conditions" tells the reader nothing and reads as a decision they cannot influence. If the reason is the budget, say so — that is a better answer than an invented performance concern, and it does not become an argument about their work.',
        fr: 'Donnez la vraie. « La conjoncture » n’apprend rien au lecteur et se lit comme une décision sur laquelle il n’a aucune prise. Si la raison est budgétaire, dites-le — c’est une meilleure réponse qu’une préoccupation de rendement inventée, et cela ne se transforme pas en débat sur son travail.',
      },
    },
    {
      id: 'next_time',
      section: {
        en: 'The reasoning',
        fr: 'Le raisonnement',
      },
      label: {
        en: 'What would change the outcome next time',
        fr: 'Ce qui pourrait changer le résultat la prochaine fois',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'What is in the employee’s control, when the next review is, and who to talk to before then.',
        fr: 'Ce qui relève de la personne, la date de la prochaine révision et à qui s’adresser d’ici là.',
      },
      hint: {
        en: 'Do not promise next year’s outcome. "If X, then an increase" is a commitment you may not be able to keep; "X is what the next review will look at" is not.',
        fr: 'Ne promettez pas le résultat de l’an prochain. « Si X, alors une augmentation » est un engagement que vous pourriez ne pas pouvoir tenir ; « X est ce que la prochaine révision examinera » ne l’est pas.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Your pay review',
        fr: 'Votre révision salariale',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{employee_name}} · {{org}} · {{today}} · Effective {{effective_date}}',
        fr: '{{employee_name}} · {{org}} · {{today}} · En vigueur le {{effective_date}}',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'The outcome',
        fr: 'Le résultat',
      },
      text: {
        en: 'Your pay review is complete, and the outcome is this: {{outcome}}. {{detail}} This applies from {{effective_date}}.',
        fr: 'Votre révision salariale est terminée et voici le résultat : {{outcome}}. {{detail}} Cela s’applique à compter du {{effective_date}}.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'Why',
        fr: 'Pourquoi',
      },
      text: {
        en: '{{reason}}',
        fr: '{{reason}}',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'What happens next',
        fr: 'La suite',
      },
      text: {
        en: '{{next_time}} If you disagree with any of this, say so — a review you think got something wrong is worth raising while the reasoning is still fresh, and doing so is not held against you.',
        fr: '{{next_time}} Si vous êtes en désaccord avec un élément, dites-le — une révision que vous estimez erronée mérite d’être contestée pendant que le raisonnement est encore frais, et le faire ne vous sera pas reproché.',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'What is not changing',
        fr: 'Ce qui ne change pas',
      },
      text: {
        en: 'Your role, your reporting line and every other term you work under are unchanged by this letter, and your service is continuous. This reports the outcome of a review; it does not vary your employment agreement. Where a change to your role or your terms is also happening, that is confirmed separately and in writing, and this letter is not it.',
        fr: 'Votre poste, votre lien hiérarchique et toutes vos autres conditions de travail demeurent inchangés par la présente lettre, et votre service demeure continu. Elle rapporte le résultat d’une révision ; elle ne modifie pas votre contrat de travail. Si un changement à votre poste ou à vos conditions survient également, il vous est confirmé séparément et par écrit, et ce n’est pas la présente lettre.',
      },
    },
    {
      type: 'note',
      tone: 'risk',
      text: {
        en: 'Before sending: check the reason you have written is the reason. An outcome that rests on a leave taken, a complaint raised, an accommodation in place, or anything else a protected ground touches is unlawful however it is worded — and where an employee in one of those situations lands worse than their peers, the reason needs to be on file and to predate the situation. Check too that this letter and the pay equity position agree, if one applies to you.',
        fr: 'Avant l’envoi : vérifiez que le motif rédigé est bien le motif réel. Un résultat reposant sur un congé pris, une plainte formulée, un accommodement en place ou tout autre élément touchant un motif protégé est illégal, quelle qu’en soit la formulation — et lorsqu’une personne dans l’une de ces situations obtient un résultat moins favorable que ses pairs, le motif doit figurer au dossier et être antérieur à la situation. Vérifiez également la concordance entre la présente lettre et la position en matière d’équité salariale, si elle vous est applicable.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'employee',
}
