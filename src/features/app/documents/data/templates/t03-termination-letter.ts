/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT03: DocTemplate = {
  id: 'tpl_t03',
  tid: 'T03',
  key: 'termination_letter',
  kind: 'letter',
  category: 'termination',
  core: true,
  name: {
    en: 'Termination letter (without cause)',
    fr: 'Lettre de cessation d’emploi (sans motif)',
  },
  desc: {
    en: 'Ends employment without cause. High exposure — confirm notice, severance, and benefit continuation before sending.',
    fr: 'Met fin à l’emploi sans motif. Exposition élevée — confirmez l’avis, l’indemnité et le maintien des avantages avant l’envoi.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'high',
  review: 'lawyer_review_recommended',
  requiresLawyerReview: true,
  version: 'v3',
  versionNumber: 3,
  effectiveDate: '2026-03-12',
  updatedAt: '2026-06-16',
  estMinutes: 10,
  usageCount: 41,
  statutory: [
    {
      en: 'ESA, 2000 ss. 54–65 — notice & severance',
      fr: 'LNE, 2000 art. 54–65 — avis et indemnité',
    },
    {
      en: 'Canada Labour Code ss. 230, 235',
      fr: 'Code canadien du travail art. 230, 235',
    },
    {
      en: 'Common-law reasonable notice (outside QC)',
      fr: 'Préavis raisonnable de common law (hors QC)',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Provide the greater of ESA notice/severance or common-law notice; continue benefits through the statutory notice period.',
      fr: 'Offrir le plus élevé de l’avis/indemnité LNE ou du préavis de common law ; maintenir les avantages durant l’avis légal.',
    },
    QC: {
      en: 'The Civil Code requires reasonable notice; LSA sets minimums and prohibits dismissal without good and sufficient cause after 2 years.',
      fr: 'Le Code civil exige un avis raisonnable ; la LNT fixe des minimums et interdit le congédiement sans cause juste et suffisante après 2 ans.',
    },
    FED: {
      en: 'CLC notice (s. 230) and severance (s. 235) apply; unjust-dismissal recourse (s. 240) may apply after 12 months.',
      fr: 'L’avis (art. 230) et l’indemnité (art. 235) du CCT s’appliquent ; le recours pour congédiement injuste (art. 240) après 12 mois.',
    },
  },
  includes: [
    {
      en: 'Effective date',
      fr: 'Date d’effet',
    },
    {
      en: 'Reason (without cause)',
      fr: 'Motif (sans motif)',
    },
    {
      en: 'Notice / pay in lieu',
      fr: 'Avis / indemnité',
    },
    {
      en: 'Severance',
      fr: 'Indemnité de départ',
    },
    {
      en: 'Benefit continuation',
      fr: 'Maintien des avantages',
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
      en: 'Support resources',
      fr: 'Ressources de soutien',
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
        en: 'Full legal name',
        fr: 'Nom légal complet',
      },
    },
    {
      id: 'tenure_years',
      section: {
        en: 'Service',
        fr: 'Service',
      },
      label: {
        en: 'Years of continuous service',
        fr: 'Années de service continu',
      },
      type: 'number',
      required: true,
      placeholder: {
        en: 'e.g. 6',
        fr: 'p. ex. 6',
      },
    },
    {
      id: 'effective_date',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Termination effective date',
        fr: 'Date d’effet de la cessation',
      },
      type: 'date',
      required: true,
    },
    {
      id: 'notice_weeks',
      section: {
        en: 'Entitlements',
        fr: 'Droits',
      },
      label: {
        en: 'Notice / pay in lieu (weeks)',
        fr: 'Avis / indemnité (semaines)',
      },
      type: 'number',
      required: true,
      hint: {
        en: 'Must meet or exceed the statutory minimum for the jurisdiction.',
        fr: 'Doit atteindre ou dépasser le minimum légal de la juridiction.',
      },
    },
    {
      id: 'severance_weeks',
      section: {
        en: 'Entitlements',
        fr: 'Droits',
      },
      label: {
        en: 'Severance (weeks, if applicable)',
        fr: 'Indemnité de départ (semaines, si applicable)',
      },
      type: 'number',
      required: false,
    },
    {
      id: 'benefits_end',
      section: {
        en: 'Entitlements',
        fr: 'Droits',
      },
      label: {
        en: 'Benefits continue until',
        fr: 'Avantages maintenus jusqu’au',
      },
      type: 'date',
      required: true,
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Termination of Employment',
        fr: 'Cessation d’emploi',
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
        en: 'Dear {{employee_name}}, this letter confirms that your employment with {{org}} will end, without cause, effective {{effective_date}} after {{tenure_years}} years of service.',
        fr: 'Cher/Chère {{employee_name}}, la présente confirme que votre emploi chez {{org}} prendra fin, sans motif, le {{effective_date}}, après {{tenure_years}} ans de service.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'You will receive {{notice_weeks}} weeks of notice (or pay in lieu) plus {{severance_weeks}} weeks of severance where applicable — meeting or exceeding the minimums for {{jurisdiction}}.',
        fr: 'Vous recevrez {{notice_weeks}} semaines d’avis (ou indemnité) plus {{severance_weeks}} semaines d’indemnité de départ le cas échéant — au moins égales aux minimums pour {{jurisdiction}}.',
      },
      n: 1,
      heading: {
        en: 'Notice & severance',
        fr: 'Avis et indemnité',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Group benefits continue until {{benefits_end}}. Your final pay includes all earned wages and accrued vacation.',
        fr: 'Les avantages collectifs sont maintenus jusqu’au {{benefits_end}}. Votre paie finale comprend tous les salaires gagnés et les vacances accumulées.',
      },
      n: 2,
      heading: {
        en: 'Benefits & final pay',
        fr: 'Avantages et paie finale',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'We can provide a reference and outplacement support. Please return company property by your last day.',
        fr: 'Nous pouvons fournir une référence et un soutien au reclassement. Veuillez retourner les biens de l’entreprise au dernier jour.',
      },
      n: 3,
      heading: {
        en: 'Support',
        fr: 'Soutien',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'This workplace is unionized: the collective agreement and its grievance procedure govern this process, and this document must follow the negotiated steps and timelines.',
        fr: 'Ce milieu de travail est syndiqué : la convention collective et sa procédure de grief régissent ce processus, et le présent document doit suivre les étapes et les délais négociés.',
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
      tone: 'risk',
      text: {
        en: 'Higher-risk document. Lawyer review is recommended before this is sent or signed.',
        fr: 'Document à risque élevé. Une révision juridique est recommandée avant l’envoi ou la signature.',
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
    '<p class="date"><span class="mf">{{document_date}}</span></p>\n<address><span class="mf">{{employee_name}}</span><br><span class="mf">{{employee_address_line_1}}</span><br><span class="mf">{{employee_address_line_2}}</span></address>\n<p class="re"><strong>Re:</strong> End of your employment with <span class="mf">{{employer_legal_name}}</span></p>\n<p>Dear <span class="mf">{{employee_first_name}}</span>,</p>\n<p>This letter confirms our conversation today. We have decided to end your employment with <strong><span class="mf">{{employer_legal_name}}</span></strong> (the <strong>Company</strong>) on a without-cause basis, effective <strong><span class="mf">{{termination_effective_date}}</span></strong>. We know this is difficult news. We want to make the transition as respectful, clear and practical as we can — and this letter sets out what you can expect from us.</p>\n<h2>1. Why we\'re making this decision</h2>\n<p>The reason for ending your employment is <strong><span class="mf">{{termination_reason}}</span></strong>. This is not a decision about your character or your effort. Where appropriate, we will provide a neutral employment reference to prospective employers; please direct reference requests to <strong><span class="mf">{{reference_contact_name}}</span></strong> at <strong><span class="mf">{{reference_contact_email}}</span></strong>.</p>\n<h2>2. Your final day</h2>\n<p>Your last working day is <strong><span class="mf">{{last_working_day}}</span></strong>. After that date, you will be on a paid notice period through <strong><span class="mf">{{notice_period_end_date}}</span></strong>, during which you are not required to perform any duties unless we agree otherwise. Your employment formally ends on <strong><span class="mf">{{termination_effective_date}}</span></strong>.</p>\n<h2>3. Your separation package</h2>\n<p>In recognition of your service and in full satisfaction of the Company\'s obligations to you under your employment agreement and applicable employment standards legislation, the Company will provide the following:</p>\n<ul><li><strong>Notice of termination (or pay in lieu):</strong> <strong><span class="mf">{{notice_weeks}}</span></strong> weeks, paid at your regular base salary, less statutory deductions. This meets or exceeds the minimum notice required by ESA ss. 54–57 (the Employment Standards Act, 2000 governs your employment).</li><li><strong>Statutory severance pay:</strong> <strong><span class="mf">{{severance_weeks}}</span></strong> weeks, paid at your regular base salary, less statutory deductions, as required by ESA s. 64. 1 week per completed year of service (max 26 weeks), where employer payroll ≥ $2.5M and employee has 5+ years.</li><li><strong>Vacation pay:</strong> All accrued and unused vacation up to <strong><span class="mf">{{termination_effective_date}}</span></strong>, less statutory deductions.</li><li><strong>Benefits continuation:</strong> Your group benefits (health, dental, life and disability) will continue until <strong><span class="mf">{{benefits_end_date}}</span></strong>, which covers at least the statutory notice period. We will send you information about continuation or conversion options before that date.</li><li><strong>Outstanding business expenses:</strong> Any approved expenses you submit by <strong><span class="mf">{{expense_deadline}}</span></strong> will be reimbursed in the normal way.</li></ul>\n<p>The Company will pay your final wages, vacation pay and notice of termination no later than the employee\'s next regular pay date or earlier if required by applicable law. Your Record of Employment will be issued within the timelines required by the Employment Insurance Regulations.</p>\n<h2>4. Enhanced offer — conditional on a release</h2>\n<p>In addition to what the Company is required to provide, and to support you while you look for your next role, the Company is offering you an enhanced severance package of <strong><span class="mf">{{enhanced_severance_amount}}</span></strong>, conditional on you signing the Full and Final Release attached to this letter. You are not required to accept this enhanced package — you will still receive everything in section 3 regardless. We encourage you to obtain independent legal advice before deciding.</p>\n<p>If you wish to accept, please sign and return the Release by <strong><span class="mf">{{release_deadline}}</span></strong>. We are genuinely happy to extend that deadline if you need more time — just ask <strong><span class="mf">{{hr_contact_name}}</span></strong>.</p>\n<h2>5. Things to return</h2>\n<p>By <strong><span class="mf">{{return_property_date}}</span></strong>, please return all Company property in your possession, including laptops, phones, access cards, keys, credit cards, and any physical or electronic documents containing Company information. We will make this easy — <strong><span class="mf">{{hr_contact_name}}</span></strong> will coordinate pickup or shipping with you.</p>\n<h2>6. Ongoing obligations</h2>\n<p>Your confidentiality and intellectual property obligations under your employment agreement continue after your last day and are not affected by this letter. These obligations do not limit your right to make a protected disclosure to a regulator, to participate in a human-rights or whistleblower complaint, or to discuss your wages and working conditions with others as permitted by law.</p>\n<h2>7. Support through the transition</h2>\n<p>We know this moment is hard and we want to help. The following supports are available to you at no cost:</p>\n<ul><li><strong>Career transition support</strong> through <strong><span class="mf">{{career_transition_provider}}</span></strong>, for up to <strong><span class="mf">{{career_transition_duration}}</span></strong>.</li><li><strong>Employee and Family Assistance Program</strong> — confidential counselling for you and your family, available for <strong><span class="mf">{{eap_continuation_period}}</span></strong> after your last day.</li><li>A conversation with <strong><span class="mf">{{hr_contact_name}}</span></strong> at <strong><span class="mf">{{hr_contact_email}}</span></strong> any time you have questions about this letter, the process, or anything else.</li></ul>\n<h2>8. Your rights</h2>\n<p>This letter is provided in good faith and is intended to comply with — and in several respects exceed — the minimum requirements of the employment standards legislation that applies to your province, human rights legislation, and any other applicable law. If you believe any part of this letter is inconsistent with those minimums, please let us know and we will correct it. Nothing in this letter, including the Release, waives any right that cannot be waived under applicable law.</p>\n<h2>9. Closing</h2>\n<p>Thank you for everything you have contributed during your time with the Company. We wish you the very best in what comes next.</p>\n<p>If anything in this letter is unclear, please reach out — we are here to talk it through.</p>\n<p class="signoff-closing">With respect and our best wishes,</p><p class="signoff-name"><span class="mf">{{employer_signer_name}}</span></p><p class="signoff-line"><span class="mf">{{employer_signer_title}}</span></p><p class="signoff-line"><span class="mf">{{employer_legal_name}}</span></p>',
}
