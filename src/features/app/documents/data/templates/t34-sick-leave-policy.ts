/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 2, Pillar D (docs/FOUR_RING_FRAMEWORK.md).

   Reads as a pair with the attendance policy (T28), and the boundary between
   them is deliberate: T28 says statutory leave is not an absence under it and
   hands the subject off; this is where it lands. Without that split, an
   employer either counts protected leave against attendance — the most
   common reprisal exposure there is — or has no written sick-leave terms at
   all. Both policies state the boundary so neither is read alone. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT34: DocTemplate = {
  id: 'tpl_t34',
  tid: 'T34',
  key: 'sick_leave_policy',
  kind: 'policy',
  category: 'policies',
  core: false,
  name: {
    en: 'Sick leave policy',
    fr: 'Politique de congé de maladie',
  },
  desc: {
    en: 'What sick leave you offer, how to use it, and what evidence you ask for — separate from attendance, which never counts it.',
    fr: 'Le congé de maladie offert, son utilisation et la preuve exigée — distinct de la présence au travail, qui ne le comptabilise jamais.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 7,
  usageCount: 0,
  statutory: [
    {
      en: 'Employment standards — the statutory entitlement is a floor a policy cannot go below',
      fr: 'Normes du travail — le droit légal constitue un plancher qu’une politique ne peut abaisser',
    },
    {
      en: 'Reprisal prohibition — using sick leave cannot be held against an employee',
      fr: 'Interdiction de représailles — l’utilisation d’un congé de maladie ne peut être reprochée',
    },
    {
      en: 'Human rights legislation — illness that becomes a disability engages the duty to accommodate',
      fr: 'Législation sur les droits de la personne — une maladie devenue handicap déclenche l’obligation d’accommodement',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'The Employment Standards Act, 2000 sets the sick-leave entitlement, and a policy may add to it but never subtract. The evidence an employer may require for it is restricted and the restriction changed in recent years — confirm the current rule before writing an evidence requirement into your policy.',
      fr: 'La Loi de 2000 sur les normes d’emploi fixe le droit au congé de maladie ; une politique peut le bonifier mais jamais le réduire. La preuve exigible est encadrée et cet encadrement a changé ces dernières années — vérifiez la règle en vigueur avant d’inscrire une exigence de preuve dans votre politique.',
    },
    QC: {
      en: 'The Act respecting labour standards sets the entitlement for absence due to sickness, and the first days of it are paid once the employee has the required service. It also bars any sanction for using it. The policy must be available in French.',
      fr: 'La Loi sur les normes du travail fixe le droit d’absence pour maladie, dont les premières journées sont rémunérées une fois le service requis atteint. Elle interdit aussi toute sanction liée à son utilisation. La politique doit être disponible en français.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III provides medical leave with pay that accrues with service, and limits when a medical certificate may be required. Federally regulated employers should write the policy against Part III rather than against a provincial entitlement that does not apply to them.',
      fr: 'Le Code canadien du travail, Partie III prévoit un congé pour raisons médicales payé qui s’accumule avec le service, et limite les cas où un certificat médical peut être exigé. Les employeurs de compétence fédérale devraient rédiger la politique en fonction de la Partie III plutôt que d’un droit provincial qui ne leur est pas applicable.',
    },
  },
  includes: [
    {
      en: 'What is offered, over the statutory floor',
      fr: 'Ce qui est offert, au-delà du minimum légal',
    },
    {
      en: 'How to report an absence',
      fr: 'Comment signaler une absence',
    },
    {
      en: 'When evidence is asked for',
      fr: 'Quand une preuve est demandée',
    },
    {
      en: 'What happens on a long absence',
      fr: 'Ce qui arrive lors d’une absence prolongée',
    },
    {
      en: 'The boundary with attendance',
      fr: 'La frontière avec la présence au travail',
    },
  ],
  questions: [
    {
      id: 'entitlement',
      section: {
        en: 'What you offer',
        fr: 'Ce que vous offrez',
      },
      label: {
        en: 'Sick leave offered',
        fr: 'Congé de maladie offert',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'How much, paid or unpaid, and how it accrues.',
        fr: 'Quelle durée, rémunérée ou non, et son mode d’accumulation.',
      },
      hint: {
        en: 'Write the entitlement you actually offer. If it is the statutory minimum, say so plainly — the statute is a floor, and a policy that reads as more generous than it is will be held to what it says.',
        fr: 'Inscrivez le droit que vous offrez réellement. S’il s’agit du minimum légal, dites-le clairement — la loi est un plancher, et une politique qui paraît plus généreuse qu’elle ne l’est vous liera à ses propres termes.',
      },
    },
    {
      id: 'report_to',
      section: {
        en: 'Reporting',
        fr: 'Signalement',
      },
      label: {
        en: 'Who to tell, and when',
        fr: 'Qui prévenir, et quand',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The person or channel, and the timing.',
        fr: 'La personne ou le canal, et le moment.',
      },
    },
    {
      id: 'evidence_practice',
      section: {
        en: 'Evidence',
        fr: 'Preuve',
      },
      label: {
        en: 'When you ask for supporting evidence',
        fr: 'Quand vous demandez une preuve à l’appui',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The circumstances, and what the evidence has to show.',
        fr: 'Les circonstances et ce que la preuve doit démontrer.',
      },
      hint: {
        en: 'Confirm what your jurisdiction permits you to require before writing this. Asking for a note you are not entitled to is the most common way a sick-leave policy becomes the problem.',
        fr: 'Vérifiez ce que votre juridiction vous permet d’exiger avant de rédiger ceci. Demander un billet auquel vous n’avez pas droit est la façon la plus courante dont une politique de congé de maladie devient le problème.',
      },
    },
    {
      id: 'long_absence',
      section: {
        en: 'Longer absences',
        fr: 'Absences prolongées',
      },
      label: {
        en: 'What happens on a long absence',
        fr: 'Ce qui arrive lors d’une absence prolongée',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Benefit continuation, disability coverage, and who stays in contact.',
        fr: 'Maintien des avantages, couverture d’invalidité et personne assurant le suivi.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Sick Leave Policy',
        fr: 'Politique de congé de maladie',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{jurisdiction}} · Effective {{today}}',
        fr: '{{org}} · {{jurisdiction}} · En vigueur le {{today}}',
      },
    },
    {
      type: 'para',
      text: {
        en: 'People get sick. This sets out the sick leave {{org}} provides, how to use it, and what we will and will not ask you for.',
        fr: 'Il arrive d’être malade. La présente politique énonce le congé de maladie offert par {{org}}, la façon de l’utiliser et ce que nous vous demanderons — ou non.',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{entitlement}} This is what {{org}} offers. Where {{statute}} entitles you to more than this, the law applies and this policy does not reduce it.',
        fr: '{{entitlement}} Voilà ce qu’offre {{org}}. Lorsque {{statute}} vous accorde davantage, la loi prévaut et la présente politique n’y déroge pas.',
      },
      n: 1,
      heading: {
        en: 'What you get',
        fr: 'Ce à quoi vous avez droit',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{report_to}} Say that you will be off and roughly how long you expect to be. You do not need to say what is wrong with you.',
        fr: '{{report_to}} Indiquez que vous serez absent(e) et la durée approximative prévue. Vous n’avez pas à préciser ce dont vous souffrez.',
      },
      n: 2,
      heading: {
        en: 'Telling us',
        fr: 'Nous prévenir',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{evidence_practice}} Where we do ask for something from a health professional, we are asking whether you were unable to work and for how long — not for your diagnosis. What you give us is kept confidential and stored separately from your personnel file.',
        fr: '{{evidence_practice}} Lorsque nous demandons un document d’un professionnel de la santé, nous cherchons à savoir si vous étiez incapable de travailler et pour quelle durée — non votre diagnostic. Ce que vous nous remettez demeure confidentiel et est conservé séparément de votre dossier d’employé.',
      },
      n: 3,
      heading: {
        en: 'Evidence',
        fr: 'Preuve',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{long_absence}} If an illness turns out to be lasting, a second process starts alongside this one: accommodation. It does not replace this policy — your leave under it continues on its own terms, and paid entitlements keep running until they are used up — it adds a conversation about what would let you work, and what we would have to change for that.',
        fr: '{{long_absence}} Si une maladie s’avère durable, un second processus s’ajoute au présent : l’accommodement. Il ne remplace pas la présente politique — votre congé s’y poursuit selon ses propres modalités et les droits rémunérés continuent de courir jusqu’à épuisement — il y ajoute une discussion sur ce qui vous permettrait de travailler et sur ce que nous devrions modifier pour cela.',
      },
      n: 4,
      heading: {
        en: 'If it goes on',
        fr: 'Si cela se prolonge',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Sick leave is not an attendance matter. Days taken under this policy are recorded — we have to know what you have used and what is left, and so do you — but they are recorded as sick leave, not as absences, and they are never a factor in a decision about your work, your pay or your future here. Our attendance policy says the same thing from its own side.',
        fr: 'Le congé de maladie ne relève pas de la présence au travail. Les journées prises en vertu de la présente politique sont consignées — nous devons savoir ce que vous avez utilisé et ce qu’il vous reste, et vous aussi — mais elles le sont à titre de congé de maladie et non d’absences, et elles n’entrent jamais en compte dans une décision touchant votre travail, votre rémunération ou votre avenir ici. Notre politique de présence énonce la même règle de son côté.',
      },
      n: 5,
      heading: {
        en: 'This is not attendance',
        fr: 'Il ne s’agit pas de présence au travail',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This workplace is unionized: where the collective agreement provides more sick leave, a different reporting route, or its own evidence terms, those apply instead.',
        fr: 'Ce milieu de travail est syndiqué : lorsque la convention collective prévoit un congé de maladie plus généreux, une autre voie de signalement ou ses propres exigences de preuve, celles-ci s’appliquent.',
      },
      heading: {
        en: 'Collective agreement',
        fr: 'Convention collective',
      },
      when: {
        union: true,
      },
    },
    {
      type: 'ack',
      text: {
        en: 'I acknowledge I have read and understood this document.',
        fr: 'Je reconnais avoir lu et compris le présent document.',
      },
    },
    {
      type: 'sig',
      roles: [
        {
          en: 'Employee',
          fr: 'Employé(e)',
        },
      ],
    },
    {
      type: 'note',
      text: {
        en: 'Read this against the attendance policy (T28) before publishing either. The two are written as a pair, and the failure they exist to prevent is a policy that counts protected leave as an absence — which is the most common reprisal exposure in this area and does not need bad intent to happen.',
        fr: 'Lisez la présente en regard de la politique de présence (T28) avant de publier l’une ou l’autre. Les deux forment un tout, et le manquement qu’elles visent à prévenir est une politique qui comptabilise un congé protégé comme une absence — la source d’exposition aux représailles la plus fréquente en la matière, et elle ne requiert aucune mauvaise intention.',
      },
      tone: 'risk',
    },
    {
      type: 'note',
      tone: 'info',
      text: {
        en: 'Generated from your answers as a starting point.',
        fr: 'Généré à partir de vos réponses comme point de départ.',
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
