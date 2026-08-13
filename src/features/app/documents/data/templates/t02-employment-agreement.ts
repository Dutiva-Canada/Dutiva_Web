/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT02: DocTemplate = {
  id: 'tpl_t02',
  tid: 'T02',
  key: 'employment_agreement',
  kind: 'agreement',
  category: 'hiring',
  core: true,
  name: {
    en: 'Employment agreement (indefinite term)',
    fr: 'Contrat de travail (durée indéterminée)',
  },
  desc: {
    en: 'A full indefinite-term contract. The termination clause is the highest-exposure section — drafted with Waksdale in mind.',
    fr: 'Un contrat complet à durée indéterminée. La clause de cessation est la section la plus exposée — rédigée en tenant compte de l’arrêt Waksdale.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v3',
  versionNumber: 3,
  effectiveDate: '2026-04-10',
  updatedAt: '2026-06-18',
  estMinutes: 12,
  usageCount: 74,
  statutory: [
    {
      en: 'Employment Standards Act, 2000 / Canada Labour Code',
      fr: 'Loi de 2000 sur les normes d’emploi / Code canadien du travail',
    },
    {
      en: 'Waksdale v. Swegon, 2020 ONCA 391',
      fr: 'Waksdale c. Swegon, 2020 ONCA 391',
    },
    {
      en: 'McKinley v. BC Tel, 2001 SCC 38',
      fr: 'McKinley c. BC Tel, 2001 CSC 38',
    },
    {
      en: 'Meiorin — BC v. BCGSEU, 1999',
      fr: 'Meiorin — C.-B. c. BCGSEU, 1999',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'A termination clause must clearly meet or exceed ESA minimums, or a court may award common-law notice instead (Waksdale).',
      fr: 'La clause de cessation doit atteindre ou dépasser les minimums de la LNE, sinon le préavis de common law s’applique (Waksdale).',
    },
    QC: {
      en: 'Québec is civil law; the Civil Code governs notice and good faith. Restrictive covenants are read narrowly.',
      fr: 'Le Québec est de droit civil ; le Code civil régit l’avis et la bonne foi. Les clauses restrictives sont interprétées restrictivement.',
    },
    FED: {
      en: 'Unjust-dismissal protection under CLC s. 240 may apply after 12 months of continuous service.',
      fr: 'La protection contre le congédiement injuste (CCT art. 240) peut s’appliquer après 12 mois de service continu.',
    },
  },
  includes: [
    {
      en: 'Parties & role',
      fr: 'Parties et poste',
    },
    {
      en: 'Start date & type',
      fr: 'Date et type',
    },
    {
      en: 'Place of work & hours',
      fr: 'Lieu et heures',
    },
    {
      en: 'Compensation',
      fr: 'Rémunération',
    },
    {
      en: 'Vacation & benefits',
      fr: 'Vacances et avantages',
    },
    {
      en: 'Confidentiality & IP',
      fr: 'Confidentialité et PI',
    },
    {
      en: 'Termination',
      fr: 'Cessation',
    },
    {
      en: 'Restrictive covenants',
      fr: 'Clauses restrictives',
    },
    {
      en: 'Governing law',
      fr: 'Loi applicable',
    },
  ],
  questions: [
    {
      id: 'employee_name',
      section: {
        en: 'Parties',
        fr: 'Parties',
      },
      label: {
        en: 'Employee full name',
        fr: 'Nom complet de l’employé(e)',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'Full legal name',
        fr: 'Nom légal complet',
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
        en: 'e.g. Account manager',
        fr: 'p. ex. gestionnaire de comptes',
      },
    },
    {
      id: 'start_date',
      section: {
        en: 'Term',
        fr: 'Durée',
      },
      label: {
        en: 'Start date',
        fr: 'Date de début',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'scheduled_hours_per_week',
      section: {
        en: 'Hours',
        fr: 'Heures',
      },
      label: {
        en: 'Scheduled hours per week',
        fr: 'Heures prévues par semaine',
      },
      type: 'number',
      required: true,
      placeholder: {
        en: '40',
        fr: '40',
      },
    },
    {
      id: 'annual_base_salary',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Annual base salary (CAD)',
        fr: 'Salaire de base annuel (CAD)',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. 82,000',
        fr: 'p. ex. 82 000',
      },
    },
    {
      id: 'vacation_weeks',
      section: {
        en: 'Compensation',
        fr: 'Rémunération',
      },
      label: {
        en: 'Vacation (weeks)',
        fr: 'Vacances (semaines)',
      },
      type: 'number',
      required: true,
      placeholder: {
        en: '3',
        fr: '3',
      },
    },
    {
      id: 'termination_basis',
      section: {
        en: 'Termination',
        fr: 'Cessation',
      },
      label: {
        en: 'Termination clause basis',
        fr: 'Base de la clause de cessation',
      },
      type: 'radio',
      required: true,
      hint: {
        en: 'Statutory-only limits exposure but must be drafted precisely.',
        fr: 'Le minimum légal limite l’exposition mais doit être rédigé précisément.',
      },
      options: [
        {
          value: 'statutory minimum',
          label: {
            en: 'Statutory minimum only',
            fr: 'Minimum légal seulement',
          },
        },
        {
          value: 'enhanced',
          label: {
            en: 'Enhanced (above minimum)',
            fr: 'Bonifié (au-dessus du minimum)',
          },
        },
      ],
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Employment Agreement',
        fr: 'Contrat de travail',
      },
    },
    {
      type: 'para',
      text: {
        en: 'This Employment Agreement is entered into on {{today}} between {{org}} (the Employer) and {{employee_name}} (the Employee).',
        fr: 'Le présent contrat de travail est conclu le {{today}} entre {{org}} (l’Employeur) et {{employee_name}} (l’Employé(e)).',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Employee is engaged as {{position_title}}, effective {{start_date}}, on an indefinite-term basis, working {{scheduled_hours_per_week}} hours per week.',
        fr: 'L’employé(e) est engagé(e) à titre de {{position_title}}, à compter du {{start_date}}, pour une durée indéterminée, à raison de {{scheduled_hours_per_week}} heures par semaine.',
      },
      n: 1,
      heading: {
        en: 'Position & start',
        fr: 'Poste et début',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Base salary is ${{annual_base_salary}} CAD per year, less statutory deductions, with {{vacation_weeks}} weeks of paid vacation — never below the minimum for {{jurisdiction}}.',
        fr: 'Le salaire de base est de {{annual_base_salary}} $ CAD par année, moins les retenues légales, avec {{vacation_weeks}} semaines de vacances payées — jamais sous le minimum pour {{jurisdiction}}.',
      },
      n: 2,
      heading: {
        en: 'Compensation & vacation',
        fr: 'Rémunération et vacances',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'On a without-cause termination, the Employee receives entitlements on the {{termination_basis}} basis, never less than the minimums required for {{jurisdiction}}. If any part would provide less, that part is void and the statutory minimum applies.',
        fr: 'En cas de cessation sans motif, l’employé(e) reçoit ses droits sur la base {{termination_basis}}, jamais inférieurs aux minimums pour {{jurisdiction}}. Toute clause offrant moins est nulle et le minimum légal s’applique.',
      },
      n: 3,
      heading: {
        en: 'Ending the employment',
        fr: 'Fin de l’emploi',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Confidential information and work product created in the role belong to {{org}}.',
        fr: 'Les renseignements confidentiels et les livrables créés dans le cadre du poste appartiennent à {{org}}.',
      },
      n: 4,
      heading: {
        en: 'Confidentiality & IP',
        fr: 'Confidentialité et PI',
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
  subject: 'employee',
  bodyHtmlEn:
    '<h1 class="center">Employment Agreement</h1>\n<p>This Employment Agreement (the <strong>Agreement</strong>) is made on <span class="mf">{{agreement_date}}</span>.</p>\n<h2>Between</h2>\n<p><strong><span class="mf">{{employer_legal_name}}</span></strong>, with its principal office at <span class="mf">{{employer_address}}</span> (the <strong>Company</strong>),</p>\n<p>— and —</p>\n<p><strong><span class="mf">{{employee_name}}</span></strong>, of <span class="mf">{{employee_address}}</span> (the <strong>Employee</strong>).</p>\n<h2>1. Position and reporting</h2>\n<p>The Employee is engaged as <span class="mf">{{position_title}}</span>, effective <span class="mf">{{start_date}}</span>, on an indefinite-term basis, reporting to <span class="mf">{{manager_name}}</span>. The Employee will perform the duties normally associated with the role and any other reasonable duties assigned by the Company.</p>\n<h2>2. Compensation</h2>\n<p>Base salary is <span class="mf">{{annual_base_salary}}</span> CAD per year, paid <span class="mf">{{pay_frequency}}</span>, less statutory deductions, reviewed at the Company\'s discretion.</p>\n<h2>3. Hours of work and overtime</h2>\n<p>Scheduled hours are <span class="mf">{{scheduled_hours_per_week}}</span> per week. Overtime, where applicable, is paid in accordance with the Employment Standards Act, 2000, s. 22.</p>\n<h2>4. Vacation and statutory holidays</h2>\n<p>The Employee is entitled to <span class="mf">{{vacation_weeks}}</span> weeks of paid vacation per year, never below the minimum required by ESA ss. 33–35.2, plus all statutory public holidays.</p>\n<h2>5. Benefits and expenses</h2>\n<p>The Employee is eligible for the Company\'s group benefits plan on the terms set out in the plan documents, and will be reimbursed for reasonable, pre-approved business expenses incurred in the performance of their duties.</p>\n<h2>6. Confidentiality and intellectual property</h2>\n<p>The Employee will keep the Company\'s confidential information confidential during and after employment. All work product created in the course of the role belongs to the Company, including copyright and other intellectual property rights, to the fullest extent permitted by law.</p>\n<h2>7. Termination</h2>\n<p>On a without-cause termination, the Employee will receive the greater of the notice (or pay in lieu) and severance, if applicable, required by the Employment Standards Act, 2000, ss. 54–65, or <span class="mf">{{enhanced_notice_description}}</span>. If any part of this clause would provide less than the statutory minimum in the circumstances at the time notice is given, that part is void and the statutory minimum governs instead, consistent with <em>Waksdale v. Swegon</em>, 2020 ONCA 391. The Company may terminate the Employee\'s employment for just cause without notice or pay in lieu, assessed contextually in accordance with <em>McKinley v. BC Tel</em>, 2001 SCC 38.</p>\n<h2>8. Return of property</h2>\n<p>On the end of employment for any reason, the Employee will promptly return all Company property, including devices, access cards, keys, and any physical or electronic materials containing Company information.</p>\n<h2>9. Restrictive covenants</h2>\n<p>The Employee\'s non-solicitation and (where lawful) non-competition obligations are set out in the Company\'s standard Restrictive Covenants Agreement, incorporated by reference. Non-competition applies only where permitted under ESA s. 67.2 (executive or sale-of-business exceptions); for all other employees in Ontario, no non-compete applies.</p>\n<h2>10. General</h2>\n<p>This Agreement is governed by the laws of the Province of <span class="mf">{{governing_province}}</span>. It is the entire agreement between the parties concerning its subject matter and may only be amended in writing signed by both parties. The Employee confirms having had the opportunity to obtain independent legal advice before signing.</p>\n<p>By signing below, the parties confirm they have read and accept the terms of this Agreement.</p>\n<div class="spacer">&nbsp;</div>\n<table class="sig"><tr>\n<td><div class="sig-line">_______________________________</div><div class="sig-under">Signature — <span class="mf">{{employer_signer_name}}</span></div><div class="sig-under"><span class="mf">{{employer_signer_title}}</span></div><div class="sig-under">Date: <span class="mf">{{employer_signature_date}}</span></div><div class="sig-label">COMPANY</div></td>\n<td><div class="sig-line">_______________________________</div><div class="sig-under">Signature — <span class="mf">{{employee_name}}</span></div><div class="sig-under"><span class="mf">{{employee_position}}</span></div><div class="sig-under">Date: <span class="mf">{{employee_signature_date}}</span></div><div class="sig-label">EMPLOYEE</div></td>\n</tr></table>',
}
