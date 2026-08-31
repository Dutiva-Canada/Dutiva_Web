import { defineMessages } from '../core'

/**
 * Employees workspace — roster (list + org chart), employee quick drawer and
 * the profile hub. EN verbatim from `App v2.dc.html` (labels block 5020–5084,
 * `buildI18n()` 3212/3244, `buildProfileView()` 4202–4267, `buildOrgGraph()`
 * 4150–4190); FR from the prototype's same `L(en, fr)` pairs / `frDict()`.
 * FR strings with no source in the prototype are marked [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * Components resolve these via `useI18n().x(employeesMessages.key)`.
 */
export const employeesMessages = defineMessages({
  /* ── Roster (list mode) ─────────────────────────────────────────────────── */
  employees_tab_people: { en: 'People', fr: 'Liste' },
  employees_tab_org: { en: 'Org chart', fr: 'Organigramme' },
  employees_filter_placeholder: {
    en: 'Filter by name, role, or jurisdiction…',
    fr: 'Filtrer par nom, poste ou compétence…',
  },
  employees_showing: { en: 'Showing', fr: 'Affichage de' },
  employees_of_sample: {
    en: 'of 82 · sample records for this prototype',
    fr: 'sur 82 · données d’exemple pour ce prototype',
  },
  employees_th_name: { en: 'Name', fr: 'Nom' },
  employees_th_role: { en: 'Role', fr: 'Poste' },
  employees_th_jurisdiction: { en: 'Jurisdiction', fr: 'Compétence' },
  employees_th_status: { en: 'Status', fr: 'Statut' },
  employees_th_tenure: { en: 'Tenure', fr: 'Ancienneté' },
  employees_no_results: {
    en: 'No employees match your filter.',
    fr: 'Aucun employé ne correspond au filtre.',
  },
  employees_no_results_sub: {
    en: 'Try a different name, role, or jurisdiction.',
    fr: 'Essayez un autre nom, poste ou compétence.',
  },
  employees_clear_filter: { en: 'Clear filter', fr: 'Effacer le filtre' },
  /* Prototype row aria: 'Open profile for {{ emp.name }}'. [FR self-authored] */
  employees_open_profile_for: { en: 'Open profile for', fr: 'Ouvrir le profil de' },
  /* [FR self-authored] */
  employees_ask_about_aria: {
    en: 'Ask Advisor about this employee',
    fr: 'Demander au Conseiller au sujet de cet employé',
  },

  /* ── Org chart mode ─────────────────────────────────────────────────────── */
  employees_people_managers: { en: 'People managers', fr: 'Gestionnaires de personnes' },
  employees_direct_reports: { en: 'Direct reports', fr: 'Subordonnés directs' },
  /* Hardcoded EN eyebrow in the prototype markup (line 949). [FR self-authored] */
  employees_org_watch_eyebrow: {
    en: 'Advisor · reporting-line watch',
    fr: 'Conseiller · veille des lignes hiérarchiques',
  },
  employees_org_note_current: {
    en: 'Reporting lines are current. No manager transitions are in progress.',
    fr: 'Les lignes hiérarchiques sont à jour. Aucune transition de gestionnaire n’est en cours.',
  },

  /* ── Quick drawer ───────────────────────────────────────────────────────── */
  /* [FR self-authored] */
  employees_drawer_aria: { en: 'Employee profile', fr: 'Profil de l’employé' },
  /* [FR self-authored] */
  employees_drawer_close: { en: 'Close', fr: 'Fermer' },
  /* Prototype CTA: 'Ask Advisor about {{ name }}'. [FR self-authored] */
  employees_drawer_ask_about: {
    en: 'Ask Advisor about',
    fr: 'Demander au Conseiller au sujet de',
  },
  employees_open_full_case: { en: 'Open full case', fr: 'Ouvrir le dossier complet' },

  /* ── Profile hub ────────────────────────────────────────────────────────── */
  /* Hardcoded EN back label in the prototype markup (line 1440). [FR self-authored] */
  employees_back_all_people: { en: 'All people', fr: 'Toutes les personnes' },
  employees_ask_advisor: { en: 'Ask Advisor', fr: 'Demander au Conseiller' },
  employees_manager_label: { en: 'Manager', fr: 'Gestionnaire' },
  /* Hardcoded EN in the header line ('· Since {{ startDate }}'). [FR self-authored] */
  employees_since_label: { en: 'Since', fr: 'Depuis' },

  employees_tab_overview: { en: 'Overview', fr: 'Aperçu' },
  employees_tab_timeline: { en: 'Timeline', fr: 'Chronologie' },
  employees_tab_documents: { en: 'Documents', fr: 'Documents' },
  employees_tab_leave: { en: 'Leave & accommodation', fr: 'Congés et accommodements' },
  employees_tab_compensation: { en: 'Compensation', fr: 'Rémunération' },
  employees_tab_wellbeing: { en: 'Wellbeing', fr: 'Bien-être' },
  employees_tab_compliance: { en: 'Compliance', fr: 'Conformité' },
  employees_tab_cases: { en: 'Cases', fr: 'Dossiers' },

  /* Record rows (overview) */
  employees_rr_location: { en: 'Work location / jurisdiction', fr: 'Lieu de travail / compétence' },
  employees_rr_type: { en: 'Employment type', fr: 'Type d’emploi' },
  employees_rr_type_value: { en: 'Full-time · Permanent', fr: 'Temps plein · Permanent' },
  employees_rr_department: { en: 'Department', fr: 'Service' },
  employees_rr_start: { en: 'Start date', fr: 'Date d’entrée en poste' },
  employees_rr_band: { en: 'Pay band', fr: 'Échelle salariale' },

  /* Governing statutes (overview record rows) */
  employees_statute_on: {
    en: 'Employment Standards Act, 2000',
    fr: 'Loi sur les normes d’emploi, 2000',
  },
  employees_statute_qc: {
    en: 'Act respecting labour standards + Charter of the French Language',
    fr: 'Loi sur les normes du travail + Charte de la langue française',
  },
  employees_statute_bc: {
    en: 'Employment Standards Act (BC)',
    fr: 'Employment Standards Act (C.-B.)',
  },
  employees_statute_ab: {
    en: 'Employment Standards Code (Alberta)',
    fr: 'Employment Standards Code (Alberta)',
  },
  employees_statute_fed: {
    en: 'Canada Labour Code, Part III',
    fr: 'Code canadien du travail, partie III',
  },
  employees_statute_fallback: {
    en: 'Confirm applicable standards',
    fr: 'Confirmer les normes applicables',
  },

  /* Stat tiles + compensation tab */
  employees_base_salary: { en: 'Base salary', fr: 'Salaire de base' },
  employees_support_signals: { en: 'Support signals', fr: 'Signaux de soutien' },
  employees_open_cases: { en: 'Open cases', fr: 'Dossiers ouverts' },
  employees_market_midpoint: { en: 'Market midpoint', fr: 'Point milieu du marché' },
  /* Concatenated after the signed delta: '+3% vs market' / '+3 % c. marché'. */
  employees_vs_market_suffix: { en: '% vs market', fr: ' % c. marché' },
  employees_band_label: { en: 'Band', fr: 'Échelle' },
  employees_comp_market_note: {
    en: 'Market midpoint comparisons are one input among several. Document any adjustment against a consistent band framework and complete HR/Finance review before committing.',
    fr: 'Les comparaisons au point milieu du marché ne sont qu’un indicateur parmi d’autres. Documentez tout ajustement selon un cadre d’échelons cohérent et faites valider par les RH et les Finances avant de vous engager.',
  },
  employees_comp_banner: {
    en: 'Restricted access — Compensation is visible to Owner/Admin, HR Manager, and Finance roles only. Views are recorded in the audit log.',
    fr: 'Accès restreint — la rémunération n’est visible que pour les rôles Propriétaire/Admin, Responsable RH et Finances. Les consultations sont consignées au journal d’audit.',
  },

  /* Timeline tab */
  employees_timeline_auto_note: {
    en: 'Advisor composes this timeline automatically from documents, communications, compliance, compensation and cases.',
    fr: 'Le Conseiller compose automatiquement cette chronologie à partir des documents, communications, conformité, rémunération et dossiers.',
  },
  employees_no_recorded_events: {
    en: 'No recorded events yet',
    fr: 'Aucun événement enregistré pour le moment',
  },
  employees_timeline_empty_body: {
    en: 'Documents, communications, reviews and compliance activity will appear here automatically as they happen.',
    fr: 'Les documents, communications, évaluations et activités de conformité apparaîtront ici automatiquement au fur et à mesure.',
  },

  /* Timeline source chips (prototype `timelineKindMeta()` — raw EN there; FR
     from the same words elsewhere in the prototype: frDict 2447/2524, nav
     labels 3227/3229, profile tab labels 4208, activity log 3614–3615). */
  employees_src_onboarding: { en: 'Onboarding', fr: 'Intégration' },
  employees_src_performance: { en: 'Performance', fr: 'Rendement' },
  employees_src_compensation: { en: 'Compensation', fr: 'Rémunération' },
  employees_src_case: { en: 'Case', fr: 'Dossier' },
  employees_src_wellbeing: { en: 'Wellbeing', fr: 'Bien-être' },
  employees_src_documents: { en: 'Documents', fr: 'Documents' },
  employees_src_communications: { en: 'Communications', fr: 'Communications' },
  employees_src_policy: { en: 'Policy', fr: 'Politique' },
  employees_src_compliance: { en: 'Compliance', fr: 'Conformité' },

  /* Leave & accommodation tab */
  employees_leave_banner: {
    en: 'Restricted access — medical and accommodation records hold functional information only. A diagnosis never belongs on file.',
    fr: 'Accès restreint — les dossiers médicaux et d’accommodement ne contiennent que de l’information fonctionnelle. Aucun diagnostic ne doit figurer au dossier.',
  },
  employees_leave_empty_title: { en: 'No leave records', fr: 'Aucun congé consigné' },
  employees_leave_empty_body: {
    en: 'Vacation, statutory leaves, and accommodation-related absences will appear here once recorded.',
    fr: 'Les vacances, les congés prévus par la loi et les absences liées à un accommodement s’afficheront ici une fois consignés.',
  },

  /* Wellbeing tab */
  employees_wellbeing_banner: {
    en: 'Restricted access — support signals are for supportive follow-up and workload review only. They must not be used for discipline, termination, compensation, ranking, or performance scoring.',
    fr: 'Accès restreint — les signaux de soutien servent uniquement au suivi bienveillant et à l’examen de la charge de travail. Ils ne doivent pas servir à la discipline, à la cessation d’emploi, à la rémunération, au classement ou à l’évaluation du rendement.',
  },
  employees_wb_empty_title: {
    en: 'No active support signals',
    fr: 'Aucun signal de soutien actif',
  },
  employees_wb_empty_body: {
    en: 'Workload, leave follow-ups, and support requests will appear here when something needs supportive attention.',
    fr: 'La charge de travail, les suivis de congé et les demandes de soutien s’afficheront ici lorsqu’une attention bienveillante sera requise.',
  },
  employees_wb_source: { en: 'Source', fr: 'Source' },
  employees_wb_confidence: { en: 'Confidence', fr: 'Confiance' },
  employees_wb_action: {
    en: 'Recommended supportive action',
    fr: 'Action de soutien recommandée',
  },

  /* Compliance tab */
  employees_resolve_with_advisor: {
    en: 'Resolve with Advisor',
    fr: 'Résoudre avec le Conseiller',
  },
  /* Rail intro for `askAdvisorAboutRisk` — inline EN in the prototype (3303).
     [FR self-authored] */
  employees_risk_flag_intro: {
    en: 'Here’s the detail behind this flag, and what I’d do next.',
    fr: 'Voici le détail derrière ce signalement, et ce que je ferais ensuite.',
  },
  /* [FR self-authored] */
  employees_draft_fix: { en: 'Draft a fix', fr: 'Rédiger un correctif' },

  /* Cases tab */
  employees_restricted: { en: 'Restricted', fr: 'Restreint' },

  /* Audit footnote */
  employees_audit_foot: {
    en: 'Views of this profile — including its restricted sections — are recorded in the audit log.',
    fr: 'Les consultations de ce profil — y compris ses sections restreintes — sont consignées au journal d’audit.',
  },
  /* A11y-only (tablist labels). */
  employees_profile_tabs_aria: {
    en: 'Employee profile sections',
    fr: 'Sections du profil de l’employé',
  }, // [FR self-authored]
  employees_view_toggle_aria: { en: 'Roster view', fr: 'Vue du personnel' }, // [FR self-authored]

  /* ── Production roster (real persistence — no design-handoff counterpart;
     [FR self-authored] throughout) ───────────────────────────────────────── */
  employees_prod_add: { en: 'Add employee', fr: 'Ajouter un employé' },
  employees_prod_cancel: { en: 'Cancel', fr: 'Annuler' },
  employees_prod_name: { en: 'Full name', fr: 'Nom complet' },
  employees_prod_title: { en: 'Job title', fr: 'Titre du poste' },
  employees_prod_email: { en: 'Email', fr: 'Courriel' },
  employees_prod_jurisdiction: {
    en: 'Employment jurisdiction',
    fr: 'Compétence d’emploi',
  },
  employees_prod_start_date: { en: 'Start date', fr: 'Date d’entrée en fonction' },
  employees_prod_save: { en: 'Save employee', fr: 'Enregistrer l’employé' },
  employees_prod_count_one: { en: 'employee', fr: 'employé' },
  employees_prod_count_many: { en: 'employees', fr: 'employés' },
  employees_prod_loading: { en: 'Loading…', fr: 'Chargement…' },
  employees_prod_empty_title: { en: 'No employees yet', fr: 'Aucun employé pour l’instant' },
  employees_prod_empty_body: {
    en: 'Add your first employee to start building your real workspace.',
    fr: 'Ajoutez votre premier employé pour commencer à bâtir votre espace de travail réel.',
  },
  employees_prod_error: {
    en: 'Couldn’t load employees.',
    fr: 'Impossible de charger les employés.',
  },
  employees_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  employees_prod_added: { en: 'Employee added', fr: 'Employé ajouté' },
  employees_prod_add_failed: {
    en: 'Couldn’t add the employee. Try again.',
    fr: 'Impossible d’ajouter l’employé. Réessayez.',
  },
  employees_prod_remove: { en: 'Remove', fr: 'Retirer' },
  employees_prod_removed: { en: 'Employee removed', fr: 'Employé retiré' },
  employees_prod_remove_failed: {
    en: 'Couldn’t remove the employee.',
    fr: 'Impossible de retirer l’employé.',
  },
  employees_prod_status_active: { en: 'Active', fr: 'Actif' },
  employees_prod_status_on_leave: { en: 'On leave', fr: 'En congé' },
  employees_prod_status_terminated: { en: 'Terminated', fr: 'Fin d’emploi' },

  /* ── Production employee profile (Phase 12) — [FR self-authored] ──────── */
  employees_prod_back: { en: 'All employees', fr: 'Tous les employés' },
  employees_prod_not_found: {
    en: 'This employee doesn’t exist or was removed.',
    fr: 'Cet employé n’existe pas ou a été retiré.',
  },
  employees_prod_detail_error: {
    en: 'Couldn’t load this profile.',
    fr: 'Impossible de charger ce profil.',
  },
  employees_prod_detail_title: { en: 'Job title', fr: 'Titre du poste' },
  employees_prod_detail_email: { en: 'Email', fr: 'Courriel' },
  employees_prod_detail_jurisdiction: { en: 'Jurisdiction', fr: 'Compétence' },
  employees_prod_detail_start: { en: 'Start date', fr: 'Entrée en fonction' },
  employees_prod_status_aria: { en: 'Employee status', fr: 'Statut de l’employé' },
  employees_prod_status_updated: { en: 'Status updated', fr: 'Statut mis à jour' },
  employees_prod_status_update_failed: {
    en: 'Couldn’t update the status.',
    fr: 'Impossible de mettre à jour le statut.',
  },
  employees_prod_cases_title: { en: 'Open cases', fr: 'Dossiers ouverts' },
  employees_prod_cases_none: {
    en: 'No open cases involve this employee.',
    fr: 'Aucun dossier ouvert ne concerne cet employé.',
  },
  employees_prod_notes_title: { en: 'Notes', fr: 'Notes' },
  employees_prod_notes_empty: {
    en: 'No notes yet — record context as you work with this employee.',
    fr: 'Aucune note pour l’instant — consignez le contexte au fil du travail avec cet employé.',
  },
  employees_prod_note_placeholder: {
    en: 'Add a note to this profile…',
    fr: 'Ajouter une note à ce profil…',
  },
  employees_prod_note_add: { en: 'Add note', fr: 'Ajouter la note' },
  employees_prod_note_added: { en: 'Note added', fr: 'Note ajoutée' },
  employees_prod_note_failed: {
    en: 'Couldn’t add the note. Try again.',
    fr: 'Impossible d’ajouter la note. Réessayez.',
  },

  /* ── Lifecycle dates (probation end / termination — 0066) ──────────────── */
  employees_prod_dates_title: { en: 'Key dates', fr: 'Dates clés' },
  employees_prod_probation_end: { en: 'Probation ends', fr: 'Fin de la probation' },
  employees_prod_probation_hint: {
    en: 'Entered per employee — contractual probation length varies by jurisdiction and offer.',
    fr: 'Saisie par employé — la durée de probation contractuelle varie selon la compétence et l’offre.',
  },
  employees_prod_termination_date: { en: 'Termination date', fr: 'Date de fin d’emploi' },
  employees_prod_termination_hint: {
    en: 'Feeds the turnover rate in Analytics.',
    fr: 'Alimente le taux de roulement dans Analytique.',
  },
  employees_prod_dates_saved: { en: 'Dates updated', fr: 'Dates mises à jour' },
  employees_prod_dates_failed: {
    en: 'Couldn’t save the dates. Try again.',
    fr: 'Impossible d’enregistrer les dates. Réessayez.',
  },
  employees_prod_review_task_missing: {
    en: 'No probation review task yet',
    fr: 'Aucune tâche d’évaluation de probation créée',
  },
  employees_prod_review_task_create: {
    en: 'Create review task',
    fr: 'Créer la tâche d’évaluation',
  },
  employees_prod_review_task_title: {
    en: 'Probation review — {name}',
    fr: 'Évaluation de probation — {name}',
  },
  employees_prod_review_task_created: {
    en: 'Review task created',
    fr: 'Tâche d’évaluation créée',
  },
  employees_prod_review_task_failed: {
    en: 'Couldn’t create the review task. Try again.',
    fr: 'Impossible de créer la tâche d’évaluation. Réessayez.',
  },
  employees_prod_review_task_exists: {
    en: 'Review task in place',
    fr: 'Tâche d’évaluation en place',
  },

  /* ── Certifications & documents (hr_expiry_records — 0064) ─────────────── */
  employees_prod_records_title: {
    en: 'Certifications & documents',
    fr: 'Attestations et documents',
  },
  employees_prod_records_empty: {
    en: 'No certifications or dated documents on file.',
    fr: 'Aucune attestation ni document daté au dossier.',
  },
  employees_prod_record_kind: { en: 'Type', fr: 'Type' },
  employees_prod_record_kind_certification: { en: 'Certification', fr: 'Attestation' },
  employees_prod_record_kind_document: { en: 'Document', fr: 'Document' },
  employees_prod_record_name: { en: 'Name', fr: 'Nom' },
  employees_prod_record_name_placeholder: {
    en: 'e.g. Forklift operator certificate, work permit…',
    fr: 'p. ex. attestation de cariste, permis de travail…',
  },
  employees_prod_record_expiry: { en: 'Expiry date', fr: 'Date d’expiration' },
  employees_prod_record_add: { en: 'Add record', fr: 'Ajouter l’enregistrement' },
  employees_prod_record_added: { en: 'Record added', fr: 'Enregistrement ajouté' },
  employees_prod_record_add_failed: {
    en: 'Couldn’t add the record. Try again.',
    fr: 'Impossible d’ajouter l’enregistrement. Réessayez.',
  },
  employees_prod_record_remove: { en: 'Remove', fr: 'Retirer' },
  employees_prod_record_removed: { en: 'Record removed', fr: 'Enregistrement retiré' },
  employees_prod_record_remove_failed: {
    en: 'Couldn’t remove the record. Try again.',
    fr: 'Impossible de retirer l’enregistrement. Réessayez.',
  },
  employees_prod_record_expires: { en: 'Expires {date}', fr: 'Expire le {date}' },
  employees_prod_record_expired: { en: 'Expired', fr: 'Échéance dépassée' },

  /* ── Leave records (hr_leaves — 0065) — status only ────────────────────── */
  employees_prod_leave_title: { en: 'Leave', fr: 'Congés' },
  employees_prod_leave_empty: {
    en: 'No leave records. Leave is status-only — type and dates, never medical detail.',
    fr: 'Aucun congé enregistré. Statut seulement — type et dates, jamais de détails médicaux.',
  },
  employees_prod_leave_type: { en: 'Leave type', fr: 'Type de congé' },
  employees_prod_leave_type_placeholder: {
    en: 'e.g. Parental leave, medical leave, vacation…',
    fr: 'p. ex. congé parental, congé médical, vacances…',
  },
  employees_prod_leave_protected: { en: 'Protected leave', fr: 'Congé protégé' },
  employees_prod_leave_start: { en: 'Start', fr: 'Début' },
  employees_prod_leave_return: { en: 'Expected return', fr: 'Retour prévu' },
  employees_prod_leave_add: { en: 'Add leave', fr: 'Ajouter le congé' },
  employees_prod_leave_added: { en: 'Leave added', fr: 'Congé ajouté' },
  employees_prod_leave_add_failed: {
    en: 'Couldn’t add the leave. Try again.',
    fr: 'Impossible d’ajouter le congé. Réessayez.',
  },
  employees_prod_leave_end: { en: 'End leave', fr: 'Terminer le congé' },
  employees_prod_leave_ended: { en: 'Leave ended', fr: 'Congé terminé' },
  employees_prod_leave_end_failed: {
    en: 'Couldn’t end the leave. Try again.',
    fr: 'Impossible de terminer le congé. Réessayez.',
  },
  employees_prod_leave_current: { en: 'Current', fr: 'En cours' },
  employees_prod_leave_ended_on: { en: 'Ended {date}', fr: 'Terminé le {date}' },
  employees_prod_leave_returns: { en: 'Returns {date}', fr: 'Retour le {date}' },
})
