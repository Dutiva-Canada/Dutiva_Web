import { defineMessages } from '../core'

/**
 * Cross-module entity links panel.
 * EN + FR [FR self-authored].
 */
export const entityLinksMessages = defineMessages({
  el_title: { en: 'Linked records', fr: 'Enregistrements liés' },
  el_empty: {
    en: 'No linked records yet.',
    fr: 'Aucun enregistrement lié.',
  },
  el_add: { en: 'Add link', fr: 'Ajouter un lien' },
  el_remove: { en: 'Remove link', fr: 'Retirer le lien' },
  el_target_module: { en: 'Module', fr: 'Module' },
  el_target_record: { en: 'Record', fr: 'Enregistrement' },
  el_link: { en: 'Link', fr: 'Lier' },
  el_loading: { en: 'Loading links…', fr: 'Chargement des liens…' },
  el_error: {
    en: 'Could not load links.',
    fr: 'Impossible de charger les liens.',
  },
})
