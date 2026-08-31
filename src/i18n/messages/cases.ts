import { defineMessages } from '../core'

/**
 * Case Files — cases list, case detail (overview / risk review / legal review /
 * activity log / notes) and the New case intake modal.
 *
 * EN verbatim from `App v2.dc.html` (case markup 1767–1973, modal 2128–2175,
 * `buildCasesView` / `buildCaseDetail` / `buildNewCaseView`); FR from its
 * `frDict()` / `buildI18n()` / inline `L(en, fr)` pairs. FR strings with no
 * source in the prototype are marked [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * Components resolve these via `useI18n().x(casesMessages.key)`.
 */
export const casesMessages = defineMessages({
  /* ── List ───────────────────────────────────────────────────────────────── */
  cases_open_of: { en: 'open of', fr: 'ouverts sur' },
  cases_word: { en: 'cases', fr: 'dossiers' },
  cases_new_case: { en: 'New case', fr: 'Nouveau dossier' },
  cases_owner: { en: 'Owner', fr: 'Responsable' },
  cases_opened: { en: 'Opened', fr: 'Ouvert le' },
  cases_progress: { en: 'Progress', fr: 'Progression' },
  /* Prototype row aria-label 'Open case {title}'. */
  cases_open_case_aria: { en: 'Open case', fr: 'Ouvrir le dossier' },

  /* ── Detail chrome ──────────────────────────────────────────────────────── */
  cases_all_cases: { en: 'All cases', fr: 'Tous les dossiers' },
  cases_ask_advisor: { en: 'Ask Advisor', fr: 'Demander au Conseiller' },
  cases_tab_overview: { en: 'Overview', fr: 'Aperçu' },
  cases_tab_risk: { en: 'Risk review', fr: 'Examen des risques' },
  cases_tab_legal: { en: 'Legal review', fr: 'Révision juridique' },
  cases_tab_activity: { en: 'Activity log', fr: 'Journal d’activité' },
  cases_tab_notes: { en: 'Notes', fr: 'Notes' },
  cases_risk_assessment: { en: 'Risk assessment', fr: 'Évaluation du risque' },
  cases_workflow: { en: 'Workflow', fr: 'Flux de travail' },
  cases_timeline: { en: 'Timeline', fr: 'Chronologie' },
  cases_people_involved: { en: 'People involved', fr: 'Personnes impliquées' },
  cases_open_conversation: { en: 'Open conversation', fr: 'Ouvrir la conversation' },
  cases_approvals: { en: 'Approvals', fr: 'Approbations' },
  cases_request_approval: { en: 'Request approval', fr: 'Demander l’approbation' },
  cases_requested: { en: 'Requested', fr: 'Demandé' },
  cases_linked_tasks: { en: 'Linked tasks', fr: 'Tâches liées' }, // [FR self-authored]
  cases_documents: { en: 'Documents', fr: 'Documents' },
  // [FR self-authored]
  cases_compliance_flags: { en: 'Compliance flags', fr: 'Signalements de conformité' },
  cases_toggle_task_aria: { en: 'Toggle task', fr: 'Basculer la tâche' }, // [FR self-authored]
  cases_mitigation: { en: 'Mitigation', fr: 'Atténuation' },

  /* ── Legal review tab ───────────────────────────────────────────────────── */
  cases_legal_status: { en: 'Review status', fr: 'État de la révision' },
  cases_legal_request: { en: 'Request legal review', fr: 'Demander une révision juridique' },
  cases_legal_counsel: { en: 'Counsel', fr: 'Conseiller' },
  cases_legal_scope: { en: 'Scope', fr: 'Portée' },
  cases_legal_due: { en: 'Due date', fr: 'Échéance' },
  cases_legal_retention: { en: 'Retention period', fr: 'Période de conservation' },
  cases_legal_outcome: { en: 'Final outcome', fr: 'Résultat final' },
  cases_legal_counsel_termination: {
    en: 'Partner counsel — employment law (external)',
    fr: 'Conseiller partenaire — droit du travail (externe)',
  },
  cases_legal_counsel_none: {
    en: 'None assigned — Advisor will flag if risk rises',
    fr: 'Aucun assigné — le Conseiller signalera si le risque augmente',
  },
  cases_legal_outcome_closed: {
    en: 'Closed — documentation complete',
    fr: 'Fermé — documentation complète',
  },
  cases_legal_outcome_open: {
    en: 'Open — no final outcome recorded yet',
    fr: 'Ouvert — aucun résultat final consigné pour l’instant',
  },

  /* ── Approvals ──────────────────────────────────────────────────────────── */
  cases_approval_termination: {
    en: 'Legal review requested — awaiting counsel (1 business day)',
    fr: 'Examen juridique demandé — en attente du conseiller (1 jour ouvrable)',
  },
  cases_approval_onboarding: {
    en: 'Complete — no approval outstanding',
    fr: 'Terminé — aucune approbation en suspens',
  },
  cases_approval_default: {
    en: 'Manager sign-off recommended before proceeding',
    fr: 'Approbation du gestionnaire recommandée avant de poursuivre',
  },
  cases_approval_requested_prefix: {
    en: 'Approval requested — routed to ',
    fr: 'Approbation demandée — acheminée à ',
  },
  cases_approval_target_counsel: {
    en: 'employment counsel',
    fr: 'un conseiller juridique en emploi',
  },
  cases_approval_target_people_ops: { en: 'People Ops', fr: 'Opérations RH' },
  /* Toast — EN-only in the prototype; FR mirrors its 'Requested approval' pair. */
  cases_toast_approval: { en: 'Approval requested', fr: 'Approbation demandée' },

  /* ── People involved ────────────────────────────────────────────────────── */
  cases_people_subject_prefix: { en: 'Subject · ', fr: 'Sujet · ' },
  cases_people_manager: { en: 'Manager', fr: 'Gestionnaire' },
  cases_people_owner: { en: 'Case owner', fr: 'Responsable du dossier' },
  cases_people_partner_counsel: { en: 'Partner counsel', fr: 'Conseiller partenaire' },
  cases_people_counsel_role: {
    en: 'Employment law · external',
    fr: 'Droit du travail · externe',
  },

  /* ── Activity log ───────────────────────────────────────────────────────── */
  cases_activity_requested: { en: 'Requested approval', fr: 'Approbation demandée' },
  cases_just_now: { en: 'Just now', fr: 'À l’instant' },

  /* ── Notes ──────────────────────────────────────────────────────────────── */
  /* Base string from buildI18n `addCaseNote`; the '(⌘↵ …)' suffix FR self-authored. */
  cases_note_placeholder: {
    en: 'Add a private case note… (⌘↵ to save)',
    fr: 'Ajouter une note privée au dossier… (⌘↵ pour enregistrer)',
  },
  cases_note_add: { en: 'Add', fr: 'Ajouter' }, // [FR self-authored]
  // [FR self-authored]
  cases_toast_note_added: { en: 'Note added to case', fr: 'Note ajoutée au dossier' },

  /* ── Compliance-flag rail (prototype `askAdvisorAboutRisk`) ─────────────── */
  cases_flag_intro: {
    en: 'Here’s the detail behind this flag, and what I’d do next.',
    // [FR self-authored]
    fr: 'Voici le détail derrière ce signalement, et ce que je ferais ensuite.',
  },
  cases_open_full_case: { en: 'Open full case', fr: 'Ouvrir le dossier complet' },
  cases_draft_fix: { en: 'Draft a fix', fr: 'Rédiger un correctif' }, // [FR self-authored]

  /* ── Unknown-id empty state (no prototype equivalent) ───────────────────── */
  // [EN + FR self-authored]
  cases_not_found_title: { en: 'Case not found', fr: 'Dossier introuvable' },
  cases_not_found_body: {
    en: 'This case isn’t in your workspace — it may have been closed, or the link is out of date.',
    fr: 'Ce dossier ne figure pas dans votre espace de travail — il a peut-être été fermé, ou le lien n’est plus à jour.',
  },

  /* ── New case modal (prototype `buildNewCaseView`) ──────────────────────── */
  cases_nc_heading: { en: 'New case', fr: 'Nouveau dossier' },
  cases_nc_sub: {
    en: 'Opens in Intake — Advisor assesses risk once the key facts are recorded.',
    fr: 'S’ouvre en Ouverture du dossier — le Conseiller évalue le risque une fois les faits essentiels consignés.',
  },
  cases_nc_type: { en: 'Case type', fr: 'Type de dossier' },
  cases_nc_employee: { en: 'Employee', fr: 'Employé' },
  cases_nc_jurisdiction: { en: 'Jurisdiction', fr: 'Province ou régime applicable' },
  cases_nc_title: { en: 'Case title (optional)', fr: 'Titre du dossier (facultatif)' },
  cases_nc_no_employee: { en: 'No specific employee', fr: 'Aucun employé précis' },
  cases_nc_sensitive: {
    en: 'Restricted case type — access is limited to the case owner, HR lead, and counsel.',
    fr: 'Type de dossier restreint — l’accès est limité au responsable du dossier, au responsable RH et au conseiller juridique.',
  },
  cases_nc_audit: {
    en: 'Case creation is recorded in the audit log.',
    fr: 'La création du dossier est consignée au journal d’audit.',
  },
  cases_nc_cancel: { en: 'Cancel', fr: 'Annuler' },
  cases_nc_create: { en: 'Create case', fr: 'Créer le dossier' },
  cases_nc_close_aria: { en: 'Close', fr: 'Fermer' },
  cases_toast_created: {
    en: 'Case created — intake started',
    fr: 'Dossier créé — ouverture du dossier commencée',
  },

  /* ── Pending / not-yet-assessed fallbacks (created cases) ───────────────── */
  cases_rec_title: { en: 'Advisor recommendation', fr: 'Recommandation du Conseiller' },
  cases_pending_factor: {
    en: 'Not yet assessed — Advisor will assess risk once intake facts are recorded.',
    fr: 'Pas encore évalué — le Conseiller évaluera le risque une fois les faits initiaux consignés.',
  },
  cases_pending_rec_body: {
    en: 'Record the key facts, confirm the jurisdiction and applicable agreement, then ask Advisor to run a risk assessment before taking action.',
    fr: 'Consignez les faits essentiels, confirmez la compétence et le contrat applicables, puis demandez au Conseiller d’évaluer le risque avant d’agir.',
  },
  cases_pending_axis_reason: {
    en: 'Not yet assessed — intake facts are still being recorded.',
    fr: 'Pas encore évalué — les faits initiaux sont en cours de consignation.',
  },
  cases_pending_axis_mitigation: {
    en: 'Complete intake and ask Advisor to run a risk assessment.',
    fr: 'Terminez l’ouverture du dossier et demandez au Conseiller d’évaluer le risque.',
  },
  /* A11y-only (tablist labels). */
  cases_tabs_aria: { en: 'Case workspace sections', fr: 'Sections du dossier' }, // [FR self-authored]

  /* ── Production case files (real persistence — no design-handoff
     counterpart; [FR self-authored] throughout) ─────────────────────────── */
  cases_prod_new: { en: 'New case', fr: 'Nouveau dossier' },
  cases_prod_cancel: { en: 'Cancel', fr: 'Annuler' },
  cases_prod_title_label: { en: 'Case title', fr: 'Titre du dossier' },
  cases_prod_type: { en: 'Case type', fr: 'Type de dossier' },
  cases_prod_employee: { en: 'Employee (optional)', fr: 'Employé (facultatif)' },
  cases_prod_employee_none: { en: 'No linked employee', fr: 'Aucun employé lié' },
  cases_prod_jurisdiction: { en: 'Jurisdiction', fr: 'Compétence' },
  cases_prod_due: { en: 'Due date', fr: 'Échéance' },
  cases_prod_save: { en: 'Create case', fr: 'Créer le dossier' },
  cases_prod_count_one: { en: 'case', fr: 'dossier' },
  cases_prod_count_many: { en: 'cases', fr: 'dossiers' },
  cases_prod_loading: { en: 'Loading…', fr: 'Chargement…' },
  cases_prod_empty_title: { en: 'No cases yet', fr: 'Aucun dossier pour l’instant' },
  cases_prod_empty_body: {
    en: 'Open your first case to start tracking real HR work.',
    fr: 'Ouvrez votre premier dossier pour commencer à suivre le travail RH réel.',
  },
  cases_prod_error: { en: 'Couldn’t load cases.', fr: 'Impossible de charger les dossiers.' },
  cases_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  cases_prod_added: { en: 'Case created', fr: 'Dossier créé' },
  cases_prod_add_failed: {
    en: 'Couldn’t create the case. Try again.',
    fr: 'Impossible de créer le dossier. Réessayez.',
  },
  cases_prod_remove: { en: 'Remove', fr: 'Retirer' },
  cases_prod_removed: { en: 'Case removed', fr: 'Dossier retiré' },
  cases_prod_remove_failed: {
    en: 'Couldn’t remove the case.',
    fr: 'Impossible de retirer le dossier.',
  },
  cases_prod_status_updated: { en: 'Status updated', fr: 'Statut mis à jour' },
  cases_prod_status_update_failed: {
    en: 'Couldn’t update the status.',
    fr: 'Impossible de mettre à jour le statut.',
  },
  cases_prod_status_aria: { en: 'Case status', fr: 'Statut du dossier' },
  cases_prod_type_termination: { en: 'Termination', fr: 'Cessation d’emploi' },
  cases_prod_type_performance: { en: 'Performance', fr: 'Rendement' },
  cases_prod_type_accommodation: { en: 'Accommodation', fr: 'Accommodement' },
  cases_prod_type_onboarding: { en: 'Onboarding', fr: 'Intégration' },
  cases_prod_status_open: { en: 'Open', fr: 'Ouvert' },
  cases_prod_status_in_review: { en: 'In review', fr: 'En révision' },
  cases_prod_status_resolved: { en: 'Resolved', fr: 'Résolu' },

  /* ── Production case detail (Phase 11) — [FR self-authored] ───────────── */
  cases_prod_back: { en: 'All cases', fr: 'Tous les dossiers' },
  cases_prod_not_found: {
    en: 'This case doesn’t exist or was removed.',
    fr: 'Ce dossier n’existe pas ou a été retiré.',
  },
  cases_prod_detail_employee: { en: 'Employee', fr: 'Employé' },
  cases_prod_detail_type: { en: 'Type', fr: 'Type' },
  cases_prod_detail_jurisdiction: { en: 'Jurisdiction', fr: 'Compétence' },
  cases_prod_detail_due: { en: 'Due', fr: 'Échéance' },
  cases_prod_notes_title: { en: 'Notes', fr: 'Notes' },
  cases_prod_notes_empty: {
    en: 'No notes yet — record the key facts as the case progresses.',
    fr: 'Aucune note pour l’instant — consignez les faits importants au fil du dossier.',
  },
  cases_prod_note_placeholder: {
    en: 'Add a note to the case record…',
    fr: 'Ajouter une note au dossier…',
  },
  cases_prod_note_add: { en: 'Add note', fr: 'Ajouter la note' },
  cases_prod_note_added: { en: 'Note added', fr: 'Note ajoutée' },
  cases_prod_note_failed: {
    en: 'Couldn’t add the note. Try again.',
    fr: 'Impossible d’ajouter la note. Réessayez.',
  },
  cases_prod_detail_error: {
    en: 'Couldn’t load this case.',
    fr: 'Impossible de charger ce dossier.',
  },
})
