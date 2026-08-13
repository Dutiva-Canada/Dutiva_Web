/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Policy rollout (docs/FOUR_RING_FRAMEWORK.md).

   For a policy that already existed. T38 introduces a new one, and the two
   are separate because the reader's question is different: a new policy has
   to be explained, an update only has to be diffed. An update notice that
   re-explains the whole policy buries the two lines the reader needed, and
   the reliable consequence is that nobody finds what moved.

   So the document is built around a before-and-after, and it asks the author
   to write both sides. That is deliberate friction: an employer who cannot
   state the old position in a sentence has not established what they are
   changing, and "the policy has been updated, please re-read it" is the
   version that gets ignored and then relied on in a dismissal. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT40: DocTemplate = {
  id: 'tpl_t40',
  tid: 'T40',
  key: 'policy_update_notification',
  kind: 'notice',
  category: 'communications',
  core: false,
  name: {
    en: 'Policy update notification',
    fr: 'Avis de mise à jour d’une politique',
  },
  desc: {
    en: 'Tells people what actually changed in a policy they already have — what moved, what did not, and whether they need to acknowledge it again.',
    fr: 'Indique ce qui a réellement changé dans une politique existante : ce qui a bougé, ce qui n’a pas bougé, et s’il faut en accuser réception de nouveau.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 4,
  usageCount: 0,
  statutory: [
    {
      en: 'A change that reduces an existing entitlement is a change to the contract',
      fr: 'Un changement réduisant un droit acquis modifie le contrat',
    },
    {
      en: 'A revised policy is enforceable only from when it was communicated',
      fr: 'Une politique révisée n’est exécutoire qu’à compter de sa communication',
    },
    {
      en: 'Version and date are what make an acknowledgement mean anything later',
      fr: 'La version et la date sont ce qui donne un sens ultérieur à l’accusé de réception',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'A revised policy applies from when it was communicated, not from when it was drafted — conduct before that date is measured against the version then in force, which is why keeping the superseded text matters. Where the revision reduces something an employee already had, that is a contractual change, and agreement alone does not carry it: at common law a variation reducing what an existing employee already has needs fresh consideration — something of value they were not already entitled to — as well as their agreement. A signature without consideration is generally unenforceable, and imposing the change instead can amount to constructive dismissal. Nothing in a revision can go below the Employment Standards Act, 2000.',
      fr: 'Une politique révisée s’applique à compter de sa communication et non de sa rédaction — la conduite antérieure s’apprécie au regard de la version alors en vigueur, d’où l’importance de conserver le texte remplacé. Lorsque la révision réduit un droit déjà acquis, il s’agit d’une modification contractuelle, et le seul accord ne suffit pas : en common law, une modification réduisant ce dont bénéficie déjà une personne en poste exige une contrepartie nouvelle — un avantage auquel elle n’avait pas déjà droit — en plus de son accord. Une signature sans contrepartie est généralement inexécutoire, et imposer le changement peut constituer un congédiement déguisé. Aucune révision ne peut aller sous la Loi de 2000 sur les normes d’emploi.',
    },
    QC: {
      en: 'Do not apply the common-law consideration analysis. Québec is a civil-law jurisdiction: whether a unilateral revision has modified an essential condition of the employment contract is assessed under the Civil Code and the Act respecting labour standards. The revised policy and this notice must be in French where French is the language of work, and the French version should be issued at the same time as any other, not after it.',
      fr: 'N’appliquez pas l’analyse de la contrepartie de common law. Le Québec est une juridiction de droit civil : la question de savoir si une révision unilatérale a modifié une condition essentielle du contrat de travail s’apprécie sous le Code civil et la Loi sur les normes du travail. La politique révisée et le présent avis doivent être en français lorsque le français est la langue du travail, et la version française doit être diffusée en même temps que toute autre, non après.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III sets the floor for any revision, and no more than that: it does not decide whether a revision that reduces an entitlement binds the employee. That turns on the private law where they work — the common-law consideration analysis above outside Québec, the Civil Code within it — so agreement alone does not settle enforceability for a federally regulated employee either. Where the policy being revised is the harassment and violence prevention policy, the Work Place Harassment and Violence Prevention Regulations require that revisions be developed jointly with the policy committee or health and safety representative and that the policy be reviewed on the prescribed cycle — a notification issued after the fact does not stand in for either. In a unionised workplace, check the collective agreement before revising a policy it touches.',
      fr: 'Le Code canadien du travail, Partie III fixe le seuil minimal de toute révision, et rien de plus : il ne détermine pas si une révision réduisant un droit lie la personne salariée. Cela dépend du droit privé du lieu de travail — l’analyse de la contrepartie de common law exposée plus haut hors Québec, le Code civil au Québec — de sorte que le seul accord ne règle pas davantage la question de l’opposabilité pour une personne de compétence fédérale. Lorsque la politique révisée est celle de prévention du harcèlement et de la violence, le Règlement afférent exige que les révisions soient élaborées conjointement avec le comité d’orientation ou le représentant en santé et sécurité et que la politique soit revue selon le cycle prescrit — un avis émis après coup ne remplace ni l’un ni l’autre. En milieu syndiqué, vérifiez la convention collective avant de réviser une politique qu’elle touche.',
    },
  },
  includes: [
    {
      en: 'Which policy and which version',
      fr: 'Quelle politique et quelle version',
    },
    {
      en: 'What changed, stated as before and after',
      fr: 'Ce qui a changé, avant et après',
    },
    {
      en: 'What did not change',
      fr: 'Ce qui n’a pas changé',
    },
    {
      en: 'When the new version applies from',
      fr: 'À compter de quand la nouvelle version s’applique',
    },
    {
      en: 'Whether a fresh acknowledgement is needed',
      fr: 'S’il faut un nouvel accusé de réception',
    },
  ],
  questions: [
    {
      id: 'policy_name',
      section: {
        en: 'The policy',
        fr: 'La politique',
      },
      label: {
        en: 'Policy name',
        fr: 'Nom de la politique',
      },
      type: 'text',
      required: true,
    },
    {
      id: 'new_version',
      section: {
        en: 'The policy',
        fr: 'La politique',
      },
      label: {
        en: 'New version, and the one it replaces',
        fr: 'Nouvelle version, et celle qu’elle remplace',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. v3, replacing v2 of 14 March 2025',
        fr: 'p. ex. v3, remplaçant la v2 du 14 mars 2025',
      },
      hint: {
        en: 'Both numbers. Which version applied when is the first question asked whenever a policy matters, and it is usually asked long after everyone has forgotten.',
        fr: 'Les deux numéros. Savoir quelle version s’appliquait à quel moment est la première question posée dès qu’une politique compte, et elle survient généralement bien après que tous l’aient oublié.',
      },
    },
    {
      id: 'was',
      section: {
        en: 'The change',
        fr: 'Le changement',
      },
      label: {
        en: 'What the policy used to say',
        fr: 'Ce que la politique prévoyait auparavant',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The old position, in plain terms.',
        fr: 'L’ancienne position, en termes simples.',
      },
      hint: {
        en: 'If you cannot state the old position in a sentence, you have not established what is being changed — and neither has the reader.',
        fr: 'Si vous ne pouvez énoncer l’ancienne position en une phrase, vous n’avez pas établi ce qui change — et le lecteur non plus.',
      },
    },
    {
      id: 'now',
      section: {
        en: 'The change',
        fr: 'Le changement',
      },
      label: {
        en: 'What it says now',
        fr: 'Ce qu’elle prévoit désormais',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The new position, and why it moved.',
        fr: 'La nouvelle position, et la raison du changement.',
      },
    },
    {
      id: 'unchanged',
      section: {
        en: 'The change',
        fr: 'Le changement',
      },
      label: {
        en: 'What has not changed',
        fr: 'Ce qui n’a pas changé',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The parts people will worry about that are untouched.',
        fr: 'Les éléments qui inquiéteront et qui demeurent inchangés.',
      },
      hint: {
        en: 'Without this, a small revision reads as a rewrite and everyone re-reads everything looking for the catch.',
        fr: 'Sans cela, une révision mineure passe pour une refonte et chacun relit tout à la recherche du piège.',
      },
    },
    {
      id: 'effective_date',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Date the new version applies from',
        fr: 'Date d’application de la nouvelle version',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'reack',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Is a fresh acknowledgement required?',
        fr: 'Un nouvel accusé de réception est-il requis ?',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'yes',
          label: {
            en: 'Yes — please sign and return',
            fr: 'Oui — veuillez signer et retourner',
          },
        },
        {
          value: 'no',
          label: {
            en: 'No — this is for information',
            fr: 'Non — à titre informatif',
          },
        },
      ],
      hint: {
        en: 'Ask again whenever the change affects what someone must do or what they receive. A wording or formatting revision does not need a signature, and asking for one anyway trains people to sign without reading.',
        fr: 'Redemandez-le dès que le changement touche ce qu’une personne doit faire ou reçoit. Une révision de forme ne requiert pas de signature, et en exiger une malgré tout habitue les gens à signer sans lire.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Update to {{policy_name}}',
        fr: 'Mise à jour de la politique {{policy_name}}',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · {{new_version}} · Applies from {{effective_date}}',
        fr: '{{org}} · {{today}} · {{new_version}} · S’applique à compter du {{effective_date}}',
      },
    },
    {
      type: 'para',
      text: {
        en: 'We have revised a policy you already have. This sets out only what changed, so you do not have to re-read the whole document to find it.',
        fr: 'Nous avons révisé une politique que vous possédez déjà. Le présent avis n’expose que ce qui a changé, pour vous éviter de relire tout le document afin de le trouver.',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'What it used to say',
        fr: 'Ce qui était prévu auparavant',
      },
      text: {
        en: '{{was}}',
        fr: '{{was}}',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'What it says now',
        fr: 'Ce qui est prévu désormais',
      },
      text: {
        en: '{{now}}',
        fr: '{{now}}',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'What has not changed',
        fr: 'Ce qui n’a pas changé',
      },
      text: {
        en: '{{unchanged}}',
        fr: '{{unchanged}}',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'When this applies from',
        fr: 'À compter de quand cela s’applique',
      },
      text: {
        en: '{{new_version}} applies from {{effective_date}}. Anything before that date is measured against the version that was in force at the time, and we keep the earlier version so that remains checkable.',
        fr: 'La version {{new_version}} s’applique à compter du {{effective_date}}. Tout ce qui précède cette date s’apprécie au regard de la version alors en vigueur, et nous conservons la version antérieure afin que cela demeure vérifiable.',
      },
    },
    {
      type: 'clause',
      n: 5,
      heading: {
        en: 'If this affects something you already have',
        fr: 'Si cela touche un droit déjà acquis',
      },
      text: {
        en: 'This revision is not intended to reduce anything you are already entitled to under your employment agreement, your terms as they have been applied, or employment standards legislation — which sets a floor no policy version can go below. If you think it does, tell us before {{effective_date}}. A change to what you are entitled to is a change to your terms, and that is agreed with you rather than notified to you.',
        fr: 'La présente révision n’a pas pour objet de réduire un droit dont vous bénéficiez déjà en vertu de votre contrat de travail, de vos conditions telles qu’appliquées ou de la législation sur les normes du travail — laquelle fixe un seuil sous lequel aucune version d’une politique ne peut aller. Si vous estimez que c’est le cas, dites-le-nous avant le {{effective_date}}. Une modification de vos droits est une modification de vos conditions : elle se convient avec vous plutôt qu’elle ne vous est notifiée.',
      },
    },
    {
      type: 'clause',
      n: 6,
      heading: {
        en: 'Do you need to sign anything?',
        fr: 'Devez-vous signer quelque chose ?',
      },
      text: {
        en: '{{reack}} Where we have asked for one, the acknowledgement below is where it goes: signing confirms you received and read this version. It is not agreement to a change in your terms, and it waives nothing you are entitled to. Where we have not, there is nothing for you to return.',
        fr: '{{reack}} Lorsque nous en demandons une, l’accusé de réception ci-dessous est l’endroit prévu à cette fin : la signature confirme que vous avez reçu et lu la présente version. Elle ne vaut pas acceptation d’une modification de vos conditions et n’emporte renonciation à aucun droit. Dans le cas contraire, vous n’avez rien à retourner.',
      },
    },
    {
      type: 'ack',
      when: {
        answer: { id: 'reack', equals: ['yes'] },
      },
      text: {
        en: 'I confirm I have received and read {{policy_name}}, version {{new_version}}.',
        fr: 'Je confirme avoir reçu et lu la politique {{policy_name}}, version {{new_version}}.',
      },
    },
    {
      type: 'sig',
      when: {
        answer: { id: 'reack', equals: ['yes'] },
      },
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
        en: 'A revised policy binds from when it was communicated, not from when it was written. Keep the superseded version: which text applied on a given date is the first question asked whenever a policy is relied on.',
        fr: 'Une politique révisée lie à compter de sa communication et non de sa rédaction. Conservez la version remplacée : savoir quel texte s’appliquait à une date donnée est la première question posée dès qu’une politique est invoquée.',
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
