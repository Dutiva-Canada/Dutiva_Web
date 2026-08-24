import { defineMessages } from '../core'

/**
 * Global search overlay (⌘K) — tabs, kind labels, placeholders, empty state.
 * EN + FR ported verbatim from `App v2.dc.html` `buildSearchView()` /
 * `buildI18n()` (all strings are inline `L(en, fr)` pairs in the prototype).
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * Search components resolve these via `useI18n().x(searchMessages.key)` so
 * they typecheck before registration; they can switch to `t('search_…')`
 * after.
 */
export const searchMessages = defineMessages({
  /* Dialog chrome — aria-label mirrors the prototype's `str.search`. */
  search_dialog_label: { en: 'Search', fr: 'Rechercher' },
  search_placeholder: {
    en: 'Search conversations, documents, knowledge…',
    fr: 'Rechercher des conversations, documents, savoir…',
  },

  /* Tab row (buildSearchView `tabs`). */
  search_tab_all: { en: 'All', fr: 'Tout' },
  search_tab_people: { en: 'People', fr: 'Personnes' },
  search_tab_cases: { en: 'Cases', fr: 'Dossiers' },
  search_tab_chats: { en: 'Conversations', fr: 'Conversations' },
  search_tab_documents: { en: 'Documents', fr: 'Documents' },
  search_tab_knowledge: { en: 'Knowledge', fr: 'Savoir' },

  /* Section labels. */
  search_pinned: { en: 'Pinned', fr: 'Épinglé' },
  search_results: { en: 'Results', fr: 'Résultats' },

  /* Result kind labels (78px column). */
  search_kind_person: { en: 'Person', fr: 'Personne' },
  search_kind_case: { en: 'Case', fr: 'Dossier' },
  search_kind_conversation: { en: 'Conversation', fr: 'Conversation' },
  search_kind_document: { en: 'Document', fr: 'Document' },
  search_kind_comms: { en: 'Comms', fr: 'Comms' },
  search_kind_task: { en: 'Task', fr: 'Tâche' },
  search_kind_compliance: { en: 'Compliance', fr: 'Conformité' },
  search_kind_policy: { en: 'Policy', fr: 'Politique' },
  search_kind_knowledge: { en: 'Knowledge', fr: 'Savoir' },

  /* Restricted lock badge (sensitive cases, high-risk documents). */
  search_restricted: { en: 'Restricted', fr: 'Restreint' },

  /* High-risk document sub suffix (leading separator is part of the string). */
  search_doc_high_risk_suffix: {
    en: ' · High-risk — review gate applies',
    fr: ' · Risque élevé — vérification requise',
  },

  /* Empty state — rendered as `{search_no_results} “{query}”`. */
  search_no_results: { en: 'No results for', fr: 'Aucun résultat pour' },
  search_no_results_hint: {
    en: 'Try a name, case, document, task, policy, or obligation.',
    fr: 'Essayez un nom, un dossier, un document, une tâche, une politique ou une obligation.',
  },

  search_loading: { en: 'Loading workspace records…', fr: 'Chargement des dossiers…' },
  search_no_org: {
    en: 'Sign in and open a production workspace to search your records.',
    fr: 'Connectez-vous et ouvrez un espace de production pour rechercher vos dossiers.',
  },
  search_load_failed: {
    en: 'Could not load search index. Try again in a moment.',
    fr: 'Impossible de charger l’index. Réessayez dans un instant.',
  },
})
