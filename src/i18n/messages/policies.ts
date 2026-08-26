import { defineMessages } from '../core'

/**
 * Policies view chrome — transcribed from the App v2 prototype
 * (`buildPoliciesView()`, `str.sub_policies`, the policies markup and the
 * `lbl.reviewWithAdvisor` / `'Draft it now'` action labels).
 *
 * EN verbatim from the prototype; FR from its `buildI18n()` / `frDict()` /
 * `lbl` map. FR strings with no source in the prototype are marked
 * [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * The view resolves these via `useI18n().x(policiesMessages.key)`.
 */
export const policiesMessages = defineMessages({
  policies_subtitle: {
    en: 'Review status across your policy library.',
    fr: 'État de révision de votre bibliothèque de politiques.',
  },
  /* The prototype markup hardcodes "Last reviewed {updated}" in EN only. */
  policies_last_reviewed_prefix: { en: 'Last reviewed ', fr: 'Dernière révision : ' }, // [FR self-authored]
  policies_review_advisor: { en: 'Review with Advisor', fr: 'Réviser avec le Conseiller' },
  policies_draft_now: { en: 'Draft it now', fr: 'La rédiger maintenant' },

  /* Advisor rail openers (prototype `buildPoliciesView().onReview`). */
  policies_rail_missing_text: {
    en: 'This policy hasn’t been generated yet. I can draft a first version now.',
    // [FR self-authored]
    fr: 'Cette politique n’a pas encore été générée. Je peux en rédiger une première version dès maintenant.',
  },
  policies_rail_take_text: {
    en: 'Here’s a quick take on this policy.',
    // [FR self-authored]
    fr: 'Voici un aperçu rapide de cette politique.',
  },

  /* ── Production policy register (real persistence — no design-handoff
     counterpart; [FR self-authored] throughout) ─────────────────────────── */
  policies_prod_add: { en: 'Add policy', fr: 'Ajouter une politique' },
  policies_prod_cancel: { en: 'Cancel', fr: 'Annuler' },
  policies_prod_name: { en: 'Policy name', fr: 'Nom de la politique' },
  policies_prod_status: { en: 'Status', fr: 'Statut' },
  policies_prod_last_reviewed: {
    en: 'Last reviewed (optional)',
    fr: 'Dernière révision (facultatif)',
  },
  policies_prod_save: { en: 'Save policy', fr: 'Enregistrer la politique' },
  policies_prod_count_one: { en: 'policy', fr: 'politique' },
  policies_prod_count_many: { en: 'policies', fr: 'politiques' },
  policies_prod_loading: { en: 'Loading…', fr: 'Chargement…' },
  policies_prod_empty_title: { en: 'No policies yet', fr: 'Aucune politique pour l’instant' },
  policies_prod_empty_body: {
    en: "Add policies you have — or flag ones you're missing — to track what's on the books.",
    fr: 'Ajoutez les politiques que vous avez — ou signalez celles qui manquent — pour suivre ce qui est en vigueur.',
  },
  policies_prod_error: {
    en: 'Couldn’t load policies.',
    fr: 'Impossible de charger les politiques.',
  },
  policies_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  policies_prod_added: { en: 'Policy added', fr: 'Politique ajoutée' },
  policies_prod_add_failed: {
    en: 'Couldn’t add the policy. Try again.',
    fr: 'Impossible d’ajouter la politique. Réessayez.',
  },
  policies_prod_remove: { en: 'Remove', fr: 'Retirer' },
  policies_prod_removed: { en: 'Policy removed', fr: 'Politique retirée' },
  policies_prod_remove_failed: {
    en: 'Couldn’t remove the policy.',
    fr: 'Impossible de retirer la politique.',
  },
  policies_prod_status_updated: { en: 'Status updated', fr: 'Statut mis à jour' },
  policies_prod_status_update_failed: {
    en: 'Couldn’t update the policy.',
    fr: 'Impossible de mettre à jour la politique.',
  },
  policies_prod_status_aria: { en: 'Policy status', fr: 'Statut de la politique' },
  policies_prod_reviewed_prefix: { en: 'Last reviewed: ', fr: 'Dernière révision : ' },
  policies_prod_status_up_to_date: { en: 'Up to date', fr: 'À jour' },
  policies_prod_status_needs_review: { en: 'Needs review', fr: 'À réviser' },
  policies_prod_status_missing: { en: 'Missing', fr: 'Manquante' },
})
