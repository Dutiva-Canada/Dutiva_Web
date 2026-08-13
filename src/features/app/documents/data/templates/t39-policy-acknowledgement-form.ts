/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Policy rollout (docs/FOUR_RING_FRAMEWORK.md).

   **Read this before using it, because it overlaps something already
   shipped.** Every policy template in the catalogue — T04, T10, T11, T12,
   T13, T28, T34 — already ends with its own `ack` block. A policy generated
   here does not need this form, and collecting both produces two records of
   the same thing with different dates, which is worse than either.

   What this is for is the case those blocks cannot cover: a set rolled out
   together, where one signature against a named list beats chasing seven
   separate pages. Onboarding and the annual refresh are the two real ones.
   It also covers a policy distributed outside Document Studio, which has no
   ack block to carry.

   The clause that earns its place is the last one. An acknowledgement is
   evidence the policy was received and read, which is what makes it
   enforceable later — it is not agreement to a change in terms, and an
   employer who treats a signature as consent to a reduction has collected
   the wrong thing. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT39: DocTemplate = {
  id: 'tpl_t39',
  tid: 'T39',
  key: 'policy_acknowledgement_form',
  kind: 'form',
  category: 'communications',
  core: false,
  name: {
    en: 'Policy acknowledgement form',
    fr: 'Formulaire d’accusé de réception de politiques',
  },
  desc: {
    en: 'One signature covering a set of policies rolled out together — for onboarding, an annual refresh, or a policy issued outside the studio.',
    fr: 'Une seule signature pour un ensemble de politiques diffusées ensemble — intégration, mise à jour annuelle ou politique émise hors du studio.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 3,
  usageCount: 0,
  statutory: [
    {
      en: 'A policy relied on in discipline must be shown to have been communicated',
      fr: 'Il faut pouvoir démontrer qu’une politique invoquée en matière disciplinaire a été communiquée',
    },
    {
      en: 'Acknowledgement of receipt is not agreement to a change in terms',
      fr: 'L’accusé de réception ne vaut pas acceptation d’une modification des conditions',
    },
    {
      en: 'No acknowledgement waives a statutory minimum',
      fr: 'Aucun accusé de réception n’emporte renonciation à un minimum légal',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Under the Employment Standards Act, 2000 an employee cannot contract out of a statutory minimum, so no signature here reduces one. What the signature does do is establish communication, which matters when a policy is later relied on in a discipline or dismissal decision — an unread policy is a weak foundation for either. Where a policy is separately mandated, such as a workplace harassment programme under the Occupational Health and Safety Act, confirm the statute’s own training and communication requirements are met rather than treating a signature as sufficient.',
      fr: 'Sous le régime de la Loi de 2000 sur les normes d’emploi, une personne salariée ne peut renoncer à un minimum légal ; aucune signature ici ne réduit donc quoi que ce soit. Ce que la signature établit, c’est la communication, ce qui compte lorsqu’une politique est ensuite invoquée dans une décision disciplinaire ou de congédiement — une politique non lue en constitue un fondement fragile. Lorsqu’une politique est par ailleurs obligatoire, comme un programme contre le harcèlement au travail sous la Loi sur la santé et la sécurité au travail, vérifiez que les exigences propres de formation et de communication sont satisfaites plutôt que de tenir la signature pour suffisante.',
    },
    QC: {
      en: 'The Act respecting labour standards sets minimums that cannot be renounced, and the Civil Code — not the common law — governs whether a term of the employment contract has been modified. The form and the policies it lists must be available in French where French is the language of work, and a signature on a French-language form covering English-only policies establishes very little.',
      fr: 'La Loi sur les normes du travail fixe des minimums auxquels on ne peut renoncer, et c’est le Code civil — non la common law — qui régit la question de savoir si une condition du contrat de travail a été modifiée. Le formulaire et les politiques qu’il énumère doivent être disponibles en français lorsque le français est la langue du travail, et une signature sur un formulaire français visant des politiques uniquement en anglais n’établit pas grand-chose.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III sets minimums a signature cannot reduce. For the harassment and violence prevention policy, the Work Place Harassment and Violence Prevention Regulations require joint development and prescribed training — an acknowledgement records receipt and does not satisfy either. In a unionised workplace, an individual acknowledgement cannot modify a term the collective agreement governs.',
      fr: 'Le Code canadien du travail, Partie III fixe des minimums qu’une signature ne peut réduire. Pour la politique de prévention du harcèlement et de la violence, le Règlement afférent exige une élaboration conjointe et une formation prescrite — un accusé de réception atteste la remise et ne satisfait ni l’une ni l’autre. En milieu syndiqué, un accusé de réception individuel ne peut modifier une condition régie par la convention collective.',
    },
  },
  includes: [
    {
      en: 'The policies covered, by name and version',
      fr: 'Les politiques visées, par nom et version',
    },
    {
      en: 'Why the employee is being asked now',
      fr: 'Pourquoi l’accusé est demandé maintenant',
    },
    {
      en: 'Where to read them and how long is allowed',
      fr: 'Où les lire et le délai accordé',
    },
    {
      en: 'What signing does and does not mean',
      fr: 'Ce que la signature signifie et ne signifie pas',
    },
    {
      en: 'Signature and date',
      fr: 'Signature et date',
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
      id: 'occasion',
      section: {
        en: 'Employee',
        fr: 'Employé',
      },
      label: {
        en: 'Why now',
        fr: 'Pourquoi maintenant',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'onboarding',
          label: {
            en: 'Joining the organisation',
            fr: 'Arrivée dans l’organisation',
          },
        },
        {
          value: 'annual',
          label: {
            en: 'Annual review of policies',
            fr: 'Révision annuelle des politiques',
          },
        },
        {
          value: 'rollout',
          label: {
            en: 'A set of policies issued together',
            fr: 'Un ensemble de politiques diffusées ensemble',
          },
        },
      ],
    },
    {
      id: 'policy_list',
      section: {
        en: 'The policies',
        fr: 'Les politiques',
      },
      label: {
        en: 'Policies covered, with version or date',
        fr: 'Politiques visées, avec version ou date',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'One per line, each with its version or effective date.',
        fr: 'Une par ligne, chacune avec sa version ou sa date d’entrée en vigueur.',
      },
      hint: {
        en: 'Name the version. An acknowledgement of "the code of conduct" proves nothing once the code has been revised twice — what makes this evidence is that it identifies which text was read.',
        fr: 'Indiquez la version. Un accusé visant « le code de conduite » ne prouve rien une fois le code révisé deux fois — c’est l’identification du texte lu qui en fait une preuve.',
      },
    },
    {
      id: 'where',
      section: {
        en: 'The policies',
        fr: 'Les politiques',
      },
      label: {
        en: 'Where they can be read',
        fr: 'Où les consulter',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'A location the employee can actually reach.',
        fr: 'Un emplacement réellement accessible à la personne.',
      },
    },
    {
      id: 'return_by',
      section: {
        en: 'The policies',
        fr: 'Les politiques',
      },
      label: {
        en: 'Return by',
        fr: 'À retourner d’ici le',
      },
      type: 'date',
      required: true,
      hint: {
        en: 'Allow enough time to actually read them. A form signed in the same minute it was handed over records that it was handed over.',
        fr: 'Prévoyez le temps de les lire réellement. Un formulaire signé dans la minute où il a été remis atteste seulement qu’il a été remis.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Policy acknowledgement',
        fr: 'Accusé de réception de politiques',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · {{employee_name}} · Please return by {{return_by}}',
        fr: '{{org}} · {{today}} · {{employee_name}} · À retourner d’ici le {{return_by}}',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'Why you are being asked',
        fr: 'Pourquoi cela vous est demandé',
      },
      text: {
        en: 'We are asking you to confirm you have received and read the policies listed below. The occasion is: {{occasion}}. We keep this record so that everyone can be treated the same way — a policy nobody was given is not one we should be applying to anybody.',
        fr: 'Nous vous demandons de confirmer avoir reçu et lu les politiques énumérées ci-dessous. Le motif est le suivant : {{occasion}}. Nous conservons ce document afin que chacun soit traité de la même façon — une politique que personne n’a reçue n’est pas une politique que nous devrions appliquer à qui que ce soit.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'The policies covered',
        fr: 'Les politiques visées',
      },
      text: {
        en: '{{policy_list}}',
        fr: '{{policy_list}}',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'Where to read them',
        fr: 'Où les consulter',
      },
      text: {
        en: '{{where}} Take the time to read them before signing, and ask about anything that is unclear first — a question now is easier for both of us than a disagreement later. If you need this in another format to be able to read it, tell us and we will provide one.',
        fr: '{{where}} Prenez le temps de les lire avant de signer et posez d’abord vos questions sur ce qui n’est pas clair — une question aujourd’hui est plus simple pour tous qu’un désaccord plus tard. Si vous avez besoin d’un autre format pour pouvoir les lire, dites-le-nous et nous vous le fournirons.',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'What signing means',
        fr: 'Ce que signifie la signature',
      },
      text: {
        en: 'Signing confirms two things and no more: that you were given these policies, and that you have read them. It is not agreement that any of them is fair, it does not give up anything you are entitled to under your employment agreement or under employment standards legislation, and it is not consent to a change in your terms of employment. If one of these policies does change your terms, that is a separate conversation and this form is not it.',
        fr: 'La signature confirme deux choses et rien de plus : que ces politiques vous ont été remises et que vous les avez lues. Elle ne signifie pas que vous les jugez équitables, n’emporte renonciation à aucun droit prévu à votre contrat de travail ou par la législation sur les normes du travail, et ne vaut pas consentement à une modification de vos conditions d’emploi. Si l’une de ces politiques modifie vos conditions, il s’agit d’une conversation distincte, à laquelle le présent formulaire ne se substitue pas.',
      },
    },
    {
      type: 'ack',
      text: {
        en: 'I confirm I have received the policies listed above, in the versions named, and that I have read them.',
        fr: 'Je confirme avoir reçu les politiques énumérées ci-dessus, dans les versions indiquées, et les avoir lues.',
      },
    },
    {
      type: 'sig',
      roles: [
        {
          en: 'Employee',
          fr: 'Employé(e)',
        },
        {
          en: 'Date',
          fr: 'Date',
        },
      ],
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'A signature records receipt, not consent to a change in terms, and waives nothing an employee is entitled to. Where a policy was generated in Document Studio it already carries its own acknowledgement — use one or the other rather than both.',
        fr: 'La signature atteste la réception, non l’acceptation d’une modification des conditions, et n’emporte renonciation à aucun droit. Lorsqu’une politique a été produite dans le Studio de documents, elle comporte déjà son propre accusé de réception — utilisez l’un ou l’autre, non les deux.',
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
