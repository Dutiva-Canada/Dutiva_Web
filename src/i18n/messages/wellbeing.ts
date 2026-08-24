import { defineMessages } from '../core'

/**
 * Wellbeing & support view — chrome strings from the prototype's
 * `buildWellbeingView()` / `askAboutWellbeing()` (App v2.dc.html).
 * EN verbatim; FR from the prototype's inline `L(en, fr)` pairs, `buildI18n()`
 * and `frDict()`. FR strings with no source in the prototype are marked
 * [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * The view resolves these via `useI18n().x(wellbeingMessages.key)`.
 */
export const wellbeingMessages = defineMessages({
  wellbeing_banner: {
    en: 'Support signals are for supportive follow-up and workload review only. They must not be used for discipline, termination, compensation, ranking, or performance scoring.',
    fr: 'Les signaux de soutien servent uniquement au suivi bienveillant et à l’examen de la charge de travail. Ils ne doivent pas servir à la discipline, à la cessation d’emploi, à la rémunération, au classement ou à l’évaluation du rendement.',
  },

  /* Stat tiles. */
  wellbeing_active_label: { en: 'Active support signals', fr: 'Signaux de soutien actifs' },
  wellbeing_follow_label: { en: 'Follow-ups this week', fr: 'Suivis cette semaine' },

  /* Signal card meta labels. */
  wellbeing_source: { en: 'Source', fr: 'Source' },
  wellbeing_confidence: { en: 'Confidence', fr: 'Confiance' },
  wellbeing_recommended: {
    en: 'Recommended supportive action',
    fr: 'Action de soutien recommandée',
  },

  /* Signal card actions. */
  wellbeing_open_profile: { en: 'Open profile', fr: 'Ouvrir le profil' },
  wellbeing_draft_checkin: { en: 'Draft support check-in', fr: 'Rédiger un suivi de soutien' },

  wellbeing_audit_note: {
    en: 'Access to support signals is recorded in the audit log.',
    fr: 'L’accès aux signaux de soutien est consigné au journal d’audit.',
  },

  /* Check-in rail (prototype `askAboutWellbeing`). */
  wellbeing_rail_title_suffix: { en: ' — wellbeing', fr: ' — bien-être' }, // [FR self-authored]
  wellbeing_handle_title: { en: 'Handle with care', fr: 'À traiter avec délicatesse' }, // [FR self-authored]
  wellbeing_handle_body: {
    en: 'Frame any conversation around workload and support, not medical questions. If a medical cause surfaces, it may trigger a duty to inquire about accommodation.',
    // [FR self-authored — phrasing follows the prototype's lbl.wellbeingNote FR]
    fr: 'Orientez toute conversation vers la charge de travail et le soutien, pas vers des questions médicales. Si une cause médicale émerge, cela peut déclencher une obligation de s’informer sur l’accommodement.',
  },
  wellbeing_handle_citation: {
    en: 'Human rights — duty to accommodate',
    fr: 'Droits de la personne — obligation d’accommodement', // [FR self-authored]
  },
  wellbeing_draft_message_action: {
    en: 'Draft a check-in message',
    fr: 'Rédiger un message de suivi',
  },
  wellbeing_context_topic: { en: 'Wellbeing', fr: 'Bien-être' },
  /* ── Production mode (real persistence, migration 0041) ──────────────────
     A register of what the employer offers — never a list of who is
     struggling. See the migration header. [FR self-authored.] */
  wellbeing_prod_loading: {
    en: 'Loading wellbeing register…',
    fr: 'Chargement du registre de bien-être…',
  },
  wellbeing_prod_count_one: { en: 'initiative', fr: 'initiative' },
  wellbeing_prod_count_many: { en: 'initiatives', fr: 'initiatives' },
  wellbeing_prod_add: { en: 'Add initiative', fr: 'Ajouter une initiative' },
  wellbeing_prod_save: { en: 'Save', fr: 'Enregistrer' },
  wellbeing_prod_cancel: { en: 'Cancel', fr: 'Annuler' },
  wellbeing_prod_name: { en: 'Name', fr: 'Nom' },
  wellbeing_prod_kind: { en: 'Type', fr: 'Type' },
  wellbeing_prod_status: { en: 'Status', fr: 'Statut' },
  wellbeing_prod_owner: { en: 'Owner', fr: 'Responsable' },
  wellbeing_prod_review_date: { en: 'Next review', fr: 'Prochaine révision' },
  wellbeing_prod_note: { en: 'Note', fr: 'Note' },
  wellbeing_prod_remove: { en: 'Remove', fr: 'Retirer' },
  wellbeing_prod_active_label: { en: 'Active supports', fr: 'Soutiens actifs' },
  wellbeing_prod_overdue_label: { en: 'Reviews overdue', fr: 'Révisions en retard' },
  wellbeing_prod_review_prefix: { en: 'Review by ', fr: 'À réviser d’ici le ' },
  wellbeing_prod_overdue_chip: { en: 'Review overdue', fr: 'Révision en retard' },
  wellbeing_prod_status_aria: { en: 'Initiative status', fr: 'Statut de l’initiative' },
  wellbeing_prod_kind_eap: { en: 'Employee assistance', fr: 'Aide aux employés' },
  wellbeing_prod_kind_training: { en: 'Training', fr: 'Formation' },
  wellbeing_prod_kind_policy: { en: 'Policy', fr: 'Politique' },
  wellbeing_prod_kind_check_in: { en: 'Check-in practice', fr: 'Pratique de suivi' },
  wellbeing_prod_kind_accommodation_support: {
    en: 'Accommodation support',
    fr: 'Soutien à l’accommodement',
  },
  wellbeing_prod_kind_other: { en: 'Other', fr: 'Autre' },
  wellbeing_prod_status_planned: { en: 'Planned', fr: 'Planifiée' },
  wellbeing_prod_status_active: { en: 'Active', fr: 'Active' },
  wellbeing_prod_status_paused: { en: 'Paused', fr: 'En pause' },
  wellbeing_prod_status_retired: { en: 'Retired', fr: 'Retirée' },
  wellbeing_prod_added: { en: 'Initiative added', fr: 'Initiative ajoutée' },
  wellbeing_prod_add_failed: {
    en: 'Couldn’t add the initiative. Try again.',
    fr: 'Impossible d’ajouter l’initiative. Réessayez.',
  },
  wellbeing_prod_removed: { en: 'Initiative removed', fr: 'Initiative retirée' },
  wellbeing_prod_remove_failed: {
    en: 'Couldn’t remove the initiative.',
    fr: 'Impossible de retirer l’initiative.',
  },
  wellbeing_prod_status_updated: { en: 'Status updated', fr: 'Statut mis à jour' },
  wellbeing_prod_status_update_failed: {
    en: 'Couldn’t update the initiative.',
    fr: 'Impossible de mettre à jour l’initiative.',
  },
  wellbeing_prod_error: {
    en: 'Couldn’t load the wellbeing register.',
    fr: 'Impossible de charger le registre de bien-être.',
  },
  wellbeing_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  wellbeing_prod_empty_title: {
    en: 'No initiatives recorded yet',
    fr: 'Aucune initiative consignée',
  },
  wellbeing_prod_empty_body: {
    en: 'Record the supports you offer — an assistance programme, a manager training, a check-in practice — and when each is next reviewed.',
    fr: 'Consignez les soutiens que vous offrez — un programme d’aide, une formation des gestionnaires, une pratique de suivi — et la date de leur prochaine révision.',
  },
  /* Replaces the demo's usage-limits banner, which described a signal
     detector. This says what the register is and what it is not. */
  wellbeing_prod_banner: {
    en: 'A register of the support you offer. Dutiva records no health information about individuals and detects no signals about anyone.',
    fr: 'Un registre du soutien que vous offrez. Dutiva ne consigne aucun renseignement de santé sur les personnes et ne détecte aucun signal concernant qui que ce soit.',
  },
  wellbeing_prod_accommodation_note: {
    en: 'Support for a named person belongs in a case, where there is a request and the employee takes part.',
    fr: 'Le soutien à une personne nommée relève d’un dossier, où il y a une demande et où l’employé(e) participe.',
  },
  wellbeing_prod_edit: { en: 'Edit', fr: 'Modifier' },
  wellbeing_prod_updated: { en: 'Initiative updated', fr: 'Initiative mise à jour' },
  wellbeing_prod_update_failed: {
    en: 'Couldn’t update the initiative.',
    fr: 'Impossible de mettre à jour l’initiative.',
  },
  wellbeing_prod_delete_confirm: {
    en: 'Remove this initiative from the register?',
    fr: 'Retirer cette initiative du registre?',
  },
  wellbeing_prod_delete_cancel: { en: 'Cancel', fr: 'Annuler' },
  wellbeing_prod_confirm_delete: { en: 'Remove', fr: 'Retirer' },
  wellbeing_prod_mark_reviewed: { en: 'Mark reviewed', fr: 'Marquer comme révisée' },
  wellbeing_prod_signals_title: { en: 'Support signals', fr: 'Signaux de soutien' },
  wellbeing_prod_signals_empty: {
    en: 'Dutiva detects no signals about individuals. Per-person support belongs in a case, where there is a request and the employee takes part.',
    fr: 'Dutiva ne détecte aucun signal concernant des personnes. Le soutien individuel relève d’un dossier, où il y a une demande et où l’employé(e) participe.',
  },
})
