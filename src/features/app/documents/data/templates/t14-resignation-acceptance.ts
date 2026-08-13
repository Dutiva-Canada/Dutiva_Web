/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT14: DocTemplate = {
  id: 'tpl_t14',
  tid: 'T14',
  key: 'resignation_acceptance',
  kind: 'letter',
  category: 'termination',
  core: true,
  name: {
    en: 'Resignation acceptance',
    fr: 'Acceptation de démission',
  },
  desc: {
    en: 'Confirms an employee’s resignation, the last day, and final-pay logistics — closing the record cleanly.',
    fr: 'Confirme la démission d’un employé, le dernier jour et la paie finale — pour clore le dossier proprement.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v2',
  versionNumber: 2,
  effectiveDate: '2026-02-01',
  updatedAt: '2026-05-05',
  estMinutes: 5,
  usageCount: 33,
  statutory: [
    {
      en: 'ESA, 2000 — final pay & vacation payout',
      fr: 'LNE, 2000 — paie finale et vacances',
    },
    {
      en: 'Record of Employment obligations',
      fr: 'Obligations du relevé d’emploi',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Pay all earned wages and accrued vacation by the ESA deadline; issue the ROE.',
      fr: 'Verser tous les salaires gagnés et les vacances accumulées dans le délai LNE ; émettre le relevé d’emploi.',
    },
    QC: {
      en: 'Provide the final pay and the relevé d’emploi promptly per LSA and federal EI rules.',
      fr: 'Fournir la paie finale et le relevé d’emploi rapidement selon la LNT et l’assurance-emploi.',
    },
    FED: {
      en: 'Follow Canada Labour Code final-pay timing and issue the ROE.',
      fr: 'Suivre les délais de paie finale du CCT et émettre le relevé d’emploi.',
    },
  },
  includes: [
    {
      en: 'Acknowledgement',
      fr: 'Accusé de réception',
    },
    {
      en: 'Last day of work',
      fr: 'Dernier jour',
    },
    {
      en: 'Final pay & vacation',
      fr: 'Paie finale et vacances',
    },
    {
      en: 'Return of property',
      fr: 'Retour des biens',
    },
    {
      en: 'Thanks & reference',
      fr: 'Remerciements et référence',
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
      placeholder: {
        en: 'Full name',
        fr: 'Nom complet',
      },
    },
    {
      id: 'last_day',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Last day of work',
        fr: 'Dernier jour de travail',
      },
      type: 'date',
      required: true,
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Acceptance of Resignation',
        fr: 'Acceptation de démission',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}}',
        fr: '{{org}} · {{today}}',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Dear {{employee_name}}, we acknowledge and accept your resignation. Your last day of work will be {{last_day}}.',
        fr: 'Cher/Chère {{employee_name}}, nous accusons réception et acceptons votre démission. Votre dernier jour sera le {{last_day}}.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Your final pay will include all earned wages and accrued vacation, issued within the timeframe required for {{jurisdiction}}. We will provide your Record of Employment.',
        fr: 'Votre paie finale comprendra tous les salaires gagnés et les vacances accumulées, dans le délai exigé pour {{jurisdiction}}. Nous fournirons votre relevé d’emploi.',
      },
      n: 1,
      heading: {
        en: 'Final pay',
        fr: 'Paie finale',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Thank you for your contributions. We would be glad to provide a reference.',
        fr: 'Merci de vos contributions. Nous serions heureux de fournir une référence.',
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
    '<h1 class="center">Acceptance of Resignation</h1>\n<p class="date"><span class="mf">{{document_date}}</span></p>\n<address><span class="mf">{{employee_name}}</span><br><span class="mf">{{employee_address_line_1}}</span><br><span class="mf">{{employee_address_line_2}}</span></address>\n<p class="re"><strong>Re:</strong> Acknowledgement of your resignation</p>\n<p>Dear <span class="mf">{{employee_first_name}}</span>,</p>\n<p>Thank you for letting us know about your decision to resign from your position as <strong><span class="mf">{{position_title}}</span></strong> at <strong><span class="mf">{{employer_legal_name}}</span></strong>. We received your notice on <span class="mf">{{resignation_notice_date}}</span>, and this letter confirms what we have agreed.</p>\n<h2>1. Your last day of work</h2>\n<p>Your last day of active employment will be <span class="mf">{{last_day_of_work}}</span>. We have accepted this date as your effective resignation date.</p>\n<h2>2. Final pay and vacation</h2>\n<p>Your final pay, including any wages owing up to and including <span class="mf">{{last_day_of_work}}</span>, plus vacation pay accrued but not yet taken, will be deposited no later than your next regular pay date (ESA s. 11).</p>\n<h2>3. Benefits and group insurance</h2>\n<p>Your participation in the Company\'s group benefits plan will continue until <span class="mf">{{benefits_end_date}}</span>. After that date, you may be eligible to convert certain coverages to an individual policy without a medical exam.</p>\n<h2>4. Return of Company property</h2>\n<p>Please return any Company property in your possession on or before your last day — including your laptop, access card, phone, keys, and any physical or electronic files containing Company information.</p>\n<h2>5. Record of Employment</h2>\n<p>Your Record of Employment (ROE) will be issued electronically to Service Canada within 5 calendar days of your last day of work, in accordance with the Employment Insurance Regulations, SOR/96-332.</p>\n<h2>6. Ongoing obligations</h2>\n<p>Confidentiality and any intellectual property assignment obligations under your employment agreement continue to apply after your last day.</p>\n<h2>7. Knowledge transfer</h2>\n<p>Between now and your last day, we\'d appreciate your help with a handover of your active projects. Your manager, <span class="mf">{{manager_name}}</span>, will work with you on a simple plan.</p>\n<h2>8. References and future contact</h2>\n<p>We\'re happy to provide a professional reference. Please direct reference requests to <span class="mf">{{reference_contact_name}}</span> at <span class="mf">{{reference_contact_email}}</span>.</p>\n<h2>9. Thank you</h2>\n<p>Thank you for everything you\'ve contributed during your time with us. We wish you the very best in what comes next.</p>\n<p class="signoff-closing">With appreciation,</p>\n<p class="signoff-name"><span class="mf">{{employer_signer_name}}</span></p>\n<p class="signoff-line"><span class="mf">{{employer_signer_title}}</span></p>\n<p class="signoff-line"><span class="mf">{{employer_legal_name}}</span></p>',
}
