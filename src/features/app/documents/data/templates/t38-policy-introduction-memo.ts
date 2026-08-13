/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 3, Policy rollout (docs/FOUR_RING_FRAMEWORK.md).

   For a policy that did not exist before. T40 is for one that changed, and
   the split is not cosmetic: a new policy has to explain what it is for,
   while an update only has to explain what moved — an update memo that
   re-explains the whole policy buries the two sentences the reader needed.

   The clause that matters most is the one distinguishing a policy from a
   term of employment. Most policies restate obligations that already exist,
   and circulating those is unremarkable. A policy that reduces something an
   employee already has is a change to their contract, and announcing it is
   not the same as agreeing it — the mechanism differs by jurisdiction, so
   the notes carry it rather than the clause. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT38: DocTemplate = {
  id: 'tpl_t38',
  tid: 'T38',
  key: 'policy_introduction_memo',
  kind: 'notice',
  category: 'communications',
  core: false,
  name: {
    en: 'Policy introduction memo',
    fr: 'Note d’introduction d’une politique',
  },
  desc: {
    en: 'Introduces a new policy — what it is for, what changes in practice, and what to do if it affects something you already had.',
    fr: 'Présente une nouvelle politique : son objet, ce qui change en pratique, et la marche à suivre si elle touche un droit déjà acquis.',
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
      en: 'A policy cannot reduce a statutory minimum, whatever it says',
      fr: 'Une politique ne peut réduire un minimum légal, quoi qu’elle prévoie',
    },
    {
      en: 'A policy that removes an existing entitlement is a change to the contract',
      fr: 'Une politique qui retire un droit existant modifie le contrat',
    },
    {
      en: 'A policy relied on in discipline must have been communicated first',
      fr: 'Une politique invoquée en matière disciplinaire doit avoir été communiquée au préalable',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'A policy is enforceable to the extent it was communicated and does not undercut the Employment Standards Act, 2000. Where a new policy takes away something an employee already had, that is a contractual change, and agreement alone does not carry it: at common law a variation reducing what an existing employee already has needs fresh consideration — something of value they were not already entitled to — as well as their agreement. A signature without consideration is generally unenforceable, and imposing the change instead can amount to constructive dismissal. Certain policies are separately mandated — workplace harassment and violence programmes under the Occupational Health and Safety Act among them — and those have prescribed content rather than optional content.',
      fr: 'Une politique est exécutoire dans la mesure où elle a été communiquée et où elle ne contrevient pas à la Loi de 2000 sur les normes d’emploi. Lorsqu’une nouvelle politique retire un droit déjà acquis, il s’agit d’une modification contractuelle, et le seul accord ne suffit pas : en common law, une modification réduisant ce dont bénéficie déjà une personne en poste exige une contrepartie nouvelle — un avantage auquel elle n’avait pas déjà droit — en plus de son accord. Une signature sans contrepartie est généralement inexécutoire, et imposer le changement peut constituer un congédiement déguisé. Certaines politiques sont par ailleurs obligatoires — dont les programmes contre le harcèlement et la violence au travail sous la Loi sur la santé et la sécurité au travail — et leur contenu est prescrit plutôt que facultatif.',
    },
    QC: {
      en: 'Do not import the common-law consideration analysis here. Québec is a civil-law jurisdiction: the Civil Code governs modification of the employment contract, and a unilateral change to an essential condition is assessed under it and the Act respecting labour standards. The policy and this memo must be in French where French is the language of work, and the Act’s psychological harassment prevention obligations set required content for the policy that addresses them.',
      fr: 'N’importez pas ici l’analyse de la contrepartie de common law. Le Québec est une juridiction de droit civil : le Code civil régit la modification du contrat de travail, et une modification unilatérale d’une condition essentielle s’apprécie sous son régime et celui de la Loi sur les normes du travail. La politique et la présente note doivent être en français lorsque le français est la langue du travail, et les obligations de prévention du harcèlement psychologique prévues par la Loi fixent le contenu requis de la politique qui les met en œuvre.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III sets the floor and a policy cannot go below it — but it does not answer whether a change to an employee’s terms binds them. Part III supplies statutory minimums, not a federal law of contract: for a federally regulated employee that question falls to the private law where they work, which means the common-law consideration analysis above outside Québec and the Civil Code within it. Do not read Part III as settling it. The Work Place Harassment and Violence Prevention Regulations require a prevention policy developed jointly with the policy committee or health and safety representative — for that policy, a memo announcing a decision already taken is evidence the joint development step was skipped. In a unionised workplace a policy cannot override the collective agreement.',
      fr: 'Le Code canadien du travail, Partie III établit le seuil minimal et une politique ne peut y déroger à la baisse — mais il ne détermine pas si une modification des conditions d’une personne la lie. La Partie III fixe des minimums légaux, non un droit fédéral des contrats : pour une personne de compétence fédérale, cette question relève du droit privé du lieu de travail, soit l’analyse de la contrepartie de common law exposée plus haut hors Québec, et le Code civil au Québec. N’y voyez pas une réponse de la Partie III. Le Règlement sur la prévention du harcèlement et de la violence dans le lieu de travail exige une politique de prévention élaborée conjointement avec le comité d’orientation ou le représentant en santé et sécurité — pour cette politique, une note annonçant une décision déjà prise atteste que l’étape d’élaboration conjointe a été omise. En milieu syndiqué, une politique ne peut supplanter la convention collective.',
    },
  },
  includes: [
    {
      en: 'What the policy is and why it exists',
      fr: 'Ce qu’est la politique et pourquoi elle existe',
    },
    {
      en: 'What changes in practice',
      fr: 'Ce qui change en pratique',
    },
    {
      en: 'When it takes effect and where to find it',
      fr: 'Sa prise d’effet et où la consulter',
    },
    {
      en: 'What to do if it affects an existing entitlement',
      fr: 'Que faire si elle touche un droit acquis',
    },
    {
      en: 'Who to ask',
      fr: 'À qui s’adresser',
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
      placeholder: {
        en: 'As it is titled in the document itself.',
        fr: 'Tel qu’il figure dans le document lui-même.',
      },
    },
    {
      id: 'purpose',
      section: {
        en: 'The policy',
        fr: 'La politique',
      },
      label: {
        en: 'What it is for',
        fr: 'Son objet',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'One or two sentences on the problem it addresses.',
        fr: 'Une ou deux phrases sur le problème qu’elle vise.',
      },
      hint: {
        en: 'If the honest answer is "a regulator requires it", say that. It is a better reason than an invented one, and people can tell the difference.',
        fr: 'Si la réponse honnête est « un organisme de réglementation l’exige », dites-le. C’est une meilleure raison qu’une raison inventée, et les gens font la différence.',
      },
    },
    {
      id: 'in_practice',
      section: {
        en: 'The effect',
        fr: 'L’effet',
      },
      label: {
        en: 'What changes in practice',
        fr: 'Ce qui change en pratique',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'What someone has to do differently on Monday — or nothing, if the answer is nothing.',
        fr: 'Ce qu’une personne devra faire autrement dès lundi — ou rien, si c’est le cas.',
      },
      hint: {
        en: 'The only paragraph most people will read. "Nothing changes for most of you; this writes down what we already do" is a complete and useful answer where it is true.',
        fr: 'Le seul paragraphe que la plupart liront. « Rien ne change pour la plupart d’entre vous ; cette politique consigne ce que nous faisons déjà » est une réponse complète et utile lorsqu’elle est exacte.',
      },
    },
    {
      id: 'effective_date',
      section: {
        en: 'The effect',
        fr: 'L’effet',
      },
      label: {
        en: 'Date it takes effect',
        fr: 'Date de prise d’effet',
      },
      type: 'date',
      required: true,
      hint: {
        en: 'Leave time between circulating it and this date. A policy that took effect before anyone read it cannot be relied on for anything that happened in between.',
        fr: 'Prévoyez un délai entre la diffusion et cette date. Une politique entrée en vigueur avant d’avoir été lue ne peut être invoquée pour ce qui s’est produit entre-temps.',
      },
    },
    {
      id: 'where',
      section: {
        en: 'Access',
        fr: 'Accès',
      },
      label: {
        en: 'Where to find the policy, and who to ask',
        fr: 'Où trouver la politique et à qui s’adresser',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'A location and a named person.',
        fr: 'Un emplacement et une personne nommée.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'New policy: {{policy_name}}',
        fr: 'Nouvelle politique : {{policy_name}}',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · To all employees · Effective {{effective_date}}',
        fr: '{{org}} · {{today}} · À tout le personnel · En vigueur le {{effective_date}}',
      },
    },
    {
      type: 'clause',
      n: 1,
      heading: {
        en: 'What this is',
        fr: 'De quoi il s’agit',
      },
      text: {
        en: 'We are introducing a policy called {{policy_name}}. {{purpose}}',
        fr: 'Nous adoptons une politique intitulée {{policy_name}}. {{purpose}}',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: {
        en: 'What changes for you',
        fr: 'Ce qui change pour vous',
      },
      text: {
        en: '{{in_practice}}',
        fr: '{{in_practice}}',
      },
    },
    {
      type: 'clause',
      n: 3,
      heading: {
        en: 'When it applies from',
        fr: 'À compter de quand elle s’applique',
      },
      text: {
        en: 'It takes effect on {{effective_date}}. It applies from that date forward and not to anything before it. Please read it before then rather than after — we would rather answer questions now than apply something nobody had seen.',
        fr: 'Elle prend effet le {{effective_date}}. Elle s’applique à compter de cette date et non à ce qui l’a précédée. Veuillez la lire avant plutôt qu’après — nous préférons répondre aux questions maintenant qu’appliquer un texte que personne n’avait vu.',
      },
    },
    {
      type: 'clause',
      n: 4,
      heading: {
        en: 'If it affects something you already have',
        fr: 'Si elle touche un droit déjà acquis',
      },
      text: {
        en: 'This policy is not intended to reduce anything you are already entitled to, whether that comes from your employment agreement, from your terms as they have been applied, or from employment standards legislation — which sets a floor a policy cannot go below in any case. If you think it does reduce something, tell us before {{effective_date}}. A change to what you are entitled to is a change to your terms, and that is a conversation with you rather than a memo to everyone.',
        fr: 'La présente politique n’a pas pour objet de réduire un droit dont vous bénéficiez déjà, qu’il découle de votre contrat de travail, de vos conditions telles qu’appliquées ou de la législation sur les normes du travail — laquelle fixe de toute façon un seuil auquel une politique ne peut déroger. Si vous estimez qu’elle réduit un tel droit, dites-le-nous avant le {{effective_date}}. Une modification de vos droits est une modification de vos conditions, ce qui appelle une conversation avec vous plutôt qu’une note à tous.',
      },
    },
    {
      type: 'clause',
      n: 5,
      heading: {
        en: 'Where to find it',
        fr: 'Où la consulter',
      },
      text: {
        en: '{{where}} If anything in it is unclear, ask before {{effective_date}} — a policy people did not understand is one we will have to explain one disagreement at a time.',
        fr: '{{where}} Si quoi que ce soit demeure obscur, posez la question avant le {{effective_date}} — une politique incomprise devra être expliquée un désaccord à la fois.',
      },
    },
    {
      type: 'ack',
      text: {
        en: 'I confirm I have received and read {{policy_name}}.',
        fr: 'Je confirme avoir reçu et lu la politique {{policy_name}}.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'Acknowledging receipt records that you were given the policy and read it. It is not agreement to a change in your terms of employment, and it does not waive anything you are entitled to.',
        fr: 'Accuser réception atteste que la politique vous a été remise et que vous l’avez lue. Cela ne vaut pas acceptation d’une modification de vos conditions d’emploi et n’emporte renonciation à aucun droit.',
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
