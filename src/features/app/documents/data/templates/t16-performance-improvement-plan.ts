/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT16: DocTemplate = {
  id: 'tpl_t16',
  tid: 'T16',
  key: 'performance_improvement_plan',
  kind: 'plan',
  category: 'discipline',
  core: true,
  name: {
    en: 'Performance improvement plan (PIP)',
    fr: 'Plan d’amélioration du rendement (PAR)',
  },
  desc: {
    en: 'A structured, time-boxed plan with clear goals, support, and check-ins. Framed as help first, not a paper trail.',
    fr: 'Un plan structuré et limité dans le temps, avec objectifs clairs, soutien et suivis. Conçu comme un appui, non un dossier.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v3',
  versionNumber: 3,
  effectiveDate: '2026-03-01',
  updatedAt: '2026-06-16',
  estMinutes: 9,
  usageCount: 44,
  statutory: [
    {
      en: 'Progressive-discipline & good-faith principles',
      fr: 'Principes de discipline progressive et de bonne foi',
    },
    {
      en: 'Human Rights Code — accommodation duty',
      fr: 'Code des droits de la personne — obligation d’adaptation',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Screen for an accommodation need before and during the plan; keep goals objective and documented.',
      fr: 'Vérifier un besoin d’adaptation avant et pendant le plan ; garder des objectifs objectifs et documentés.',
    },
    QC: {
      en: 'Good faith and fair process are required; the plan should be realistic and supported.',
      fr: 'La bonne foi et l’équité procédurale sont requises ; le plan doit être réaliste et soutenu.',
    },
    FED: {
      en: 'A documented, supportive plan strengthens the record if unjust-dismissal review follows.',
      fr: 'Un plan documenté et soutenu renforce le dossier en cas d’examen pour congédiement injuste.',
    },
  },
  includes: [
    {
      en: 'Goals & measures',
      fr: 'Objectifs et mesures',
    },
    {
      en: 'Support & resources',
      fr: 'Soutien et ressources',
    },
    {
      en: 'Check-in schedule',
      fr: 'Calendrier de suivi',
    },
    {
      en: 'Review period',
      fr: 'Période de révision',
    },
    {
      en: 'Possible outcomes',
      fr: 'Résultats possibles',
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
      id: 'goals',
      section: {
        en: 'Goals',
        fr: 'Objectifs',
      },
      label: {
        en: 'Improvement goals',
        fr: 'Objectifs d’amélioration',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Specific, measurable goals and the standard expected.',
        fr: 'Objectifs précis et mesurables, et la norme attendue.',
      },
    },
    {
      id: 'support',
      section: {
        en: 'Support',
        fr: 'Soutien',
      },
      label: {
        en: 'Support provided',
        fr: 'Soutien fourni',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Coaching, training, tools, or adjusted workload.',
        fr: 'Coaching, formation, outils ou charge ajustée.',
      },
    },
    {
      id: 'review_period',
      section: {
        en: 'Timing',
        fr: 'Échéancier',
      },
      label: {
        en: 'Review period',
        fr: 'Période de révision',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: '30 days',
          label: {
            en: '30 days',
            fr: '30 jours',
          },
        },
        {
          value: '60 days',
          label: {
            en: '60 days',
            fr: '60 jours',
          },
        },
        {
          value: '90 days',
          label: {
            en: '90 days',
            fr: '90 jours',
          },
        },
      ],
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Performance Improvement Plan',
        fr: 'Plan d’amélioration du rendement',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{today}} · Confidential',
        fr: '{{org}} · {{today}} · Confidentiel',
      },
    },
    {
      type: 'para',
      text: {
        en: 'This plan is designed to help {{employee_name}} succeed. It sets clear goals and the support {{org}} will provide over the next {{review_period}}.',
        fr: 'Ce plan vise à aider {{employee_name}} à réussir. Il fixe des objectifs clairs et le soutien que {{org}} offrira au cours des prochains {{review_period}}.',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{goals}}',
        fr: '{{goals}}',
      },
      n: 1,
      heading: {
        en: 'Goals',
        fr: 'Objectifs',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{support}} We will check in regularly and review together at the end of the {{review_period}} period.',
        fr: '{{support}} Nous ferons des suivis réguliers et réviserons ensemble à la fin de la période de {{review_period}}.',
      },
      n: 2,
      heading: {
        en: 'Support we’ll provide',
        fr: 'Soutien fourni',
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
    '<h1 class="center">Performance Improvement Plan</h1>\n<p class="center"><strong>Employee:</strong> <span class="mf">{{employee_name}}</span> &nbsp;•&nbsp; <strong>Role:</strong> <span class="mf">{{position_title}}</span> &nbsp;•&nbsp; <strong>Manager:</strong> <span class="mf">{{manager_name}}</span></p>\n<p class="center"><strong>PIP Start:</strong> <span class="mf">{{pip_start_date}}</span> &nbsp;•&nbsp; <strong>PIP End:</strong> <span class="mf">{{pip_end_date}}</span> &nbsp;•&nbsp; <strong>Review Cadence:</strong> <span class="mf">{{pip_review_cadence}}</span></p>\n<p>This Performance Improvement Plan (PIP) exists because we believe you can succeed in your role at <span class="mf">{{employer_legal_name}}</span>, and we want to give you clear, fair support to get there. A PIP is not a disciplinary measure and is not, by itself, a step toward termination.</p>\n<h2>1. Why we are having this conversation</h2>\n<p>Over the past period, the following areas of your performance have not met the expectations of your role: <span class="mf">{{performance_concerns_summary}}</span>.</p>\n<h2>2. Expectations for the PIP period</h2>\n<ul><li><strong>Expectation 1:</strong> <span class="mf">{{expectation_1}}</span></li><li><strong>Expectation 2:</strong> <span class="mf">{{expectation_2}}</span></li><li><strong>Expectation 3:</strong> <span class="mf">{{expectation_3}}</span></li></ul>\n<h2>3. Support the Company will provide</h2>\n<p>Coaching and feedback on <span class="mf">{{coaching_cadence}}</span>; training and resources: <span class="mf">{{training_resources}}</span>; accommodation where a concern relates to a protected ground under the Human Rights Code, R.S.O. 1990, c. H.19 and the <em>Meiorin</em> standard.</p>\n<h2>4. Check-ins and progress reviews</h2>\n<p>Your manager will meet with you <span class="mf">{{pip_review_cadence}}</span> throughout the PIP period to discuss progress and adjust the plan where it makes sense.</p>\n<h2>5. What happens at the end of the PIP</h2>\n<p>One of the following will happen: <strong>Successful completion</strong> — the PIP closes and you continue in your role; <strong>Extension</strong> — where fair and realistic; or <strong>Further action</strong> — up to and including termination, assessed contextually under <em>McKinley v. BC Tel</em>, 2001 SCC 38, and with your ESA ss. 54–57 entitlements fully respected.</p>\n<h2>6. Your rights during this process</h2>\n<p>You have the right to clear feedback, to ask questions, to raise concerns without fear of retaliation, and to reasonable accommodation where human rights legislation requires it.</p>\n<h2>7. Documentation</h2>\n<p>A complete written record of this PIP process will be maintained, including this document and notes from each check-in, retained for a minimum of 3 years after employment ends.</p>\n<h2>8. Acknowledgement</h2>\n<p>Your signature below confirms that you have received a copy of this PIP and that it has been discussed with you. It does not mean you agree with every point — you may submit a written response.</p>\n<div class="spacer">&nbsp;</div>\n<table class="sig"><tr>\n<td><div class="sig-line">_______________________________</div><div class="sig-under">Signature — <span class="mf">{{employer_signer_name}}</span></div><div class="sig-under"><span class="mf">{{employer_signer_title}}</span></div><div class="sig-under">Date: <span class="mf">{{employer_signature_date}}</span></div><div class="sig-label">MANAGER</div></td>\n<td><div class="sig-line">_______________________________</div><div class="sig-under">Signature — <span class="mf">{{employee_name}}</span></div><div class="sig-under"><span class="mf">{{employee_position}}</span></div><div class="sig-under">Date: <span class="mf">{{employee_signature_date}}</span></div><div class="sig-label">EMPLOYEE — RECEIVED AND DISCUSSED</div></td>\n</tr></table>',
}
