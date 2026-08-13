/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. All FR is [FR self-authored].

   Ring 1, Workplace Policies (docs/FOUR_RING_FRAMEWORK.md). One of the eight
   Ring 1 tools the framework lists that had no template.

   The distinction this policy is built around is culpable vs innocent
   absenteeism: one is a conduct problem and can be disciplined, the other is
   a capacity problem and triggers the duty to accommodate. A policy that
   treats every absence as the first kind is how employers discipline their
   way into a human rights complaint. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT28: DocTemplate = {
  id: 'tpl_t28',
  tid: 'T28',
  key: 'attendance_policy',
  kind: 'policy',
  category: 'policies',
  core: true,
  name: {
    en: 'Attendance policy',
    fr: 'Politique de présence au travail',
  },
  desc: {
    en: 'Sets attendance expectations and how absences are reported — separating absence someone chooses from absence they cannot help.',
    fr: 'Établit les attentes en matière de présence et le signalement des absences — en distinguant l’absence choisie de celle qui est subie.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-01',
  updatedAt: '2026-08-01',
  estMinutes: 8,
  usageCount: 0,
  statutory: [
    {
      en: 'Employment standards — protected leaves cannot be counted against attendance',
      fr: 'Normes du travail — les congés protégés ne peuvent être comptabilisés contre la présence',
    },
    {
      en: 'Human rights legislation — innocent absenteeism engages the duty to accommodate',
      fr: 'Législation sur les droits de la personne — l’absentéisme non coupable déclenche l’obligation d’accommodement',
    },
    {
      en: 'Privacy — medical evidence is limited to what supports the absence',
      fr: 'Vie privée — la preuve médicale se limite à ce qui justifie l’absence',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Leaves under the Employment Standards Act, 2000 — sick, family responsibility, bereavement and the rest — are protected, and reprisal for taking one is prohibited. The evidence an employer may require for a statutory leave is limited and has changed in recent years; confirm what applies before asking for a note. Absence connected to a disability is a Human Rights Code matter, not a discipline matter.',
      fr: 'Les congés prévus par la Loi de 2000 sur les normes d’emploi — maladie, obligations familiales, décès et autres — sont protégés, et les représailles pour en avoir pris un sont interdites. La preuve exigible pour un congé légal est limitée et a changé ces dernières années ; vérifiez ce qui s’applique avant d’exiger un billet. Une absence liée à un handicap relève du Code des droits de la personne, non de la discipline.',
    },
    QC: {
      en: 'The Act respecting labour standards protects absences for sickness, organ or tissue donation, accident, domestic or sexual violence, and family obligations, and bars dismissal or sanction for taking them. The Charter of human rights and freedoms governs where a disability is involved.',
      fr: 'La Loi sur les normes du travail protège les absences pour maladie, don d’organes ou de tissus, accident, violence conjugale ou à caractère sexuel et obligations familiales, et interdit le congédiement ou la sanction pour les avoir prises. La Charte des droits et libertés de la personne s’applique lorsqu’un handicap est en cause.',
    },
    FED: {
      en: 'The Canada Labour Code, Part III sets the protected leaves and prohibits dismissal, suspension, demotion or discipline for taking one. Federally regulated employers should also check the medical-certificate limits in Part III before requiring evidence.',
      fr: 'Le Code canadien du travail, Partie III établit les congés protégés et interdit le congédiement, la suspension, la rétrogradation ou toute mesure disciplinaire pour les avoir pris. Les employeurs de compétence fédérale devraient aussi vérifier les limites relatives au certificat médical prévues à la Partie III avant d’exiger une preuve.',
    },
  },
  includes: [
    {
      en: 'Attendance expectations',
      fr: 'Attentes en matière de présence',
    },
    {
      en: 'How to report an absence',
      fr: 'Comment signaler une absence',
    },
    {
      en: 'Protected leaves, which this policy does not touch',
      fr: 'Congés protégés, non visés par la politique',
    },
    {
      en: 'Absence someone cannot help',
      fr: 'Absence subie',
    },
    {
      en: 'Absence someone chooses',
      fr: 'Absence choisie',
    },
    {
      en: 'Supporting evidence',
      fr: 'Preuve à l’appui',
    },
  ],
  questions: [
    {
      id: 'report_to',
      section: {
        en: 'Reporting',
        fr: 'Signalement',
      },
      label: {
        en: 'Who an absence is reported to',
        fr: 'À qui une absence est signalée',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Role or name, and how to reach them.',
        fr: 'Fonction ou nom, et coordonnées.',
      },
    },
    {
      id: 'report_when',
      section: {
        en: 'Reporting',
        fr: 'Signalement',
      },
      label: {
        en: 'When to report',
        fr: 'Quand signaler',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. before the start of the shift',
        fr: 'p. ex. avant le début du quart',
      },
    },
    {
      id: 'schedule_expectation',
      section: {
        en: 'Expectations',
        fr: 'Attentes',
      },
      label: {
        en: 'The attendance expectation',
        fr: 'L’attente en matière de présence',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Scheduled hours, any flexibility, and what counts as late.',
        fr: 'Heures prévues, souplesse applicable et ce qui constitue un retard.',
      },
    },
    {
      id: 'evidence_practice',
      section: {
        en: 'Evidence',
        fr: 'Preuve',
      },
      label: {
        en: 'When supporting evidence is asked for',
        fr: 'Quand une preuve à l’appui est demandée',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The circumstances, and what the evidence must show.',
        fr: 'Les circonstances, et ce que la preuve doit démontrer.',
      },
      hint: {
        en: 'Confirm what your jurisdiction actually permits you to require for a statutory leave — the limits are real and have changed recently.',
        fr: 'Vérifiez ce que votre juridiction vous permet réellement d’exiger pour un congé légal — les limites sont réelles et ont changé récemment.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Attendance Policy',
        fr: 'Politique de présence au travail',
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
        en: 'Work at {{org}} depends on people being where they said they would be. This policy sets out what we expect, how to tell us when you cannot make it, and how we handle absence — which is not one thing, and is not treated as one.',
        fr: 'Le travail chez {{org}} repose sur la présence des personnes là où elles se sont engagées à être. La présente politique énonce nos attentes, la façon de nous prévenir en cas d’empêchement et notre traitement des absences — qui ne forment pas un tout uniforme et ne sont pas traitées comme tel.',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{schedule_expectation}}',
        fr: '{{schedule_expectation}}',
      },
      n: 1,
      heading: {
        en: 'What we expect',
        fr: 'Ce que nous attendons',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Tell {{report_to}} {{report_when}}. Say that you will be away and roughly how long you expect to be — you do not need to say what is wrong with you. If the absence runs longer than you first thought, send an update.',
        fr: 'Prévenez {{report_to}} {{report_when}}. Indiquez que vous serez absent(e) et la durée approximative prévue — vous n’avez pas à préciser ce dont vous souffrez. Si l’absence se prolonge au-delà de ce qui était prévu, transmettez une mise à jour.',
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
        en: 'Leaves you are entitled to under {{statute}} are not absences under this policy. They are not counted, not recorded against you, and taking one will never be held against you in any decision {{org}} makes. That includes sick leave, family and bereavement leaves, and every other statutory leave. Sick leave has its own policy, and that is where its terms live.',
        fr: 'Les congés auxquels vous avez droit en vertu de {{statute}} ne constituent pas des absences au sens de la présente politique. Ils ne sont pas comptabilisés, ne sont pas consignés à votre dossier, et leur utilisation ne vous sera jamais reprochée dans quelque décision que ce soit de {{org}}. Cela vise le congé de maladie, les congés pour obligations familiales et pour décès, ainsi que tout autre congé prévu par la loi. Le congé de maladie fait l’objet de sa propre politique, où se trouvent ses modalités.',
      },
      n: 3,
      heading: {
        en: 'Protected leaves are not covered by this policy',
        fr: 'Les congés protégés ne sont pas visés',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Where absence comes from illness, injury or disability, it is not a conduct issue and is not disciplined. We will talk with you about what support or adjustment would help, and if the pattern continues we will work through it as an accommodation. If we ever reach a point where the situation cannot continue, that is a decision made on evidence, with you involved, and never as a first step.',
        fr: 'Lorsque l’absence découle d’une maladie, d’une blessure ou d’un handicap, il ne s’agit pas d’une question de conduite et elle ne fait l’objet d’aucune mesure disciplinaire. Nous discuterons avec vous du soutien ou de l’ajustement qui pourrait aider et, si la situation se maintient, nous la traiterons comme un accommodement. Si nous devions un jour conclure que la situation ne peut se poursuivre, cette décision reposera sur une preuve, avec votre participation, et ne sera jamais une première mesure.',
      },
      n: 4,
      heading: {
        en: 'Absence you cannot help',
        fr: 'Absence que vous ne pouvez éviter',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Absence you can help — not showing up without telling anyone, repeated lateness, leaving a shift uncovered — is a conduct matter and is handled the way any other conduct matter is: raised with you first, in writing if it continues, and with a chance to put it right.',
        fr: 'L’absence que vous pouvez éviter — ne pas se présenter sans prévenir, les retards répétés, laisser un quart non couvert — relève de la conduite et est traitée comme toute autre question de conduite : abordée d’abord avec vous, par écrit si elle persiste, et avec l’occasion d’y remédier.',
      },
      n: 5,
      heading: {
        en: 'Absence you can help',
        fr: 'Absence que vous pouvez éviter',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{evidence_practice}} Where we ask for something from a health professional, we are asking whether you were unable to work and for how long — not what your diagnosis is. What you give us is kept confidential and stored separately from your general personnel file.',
        fr: '{{evidence_practice}} Lorsque nous demandons un document d’un professionnel de la santé, nous cherchons à savoir si vous étiez incapable de travailler et pour quelle durée — non quel est votre diagnostic. Ce que vous nous remettez demeure confidentiel et est conservé séparément de votre dossier d’employé général.',
      },
      n: 6,
      heading: {
        en: 'Supporting evidence',
        fr: 'Preuve à l’appui',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This workplace is unionized: where the collective agreement sets attendance standards, reporting steps or a management-of-attendance process, those terms prevail over this policy.',
        fr: 'Ce milieu de travail est syndiqué : lorsque la convention collective fixe des normes de présence, des modalités de signalement ou un processus de gestion de la présence, ces dispositions ont préséance sur la présente politique.',
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
        en: 'A no-fault attendance policy that counts every absence the same way — statutory leave included — is the single most common source of reprisal and discrimination exposure in this area. Trigger points measured in occurrences do not distinguish between the two kinds of absence, and this policy deliberately does not use them.',
        fr: 'Une politique de présence sans égard à la faute, qui comptabilise toutes les absences de la même façon — congés légaux compris — est la source d’exposition aux représailles et à la discrimination la plus fréquente en la matière. Les seuils fondés sur le nombre d’occurrences ne distinguent pas les deux types d’absence, et la présente politique s’abstient délibérément d’en employer.',
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
