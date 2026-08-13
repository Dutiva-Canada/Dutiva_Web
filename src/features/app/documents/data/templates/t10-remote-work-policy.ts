/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT10: DocTemplate = {
  id: 'tpl_t10',
  tid: 'T10',
  key: 'remote_work_policy',
  kind: 'policy',
  category: 'policies',
  core: true,
  name: {
    en: 'Remote & hybrid work policy',
    fr: 'Politique de télétravail et hybride',
  },
  desc: {
    en: 'Sets eligibility, hours, equipment, expenses, data security, and health-and-safety for work away from the office.',
    fr: 'Définit l’admissibilité, les heures, l’équipement, les dépenses, la sécurité des données et la santé-sécurité hors bureau.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v3',
  versionNumber: 3,
  effectiveDate: '2026-04-01',
  updatedAt: '2026-06-25',
  estMinutes: 8,
  usageCount: 61,
  statutory: [
    {
      en: 'OHSA — remote workspaces',
      fr: 'LSST — espaces distants',
    },
    {
      en: 'ESA, 2000 — hours & disconnecting',
      fr: 'LNE, 2000 — heures et déconnexion',
    },
    {
      en: 'PIPEDA / Law 25 — data at home',
      fr: 'LPRPDE / Loi 25 — données à domicile',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Employers with 25+ employees must have a written disconnecting-from-work policy under the ESA.',
      fr: 'Les employeurs de 25 employés et plus doivent avoir une politique écrite sur la déconnexion (LNE).',
    },
    QC: {
      en: 'Reasonable teleworking expenses and CNESST coverage extend to the home workspace.',
      fr: 'Les dépenses raisonnables de télétravail et la couverture CNESST s’étendent au domicile.',
    },
    FED: {
      en: 'Canada Labour Code hours-of-work and right-to-refuse provisions apply to remote work.',
      fr: 'Les dispositions du CCT sur les heures et le droit de refus s’appliquent au télétravail.',
    },
  },
  includes: [
    {
      en: 'Eligibility',
      fr: 'Admissibilité',
    },
    {
      en: 'Hours & availability',
      fr: 'Heures et disponibilité',
    },
    {
      en: 'Right to disconnect',
      fr: 'Droit à la déconnexion',
    },
    {
      en: 'Equipment & expenses',
      fr: 'Équipement et dépenses',
    },
    {
      en: 'Data security',
      fr: 'Sécurité des données',
    },
    {
      en: 'Health & safety at home',
      fr: 'Santé-sécurité à domicile',
    },
    {
      en: 'Ending an arrangement',
      fr: 'Fin d’une entente',
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
      id: 'model',
      section: {
        en: 'Model',
        fr: 'Modèle',
      },
      label: {
        en: 'Arrangement',
        fr: 'Formule',
      },
      type: 'radio',
      required: true,
      options: [
        {
          value: 'hybrid',
          label: {
            en: 'Hybrid (set office days)',
            fr: 'Hybride (jours fixés)',
          },
        },
        {
          value: 'fully remote',
          label: {
            en: 'Fully remote',
            fr: 'Entièrement à distance',
          },
        },
        {
          value: 'flexible',
          label: {
            en: 'Flexible / case-by-case',
            fr: 'Flexible / cas par cas',
          },
        },
      ],
    },
    {
      id: 'office_days',
      section: {
        en: 'Model',
        fr: 'Modèle',
      },
      label: {
        en: 'In-office days/week (if hybrid)',
        fr: 'Jours au bureau/sem. (si hybride)',
      },
      type: 'number',
      required: false,
      placeholder: {
        en: '2',
        fr: '2',
      },
    },
    {
      id: 'core_hours',
      section: {
        en: 'Hours',
        fr: 'Heures',
      },
      label: {
        en: 'Core availability hours',
        fr: 'Heures de disponibilité de base',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. 10:00–15:00 local',
        fr: 'p. ex. 10 h–15 h locale',
      },
    },
    {
      id: 'equipment',
      section: {
        en: 'Equipment',
        fr: 'Équipement',
      },
      label: {
        en: 'Equipment provided',
        fr: 'Équipement fourni',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'company laptop & essentials',
          label: {
            en: 'Company laptop & essentials',
            fr: 'Portable et essentiels fournis',
          },
        },
        {
          value: 'monthly stipend',
          label: {
            en: 'Monthly stipend',
            fr: 'Allocation mensuelle',
          },
        },
        {
          value: 'bring your own device',
          label: {
            en: 'Bring your own device',
            fr: 'Appareil personnel',
          },
        },
      ],
    },
    {
      id: 'expenses',
      section: {
        en: 'Expenses',
        fr: 'Dépenses',
      },
      label: {
        en: 'Home-office expenses reimbursed?',
        fr: 'Dépenses de bureau à domicile remboursées ?',
      },
      type: 'radio',
      required: true,
      options: [
        {
          value: 'yes, reasonable expenses',
          label: {
            en: 'Yes, reasonable expenses',
            fr: 'Oui, dépenses raisonnables',
          },
        },
        {
          value: 'no',
          label: {
            en: 'No',
            fr: 'Non',
          },
        },
      ],
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Remote & Hybrid Work Policy',
        fr: 'Politique de télétravail et hybride',
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
        en: '{{org}} supports a {{model}} arrangement. Where hybrid, employees attend the office {{office_days}} day(s) per week.',
        fr: '{{org}} soutient une formule {{model}}. En mode hybride, les employés sont au bureau {{office_days}} jour(s) par semaine.',
      },
      n: 1,
      heading: {
        en: 'Arrangement',
        fr: 'Formule',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Core availability is {{core_hours}}. Outside working hours, employees are not expected to respond, consistent with disconnecting-from-work standards.',
        fr: 'La disponibilité de base est {{core_hours}}. Hors des heures, aucune réponse n’est attendue, conformément aux normes sur la déconnexion.',
      },
      n: 2,
      heading: {
        en: 'Hours & right to disconnect',
        fr: 'Heures et droit à la déconnexion',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Equipment: {{equipment}}. Reimbursement of reasonable home-office expenses: {{expenses}}.',
        fr: 'Équipement : {{equipment}}. Remboursement des dépenses raisonnables : {{expenses}}.',
      },
      n: 3,
      heading: {
        en: 'Equipment & expenses',
        fr: 'Équipement et dépenses',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Employees protect personal and confidential information at home to the same standard as in the office, consistent with PIPEDA and, in Québec, Law 25.',
        fr: 'Les employés protègent à domicile les renseignements au même niveau qu’au bureau, conformément à la LPRPDE et, au Québec, à la Loi 25.',
      },
      n: 4,
      heading: {
        en: 'Data security',
        fr: 'Sécurité des données',
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
    '<h1 class="center">Remote Work Policy</h1>\n<p class="center"><strong>Effective:</strong> <span class="mf">{{policy_effective_date}}</span> — <strong>Applies to:</strong> <span class="mf">{{policy_scope}}</span></p>\n<h2>Why we have this policy</h2>\n<p>Where your role allows it, we support working remotely or in a hybrid way. This policy sets out that shared understanding and the legal requirements that apply to remote work in your jurisdiction.</p>\n<h2>1. Who is eligible</h2>\n<p>Remote work is available where the nature of your role, the security of information, and the needs of your team allow it. Your manager, with HR, decides what arrangement is right for your role.</p>\n<h2>2. Types of arrangement</h2>\n<p>We support three arrangement types, each documented with your manager: <strong>Onsite</strong>, <strong>Hybrid</strong> (a mix of onsite and remote on an agreed schedule), and <strong>Fully remote</strong> (working from an approved home office or other approved location).</p>\n<h2>3. Your remote workspace</h2>\n<p>Your remote workspace should be quiet, safe, and confidential. The Company will provide the equipment listed in <span class="mf">{{remote_equipment_list}}</span>; reasonable accommodations for disability-related needs are available on request under the <em>Meiorin</em> standard (<em>British Columbia (PSERC) v. BCGSEU</em>, [1999] 3 S.C.R. 3).</p>\n<h2>4. Health and safety at home</h2>\n<p>The Company\'s health and safety obligations under the Occupational Health and Safety Act, R.S.O. 1990, c. O.1, ss. 32.0.1–32.0.8 extend to remote workspaces. Report any incident or injury that happens while working to <span class="mf">{{hs_contact_name}}</span>.</p>\n<h2>5. Working hours and right to disconnect</h2>\n<p>Your regular hours of work are the same as they would be onsite. You are expected to be available during core hours of <span class="mf">{{core_hours}}</span>, local time. For employees working in Ontario, this right-to-disconnect policy is provided in accordance with ESA s. 21.1.2 (employers with 25+ employees must have a written policy).</p>\n<h2>6. Overtime and accurate timekeeping</h2>\n<p>Overtime rules apply to remote work the same as onsite. The overtime threshold in Ontario is 44 hours per week (ESA s. 22). Pre-approval is required before working beyond your regular hours.</p>\n<h2>7. Electronic monitoring</h2>\n<p>We use the following electronic monitoring practices to protect information security and support business operations: <span class="mf">{{electronic_monitoring_description}}</span>. For employees working in Ontario, this disclosure is provided in accordance with ESA s. 41.1.1 (employers with 25+ employees must have a written electronic monitoring policy).</p>\n<h2>8. Information security</h2>\n<p>When working remotely, use only Company-approved devices and networks for Company information, do not store Company data on personal cloud storage, and report any suspected security incident to <span class="mf">{{it_security_contact}}</span> immediately.</p>\n<h2>9. Expenses and equipment</h2>\n<p>Reasonable, pre-approved expenses necessary to perform your role from a remote workspace are reimbursable under our Expense Policy. Company-owned equipment remains the Company\'s property at all times and must be returned on request or at the end of employment.</p>\n<h2>10. Cross-provincial and relocation considerations</h2>\n<p>If you relocate to a different province, you must notify <span class="mf">{{hr_contact_name}}</span> before the move. Employment standards, overtime rules, statutory leaves, and payroll deductions all depend on the province where work is actually performed.</p>\n<h2>11. Right to modify the arrangement</h2>\n<p>Remote work is not a right — it is an arrangement based on role, performance, and business needs. The Company may change or end a remote arrangement on reasonable notice.</p>\n<h2>12. Questions and concerns</h2>\n<p>If any part of this policy is unclear, please talk to your manager or <span class="mf">{{hr_contact_name}}</span>.</p>',
}
