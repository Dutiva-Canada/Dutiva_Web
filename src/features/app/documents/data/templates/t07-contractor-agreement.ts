/* Originally GENERATED from the HR Documents Library handoff (dutiva-data.js)
   by scripts/generate-doclib.mjs. **That generator is retired** — its own
   header says so, its source JSON was never committed, and it fails at the
   first read. The "regenerate rather than edit" instruction it left here
   pointed at a process that no longer exists, so this file is hand-maintained
   like the rest of the catalogue. Edit it deliberately and keep the FR in
   step; docs/FOUR_RING_FRAMEWORK.md records why. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT07: DocTemplate = {
  id: 'tpl_t07',
  tid: 'T07',
  key: 'contractor_agreement',
  kind: 'agreement',
  category: 'hiring',
  core: true,
  name: {
    en: 'Independent contractor agreement',
    fr: 'Contrat de travailleur autonome',
  },
  desc: {
    en: 'Engages a contractor, not an employee. Misclassification is a leading liability — the real relationship decides status.',
    fr: 'Engage un travailleur autonome, non un employé. La mauvaise classification est une source majeure de responsabilité.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'high',
  review: 'lawyer_review_recommended',
  requiresLawyerReview: true,
  version: 'v3',
  versionNumber: 3,
  effectiveDate: '2026-02-15',
  updatedAt: '2026-06-20',
  estMinutes: 10,
  usageCount: 22,
  statutory: [
    {
      en: 'CRA control / integration tests',
      fr: 'Tests de contrôle / intégration de l’ARC',
    },
    {
      en: 'ESA, 2000 (if reclassified)',
      fr: 'LNE, 2000 (si requalifié)',
    },
    {
      en: 'Dependent-contractor case law',
      fr: 'Jurisprudence sur l’entrepreneur dépendant',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'A contractor treated like an employee can be reclassified, triggering ESA entitlements and CRA remittances.',
      fr: 'Un autonome traité comme employé peut être requalifié, entraînant droits LNE et remises à l’ARC.',
    },
    QC: {
      en: 'Revenu Québec and the CNESST apply their own tests; a dependent contractor may gain protections.',
      fr: 'Revenu Québec et la CNESST appliquent leurs propres tests ; un entrepreneur dépendant peut obtenir des protections.',
    },
    FED: {
      en: 'Reclassification can expose the payer to source-deduction and Code liabilities.',
      fr: 'Une requalification peut exposer le payeur aux retenues à la source et aux responsabilités du Code.',
    },
  },
  includes: [
    {
      en: 'Independent status',
      fr: 'Statut indépendant',
    },
    {
      en: 'Services & deliverables',
      fr: 'Services et livrables',
    },
    {
      en: 'Fees & invoicing',
      fr: 'Honoraires et facturation',
    },
    {
      en: 'Own tools & risk',
      fr: 'Outils et risque propres',
    },
    {
      en: 'IP assignment',
      fr: 'Cession de PI',
    },
    {
      en: 'No employee benefits',
      fr: 'Aucun avantage d’employé',
    },
    {
      en: 'Term & termination',
      fr: 'Durée et cessation',
    },
  ],
  questions: [
    {
      id: 'contractor_name',
      section: {
        en: 'Party',
        fr: 'Partie',
      },
      label: {
        en: 'Contractor / business name',
        fr: 'Nom du travailleur / de l’entreprise',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. Rivard Consulting Inc.',
        fr: 'p. ex. Rivard Conseil inc.',
      },
    },
    {
      id: 'services',
      section: {
        en: 'Services',
        fr: 'Services',
      },
      label: {
        en: 'Services provided',
        fr: 'Services fournis',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'Describe the deliverables and scope.',
        fr: 'Décrivez les livrables et la portée.',
      },
    },
    {
      id: 'fee_basis',
      section: {
        en: 'Fees',
        fr: 'Honoraires',
      },
      label: {
        en: 'Fee & basis',
        fr: 'Honoraires et base',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. $95/hr, invoiced monthly',
        fr: 'p. ex. 95 $/h, facturé mensuellement',
      },
    },
    {
      id: 'engagement_length',
      section: {
        en: 'Term',
        fr: 'Durée',
      },
      label: {
        en: 'Engagement length',
        fr: 'Durée de l’engagement',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. 6 months',
        fr: 'p. ex. 6 mois',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Independent Contractor Agreement',
        fr: 'Contrat de travailleur autonome',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Between {{org}} and {{contractor_name}}, effective {{today}}.',
        fr: 'Entre {{org}} et {{contractor_name}}, en vigueur le {{today}}.',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'The Contractor is an independent business, controls how the work is done, uses its own tools, and is not an employee of {{org}}. The Contractor is responsible for its own taxes, remittances, and insurance.',
        fr: 'Le Contractant est une entreprise indépendante, contrôle l’exécution du travail, utilise ses propres outils et n’est pas un employé de {{org}}. Il est responsable de ses impôts, remises et assurances.',
      },
      n: 1,
      heading: {
        en: 'Independent status',
        fr: 'Statut indépendant',
      },
    },
    {
      type: 'clause',
      text: {
        en: 'Services: {{services}}. Fees: {{fee_basis}}, over an engagement of {{engagement_length}}.',
        fr: 'Services : {{services}}. Honoraires : {{fee_basis}}, sur un engagement de {{engagement_length}}.',
      },
      n: 2,
      heading: {
        en: 'Services & fees',
        fr: 'Services et honoraires',
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
  subject: 'external',
  bodyHtmlEn:
    '<h1 class="center">Independent Contractor Agreement</h1>\n<p>This Independent Contractor Agreement (the <strong>Agreement</strong>) is made on <strong><span class="mf">{{agreement_date}}</span></strong>.</p>\n<h2>Between</h2>\n<p><strong><span class="mf">{{employer_legal_name}}</span></strong>, with its principal office at <strong><span class="mf">{{employer_address}}</span></strong> (the <strong>Client</strong>),</p>\n<p>— and —</p>\n<p><strong><span class="mf">{{contractor_legal_name}}</span></strong>, of <strong><span class="mf">{{contractor_address}}</span></strong> (the <strong>Contractor</strong>).</p>\n<h2>Framing</h2>\n<p>This Agreement sets out the terms under which the Contractor will provide services to the Client. We want to be upfront about one important thing: this is a business-to-business relationship, not employment. We have drafted it that way intentionally, and we expect both Parties to behave consistently with that. If how we actually work together ever starts to look more like employment — because of direction, control, integration, or any of the factors in *671122 Ontario Ltd. v. Sagaz Industries Canada Inc.*, 2001 SCC 59 — we will have a conversation and, if necessary, restructure the relationship rather than leave it misclassified.</p>\n<h2>1. Services</h2>\n<p>The Contractor will provide the services described in Schedule A — Statement of Work (the <strong>Services</strong>). The Contractor decides, within reason, how and where to perform the Services, subject only to any schedule, deliverables, quality standards or security requirements set out in Schedule A.</p>\n<h2>2. Independent status</h2>\n<p>The Contractor is an independent business, not an employee, partner, agent or joint venturer of the Client. The Contractor:</p>\n<ul><li>is free to accept work from other clients, subject only to the confidentiality and conflict-of-interest provisions in this Agreement;</li><li>provides its own tools, equipment and workspace, except any items the Client specifically agrees to supply in Schedule A;</li><li>is responsible for its own taxes, CPP/QPP, EI (if applicable), HST/GST/QST registration and remittance, and its own insurance (including commercial general liability and, where applicable, professional liability);</li><li>may subcontract the Services only with the Client\'s prior written consent, and remains fully responsible for its subcontractors;</li><li>is not entitled to employee benefits, vacation pay, overtime, statutory holiday pay, or termination or severance entitlements under the employment standards legislation that applies to the Client.</li></ul>\n<p>Nothing in this Agreement makes the Contractor a "dependent contractor" under the line of authority that includes *McKee v. Reid\'s Heritage Homes Ltd.*, 2009 ONCA 916. The Parties have structured the relationship deliberately to avoid that classification.</p>\n<h2>3. Fees and expenses</h2>\n<p>The Client will pay the Contractor <strong><span class="mf">{{contractor_fee_description}}</span></strong>, plus applicable HST/GST/QST, against valid invoices submitted <strong><span class="mf">{{invoice_frequency}}</span></strong> to <strong><span class="mf">{{ap_contact_email}}</span></strong>. Undisputed invoices are payable within <strong><span class="mf">{{payment_terms_days}}</span></strong> days. Reasonable, pre-approved expenses are reimbursable upon production of receipts.</p>\n<h2>4. Term and termination</h2>\n<p>This Agreement begins on <strong><span class="mf">{{services_start_date}}</span></strong> and continues until <strong><span class="mf">{{services_end_date}}</span></strong>, unless ended earlier in accordance with this section. Either Party may end this Agreement on <strong><span class="mf">{{contractor_notice_days}}</span></strong> days\' written notice, with or without reason. Either Party may end this Agreement immediately on written notice if the other Party materially breaches the Agreement and fails to cure the breach within <strong><span class="mf">{{cure_period_days}}</span></strong> days, or becomes insolvent. On termination, the Client will pay for Services satisfactorily completed up to the termination date.</p>\n<h2>5. Confidentiality</h2>\n<p>The Contractor will keep the Client\'s Confidential Information confidential during and after the term of this Agreement, on the terms of our standard Confidentiality Agreement, which is incorporated by reference. Confidential Information is broadly defined and includes client, personnel, technology and business information. This obligation survives the end of this Agreement.</p>\n<h2>6. Intellectual property</h2>\n<p>All deliverables created by the Contractor specifically for the Client under this Agreement (the <strong>Deliverables</strong>) are a work made for hire to the fullest extent permitted by law, and otherwise are assigned to the Client upon creation, including copyright and all other IP rights. The Contractor waives all moral rights in the Deliverables to the extent permitted by law. The Contractor retains ownership of any pre-existing materials, tools and know-how used to create the Deliverables, and grants the Client a perpetual, worldwide, royalty-free licence to use those embedded materials as part of the Deliverables.</p>\n<h2>7. Privacy and data</h2>\n<p>If the Services involve personal information, the Contractor will handle it in accordance with the <strong>Personal Information Protection and Electronic Documents Act</strong>, S.C. 2000, c. 5 and any applicable provincial privacy law (including Québec\'s Law 25 — <strong>An Act to modernize legislative provisions as regards the protection of personal information</strong>, S.Q. 2021, c. 25), use it only for the Services, protect it with reasonable safeguards, and return or destroy it at the end of the Agreement. The Contractor will promptly report any privacy incident to the Client.</p>\n<h2>8. Representations and warranties</h2>\n<p>The Contractor represents and warrants that: (a) it has the right and authority to enter into this Agreement; (b) it will perform the Services in a professional, workmanlike manner consistent with industry standards; (c) the Deliverables will not infringe any third-party IP rights; and (d) the Contractor will comply with all applicable laws, including health and safety, anti-bribery, anti-spam and human rights laws.</p>\n<h2>9. Indemnity and limitation of liability</h2>\n<p>Each Party will indemnify the other for damages arising from the indemnifying Party\'s breach of this Agreement, gross negligence or wilful misconduct. Neither Party is liable to the other for indirect, consequential, special or punitive damages, and each Party\'s total liability for direct damages under this Agreement is capped at the fees paid or payable under this Agreement in the <strong><span class="mf">{{liability_cap_period}}</span></strong> preceding the event giving rise to the claim. This cap does not apply to the Contractor\'s confidentiality, IP assignment, privacy, or indemnity obligations, or to a Party\'s gross negligence or wilful misconduct.</p>\n<h2>10. General</h2>\n<p>This Agreement is governed by the laws of the Province of <strong>Province of Ontario</strong>. It is the entire agreement between the Parties about its subject matter and replaces any earlier agreement. It may only be amended in writing signed by both Parties. If any part is found unenforceable, the rest continues in full force. Neither Party may assign this Agreement without the other\'s prior written consent, except to a successor of all or substantially all of its business. The Contractor confirms that it has had the opportunity to obtain independent legal and tax advice before signing.</p>\n<p>By signing below, the Parties confirm they have read and accept the terms of this Agreement.</p>\n<div class="spacer">&nbsp;</div>\n<table class="sig"><tr>\n        <td>\n          <div class="sig-line">______________________________________</div>\n          <div class="sig-under">Signature — <span class="mf">{{employer_signer_name}}</span></div>\n          <div class="sig-under"><span class="mf">{{employer_signer_title}}</span></div>\n          <div class="sig-under">Date: <span class="mf">{{employer_signature_date}}</span></div>\n          <div class="sig-label">CLIENT</div>\n        </td>\n        <td>\n          <div class="sig-line">______________________________________</div>\n          <div class="sig-under">Signature — <span class="mf">{{contractor_legal_name}}</span></div>\n          <div class="sig-under"><span class="mf">{{contractor_signer_title}}</span></div>\n          <div class="sig-under">Date: <span class="mf">{{employee_signature_date}}</span></div>\n          <div class="sig-label">CONTRACTOR</div>\n        </td></tr></table>',
}
