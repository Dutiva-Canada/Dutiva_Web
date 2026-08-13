/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT04: DocTemplate = {
  id: 'tpl_t04',
  tid: 'T04',
  key: 'employee_handbook',
  kind: 'handbook',
  category: 'policies',
  core: true,
  name: {
    en: 'Employee handbook',
    fr: 'Manuel de l’employé',
  },
  desc: {
    en: 'The consolidated guide to how the workplace runs — conduct, hours, leave, and where to get help.',
    fr: 'Le guide regroupé du fonctionnement du milieu — conduite, heures, congés et ressources.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v5',
  versionNumber: 5,
  effectiveDate: '2026-01-10',
  updatedAt: '2026-06-18',
  estMinutes: 14,
  usageCount: 63,
  statutory: [
    {
      en: 'Employment Standards Act, 2000',
      fr: 'Loi de 2000 sur les normes d’emploi',
    },
    {
      en: 'Occupational Health and Safety Act',
      fr: 'Loi sur la santé et la sécurité au travail',
    },
    {
      en: 'Human Rights Code',
      fr: 'Code des droits de la personne',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Include the written policy on disconnecting from work (ESA) if you have 25+ employees.',
      fr: 'Inclure la politique écrite sur la déconnexion (LNE) si vous comptez 25 employés et plus.',
    },
    QC: {
      en: 'Reference the LSA and psychological-harassment obligations; provide in French.',
      fr: 'Référer à la LNT et aux obligations sur le harcèlement psychologique ; fournir en français.',
    },
    FED: {
      en: 'Reflect Canada Labour Code standards and the harassment-and-violence regulations.',
      fr: 'Refléter les normes du Code canadien du travail et le règlement sur le harcèlement et la violence.',
    },
  },
  includes: [
    {
      en: 'Welcome & values',
      fr: 'Bienvenue et valeurs',
    },
    {
      en: 'Hours & pay',
      fr: 'Heures et paie',
    },
    {
      en: 'Time off & leave',
      fr: 'Congés',
    },
    {
      en: 'Conduct & respect',
      fr: 'Conduite et respect',
    },
    {
      en: 'Health & safety',
      fr: 'Santé-sécurité',
    },
    {
      en: 'Where to get help',
      fr: 'Où obtenir de l’aide',
    },
  ],
  questions: [
    {
      id: 'effective_date',
      section: {
        en: 'Basics',
        fr: 'Bases',
      },
      label: {
        en: 'Effective date',
        fr: 'Date d’entrée en vigueur',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'hr_contact',
      section: {
        en: 'Support',
        fr: 'Soutien',
      },
      label: {
        en: 'HR / people contact',
        fr: 'Contact RH / personnes',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. people@northgate.ca',
        fr: 'p. ex. personnes@northgate.ca',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Employee Handbook',
        fr: 'Manuel de l’employé',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · Effective {{effective_date}} · {{jurisdiction}}',
        fr: '{{org}} · En vigueur le {{effective_date}} · {{jurisdiction}}',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This handbook explains how {{org}} works and what we expect of each other. It sits alongside — and never below — the minimum standards for {{jurisdiction}}.',
        fr: 'Ce manuel explique le fonctionnement de {{org}} et nos attentes mutuelles. Il complète — sans jamais réduire — les normes minimales pour {{jurisdiction}}.',
      },
      n: 1,
      heading: {
        en: 'Welcome',
        fr: 'Bienvenue',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Questions and concerns can be raised with {{hr_contact}} at any time, without fear of reprisal.',
        fr: 'Les questions et préoccupations peuvent être adressées à {{hr_contact}} en tout temps, sans crainte de représailles.',
      },
      n: 2,
      heading: {
        en: 'Getting help',
        fr: 'Obtenir de l’aide',
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
  bodyHtmlEn:
    '<h1 class="center">Employee Handbook</h1>\n<p class="center"><strong>Effective:</strong> <span class="mf">{{handbook_effective_date}}</span></p>\n<h2>Welcome</h2>\n<p>This handbook explains how <span class="mf">{{employer_legal_name}}</span> works and what we expect of each other. It sits alongside — and never below — the minimum standards set by the employment standards legislation that applies to your province. Where a specific policy (Code of Conduct, Harassment Prevention, Vacation & Leave, Remote Work) covers a topic in more detail, that policy governs the specifics; this handbook is the map.</p>\n<h2>1. Employment basics</h2>\n<p>Employees are classified as full-time, part-time, or fixed-term, as set out in their offer letter and employment agreement. Your classification determines eligibility for certain benefits and leaves.</p>\n<h2>2. Hours of work and attendance</h2>\n<p>Standard hours and overtime eligibility are set out in your employment agreement, consistent with the Employment Standards Act, 2000, ss. 17–22. Please notify your manager as early as possible if you cannot attend as scheduled.</p>\n<h2>3. Compensation and pay</h2>\n<p>Pay dates, deductions, and how to raise a pay question are posted at <span class="mf">{{payroll_info_url}}</span>. Wage statements are provided each pay period as required by ESA s. 12.</p>\n<h2>4. Vacation and leaves</h2>\n<p>Vacation, sick leave, and statutory job-protected leaves are governed by our Vacation & Leave Policy, which meets or exceeds ESA ss. 33–50.1. See <span class="mf">{{policy_hub_url}}</span> for the current version.</p>\n<h2>5. Workplace conduct</h2>\n<p>Our Code of Conduct sets the standard for honesty, respect, conflicts of interest, and use of company property. Everyone — employees, contractors, and leaders alike — is expected to know and follow it.</p>\n<h2>6. Health and safety</h2>\n<p>We are committed to a safe workplace under the Occupational Health and Safety Act, R.S.O. 1990, c. O.1. You have the right to know about workplace hazards, to participate in health and safety activities, and to refuse unsafe work. Report hazards or incidents to <span class="mf">{{hs_contact_name}}</span> immediately.</p>\n<h2>7. Harassment, discrimination and violence prevention</h2>\n<p>Our Workplace Harassment, Discrimination and Violence Prevention Policy sets out prohibited conduct, how to report a concern, and how we investigate, consistent with OHSA ss. 32.0.1–32.0.8 and the Human Rights Code, R.S.O. 1990, c. H.19.</p>\n<h2>8. Privacy and confidentiality</h2>\n<p>We collect and use personal information only for legitimate business purposes, consistent with PIPEDA (federal baseline) and, in Québec, Law 25. Confidential business information must be protected during and after your employment.</p>\n<h2>9. Technology and electronic monitoring</h2>\n<p>Company systems are provided for business use. Where required by ESA s. 41.1.1 (employers with 25+ employees), our Electronic Monitoring Policy describes what is monitored and why; ask <span class="mf">{{it_contact_name}}</span> for details.</p>\n<h2>10. Progressive discipline</h2>\n<p>Where performance or conduct concerns arise, we generally follow a progressive approach — informal conversation, written warning, and, where necessary, further action up to termination — assessed contextually in accordance with <em>McKinley v. BC Tel</em>, 2001 SCC 38.</p>\n<h2>11. Termination and resignation</h2>\n<p>Termination entitlements follow the Employment Standards Act, 2000 and your employment agreement. If you resign, please provide notice consistent with your role and let <span class="mf">{{hr_contact_name}}</span> know as soon as possible so we can plan a smooth handover.</p>\n<h2>12. Changes to this handbook</h2>\n<p>This handbook is reviewed at least annually and may be updated to reflect changes in the law or our practices. Where a legislated minimum changes, the statutory minimum applies automatically even before a formal update. The current version is always available at <span class="mf">{{policy_hub_url}}</span>.</p>\n<h2>13. Acknowledgement</h2>\n<p><strong>Acknowledgement of receipt.</strong> My signature below confirms that I have received, read, and understand this handbook, and that I know where to go with questions.</p>\n<div class="spacer">&nbsp;</div>\n<table class="sig"><tr>\n<td><div class="sig-line">_______________________________</div><div class="sig-under">Signature — <span class="mf">{{employee_name}}</span></div><div class="sig-under"><span class="mf">{{employee_position}}</span></div><div class="sig-under">Date: <span class="mf">{{employee_signature_date}}</span></div><div class="sig-label">EMPLOYEE — ACKNOWLEDGED</div></td>\n</tr></table>',
}
