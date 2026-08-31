/* AUTHORED IN-REPO — not from the HR Documents Library handoff, so unlike
   T01–T16 this file is maintained by hand. Ported from the legacy fixture
   src/data/documents.ts (EF7). All FR is [FR self-authored]. */
import { DOC_DISCLAIMER_NOTE } from '../meta'
import type { DocTemplate } from '../types'

export const tplT49: DocTemplate = {
  id: 'tpl_t49',
  tid: 'T49',
  key: 'onboarding_package',
  kind: 'checklist',
  category: 'hiring',
  core: false,
  name: {
    en: 'Onboarding package',
    fr: 'Trousse d’intégration',
  },
  desc: {
    en: 'A first-week onboarding bundle: welcome letter, benefits enrollment, IT equipment checklist, statutory holiday calendar, and first-week schedule. French by default in Quebec per the Charter of the French Language.',
    fr: 'Une trousse d’intégration pour la première semaine : lettre de bienvenue, inscription aux avantages sociaux, liste de vérification de l’équipement informatique, calendrier des jours fériés et horaire de la première semaine. En français par défaut au Québec conformément à la Charte de la langue française.',
  },
  jurisdictions: ['ON', 'QC', 'FED'],
  risk: 'low',
  review: 'not_reviewed',
  requiresLawyerReview: false,
  version: 'v1',
  versionNumber: 1,
  effectiveDate: '2026-08-06',
  updatedAt: '2026-08-06',
  estMinutes: 10,
  usageCount: 0,
  statutory: [
    {
      en: 'Charter of the French Language (Quebec) — French by default',
      fr: 'Charte de la langue française (Québec) — français par défaut',
    },
  ],
  jurisdictionNotes: {
    ON: {
      en: 'No language requirement — English or French as agreed with the employee.',
      fr: 'Aucune exigence linguistique — anglais ou français selon l’entente avec l’employé.',
    },
    QC: {
      en: 'Documents must be provided in French by default, with an English version available on request. Confirm whether any employee-requested language exception applies.',
      fr: 'Les documents doivent être fournis en français par défaut, une version anglaise étant disponible sur demande. Confirmez si une exception linguistique demandée par l’employé s’applique.',
    },
    FED: {
      en: 'Federally regulated workplaces may provide documents in either official language.',
      fr: 'Les milieux de travail sous réglementation fédérale peuvent fournir les documents dans l’une ou l’autre des langues officielles.',
    },
  },
  includes: [
    { en: 'Welcome letter', fr: 'Lettre de bienvenue' },
    { en: 'Benefits enrollment', fr: 'Inscription aux avantages sociaux' },
    { en: 'IT equipment checklist', fr: 'Liste de vérification de l’équipement informatique' },
    { en: 'Statutory holiday calendar', fr: 'Calendrier des jours fériés' },
    { en: 'First-week schedule', fr: 'Horaire de la première semaine' },
  ],
  questions: [
    {
      id: 'employee_name',
      section: { en: 'Employee', fr: 'Employé(e)' },
      label: { en: 'Employee full name', fr: 'Nom complet de l’employé(e)' },
      type: 'text',
      required: true,
      placeholder: { en: 'Full name', fr: 'Nom complet' },
    },
    {
      id: 'office_location',
      section: { en: 'Location', fr: 'Lieu' },
      label: { en: 'Office location', fr: 'Lieu de travail' },
      type: 'text',
      required: true,
      placeholder: { en: 'e.g. Quebec Office', fr: 'p. ex. Bureau du Québec' },
    },
  ],
  preview: [
    {
      type: 'title',
      text: {
        en: 'Onboarding Package — {{office_location}}',
        fr: 'Trousse d’intégration — {{office_location}}',
      },
    },
    {
      type: 'meta',
      text: {
        en: '{{org}} · {{employee_name}} · {{jurisdiction}}',
        fr: '{{org}} · {{employee_name}} · {{jurisdiction}}',
      },
    },
    {
      type: 'para',
      text: {
        en: 'Documents provided in French by default per the Charter of the French Language, with an English version available on request.',
        fr: 'Documents fournis en français par défaut conformément à la Charte de la langue française, une version anglaise étant disponible sur demande.',
      },
      when: { juris: 'QC' },
    },
    {
      type: 'para',
      text: {
        en: 'Includes: welcome letter, benefits enrollment, IT equipment checklist, statutory holiday calendar, and first-week schedule.',
        fr: 'Comprend : lettre de bienvenue, inscription aux avantages sociaux, liste de vérification de l’équipement informatique, calendrier des jours fériés et horaire de la première semaine.',
      },
    },
    {
      type: 'note',
      tone: 'info',
      text: DOC_DISCLAIMER_NOTE,
    },
  ],
  subject: 'employee',
}
