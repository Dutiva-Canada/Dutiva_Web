/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT11: DocTemplate = {
  id: 'tpl_t11',
  tid: 'T11',
  key: 'vacation_leave_policy',
  kind: 'policy',
  category: 'policies',
  core: true,
  name: {
    en: 'Vacation & leave policy',
    fr: 'Politique de vacances et de congés',
  },
  desc: {
    en: 'Consolidates statutory and company leave — vacation, sick, personal, bereavement, and job-protected leaves.',
    fr: 'Regroupe les congés légaux et de l’entreprise — vacances, maladie, personnel, deuil et congés protégés.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v3',
  versionNumber: 3,
  effectiveDate: '2026-01-05',
  updatedAt: '2026-05-18',
  estMinutes: 7,
  usageCount: 57,
  statutory: [
    {
      en: 'ESA, 2000 — vacation & leaves',
      fr: 'LNE, 2000 — vacances et congés',
    },
    {
      en: 'Act respecting labour standards',
      fr: 'Loi sur les normes du travail',
    },
    {
      en: 'Canada Labour Code, Part III',
      fr: 'Code canadien du travail, Partie III',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Vacation is at least 2 weeks (4%), rising to 3 weeks (6%) after 5 years; job-protected leaves are set by the ESA.',
      fr: 'Les vacances sont d’au moins 2 semaines (4 %), portées à 3 semaines (6 %) après 5 ans ; congés protégés selon la LNE.',
    },
    QC: {
      en: 'Annual leave and indemnity follow the LSA; company terms may exceed but not reduce them.',
      fr: 'Le congé annuel et l’indemnité suivent la LNT ; l’entreprise peut les dépasser mais non les réduire.',
    },
    FED: {
      en: 'Federal minimums include 3 weeks after 5 years and personal/medical leave under the Code.',
      fr: 'Les minimums fédéraux : 3 semaines après 5 ans et congés personnels/médicaux selon le Code.',
    },
  },
  includes: [
    {
      en: 'Vacation accrual',
      fr: 'Accumulation de vacances',
    },
    {
      en: 'Statutory holidays',
      fr: 'Jours fériés',
    },
    {
      en: 'Sick & personal days',
      fr: 'Congés maladie et personnels',
    },
    {
      en: 'Bereavement',
      fr: 'Deuil',
    },
    {
      en: 'Job-protected leaves',
      fr: 'Congés protégés',
    },
    {
      en: 'Requesting leave',
      fr: 'Demander un congé',
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
      id: 'vacation_base',
      section: {
        en: 'Vacation',
        fr: 'Vacances',
      },
      label: {
        en: 'Base vacation entitlement',
        fr: 'Droit de base aux vacances',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: '2 weeks',
          label: {
            en: '2 weeks (statutory)',
            fr: '2 semaines (légal)',
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
      id: 'sick_days',
      section: {
        en: 'Sick',
        fr: 'Maladie',
      },
      label: {
        en: 'Paid sick / personal days per year',
        fr: 'Jours payés maladie / personnels par an',
      },
      type: 'number',
      required: true,
      placeholder: {
        en: '5',
        fr: '5',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Vacation & Leave Policy',
        fr: 'Politique de vacances et de congés',
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
        en: 'Employees receive {{vacation_base}} of paid vacation, never below the statutory minimum for {{jurisdiction}}.',
        fr: 'Les employés reçoivent {{vacation_base}} de vacances payées, jamais sous le minimum légal pour {{jurisdiction}}.',
      },
      n: 1,
      heading: {
        en: 'Vacation',
        fr: 'Vacances',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{sick_days}} paid sick/personal days are provided yearly, in addition to all job-protected statutory leaves for {{jurisdiction}}.',
        fr: '{{sick_days}} jours payés maladie/personnels sont offerts chaque année, en plus de tous les congés légaux protégés pour {{jurisdiction}}.',
      },
      n: 2,
      heading: {
        en: 'Sick & protected leaves',
        fr: 'Maladie et congés protégés',
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
    '<h1 class="center">Vacation and Leave Policy</h1>\n<p class="center"><strong>Effective:</strong> <span class="mf">{{policy_effective_date}}</span></p>\n<h2>Our philosophy</h2>\n<p>Time away isn\'t a reward for working hard — it\'s part of working well. This policy sets out how vacation and leaves work at <span class="mf">{{employer_legal_name}}</span>, and what the law guarantees you. Where the law requires more than this policy provides, the law controls.</p>\n<h2>1. Vacation entitlement</h2>\n<p>All regular employees receive <span class="mf">{{vacation_weeks}}</span> weeks of paid vacation per year, meeting or exceeding the minimum required by ESA ss. 33–34. After the applicable threshold, employees receive 3 weeks / 6% after 5 years of service (ESA s. 35.2).</p>\n<h2>2. Accrual and timing</h2>\n<p>Vacation accrues from your first day of employment. You may take vacation as it accrues, subject to your manager\'s approval and the team\'s operational needs.</p>\n<h2>3. Requesting vacation</h2>\n<p>Please request vacation at least <span class="mf">{{vacation_request_notice}}</span> in advance through <span class="mf">{{vacation_request_tool}}</span>.</p>\n<h2>4. Carryover and payout on separation</h2>\n<p>Carryover of unused vacation is permitted up to <span class="mf">{{carryover_limit}}</span>. On separation from employment, any accrued and unused vacation pay will be paid out in your final wages, as required by ESA ss. 33–42.</p>\n<h2>5. Statutory public holidays</h2>\n<p>You will be paid for all statutory public holidays recognized in your jurisdiction, at the minimum rate required by law.</p>\n<h2>6. Sick leave</h2>\n<p>You are entitled to all sick leave required by law, including 3 unpaid sick leave days per year (ESA s. 50.0.1). On top of statutory minimums, the Company offers <span class="mf">{{additional_sick_days}}</span> paid sick days per year.</p>\n<h2>7. Pregnancy, parental, adoption and caregiver leaves</h2>\n<p>You are entitled to all pregnancy, parental, adoption, family caregiver, and critical illness leaves prescribed by ESA ss. 46–49.1 (pregnancy leave: up to 17 weeks; parental leave: up to 61 weeks). We will not retaliate against you for taking these leaves.</p>\n<h2>8. Bereavement, domestic violence, and other protected leaves</h2>\n<p>You are entitled to all bereavement, domestic or sexual violence, family responsibility, reservist, organ donor, and other statutory leaves provided by the employment standards legislation that applies to you. Please reach out to <span class="mf">{{hr_contact_name}}</span> as soon as you reasonably can.</p>\n<h2>9. Religious accommodation</h2>\n<p>We will reasonably accommodate religious observance requests up to the point of undue hardship, in accordance with the Human Rights Code, R.S.O. 1990, c. H.19 and the <em>Meiorin</em> standard.</p>\n<h2>10. Communication during time off</h2>\n<p>When you are on vacation or leave, we do not expect you to check email, take calls, or respond to messages, consistent with our right-to-disconnect obligations under ESA s. 21.1.2.</p>\n<h2>11. Policy review and updates</h2>\n<p>This policy is reviewed at least annually. When a legislated minimum changes, the statutory minimum applies automatically. The current version is available at <span class="mf">{{policy_url}}</span>.</p>',
}
