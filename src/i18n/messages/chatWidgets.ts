import { defineMessages } from '../core'

/**
 * Interactive chat widgets — chrome strings for the shared <ChatWidget />
 * system (calculators, charts, tables, checklists, timelines, comparison
 * cards) rendered from `dutiva-widget` spec blocks in assistant replies.
 *
 * EN drafted for this feature; FR marked [FR self-authored] throughout — no
 * prototype source exists for these strings.
 */
export const chatWidgetMessages = defineMessages({
  /* ── Shared frame ─────────────────────────────────────────────────────── */
  chatw_region_label: { en: 'Interactive tool', fr: 'Outil interactif' }, // [FR self-authored]
  chatw_fallback: {
    en: 'This interactive content could not be displayed.',
    fr: 'Ce contenu interactif n’a pas pu être affiché.',
  }, // [FR self-authored]

  /* ── Calculator ───────────────────────────────────────────────────────── */
  chatw_calc_estimate_disclaimer: {
    en: 'Estimate — verify against current legislation before relying on it.',
    fr: 'Estimation — vérifiez la législation en vigueur avant de vous y fier.',
  }, // [FR self-authored]

  /* ── Table ────────────────────────────────────────────────────────────── */
  chatw_table_search: { en: 'Filter rows', fr: 'Filtrer les lignes' }, // [FR self-authored]
  chatw_table_no_results: {
    en: 'No rows match that filter.',
    fr: 'Aucune ligne ne correspond à ce filtre.',
  }, // [FR self-authored]
  chatw_table_sort_asc: {
    en: 'sorted ascending — activate to sort descending',
    fr: 'tri croissant — activez pour trier en ordre décroissant',
  }, // [FR self-authored]
  chatw_table_sort_desc: {
    en: 'sorted descending — activate to clear the sort',
    fr: 'tri décroissant — activez pour retirer le tri',
  }, // [FR self-authored]
  chatw_table_sort_none: {
    en: 'activate to sort ascending',
    fr: 'activez pour trier en ordre croissant',
  }, // [FR self-authored]
  chatw_table_region: { en: 'Data table', fr: 'Tableau de données' }, // [FR self-authored]

  /* ── Checklist ────────────────────────────────────────────────────────── */
  chatw_checklist_progress: {
    en: '{done} of {total} done',
    fr: '{done} sur {total} terminés',
  }, // [FR self-authored]
  chatw_checklist_copy: { en: 'Copy summary', fr: 'Copier le résumé' }, // [FR self-authored]
  chatw_checklist_copied: { en: 'Copied', fr: 'Copié' }, // [FR self-authored]
  chatw_checklist_copy_failed: {
    en: 'Copy failed — clipboard unavailable',
    fr: 'Échec de la copie — presse-papiers indisponible',
  }, // [FR self-authored]

  /* ── Timeline ─────────────────────────────────────────────────────────── */
  chatw_timeline_done: { en: 'Done', fr: 'Terminé' }, // [FR self-authored]
  chatw_timeline_current: { en: 'Current', fr: 'En cours' }, // [FR self-authored]
  chatw_timeline_upcoming: { en: 'Upcoming', fr: 'À venir' }, // [FR self-authored]

  /* ── Comparison cards ─────────────────────────────────────────────────── */
  chatw_comparison_recommended: { en: 'Recommended', fr: 'Recommandé' }, // [FR self-authored]

  /* ── Demo view (/app/chat-widgets) ────────────────────────────────────── */
  chatw_demo_title: { en: 'Chat widgets', fr: 'Outils de clavardage' }, // [FR self-authored]
  chatw_demo_sub: {
    en: 'Interactive tools a chatbot can drop into a reply. Each one renders from a spec — a bot sends data, never code.',
    fr: 'Des outils interactifs qu’un agent peut insérer dans une réponse. Chacun est généré à partir d’une spécification — l’agent envoie des données, jamais du code.',
  }, // [FR self-authored]
  chatw_demo_flag_on: {
    en: 'Widgets enabled for: {surfaces}',
    fr: 'Outils activés pour : {surfaces}',
  }, // [FR self-authored]
  chatw_demo_flag_off: {
    en: 'Widget flag is off — chatbots render replies as plain text. Set VITE_INTERACTIVE_CHAT_WIDGETS or the dutiva:flag:interactiveChatWidgets localStorage key to opt a surface in.',
    fr: 'L’indicateur est désactivé — les agents affichent les réponses en texte brut. Définissez VITE_INTERACTIVE_CHAT_WIDGETS ou la clé localStorage dutiva:flag:interactiveChatWidgets pour activer une surface.',
  }, // [FR self-authored]
  chatw_demo_mixed_title: {
    en: 'Text and widgets in one reply',
    fr: 'Texte et outils dans une même réponse',
  }, // [FR self-authored]
  chatw_demo_fallback_title: {
    en: 'Graceful fallback for an invalid spec',
    fr: 'Repli gracieux pour une spécification invalide',
  }, // [FR self-authored]
})
