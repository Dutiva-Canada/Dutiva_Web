import { defineMessages } from '../core'

/**
 * Governance workspace chrome — register, decisions, officers, shareholders.
 * EN + FR [FR self-authored].
 */
export const governanceMessages = defineMessages({
  gov_title: { en: 'Governance', fr: 'Gouvernance' },
  gov_subtitle: {
    en: 'A lightweight corporate register, not a board portal.',
    fr: 'Un registre corporatif léger, pas un portail de conseil.',
  },
  gov_tab_overview: { en: 'Overview', fr: 'Aperçu' },
  gov_tab_records: { en: 'Records', fr: 'Registres' },
  gov_tab_decisions: { en: 'Decisions', fr: 'Décisions' },
  gov_tab_officers: { en: 'Officers', fr: 'Dirigeants' },
  gov_tab_shareholders: { en: 'Shareholders', fr: 'Actionnaires' },
  gov_empty_title: { en: 'No governance records yet', fr: 'Aucun dossier de gouvernance' },
  gov_empty_body: {
    en: 'Add your first corporate record — articles, by-laws, or minutes.',
    fr: 'Ajoutez votre premier dossier corporatif — articles, statuts ou procès-verbaux.',
  },
  gov_empty_add: { en: 'Add record', fr: 'Ajouter un dossier' },
  gov_link_document: { en: 'Open document', fr: 'Ouvrir le document' },
  gov_record_type_articles: { en: 'Articles', fr: 'Statuts constitutifs' },
  gov_record_type_bylaw: { en: 'By-law', fr: 'Règlement' },
  gov_record_type_resolution: { en: 'Resolution', fr: 'Résolution' },
  gov_record_type_minutes: { en: 'Minutes', fr: 'Procès-verbal' },
  gov_record_type_register: { en: 'Register', fr: 'Registre' },
  gov_status_active: { en: 'Active', fr: 'Actif' },
  gov_status_superseded: { en: 'Superseded', fr: 'Remplacé' },
  gov_status_pending_review: { en: 'Pending review', fr: 'En révision' },
  gov_decision_status_proposed: { en: 'Proposed', fr: 'Proposé' },
  gov_decision_status_adopted: { en: 'Adopted', fr: 'Adopté' },
  gov_decision_status_rescinded: { en: 'Rescinded', fr: 'Révoqué' },
  gov_officer_role_director: { en: 'Director', fr: 'Administrateur' },
  gov_officer_role_president: { en: 'President', fr: 'Président' },
  gov_officer_role_secretary: { en: 'Secretary', fr: 'Secrétaire' },
  gov_officer_role_treasurer: { en: 'Treasurer', fr: 'Trésorier' },
  gov_officer_active: { en: 'Active', fr: 'Actif' },
  gov_officer_inactive: { en: 'Inactive', fr: 'Inactif' },
  gov_shareholder_total_shares: { en: 'shares issued', fr: 'actions émises' },
  gov_disclaimer: {
    en: 'Dutiva provides practical workflow support, not legal review.',
    fr: 'Dutiva offre un soutien pratique aux flux de travail, pas un examen juridique.',
  },
})
