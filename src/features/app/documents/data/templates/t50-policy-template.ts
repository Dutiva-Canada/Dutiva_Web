/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. Ported from the legacy fixture
   src/data/documents.ts (EF7). All FR is [FR self-authored].

   This is a generic policy shell — the Advisor tailors the body once you
   describe what the policy should cover. It exists so a user can start from
   structure rather than a blank page when no specific template fits. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT50: DocTemplate = {
  id: 'tpl_t50',
  tid: 'T50',
  key: 'policy_template',
  kind: 'policy',
  category: 'policies',
  core: false,
  name: {
    en: 'Policy template',
    fr: 'Modèle de politique',
  },
  desc: {
    en: 'A generic policy shell — purpose, scope, and detail sections the Advisor tailors once you describe what the policy should cover. Start here when no specific template fits.',
    fr: 'Un modèle de politique générique — objet, portée et sections de détail que le Conseiller adaptera une fois que vous aurez décrit ce que la politique doit couvrir. Commencez ici lorsqu’aucun modèle spécifique ne convient.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'hr_review_required',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-06',
  updatedAt: '2026-08-06',
  estMinutes: 8,
  usageCount: 0,
  statutory: [],
  jurisdictionNotes: {
    ON: {
      en: 'Generic shell — the Advisor tailors the body; jurisdiction-specific obligations depend on the policy topic.',
      fr: 'Modèle générique — le Conseiller adapte le corps ; les obligations propres à la province dépendent du sujet de la politique.',
    },
    QC: {
      en: 'If the policy will be distributed in Quebec, draft it in French first per the Charter of the French Language.',
      fr: 'Si la politique sera distribuée au Québec, la rédiger en français d’abord conformément à la Charte de la langue française.',
    },
    FED: {
      en: 'Federally regulated employers should check whether the policy topic falls under the Canada Labour Code.',
      fr: 'Les employeurs sous réglementation fédérale devraient vérifier si le sujet de la politique relève du Code canadien du travail.',
    },
  },
  includes: [
    { en: 'Purpose and scope', fr: 'Objet et portée' },
    { en: 'Who this policy applies to', fr: 'Personnes visées par cette politique' },
    {
      en: 'Policy detail (Advisor-tailored)',
      fr: 'Détail de la politique (adapté par le Conseiller)',
    },
  ],
  questions: [
    {
      id: 'policy_title',
      section: { en: 'Title', fr: 'Titre' },
      label: { en: 'Policy title', fr: 'Titre de la politique' },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. Social Media Policy',
        fr: 'p. ex. Politique sur les médias sociaux',
      },
    },
    {
      id: 'policy_scope',
      section: { en: 'Scope', fr: 'Portée' },
      label: {
        en: 'Who does this policy apply to?',
        fr: 'À qui cette politique s’applique-t-elle ?',
      },
      type: 'text',
      required: true,
      placeholder: {
        en: 'e.g. All employees and contractors',
        fr: 'p. ex. Tous les employés et entrepreneurs',
      },
    },
    {
      id: 'policy_detail',
      section: { en: 'Detail', fr: 'Détail' },
      label: {
        en: 'Describe what this policy should cover',
        fr: 'Décrivez ce que cette politique doit couvrir',
      },
      type: 'textarea',
      required: true,
      placeholder: {
        en: 'The Advisor will draft the policy body from your description.',
        fr: 'Le Conseiller rédigera le corps de la politique à partir de votre description.',
      },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Company Policy — {{policy_title}}',
        fr: 'Politique de l’entreprise — {{policy_title}}',
      },
    },
    {
      type: 'meta',
      text: { en: '{{org}} · {{jurisdiction}}', fr: '{{org}} · {{jurisdiction}}' },
    },
    {
      type: 'clause',
      n: 1,
      heading: { en: 'Purpose and scope', fr: 'Objet et portée' },
      text: {
        en: 'This policy applies to {{policy_scope}}. Its purpose is to set clear expectations and ensure consistency across the organization.',
        fr: 'Cette politique s’applique à {{policy_scope}}. Son objet est d’établir des attentes claires et d’assurer la cohérence dans l’ensemble de l’organisation.',
      },
    },
    {
      type: 'clause',
      n: 2,
      heading: { en: 'Policy detail', fr: 'Détail de la politique' },
      text: {
        en: '{{policy_detail}}',
        fr: '{{policy_detail}}',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'org',
}
