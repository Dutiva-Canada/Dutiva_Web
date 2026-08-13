/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT09: DocTemplate = {
  id: 'tpl_t09',
  tid: 'T09',
  key: 'quebec_offer_letter',
  kind: 'letter',
  category: 'hiring',
  core: true,
  name: {
    en: 'Québec offer letter',
    fr: 'Lettre d’offre — Québec',
  },
  desc: {
    en: 'An offer letter tuned to Québec: French-language default, LSA terms, and Civil Code framing.',
    fr: 'Une lettre d’offre adaptée au Québec : français par défaut, conditions de la LNT et cadre du Code civil.',
  },
  jurisdictions: ['QC'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v2',
  versionNumber: 2,
  effectiveDate: '2026-03-01',
  updatedAt: '2026-06-12',
  estMinutes: 7,
  usageCount: 19,
  statutory: [
    {
      en: 'Act respecting labour standards (LSA)',
      fr: 'Loi sur les normes du travail (LNT)',
    },
    {
      en: 'Charter of the French language (Bill 96)',
      fr: 'Charte de la langue française (Loi 96)',
    },
    {
      en: 'Civil Code of Québec',
      fr: 'Code civil du Québec',
    },
  ],
  jurisdictionNotes: {
    QC: {
      en: 'The offer must be available in French; an English version requires the employee’s express wish. LSA minimums apply.',
      fr: 'L’offre doit être disponible en français ; une version anglaise requiert la volonté expresse de l’employé. Les minimums de la LNT s’appliquent.',
    },
  },
  includes: [
    {
      en: 'Position and supervisor',
      fr: 'Poste et supérieur',
    },
    {
      en: 'Date and location',
      fr: 'Date et lieu',
    },
    {
      en: 'Compensation (LSA)',
      fr: 'Rémunération (LNT)',
    },
    {
      en: 'Vacation (LSA)',
      fr: 'Vacances (LNT)',
    },
    {
      en: 'Working language',
      fr: 'Langue de travail',
    },
    {
      en: 'Acceptance',
      fr: 'Acceptation',
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
        en: 'e.g. Léa Tremblay',
        fr: 'p. ex. Léa Tremblay',
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
        en: 'e.g. Gestionnaire de comptes',
        fr: 'p. ex. gestionnaire de comptes',
      },
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
        en: 'e.g. 74,000',
        fr: 'p. ex. 74 000',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Offer of Employment (Québec)',
        fr: 'Offre d’emploi (Québec)',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · Québec',
        fr: '{{org}} · {{today}} · Québec',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Dear {{candidate_name}}, we offer you the position of {{position_title}}, beginning {{start_date}}, at an annual salary of ${{annual_salary}} CAD.',
        fr: 'Cher/Chère {{candidate_name}}, nous vous offrons le poste de {{position_title}}, débutant le {{start_date}}, au salaire annuel de {{annual_salary}} $ CAD.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'French is the language of work. This offer is provided in French; an English version is available at your express request.',
        fr: 'Le français est la langue de travail. La présente offre est fournie en français ; une version anglaise est disponible sur demande expresse.',
      },
      n: 1,
      heading: {
        en: 'Language of work',
        fr: 'Langue de travail',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Vacation, notice, and leaves meet or exceed the Act respecting labour standards.',
        fr: 'Les vacances, l’avis et les congés atteignent ou dépassent la Loi sur les normes du travail.',
      },
      n: 2,
      heading: {
        en: 'Standards (LSA)',
        fr: 'Normes (LNT)',
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
    '<p class="date"><span class="mf">{{document_date}}</span></p>\n<address><span class="mf">{{employee_name}}</span><br><span class="mf">{{employee_address_line_1}}</span><br><span class="mf">{{employee_address_line_2}}</span></address>\n<p class="re"><strong>Re:</strong> Offer of employment — <span class="mf">{{position_title}}</span> (Québec)</p>\n<p>Dear <span class="mf">{{employee_first_name}}</span>,</p>\n<blockquote><strong>Important notice about language.</strong> Under the Charter of the French Language, CQLR c C-11, s. 41 (as amended by S.Q. 2022, c. 14, "Bill 96"), the French version of this offer is the binding version of the document. This English version is provided as a courtesy to help you read and understand the offer. If there is any inconsistency between the two, the French text prevails. You have received both versions at the same time and the same terms are offered to you in each language.</blockquote>\n<p>We are delighted to offer you the position of <strong><span class="mf">{{position_title}}</span></strong> at <strong><span class="mf">{{employer_legal_name}}</span></strong> (the <strong>Company</strong>), based in the Province of Québec. This letter sets out the main terms of our offer. Please review it carefully and, if everything looks right, sign and return a copy by <strong><span class="mf">{{offer_expiry_date}}</span></strong>.</p>\n<h2>1. Your role and start date</h2>\n<p>You will report to <strong><span class="mf">{{manager_name}}</span></strong>, <strong><span class="mf">{{manager_title}}</span></strong>, and your primary duties are set out in the attached job description. Your first day will be <strong><span class="mf">{{start_date}}</span></strong>, and you will be based at <strong><span class="mf">{{work_location}}</span></strong>.</p>\n<h2>2. Compensation</h2>\n<p>Your starting base salary will be <strong><span class="mf">{{annual_base_salary}}</span></strong> per year, paid <strong><span class="mf">{{pay_frequency}}</span></strong> by direct deposit, less statutory deductions. You will also be eligible for <strong><span class="mf">{{variable_comp_description}}</span></strong>, subject to the terms of the applicable plan.</p>\n<h2>3. Vacation, holidays and leaves</h2>\n<p>You will receive <strong><span class="mf">{{vacation_weeks}}</span></strong> weeks of paid vacation per year, in addition to the statutory holidays prescribed by the <strong>Act respecting Labour Standards</strong>, CQLR c N-1.1 (the <strong>ARLS</strong>). After three years of service, you will be entitled to three weeks or 6% (ARLS art. 68). You are entitled to all leaves of absence prescribed by the ARLS (including parental under the Régime québécois d\'assurance parentale, family obligations, sick and personal leave under ARLS art. 79.1, bereavement and domestic-violence leaves), without fear of retaliation.</p>\n<h2>4. Overtime and working hours</h2>\n<p>Your regular hours will be a maximum of <strong>40 hours per week</strong>. Overtime is payable at 1.5× for hours worked beyond 40 per week (ARLS art. 55). Québec also recognizes a right to refuse overtime in certain family-status situations (ARLS art. 59.0.1).</p>\n<h2>5. Benefits and wellbeing</h2>\n<p>You will have access to the Company\'s <strong><span class="mf">{{benefits_plan_name}}</span></strong> group benefits plan (health, dental, life and disability coverage) starting <strong><span class="mf">{{benefits_start_date}}</span></strong>. You will also have access to our Employee and Family Assistance Program. We believe wellbeing isn\'t a perk — it\'s part of doing good work.</p>\n<h2>6. Probation</h2>\n<p>The first <strong><span class="mf">{{probation_length}}</span></strong> of your employment will be a probationary period. During this period, either party may end the employment on the minimum notice required by the ARLS.</p>\n<h2>7. Ending the employment</h2>\n<p>If employment ends, you will receive at least the notice (or indemnity in lieu) and any other amounts required by the ARLS, including: (a) notice under ARLS art. 82 based on your years of service (1–2 weeks per year for 1–2 years; 2 weeks per year for 3+ years); (b) where applicable, protection against dismissal without just and sufficient cause for employees with two or more years of service under ARLS art. 124; and (c) final wages within 72 hours as required by ARLS art. 82.1. You will be paid for accrued vacation in your final pay.</p>\n<h2>8. Confidentiality and intellectual property</h2>\n<p>As a condition of employment, you agree to keep the Company\'s confidential information confidential both during and after your employment, and that any work product created in the course of your role belongs to the Company. The full terms are in your employment agreement, which will be provided alongside this offer.</p>\n<h2>9. Pay equity and language obligations</h2>\n<p>The salary offered complies with the Company\'s pay equity plan under the Act respecting pay equity, CQLR c E-12.001. This offer is provided in French as the primary version in accordance with the Charter of the French Language, art. 41.</p>\n<h2>10. Conditions</h2>\n<p>This offer is conditional on: (a) your ability to legally work in Canada; (b) satisfactory completion of the background checks we have described to you; and (c) your signature of the employment agreement and related policies by <strong><span class="mf">{{start_date}}</span></strong>.</p>\n<p>If you would like to accept, please sign the French version of this letter and return it to <strong><span class="mf">{{hr_contact_name}}</span></strong> at <strong><span class="mf">{{hr_contact_email}}</span></strong> by <strong><span class="mf">{{offer_expiry_date}}</span></strong>. If you have any questions, please reach out — we are happy to walk through anything with you.</p>\n<p class="signoff-closing">Warmly,</p><p class="signoff-name"><span class="mf">{{employer_signer_name}}</span></p><p class="signoff-line"><span class="mf">{{employer_signer_title}}</span></p><p class="signoff-line"><span class="mf">{{employer_legal_name}}</span></p>',
}
