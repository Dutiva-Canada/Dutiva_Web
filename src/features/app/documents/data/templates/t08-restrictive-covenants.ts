/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT08: DocTemplate = {
  id: 'tpl_t08',
  tid: 'T08',
  key: 'restrictive_covenants',
  kind: 'agreement',
  category: 'agreements',
  core: true,
  name: {
    en: 'Restrictive covenants agreement',
    fr: 'Entente de clauses restrictives',
  },
  desc: {
    en: 'Non-solicitation and (where lawful) non-competition terms. In Ontario, employee non-competes are largely banned.',
    fr: 'Clauses de non-sollicitation et (là où c’est permis) de non-concurrence. En Ontario, les non-concurrences sont largement interdites.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'high',
  review: 'lawyer_review_recommended',
  requiresLawyerReview: true,
  version: 'v2',
  versionNumber: 2,
  effectiveDate: '2026-01-25',
  updatedAt: '2026-06-10',
  estMinutes: 9,
  usageCount: 14,
  statutory: [
    {
      en: 'ESA, 2000 ss. 67.1–67.2 — non-compete prohibition (ON)',
      fr: 'LNE, 2000 art. 67.1–67.2 — interdiction de non-concurrence (ON)',
    },
    {
      en: 'Common-law reasonableness test',
      fr: 'Test de raisonnabilité de common law',
    },
    {
      en: 'Civil Code of Québec',
      fr: 'Code civil du Québec',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Employee non-compete agreements are prohibited under the ESA except in narrow cases (e.g. sale of a business). Non-solicitation may still be enforceable.',
      fr: 'Les non-concurrences pour employés sont interdites par la LNE sauf cas restreints (p. ex. vente d’entreprise). La non-sollicitation peut demeurer exécutoire.',
    },
    QC: {
      en: 'The Civil Code limits non-competes to what is reasonable in time, place, and activity, and the employer bears the burden.',
      fr: 'Le Code civil limite les non-concurrences au raisonnable en temps, lieu et activité ; le fardeau incombe à l’employeur.',
    },
    FED: {
      en: 'Provincial rules of the employee’s province generally apply to covenant enforceability.',
      fr: 'Les règles provinciales de la province de l’employé s’appliquent généralement.',
    },
  },
  includes: [
    {
      en: 'Non-solicitation of clients',
      fr: 'Non-sollicitation des clients',
    },
    {
      en: 'Non-solicitation of staff',
      fr: 'Non-sollicitation du personnel',
    },
    {
      en: 'Non-competition (if lawful)',
      fr: 'Non-concurrence (si permis)',
    },
    {
      en: 'Reasonableness limits',
      fr: 'Limites de raisonnabilité',
    },
    {
      en: 'Severability',
      fr: 'Divisibilité',
    },
  ],
  questions: [
    {
      id: 'employee_name',
      section: {
        en: 'Party',
        fr: 'Partie',
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
      id: 'covenant_scope',
      section: {
        en: 'Scope',
        fr: 'Portée',
      },
      label: {
        en: 'Covenants to include',
        fr: 'Clauses à inclure',
      },
      type: 'select',
      required: true,
      options: [
        {
          value: 'non-solicitation only',
          label: {
            en: 'Non-solicitation only',
            fr: 'Non-sollicitation seulement',
          },
        },
        {
          value: 'non-solicitation + non-compete',
          label: {
            en: 'Non-solicitation + non-compete',
            fr: 'Non-sollicitation + non-concurrence',
          },
        },
      ],
    },
    {
      id: 'duration_months',
      section: {
        en: 'Scope',
        fr: 'Portée',
      },
      label: {
        en: 'Duration (months)',
        fr: 'Durée (mois)',
      },
      type: 'number',
      required: true,
      placeholder: {
        en: '12',
        fr: '12',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Restrictive Covenants Agreement',
        fr: 'Entente de clauses restrictives',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Between {{org}} and {{employee_name}}. Covenants included: {{covenant_scope}}, for {{duration_months}} months.',
        fr: 'Entre {{org}} et {{employee_name}}. Clauses incluses : {{covenant_scope}}, pour {{duration_months}} mois.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Each covenant is limited to what is reasonable in duration, territory, and activity, and necessary to protect legitimate business interests. Overly broad terms may be unenforceable.',
        fr: 'Chaque clause est limitée au raisonnable en durée, territoire et activité, et nécessaire pour protéger des intérêts légitimes. Des clauses trop larges peuvent être inexécutoires.',
      },
      n: 1,
      heading: {
        en: 'Reasonableness',
        fr: 'Raisonnabilité',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'In Ontario, employee non-compete agreements are prohibited under the ESA except in narrow cases; where prohibited, only non-solicitation applies.',
        fr: 'En Ontario, les non-concurrences pour employés sont interdites par la LNE sauf cas restreints ; là où c’est interdit, seule la non-sollicitation s’applique.',
      },
      n: 2,
      heading: {
        en: 'Ontario note',
        fr: 'Note Ontario',
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
    '<h1 class="center">Restrictive Covenants Agreement</h1>\n<p>This Restrictive Covenants Agreement (the <strong>Agreement</strong>) is made on <strong><span class="mf">{{agreement_date}}</span></strong> between <strong><span class="mf">{{employer_legal_name}}</span></strong> (the <strong>Company</strong>) and <strong><span class="mf">{{employee_name}}</span></strong> (the <strong>Employee</strong>).</p>\n<h2>Why we\'re asking for this</h2>\n<p>Your role will put you in contact with our customers, our prospects, our confidential information, and the relationships that make our business work. This Agreement is about protecting those relationships and that information for a reasonable period after you leave — not about preventing you from working. We have drafted these restrictions to be as narrow as they can reasonably be, consistent with *J.G. Collins Insurance Agencies Ltd. v. Elsley*, [1978] 2 S.C.R. 916 and *Shafron v. KRG Insurance Brokers (Western) Inc.*, 2009 SCC 6.</p>\n<h2>1. Definitions</h2>\n<p>In this Agreement:</p>\n<ul><li><strong>Restricted Period</strong> means the <strong><span class="mf">{{restricted_period}}</span></strong> period that begins when your employment with the Company ends, for any reason.</li><li><strong>Restricted Territory</strong> means <strong><span class="mf">{{restricted_territory}}</span></strong>.</li><li><strong>Restricted Business</strong> means the business of <strong><span class="mf">{{restricted_business_description}}</span></strong> as actually carried on by the Company at the time your employment ends.</li><li><strong>Customer</strong> means a person or entity that was a customer of the Company, or an active prospect the Company was actively pursuing, at any time in the <strong><span class="mf">{{customer_lookback}}</span></strong> months before your employment ends, and with whom you had material dealings or about whom you had access to Confidential Information during that period.</li></ul>\n<h2>2. Non-solicitation of customers</h2>\n<p>During the Restricted Period, you will not, directly or indirectly, solicit any Customer for the purpose of providing products or services that compete with the Restricted Business. This clause is about solicitation — it does not prevent you from responding to a Customer who freely approaches you without any inducement from you.</p>\n<h2>3. Non-dealing (limited)</h2>\n<p>During the Restricted Period, you will not, directly or indirectly, accept the business of any Customer in connection with products or services that compete with the Restricted Business, to the extent that doing so would involve a material use of Confidential Information you learned at the Company. This restriction is limited to what is reasonably necessary to protect the Company\'s legitimate interests in Confidential Information and customer goodwill.</p>\n<h2>4. Non-solicitation of employees and contractors</h2>\n<p>During the Restricted Period, you will not, directly or indirectly, solicit or induce any employee or active contractor of the Company with whom you worked during the last <strong><span class="mf">{{employee_lookback}}</span></strong> months of your employment to leave the Company. Receiving an application from someone who responds to a general advertisement (not directed at Company personnel) is not a breach of this clause.</p>\n<h2>5. Non-competition (limited, executive/sale-of-business only)</h2>\n<p><strong>This section only applies in two specific situations:</strong></p>\n<ul><li>(a) <strong>Executive carve-out (Ontario).</strong> If you are an "executive" within the meaning of s. 67.2(4) of the <strong>Employment Standards Act, 2000</strong>, S.O. 2000, c. 41 (meaning any of: chief executive officer, president, chief administrative officer, chief operating officer, chief financial officer, chief information officer, chief legal officer, chief human resources officer, chief corporate development officer, or holds any other chief executive position) this Agreement includes the non-competition provisions set out in Schedule A, and you have been told so in writing at the time this Agreement was signed; or</li><li>(b) <strong>Sale-of-business exception (Ontario).</strong> If this Agreement is entered into in connection with the sale of a business or a part of a business within the meaning of s. 67.2(3) of the <strong>Employment Standards Act, 2000</strong>, and you are a seller or former owner of that business.</li></ul>\n<p><strong>For every other employee in Ontario, this Agreement does not contain a non-compete.</strong> Ontario\'s s. 67.2 prohibition on non-competes applies in full, and any attempted non-compete in this Agreement with respect to a non-executive, non-sale-of-business employee in Ontario is void.</p>\n<p>In provinces outside Ontario, a separate non-competition schedule may apply only if expressly attached and identified as applying to you, and only to the minimum extent reasonable to protect legitimate business interests (*Elsley*, *Shafron*).</p>\n<h2>6. Confidentiality</h2>\n<p>Your confidentiality obligations, including those set out in your employment agreement and any separate confidentiality agreement, continue after your employment ends and are not limited by the Restricted Period. Confidentiality obligations do not prevent you from making a protected disclosure to a regulator or law-enforcement agency, participating in a human-rights or whistleblower complaint, or discussing your wages and working conditions with others as permitted by law.</p>\n<h2>7. Reasonableness and severability</h2>\n<p>You acknowledge that: (a) the Company has a legitimate proprietary interest in the Confidential Information, Customer relationships and goodwill that these covenants protect; (b) the Restricted Period, Restricted Territory and Restricted Business have been tailored to that interest and are reasonable; and (c) you have had the opportunity to obtain independent legal advice before signing. If a court finds any covenant to be broader than is reasonable, the Parties intend that the covenant be enforced to the maximum extent permitted by law. If that is not possible, the unenforceable covenant is severed and the rest of the Agreement continues in full force.</p>\n<h2>8. Remedies</h2>\n<p>You agree that money damages alone may not be sufficient to remedy a breach of this Agreement, and that the Company may seek injunctive relief in addition to any other legal or equitable remedy, without having to prove actual damages and without being required to post a bond (where permitted by law). Nothing in this section limits either Party\'s other rights and remedies.</p>\n<h2>9. Acknowledgement</h2>\n<p>You acknowledge that you have read and understood this Agreement, that you had the opportunity to obtain independent legal advice before signing, and that you enter into it freely and voluntarily as a condition of the employment, equity or other consideration identified above.</p>\n<h2>10. Governing law</h2>\n<p>This Agreement is governed by the laws of the Province of <strong>Province of Ontario</strong> and the laws of Canada that apply in that province.</p>\n<p>By signing below, the Parties confirm they have read and accept the terms of this Agreement.</p>\n<div class="spacer">&nbsp;</div>\n<table class="sig"><tr>\n        <td>\n          <div class="sig-line">______________________________________</div>\n          <div class="sig-under">Signature — <span class="mf">{{employer_signer_name}}</span></div>\n          <div class="sig-under"><span class="mf">{{employer_signer_title}}</span></div>\n          <div class="sig-under">Date: <span class="mf">{{employer_signature_date}}</span></div>\n          <div class="sig-label">COMPANY</div>\n        </td>\n        <td>\n          <div class="sig-line">______________________________________</div>\n          <div class="sig-under">Signature — <span class="mf">{{employee_name}}</span></div>\n          <div class="sig-under"><span class="mf">{{employee_position}}</span></div>\n          <div class="sig-under">Date: <span class="mf">{{employee_signature_date}}</span></div>\n          <div class="sig-label">EMPLOYEE</div>\n        </td></tr></table>',
}
