/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT06: DocTemplate = {
  id: 'tpl_t06',
  tid: 'T06',
  key: 'written_warning',
  kind: 'letter',
  category: 'discipline',
  core: true,
  name: {
    en: 'Written warning',
    fr: 'Avertissement écrit',
  },
  desc: {
    en: 'Documents a performance or conduct concern, the expected change, and the consequence if it continues.',
    fr: 'Documente une préoccupation de rendement ou de conduite, le changement attendu et la conséquence en cas de récidive.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'medium',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v2',
  versionNumber: 2,
  effectiveDate: '2026-02-20',
  updatedAt: '2026-05-20',
  estMinutes: 6,
  usageCount: 52,
  statutory: [
    {
      en: 'Progressive-discipline principles',
      fr: 'Principes de discipline progressive',
    },
    {
      en: 'Human Rights Code — accommodation before discipline',
      fr: 'Code des droits de la personne — adaptation avant discipline',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Rule out a disability or accommodation need before disciplining for performance.',
      fr: 'Écarter un besoin d’adaptation ou un handicap avant de discipliner pour le rendement.',
    },
    QC: {
      en: 'Keep records; the CNESST and tribunals expect a fair, documented process.',
      fr: 'Conserver les dossiers ; la CNESST et les tribunaux attendent un processus équitable et documenté.',
    },
    FED: {
      en: 'Document steps carefully — unjust-dismissal review considers the discipline record.',
      fr: 'Documenter les étapes — l’examen pour congédiement injuste tient compte du dossier disciplinaire.',
    },
  },
  includes: [
    {
      en: 'The concern',
      fr: 'La préoccupation',
    },
    {
      en: 'Expectation & standard',
      fr: 'Attente et norme',
    },
    {
      en: 'Support offered',
      fr: 'Soutien offert',
    },
    {
      en: 'Consequence if unresolved',
      fr: 'Conséquence si non résolu',
    },
    {
      en: 'Employee response',
      fr: 'Réponse de l’employé',
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
      id: 'concern',
      section: {
        en: 'Concern',
        fr: 'Préoccupation',
      },
      label: {
        en: 'The concern',
        fr: 'La préoccupation',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Describe the specific behaviour or performance issue and when it occurred.',
        fr: 'Décrivez le comportement ou le problème de rendement précis et le moment.',
      },
    },
    {
      id: 'expectation',
      section: {
        en: 'Expectation',
        fr: 'Attente',
      },
      label: {
        en: 'Expected change',
        fr: 'Changement attendu',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'What specifically must improve, and by when.',
        fr: 'Ce qui doit s’améliorer précisément, et pour quand.',
      },
    },
    {
      id: 'review_date',
      section: {
        en: 'Follow-up',
        fr: 'Suivi',
      },
      label: {
        en: 'Review date',
        fr: 'Date de révision',
      },
      type: 'date',
      required: true,
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Written Warning',
        fr: 'Avertissement écrit',
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
        en: 'This letter is a formal written warning to {{employee_name}} regarding the following concern:',
        fr: 'La présente constitue un avertissement écrit formel à {{employee_name}} concernant la préoccupation suivante :',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{concern}}',
        fr: '{{concern}}',
      },
      n: 1,
      heading: {
        en: 'The concern',
        fr: 'La préoccupation',
      },
    },
    {
      type: 'clause',
      text: {
        en: '{{expectation}} We will review progress together on {{review_date}}. Support is available to help you meet this expectation.',
        fr: '{{expectation}} Nous réviserons les progrès ensemble le {{review_date}}. Du soutien est disponible pour vous aider à atteindre cette attente.',
      },
      n: 2,
      heading: {
        en: 'What we expect',
        fr: 'Nos attentes',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Failure to meet the expectation may lead to further action, up to and including termination. You may add your response below.',
        fr: 'Le non-respect de l’attente peut mener à d’autres mesures, pouvant aller jusqu’à la cessation d’emploi. Vous pouvez ajouter votre réponse ci-dessous.',
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
    '<p class="date"><span class="mf">{{document_date}}</span></p>\n<address><span class="mf">{{employee_name}}</span><br><span class="mf">{{employee_address_line_1}}</span><br><span class="mf">{{employee_address_line_2}}</span></address>\n<p class="re"><strong>Re:</strong> Written warning — <span class="mf">{{warning_subject}}</span></p>\n<p>Dear <span class="mf">{{employee_first_name}}</span>,</p>\n<p>The purpose of this letter is to formally document a concern we have discussed with you and to confirm the expectations going forward. A written warning is a serious step, but it is not the end of the road — it is an honest, early conversation so we can course-correct together.</p>\n<h2>1. Summary of the concern</h2>\n<p>On <strong><span class="mf">{{incident_date}}</span></strong>, the following occurred: <strong><span class="mf">{{incident_description}}</span></strong>. This was discussed with you on <strong><span class="mf">{{verbal_warning_date}}</span></strong> by <strong><span class="mf">{{verbal_warning_by}}</span></strong>. Despite that conversation, the concern has not been fully resolved.</p>\n<h2>2. Why this is a concern</h2>\n<p>The behaviour described above is inconsistent with <strong><span class="mf">{{policy_or_expectation}}</span></strong>. We are raising it because it matters to us, to your colleagues, and to our customers — and because we believe you can meet the expectation with the right support.</p>\n<h2>3. What we expect going forward</h2>\n<p>Effective immediately, we expect you to:</p>\n<ul><li><strong><span class="mf">{{expectation_1}}</span></strong></li><li><strong><span class="mf">{{expectation_2}}</span></strong></li><li><strong><span class="mf">{{expectation_3}}</span></strong></li></ul>\n<p>We will check in on <strong><span class="mf">{{checkin_date}}</span></strong> to discuss how things are going. In the meantime, your manager <strong><span class="mf">{{manager_name}}</span></strong> is available to support you — please reach out whenever you need to.</p>\n<h2>4. Support available to you</h2>\n<p>If anything outside of work is making it harder to meet these expectations — your health, a family situation, anything protected under human rights legislation — please tell us. You are entitled to reasonable accommodation up to the point of undue hardship, in accordance with the *Meiorin* test (*British Columbia (PSERC) v. BCGSEU*, [1999] 3 S.C.R. 3) and applicable human rights legislation. You can also access our Employee and Family Assistance Program at <strong><span class="mf">{{eap_contact}}</span></strong> for confidential counselling and support.</p>\n<h2>5. Consequences if the concern continues</h2>\n<p>If the concern is not resolved after this warning, further steps under our progressive discipline process may follow, up to and including termination of your employment for just cause. Any decision to move to termination for cause would be made contextually, as required by *McKinley v. BC Tel*, 2001 SCC 38, considering the nature and circumstances of the behaviour and giving you a fair opportunity to respond. Nothing in this letter limits your entitlements under the employment standards legislation that applies to your province (for example, the <strong>Employment Standards Act, 2000</strong>, S.O. 2000, c. 41 in Ontario).</p>\n<h2>6. Your right to respond</h2>\n<p>You are welcome to provide a written response to this warning, and to include any context we may have missed. If you do, we will add your response to your employment file. You have the right to be treated fairly throughout this process and to have any concerns about this warning escalated to <strong><span class="mf">{{hr_contact_name}}</span></strong>.</p>\n<h2>7. How long this stays active</h2>\n<p>This warning will remain active on your file for <strong><span class="mf">{{warning_active_period}}</span></strong>. If the concern is resolved and does not recur during that period, the warning is no longer considered in future decisions, except to the extent relevant to a pattern.</p>\n<p>We want to be very clear: this letter is not a reflection of your value as a person or a teammate. It is an honest attempt to help us both move forward. We are here to support you.</p>\n<p class="signoff-closing">With respect,</p><p class="signoff-name"><span class="mf">{{employer_signer_name}}</span></p><p class="signoff-line"><span class="mf">{{employer_signer_title}}</span></p><p class="signoff-line"><span class="mf">{{employer_legal_name}}</span></p>\n<div class="spacer">&nbsp;</div>\n<p><strong>Acknowledgement of receipt.</strong> My signature below indicates that I have received and read this warning. It does not mean I agree with every detail — I may provide a written response. I understand I can contact <strong><span class="mf">{{hr_contact_name}}</span></strong> with any questions.</p>\n<table class="sig"><tr>\n        <td>\n          <div class="sig-line">______________________________________</div>\n          <div class="sig-under">Signature — <span class="mf">{{employer_signer_name}}</span></div>\n          <div class="sig-under"><span class="mf">{{employer_signer_title}}</span></div>\n          <div class="sig-under">Date: <span class="mf">{{employer_signature_date}}</span></div>\n          <div class="sig-label">EMPLOYER</div>\n        </td>\n        <td>\n          <div class="sig-line">______________________________________</div>\n          <div class="sig-under">Signature — <span class="mf">{{employee_name}}</span></div>\n          <div class="sig-under"><span class="mf">{{employee_position}}</span></div>\n          <div class="sig-under">Date: <span class="mf">{{employee_signature_date}}</span></div>\n          <div class="sig-label">EMPLOYEE — RECEIVED</div>\n        </td></tr></table>',
}
