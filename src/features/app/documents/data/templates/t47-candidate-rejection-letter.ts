/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. Ported from the legacy fixture
   src/data/documents.ts (EF7). All FR is [FR self-authored]. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT47: DocTemplate = {
  id: 'tpl_t47',
  tid: 'T47',
  key: 'candidate_rejection_letter',
  kind: 'letter',
  category: 'hiring',
  core: false,
  name: {
    en: 'Candidate rejection letter',
    fr: 'Lettre de refus de candidature',
  },
  desc: {
    en: 'A respectful, professional decline sent to an unsuccessful candidate after interview.',
    fr: 'Un refus respectueux et professionnel envoyé à un candidat non retenu après l’entrevue.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'not_reviewed',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-06',
  updatedAt: '2026-08-06',
  estMinutes: 3,
  usageCount: 0,
  statutory: [],
  jurisdictionNotes: {
    ON: {
      en: 'No jurisdiction-specific requirement — a professional, respectful decline is the standard everywhere.',
      fr: 'Aucune exigence propre à la province — un refus professionnel et respectueux est la norme partout.',
    },
    QC: {
      en: 'No jurisdiction-specific requirement — send in the candidate’s interview language.',
      fr: 'Aucune exigence propre à la province — envoyer dans la langue d’entrevue du candidat.',
    },
    FED: {
      en: 'No jurisdiction-specific requirement for federally regulated employers.',
      fr: 'Aucune exigence propre à la province pour les employeurs sous réglementation fédérale.',
    },
  },
  includes: [
    { en: 'Thank-you for the application', fr: 'Remerciement pour la candidature' },
    { en: 'The decision', fr: 'La décision' },
    { en: 'Optional: resume retention note', fr: 'Optionnel : conservation du CV' },
  ],
  questions: [
    {
      id: 'candidate_name',
      section: { en: 'Candidate', fr: 'Candidat(e)' },
      label: { en: 'Candidate full name', fr: 'Nom complet du candidat(e)' },
      type: 'text',
      required: true,
      placeholder: { en: 'Full name', fr: 'Nom complet' },
    },
    {
      id: 'position_title',
      section: { en: 'Role', fr: 'Poste' },
      label: { en: 'Position title', fr: 'Titre du poste' },
      type: 'text',
      required: true,
      placeholder: { en: 'e.g. Senior Analyst', fr: 'p. ex. Analyste principal' },
    },
    {
      id: 'keep_on_file',
      section: { en: 'Resume retention', fr: 'Conservation du CV' },
      label: { en: 'Keep resume on file for future opportunities?', fr: 'Conserver le CV pour de futures occasions ?' },
      type: 'radio',
      required: true,
      options: [
        { value: 'yes', label: { en: 'Yes', fr: 'Oui' } },
        { value: 'no', label: { en: 'No', fr: 'Non' } },
      ],
    },
  ],
  preview: [
    {
      type: 'title',
      text: { en: 'Thank you for your interest', fr: 'Merci de votre intérêt' },
    },
    {
      type: 'meta',
      text: { en: '{{org}} · {{today}}', fr: '{{org}} · {{today}}' },
    },
    {
      type: 'para',
      text: {
        en: 'Dear {{candidate_name}},',
        fr: 'Madame, Monsieur {{candidate_name}},',
      },
    },
    {
      type: 'para',
      text: {
        en: 'We appreciate the time you invested in interviewing for the {{position_title}} role. After careful consideration, we’ve decided to move forward with another candidate.',
        fr: 'Nous vous remercions du temps consacré à l’entrevue pour le poste de {{position_title}}. Après mûre réflexion, nous avons décidé de poursuivre avec un autre candidat.',
      },
    },
    {
      type: 'para',
      text: {
        en: 'We were impressed with your background and will keep your resume on file for future opportunities that may be a better fit.',
        fr: 'Votre parcours nous a impressionnés et nous conserverons votre CV pour de futures occasions qui pourraient mieux vous convenir.',
      },
      when: { answer: { id: 'keep_on_file', equals: ['yes'] } },
    },
    {
      type: 'sig',
      roles: [{ en: 'Hiring manager', fr: 'Responsable du recrutement' }],
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'candidate',
}
