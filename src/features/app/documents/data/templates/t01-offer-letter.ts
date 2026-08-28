/* T01 — Offer of employment letter (Ontario).
   Replaced from T01_Offer_Letter_ON_Bilingual_EN_FR_polished.md (bilingual
   Ontario offer letter handoff). Ontario-only: QC and FED get their own
   jurisdiction-specific offer-letter templates (see T09 for QC) rather than
   this one carrying conditional Ontario-only clauses. Hand-maintained; keep
   the FR in step with the EN on every edit.

   Questions and preview blocks live in t01-offer-letter.questions.ts and
   t01-offer-letter.preview.ts — edit those when changing wizard or body copy. */
import type { DocTemplate } from '../types'
import { t01OfferLetterQuestions } from './t01-offer-letter.questions'
import { t01OfferLetterPreview } from './t01-offer-letter.preview'

export const tplT01: DocTemplate = {
  id: 'tpl_t01',
  tid: 'T01',
  key: 'offer_letter',
  kind: 'letter',
  category: 'hiring',
  core: true,
  name: {
    en: 'Offer of employment letter (Ontario)',
    fr: 'Lettre d’offre d’emploi (Ontario)',
  },
  desc: {
    en: 'A bilingual Ontario offer of employment: role, pay, hours, benefits, vacation, probation, conditions, governing terms and acceptance.',
    fr: 'Une offre d’emploi bilingue de l’Ontario : poste, rémunération, heures, avantages, vacances, probation, conditions, dispositions applicables et acceptation.',
  },
  jurisdictions: ['ON'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v5',
  versionNumber: 5,
  effectiveDate: '2026-05-01',
  updatedAt: '2026-08-14',
  estMinutes: 12,
  usageCount: 128,
  statutory: [
    {
      en: 'Employment Standards Act, 2000 — minimum standards',
      fr: 'Loi de 2000 sur les normes d’emploi — normes minimales',
    },
    {
      en: 'Human Rights Code — non-discrimination in hiring',
      fr: 'Code des droits de la personne — non-discrimination à l’embauche',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'Written for Ontario employers. ESA, 2000 minimum standards cannot be contracted out of; a non-compliant termination clause can void the clause entirely (Waksdale v. Swegon, 2020 ONCA 391).',
      fr: 'Rédigé pour les employeurs de l’Ontario. Les normes minimales de la LNE de 2000 ne peuvent être écartées par contrat ; une clause de cessation non conforme peut être invalidée (Waksdale c. Swegon, 2020 ONCA 391).',
    },
  },
  includes: [
    { en: 'Employer information', fr: 'Renseignements sur l’employeur' },
    { en: 'Role, start date & reporting', fr: 'Poste, date de début et supervision' },
    {
      en: 'Employment type, hours & overtime',
      fr: 'Type d’emploi, heures et heures supplémentaires',
    },
    { en: 'Compensation & pay administration', fr: 'Rémunération et administration de la paie' },
    { en: 'Variable compensation', fr: 'Rémunération variable' },
    { en: 'Benefits & wellness', fr: 'Avantages sociaux et mieux-être' },
    {
      en: 'Vacation, vacation pay & public holidays',
      fr: 'Vacances, indemnité de vacances et jours fériés',
    },
    {
      en: 'Statutory leaves & required workplace policies',
      fr: 'Congés prévus par la loi et politiques obligatoires',
    },
    { en: 'Probationary period', fr: 'Période probatoire' },
    {
      en: 'Confidentiality & intellectual property',
      fr: 'Confidentialité et propriété intellectuelle',
    },
    { en: 'Ending employment', fr: 'Fin de l’emploi' },
    { en: 'Temporary layoff', fr: 'Mise à pied temporaire' },
    { en: 'Conditions of this offer', fr: 'Conditions de la présente offre' },
    { en: 'Governing documents & law', fr: 'Documents applicables et droit applicable' },
    { en: 'Acceptance & Schedule A', fr: 'Acceptation et annexe A' },
  ],
  questions: t01OfferLetterQuestions,
  preview: t01OfferLetterPreview,
  delivery: 'bilingual',
  subject: 'candidate',
}
