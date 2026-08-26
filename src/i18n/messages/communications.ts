import { defineMessages } from '../core'

/**
 * Communications view — chrome strings from the prototype's
 * `buildCommunicationsView()` / `sendCommunication()` / `markCommSent()`
 * (App v2.dc.html) plus the `lbl` entries it renders (commsSubtitle,
 * reviewWithAdvisor). EN verbatim; FR from the prototype's inline `L(en, fr)`
 * pairs and `buildI18n()`.
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * The view resolves these via `useI18n().x(communicationsMessages.key)`.
 */
export const communicationsMessages = defineMessages({
  comms_subtitle: {
    en: 'Advisor reviews every announcement for jurisdiction and tone before it goes out.',
    fr: 'Le Conseiller examine chaque annonce pour la compétence et le ton avant l’envoi.',
  },
  comms_review_with_advisor: { en: 'Review with Advisor', fr: 'Réviser avec le Conseiller' },

  /* Status labels (prototype `statusLabel` map — view-level wording). */
  comms_status_draft: { en: 'Draft', fr: 'Ébauche' },
  comms_status_scheduled: { en: 'Scheduled', fr: 'Planifié' },
  comms_status_sent: { en: 'Sent', fr: 'Envoyé' },
  comms_just_now: { en: 'Just now', fr: 'À l’instant' },

  /* Send buttons. */
  comms_send: { en: 'Send', fr: 'Envoyer' },
  comms_send_now: { en: 'Send now', fr: 'Envoyer maintenant' },

  /* Advisor review dimensions (prototype `dims(...)`). */
  comms_dim_tone: { en: 'Tone', fr: 'Ton' },
  comms_dim_legal: { en: 'Legal', fr: 'Juridique' },
  comms_dim_clarity: { en: 'Clarity', fr: 'Clarté' },
  comms_dim_policy: { en: 'Policy', fr: 'Politiques' },
  comms_dim_ok_suffix: { en: ' · OK', fr: ' · OK' },
  comms_dim_review_suffix: { en: ' · Review', fr: ' · À revoir' },

  /* Sensitive-send review gate (prototype `sendCommunication`). */
  comms_sensitive_intro: {
    en: 'This is a sensitive communication — review before sending.',
    fr: 'Communication sensible — vérifiez avant l’envoi.',
  },
  comms_gate_title: { en: 'Review before sending', fr: 'Vérification avant l’envoi' },
  comms_gate_confirm: {
    en: 'Mark reviewed & send',
    fr: 'Marquer comme vérifié et envoyer',
  },
  comms_sent_toast: {
    en: 'Sent — recorded in the communication history',
    fr: 'Envoyé — consigné dans l’historique des communications',
  },

  /* "Review with Advisor" rail turn (prototype `onReview` per comm). */
  comms_review_intro: {
    en: 'Here’s my read on this message before it goes out.',
    fr: 'Voici mon évaluation de ce message avant l’envoi.',
  },
  comms_review_card_title: { en: 'Advisor review', fr: 'Examen du Conseiller' },
  comms_open_in_documents: { en: 'Open in Documents', fr: 'Ouvrir dans Documents' },
  /* ── Production mode (real persistence, migration 0040) ──────────────────
     No Advisor review dimensions here: the demo's tone/legal/clarity/policy
     chips assert a review the product never performs. [FR self-authored.] */
  comms_prod_loading: { en: 'Loading communications…', fr: 'Chargement des communications…' },
  comms_prod_count_one: { en: 'message', fr: 'message' },
  comms_prod_count_many: { en: 'messages', fr: 'messages' },
  comms_prod_add: { en: 'Log a message', fr: 'Consigner un message' },
  comms_prod_save: { en: 'Save', fr: 'Enregistrer' },
  comms_prod_cancel: { en: 'Cancel', fr: 'Annuler' },
  comms_prod_title: { en: 'Title', fr: 'Titre' },
  comms_prod_audience: { en: 'Audience', fr: 'Destinataires' },
  comms_prod_channel: { en: 'Channel', fr: 'Canal' },
  comms_prod_status: { en: 'Status', fr: 'Statut' },
  comms_prod_scheduled_for: { en: 'Scheduled for', fr: 'Prévu pour' },
  comms_prod_template: { en: 'Drafted from', fr: 'Rédigé à partir de' },
  comms_prod_template_none: { en: 'No template', fr: 'Aucun modèle' },
  comms_prod_note: { en: 'Note', fr: 'Note' },
  comms_prod_remove: { en: 'Remove', fr: 'Retirer' },
  comms_prod_mark_sent: { en: 'Mark as sent', fr: 'Marquer comme envoyé' },
  comms_prod_sent_prefix: { en: 'Sent ', fr: 'Envoyé le ' },
  comms_prod_scheduled_prefix: { en: 'Scheduled ', fr: 'Prévu le ' },
  comms_prod_status_draft: { en: 'Draft', fr: 'Brouillon' },
  comms_prod_status_scheduled: { en: 'Scheduled', fr: 'Prévu' },
  comms_prod_status_sent: { en: 'Sent', fr: 'Envoyé' },
  comms_prod_channel_email: { en: 'Email', fr: 'Courriel' },
  comms_prod_channel_meeting: { en: 'Meeting', fr: 'Réunion' },
  comms_prod_channel_intranet: { en: 'Intranet', fr: 'Intranet' },
  comms_prod_channel_letter: { en: 'Letter', fr: 'Lettre' },
  comms_prod_channel_other: { en: 'Other', fr: 'Autre' },
  comms_prod_added: { en: 'Message logged', fr: 'Message consigné' },
  comms_prod_add_failed: {
    en: 'Couldn’t log the message. Try again.',
    fr: 'Impossible de consigner le message. Réessayez.',
  },
  comms_prod_removed: { en: 'Message removed', fr: 'Message retiré' },
  comms_prod_remove_failed: {
    en: 'Couldn’t remove the message.',
    fr: 'Impossible de retirer le message.',
  },
  comms_prod_marked_sent: { en: 'Marked as sent', fr: 'Marqué comme envoyé' },
  comms_prod_mark_sent_failed: {
    en: 'Couldn’t update the message.',
    fr: 'Impossible de mettre à jour le message.',
  },
  comms_prod_error: {
    en: 'Couldn’t load communications.',
    fr: 'Impossible de charger les communications.',
  },
  comms_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  comms_prod_empty_title: { en: 'No messages logged yet', fr: 'Aucun message consigné' },
  comms_prod_empty_body: {
    en: 'Log an announcement to keep a record of what went out, to whom, and when.',
    fr: 'Consignez une annonce pour garder une trace de ce qui a été diffusé, à qui et quand.',
  },
  /* Says plainly what "Mark as sent" does, because the demo's Send button
     implied a delivery path the product does not have. */
  comms_prod_record_note: {
    en: 'This is a record of what you sent. Dutiva does not deliver messages — marking one sent logs that you did.',
    fr: 'Il s’agit d’un registre de ce que vous avez envoyé. Dutiva ne diffuse pas les messages — les marquer comme envoyés consigne que vous l’avez fait.',
  },
  comms_prod_edit: { en: 'Edit', fr: 'Modifier' },
  comms_prod_updated: { en: 'Message updated', fr: 'Message mis à jour' },
  comms_prod_update_failed: {
    en: 'Couldn’t update the message.',
    fr: 'Impossible de mettre à jour le message.',
  },
  comms_prod_delete_confirm: {
    en: 'Remove this message from the log?',
    fr: 'Retirer ce message du registre?',
  },
  comms_prod_delete_cancel: { en: 'Cancel', fr: 'Annuler' },
  comms_prod_confirm_delete: { en: 'Remove', fr: 'Retirer' },
  comms_prod_review_rail_title: { en: 'Advisor review', fr: 'Examen du Conseiller' },
  comms_prod_review_rail_body: {
    en: 'Tone, legal, clarity, and policy checks appear when Advisor has reviewed a draft.',
    fr: 'Les vérifications de ton, juridiques, de clarté et de politiques apparaissent lorsque le Conseiller a examiné un brouillon.',
  },
})
