/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT01: DocTemplate = {
  id: 'tpl_t01',
  tid: 'T01',
  key: 'offer_letter',
  kind: 'letter',
  category: 'hiring',
  core: true,
  name: {
    en: 'Offer of employment letter',
    fr: 'Lettre d’offre d’emploi',
  },
  desc: {
    en: 'A conditional written offer setting out role, pay, start date, and the core terms of employment.',
    fr: 'Une offre écrite conditionnelle : poste, rémunération, date d’entrée en fonction et conditions essentielles.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v4',
  versionNumber: 4,
  effectiveDate: '2026-05-01',
  updatedAt: '2026-06-18',
  estMinutes: 6,
  usageCount: 128,
  statutory: [
    {
      en: 'Employment Standards Act, 2000 — minimum standards',
      fr: 'Loi de 2000 sur les normes d’emploi — normes minimales',
    },
    {
      en: 'Human Rights Code — non-discrimination in hiring',
      fr: 'Code des droits de la personne — non-discrimination à l’embauche',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Terms may not fall below ESA, 2000 minimums; a non-compliant termination clause can void the clause entirely.',
      fr: 'Les conditions ne peuvent être sous les minimums de la LNE ; une clause de cessation non conforme peut être invalidée.',
    },
    QC: {
      en: 'Reflect the Act respecting labour standards; probation does not remove Civil Code notice obligations.',
      fr: 'Refléter la Loi sur les normes du travail ; la probation ne supprime pas les obligations d’avis du Code civil.',
    },
    FED: {
      en: 'Federally regulated employers follow the Canada Labour Code, Part III for notice, hours, and vacation.',
      fr: 'Les employeurs fédéraux suivent le Code canadien du travail, Partie III.',
    },
  },
  includes: [
    {
      en: 'Position & reporting',
      fr: 'Poste et lien hiérarchique',
    },
    {
      en: 'Start date & location',
      fr: 'Date et lieu',
    },
    {
      en: 'Compensation',
      fr: 'Rémunération',
    },
    {
      en: 'Hours of work',
      fr: 'Heures de travail',
    },
    {
      en: 'Vacation & benefits',
      fr: 'Vacances et avantages',
    },
    {
      en: 'Probation',
      fr: 'Probation',
    },
    {
      en: 'Termination',
      fr: 'Cessation',
    },
    {
      en: 'Conditional offer & acceptance',
      fr: 'Offre conditionnelle et acceptation',
    },
  ],
  questions: [
    {
      id: 'candidate_name',
      section: {
        en: 'Candidate',
        fr: 'Candidat',
      },
      label: {
        en: 'Candidate full name',
        fr: 'Nom complet du candidat',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. Gabriel Dubois',
        fr: 'p. ex. Gabriel Dubois',
      },
    },
    {
      id: 'position_title',
      section: {
        en: 'Role',
        fr: 'Poste',
      },
      label: {
        en: 'Position title',
        fr: 'Titre du poste',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. Field technician',
        fr: 'p. ex. technicien de terrain',
      },
    },
    {
      id: 'manager_name',
      section: {
        en: 'Role',
        fr: 'Poste',
      },
      label: {
        en: 'Reports to',
        fr: 'Relève de',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. Operations Manager',
        fr: 'p. ex. directeur des opérations',
      },
    },
    {
      id: 'employment_type',
      section: {
        en: 'Role',
        fr: 'Poste',
      },
      label: {
        en: 'Employment type',
        fr: 'Type d’emploi',
      },
      type: 'radio',
      required: true,
      options: [
        {
          value: 'full-time',
          label: {
            en: 'Full-time',
            fr: 'Temps plein',
          },
        },
        {
          value: 'part-time',
          label: {
            en: 'Part-time',
            fr: 'Temps partiel',
          },
        },
      ],
    },
    {
      id: 'start_date',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Start date',
        fr: 'Date d’entrée en fonction',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'work_location',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Primary work location',
        fr: 'Lieu de travail principal',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. Ottawa, ON (hybrid)',
        fr: 'p. ex. Ottawa (ON), hybride',
      },
    },
    {
      id: 'annual_salary',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Annual salary (CAD)',
        fr: 'Salaire annuel (CAD)',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. 68,000',
        fr: 'p. ex. 68 000',
      },
    },
    {
      id: 'vacation_weeks',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Vacation',
        fr: 'Vacances',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: '2 weeks',
          label: {
            en: '2 weeks (statutory minimum)',
            fr: '2 semaines (minimum légal)',
          },
        },
        {
          value: '3 weeks',
          label: {
            en: '3 weeks',
            fr: '3 semaines',
          },
        },
        {
          value: '4 weeks',
          label: {
            en: '4 weeks',
            fr: '4 semaines',
          },
        },
      ],
    },
    {
      id: 'probation',
      section: {
        en: 'Terms',
        fr: 'Conditions',
      },
      label: {
        en: 'Probationary period',
        fr: 'Période de probation',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'no',
          label: {
            en: 'None',
            fr: 'Aucune',
          },
        },
        {
          value: '3-month',
          label: {
            en: '3 months',
            fr: '3 mois',
          },
        },
        {
          value: '6-month',
          label: {
            en: '6 months',
            fr: '6 mois',
          },
        },
      ],
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Offer of Employment',
        fr: 'Offre d’emploi',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · {{jurisdiction}}',
        fr: '{{org}} · {{today}} · {{jurisdiction}}',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Dear {{candidate_name}}, we are pleased to offer you the position of {{position_title}}, reporting to {{manager_name}}, on a {{employment_type}} basis.',
        fr: 'Cher/Chère {{candidate_name}}, nous avons le plaisir de vous offrir le poste de {{position_title}}, relevant de {{manager_name}}, à titre {{employment_type}}.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Your employment begins on {{start_date}}. Your primary work location is {{work_location}}.',
        fr: 'Votre emploi débute le {{start_date}}. Votre lieu de travail principal est {{work_location}}.',
      },
      n: 1,
      heading: {
        en: 'Start date & location',
        fr: 'Date et lieu',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'You will earn an annual salary of ${{annual_salary}} CAD, less statutory deductions, with {{vacation_weeks}} of paid vacation at or above the minimum for {{jurisdiction}}.',
        fr: 'Vous gagnerez un salaire annuel de {{annual_salary}} $ CAD, moins les retenues légales, avec {{vacation_weeks}} de vacances payées, au moins égales au minimum pour {{jurisdiction}}.',
      },
      n: 2,
      heading: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'A {{probation}} probationary period applies. Either party may end this employment per the applicable standards for {{jurisdiction}}, including any required notice or pay in lieu.',
        fr: 'Une période de probation de {{probation}} s’applique. Chaque partie peut mettre fin à l’emploi selon les normes applicables pour {{jurisdiction}}, y compris tout avis ou indemnité en tenant lieu.',
      },
      n: 3,
      heading: {
        en: 'Probation & termination',
        fr: 'Probation et cessation',
      },
    },
    {
      type: 'para',
      text: {
        en: 'This offer is conditional on satisfactory reference and eligibility-to-work checks. To accept, sign and return by the date discussed.',
        fr: 'Cette offre est conditionnelle à des vérifications de références et d’admissibilité satisfaisantes. Pour l’accepter, signez et retournez avant la date convenue.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Because {{org}} employs 25 or more employees in Ontario, you will receive a copy of the written policy on disconnecting from work required by the Employment Standards Act, 2000.',
        fr: 'Comme {{org}} emploie 25 salariés ou plus en Ontario, vous recevrez une copie de la politique écrite sur la déconnexion exigée par la Loi de 2000 sur les normes d’emploi.',
      },
      heading: {
        en: 'Disconnecting from work',
        fr: 'Droit à la déconnexion',
      },
      when: {
        juris: 'ON',
        min_headcount: 25,
      },
    },
    {
      type: 'sig',
      roles: [
        {
          en: 'Employer representative',
          fr: 'Représentant de l’employeur',
        },
        {
          en: 'Employee',
          fr: 'Employé(e)',
        },
      ],
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
  subject: 'candidate',
  bodyHtmlEn:
    '<h1 class="center">Offer of Employment</h1>\n<p class="date"><span class="mf">{{document_date}}</span></p>\n<address><span class="mf">{{candidate_name}}</span><br><span class="mf">{{candidate_address_line_1}}</span><br><span class="mf">{{candidate_address_line_2}}</span></address>\n<p class="re"><strong>Re:</strong> Offer of employment — <span class="mf">{{position_title}}</span></p>\n<p>Dear <span class="mf">{{candidate_first_name}}</span>,</p>\n<p>We are pleased to offer you the position of <strong><span class="mf">{{position_title}}</span></strong> at <strong><span class="mf">{{employer_legal_name}}</span></strong> (the <strong>Company</strong>), reporting to <strong><span class="mf">{{manager_name}}</span></strong>. This letter sets out the principal terms of your employment. Please review it carefully and, if everything looks right, sign and return a copy by <span class="mf">{{offer_expiry_date}}</span>.</p>\n<h2>1. Start date and location</h2>\n<p>Your first day will be <span class="mf">{{start_date}}</span>, and you will be based at <span class="mf">{{work_location}}</span>. Your employment is <span class="mf">{{employment_type}}</span>.</p>\n<h2>2. Compensation</h2>\n<p>You will earn an annual base salary of <span class="mf">{{annual_base_salary}}</span> CAD, paid <span class="mf">{{pay_frequency}}</span> by direct deposit, less statutory deductions.</p>\n<h2>3. Hours of work and overtime</h2>\n<p>Your regular hours will be <span class="mf">{{scheduled_hours_per_week}}</span> hours per week. Overtime is paid in accordance with the Employment Standards Act, 2000, s. 22, at 1.5× your regular rate for hours worked beyond the statutory threshold, unless your role is exempt as a manager or supervisor under O. Reg. 285/01.</p>\n<h2>4. Vacation and statutory holidays</h2>\n<p>You will receive <span class="mf">{{vacation_weeks}}</span> weeks of paid vacation per year, meeting or exceeding the minimum required by ESA ss. 33–34. You will also be paid for all statutory public holidays recognized in your jurisdiction.</p>\n<h2>5. Benefits</h2>\n<p>You will be eligible for the Company\'s <span class="mf">{{benefits_plan_name}}</span> group benefits plan starting <span class="mf">{{benefits_start_date}}</span>, in accordance with the plan\'s terms.</p>\n<h2>6. Probationary period</h2>\n<p>The first <span class="mf">{{probation_length}}</span> of your employment is a probationary period during which your fit for the role will be assessed. Statutory notice obligations continue to apply throughout.</p>\n<h2>7. Termination</h2>\n<p>Either party may end this employment in accordance with the Employment Standards Act, 2000. On a without-cause termination, you will receive at least the notice (or pay in lieu) and severance, if applicable, required by ESA ss. 54–65. If any part of this offer would provide less than the statutory minimum, that part is void and the statutory minimum applies instead, consistent with <em>Waksdale v. Swegon</em>, 2020 ONCA 391.</p>\n<h2>8. Confidentiality and intellectual property</h2>\n<p>As a condition of employment, you agree to keep the Company\'s confidential information confidential during and after your employment, and that any work product created in the course of your role belongs to the Company. Full terms are set out in your Employment Agreement and Confidentiality Agreement, provided alongside this offer.</p>\n<h2>9. Conditions of this offer</h2>\n<p>This offer is conditional on: (a) your ability to legally work in Canada; (b) satisfactory completion of the background and reference checks we have described to you; and (c) your signature of the Employment Agreement and related policies by <span class="mf">{{start_date}}</span>.</p>\n<p>If you have any questions, please reach out — we are happy to walk through anything with you.</p>\n<p class="signoff-closing">Welcome to the team,</p>\n<p class="signoff-name"><span class="mf">{{employer_signer_name}}</span></p>\n<p class="signoff-line"><span class="mf">{{employer_signer_title}}</span></p>\n<p class="signoff-line"><span class="mf">{{employer_legal_name}}</span></p>',
}
