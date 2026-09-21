import { defineMessages } from '../core'

/**
 * Agent layer — confirm-card chrome, executor refusal strings, and the
 * bilingual copy for the CRM tools. Everything here is chrome or
 * tool-authored UI copy; user-entered data stays in the params.
 *
 * FR is self-authored at the definition site ([FR self-authored]).
 */
export const agentMessages = defineMessages({
  /* ── Confirm card chrome ────────────────────────────────────────────────── */
  agent_action_eyebrow: { en: 'Proposed action', fr: 'Action proposée' }, // [FR self-authored]
  agent_tier_read: { en: 'Read', fr: 'Lecture' }, // [FR self-authored]
  agent_tier_draft: { en: 'Draft', fr: 'Brouillon' }, // [FR self-authored]
  agent_tier_commit: { en: 'Writes to workspace', fr: 'Écrit dans l’espace de travail' }, // [FR self-authored]
  agent_confirm: { en: 'Confirm', fr: 'Confirmer' }, // [FR self-authored]
  agent_run: { en: 'Run', fr: 'Exécuter' }, // [FR self-authored]
  agent_decline: { en: 'Decline', fr: 'Refuser' }, // [FR self-authored]
  agent_working: { en: 'Working…', fr: 'En cours…' }, // [FR self-authored]
  agent_done: { en: 'Done', fr: 'Terminé' }, // [FR self-authored]
  agent_declined: { en: 'Declined — nothing changed.', fr: 'Refusé — rien n’a changé.' }, // [FR self-authored]

  /* ── Executor refusals ──────────────────────────────────────────────────── */
  agent_err_unknown_tool: {
    en: 'That action isn’t available.',
    fr: 'Cette action n’est pas offerte.',
  }, // [FR self-authored]
  agent_err_missing_param: {
    en: 'Missing a required detail',
    fr: 'Un détail requis manque',
  }, // [FR self-authored]
  agent_err_bad_param: {
    en: 'A detail didn’t check out',
    fr: 'Un détail n’a pas passé la vérification',
  }, // [FR self-authored]
  agent_err_unknown_param: {
    en: 'The action carried a field it doesn’t use',
    fr: 'L’action comportait un champ qu’elle n’utilise pas',
  }, // [FR self-authored]
  agent_err_forbidden: {
    en: 'Your role doesn’t allow this action.',
    fr: 'Votre rôle ne permet pas cette action.',
  }, // [FR self-authored]
  agent_err_module_closed: {
    en: 'Open this workspace first, then confirm again',
    fr: 'Ouvrez d’abord cet espace, puis confirmez à nouveau',
  }, // [FR self-authored]
  agent_err_failed: {
    en: 'The action couldn’t complete — nothing was changed.',
    fr: 'L’action n’a pas abouti — rien n’a été modifié.',
  }, // [FR self-authored]
  agent_err_capability_demo: {
    en: 'Not available in the demo workspace — switch to a production workspace to add records.',
    fr: 'Non disponible dans l’espace de démo — passez à un espace de production pour ajouter des entrées.',
  }, // [FR self-authored]

  /* ── Rail intent acknowledgement (deterministic CRM proposer) ──────────── */
  agent_rail_proposal_ack: {
    en: 'Here’s what I can do — check it and confirm.',
    fr: 'Voici ce que je peux faire — vérifiez et confirmez.',
  }, // [FR self-authored]

  /* ── CRM tool labels + descriptions ─────────────────────────────────────── */
  agent_crm_module: { en: 'Customers', fr: 'Clients' }, // [FR self-authored]

  agent_crm_search_label: { en: 'Search contacts', fr: 'Rechercher des contacts' }, // [FR self-authored]
  agent_crm_search_desc: {
    en: 'Finds CRM contacts by name, email or status.',
    fr: 'Trouve des contacts par nom, courriel ou statut.',
  }, // [FR self-authored]

  agent_crm_pipeline_label: { en: 'Show pipeline', fr: 'Afficher le pipeline' }, // [FR self-authored]
  agent_crm_pipeline_desc: {
    en: 'Lists open deals grouped by stage.',
    fr: 'Liste les occasions ouvertes par étape.',
  }, // [FR self-authored]

  agent_crm_followups_label: { en: 'Upcoming follow-ups', fr: 'Suivis à venir' }, // [FR self-authored]
  agent_crm_followups_desc: {
    en: 'Lists follow-ups due in the next 7 days.',
    fr: 'Liste les suivis prévus dans les 7 prochains jours.',
  }, // [FR self-authored]

  agent_crm_add_contact_label: { en: 'Add a contact', fr: 'Ajouter un contact' }, // [FR self-authored]
  agent_crm_add_contact_desc: {
    en: 'Creates a contact record in the CRM.',
    fr: 'Crée une fiche de contact dans le CRM.',
  }, // [FR self-authored]

  agent_crm_log_activity_label: { en: 'Log an activity', fr: 'Consigner une activité' }, // [FR self-authored]
  agent_crm_log_activity_desc: {
    en: 'Adds a call, meeting, email, note or task to the CRM activity log.',
    fr: 'Ajoute un appel, une réunion, un courriel, une note ou une tâche au journal.',
  }, // [FR self-authored]

  agent_crm_move_deal_label: { en: 'Move a deal', fr: 'Déplacer une occasion' }, // [FR self-authored]
  agent_crm_move_deal_desc: {
    en: 'Moves a deal to a new pipeline stage.',
    fr: 'Déplace une occasion vers une nouvelle étape du pipeline.',
  }, // [FR self-authored]

  /* ── CRM tool param descriptions (model-facing, EN-primary) ────────────── */
  agent_crm_p_query: {
    en: 'Text to match against name or email',
    fr: 'Texte à comparer au nom ou au courriel',
  }, // [FR self-authored]
  agent_crm_p_status: { en: 'Contact status filter', fr: 'Filtre de statut du contact' }, // [FR self-authored]
  agent_crm_p_name: { en: 'Full name', fr: 'Nom complet' }, // [FR self-authored]
  agent_crm_p_email: { en: 'Email address', fr: 'Adresse courriel' }, // [FR self-authored]
  agent_crm_p_phone: { en: 'Phone number', fr: 'Numéro de téléphone' }, // [FR self-authored]
  agent_crm_p_company: {
    en: 'Company name (matched to an existing company)',
    fr: 'Nom de l’entreprise (associé à une entreprise existante)',
  }, // [FR self-authored]
  agent_crm_p_role: { en: 'Job title or role', fr: 'Titre ou rôle' }, // [FR self-authored]
  agent_crm_p_contact_status: { en: 'Initial status', fr: 'Statut initial' }, // [FR self-authored]
  agent_crm_p_activity_type: { en: 'Activity type', fr: 'Type d’activité' }, // [FR self-authored]
  agent_crm_p_summary: { en: 'What happened, in one line', fr: 'Ce qui s’est passé, en une ligne' }, // [FR self-authored]
  agent_crm_p_contact_name: {
    en: 'Contact name (matched to an existing contact)',
    fr: 'Nom du contact (associé à un contact existant)',
  }, // [FR self-authored]
  agent_crm_p_deal_title: {
    en: 'Deal title (matched to an existing deal)',
    fr: 'Titre de l’occasion (associé à une occasion existante)',
  }, // [FR self-authored]
  agent_crm_p_date: {
    en: 'Date (YYYY-MM-DD); defaults to today',
    fr: 'Date (AAAA-MM-JJ) ; aujourd’hui par défaut',
  }, // [FR self-authored]
  agent_crm_p_follow_up: { en: 'Follow-up date (YYYY-MM-DD)', fr: 'Date de suivi (AAAA-MM-JJ)' }, // [FR self-authored]
  agent_crm_p_stage: { en: 'New pipeline stage', fr: 'Nouvelle étape du pipeline' }, // [FR self-authored]

  /* ── CRM tool results ───────────────────────────────────────────────────── */
  agent_crm_result_contact_added: { en: 'Contact added', fr: 'Contact ajouté' }, // [FR self-authored]
  agent_crm_result_activity_logged: { en: 'Activity logged', fr: 'Activité consignée' }, // [FR self-authored]
  agent_crm_result_deal_moved: { en: 'Deal moved', fr: 'Occasion déplacée' }, // [FR self-authored]
  agent_crm_result_no_contacts: { en: 'No contacts match.', fr: 'Aucun contact ne correspond.' }, // [FR self-authored]
  agent_crm_result_no_deals: { en: 'No open deals.', fr: 'Aucune occasion ouverte.' }, // [FR self-authored]
  agent_crm_result_no_followups: {
    en: 'No follow-ups due in the next 7 days.',
    fr: 'Aucun suivi prévu dans les 7 prochains jours.',
  }, // [FR self-authored]
  agent_crm_result_deal_not_found: {
    en: 'No deal matches that title.',
    fr: 'Aucune occasion ne correspond à ce titre.',
  }, // [FR self-authored]

  /* ── Communications tool labels + descriptions ─────────────────────────── */
  agent_comms_module: { en: 'Communications', fr: 'Communications' }, // [FR self-authored]

  agent_comms_list_label: {
    en: 'List logged communications',
    fr: 'Lister les communications consignées',
  }, // [FR self-authored]
  agent_comms_list_desc: {
    en: 'Reads the internal communications register.',
    fr: 'Lit le registre des communications internes.',
  }, // [FR self-authored]

  agent_comms_log_label: { en: 'Log a communication', fr: 'Consigner une communication' }, // [FR self-authored]
  agent_comms_log_desc: {
    en: 'Adds an entry to the register — it records a communication, it does not send one.',
    fr: 'Ajoute une entrée au registre — elle consigne une communication, elle n’en envoie pas.',
  }, // [FR self-authored]

  agent_comms_mark_sent_label: {
    en: 'Record a communication as sent',
    fr: 'Consigner une communication comme envoyée',
  }, // [FR self-authored]
  agent_comms_mark_sent_desc: {
    en: 'Marks a logged entry as sent — records that it went out; nothing is delivered.',
    fr: 'Marque une entrée comme envoyée — consigne son envoi ; rien n’est transmis.',
  }, // [FR self-authored]

  /* ── Communications tool param descriptions ────────────────────────────── */
  agent_comms_p_title: { en: 'Communication title', fr: 'Titre de la communication' }, // [FR self-authored]
  agent_comms_p_match_title: {
    en: 'Title (matched to an existing register entry)',
    fr: 'Titre (associé à une entrée existante du registre)',
  }, // [FR self-authored]
  agent_comms_p_audience: {
    en: 'Audience (e.g. all staff)',
    fr: 'Public (p. ex. tout le personnel)',
  }, // [FR self-authored]
  agent_comms_p_channel: {
    en: 'Channel — email, meeting, intranet, letter or other',
    fr: 'Canal — courriel, réunion, intranet, lettre ou autre',
  }, // [FR self-authored]
  agent_comms_p_status_filter: {
    en: 'Status filter — draft, scheduled or sent',
    fr: 'Filtre de statut — brouillon, prévue ou envoyée',
  }, // [FR self-authored]
  agent_comms_p_status_initial: {
    en: 'Initial status — draft, scheduled or sent',
    fr: 'Statut initial — brouillon, prévue ou envoyée',
  }, // [FR self-authored]
  agent_comms_p_scheduled: { en: 'Scheduled date (YYYY-MM-DD)', fr: 'Date prévue (AAAA-MM-JJ)' }, // [FR self-authored]
  agent_comms_p_note: { en: 'Short note', fr: 'Note courte' }, // [FR self-authored]

  /* ── Communications tool results ────────────────────────────────────────── */
  agent_comms_result_none: {
    en: 'No logged communications match.',
    fr: 'Aucune communication consignée ne correspond.',
  }, // [FR self-authored]
  agent_comms_result_not_found: {
    en: 'No register entry matches that title.',
    fr: 'Aucune entrée du registre ne correspond à ce titre.',
  }, // [FR self-authored]

  /* ── Tasks tool labels + descriptions ──────────────────────────────────── */
  agent_tasks_module: { en: 'Tasks', fr: 'Tâches' }, // [FR self-authored]

  agent_tasks_list_label: { en: 'List tasks', fr: 'Lister les tâches' }, // [FR self-authored]
  agent_tasks_list_desc: {
    en: 'Reads the task checklist.',
    fr: 'Lit la liste des tâches.',
  }, // [FR self-authored]

  agent_tasks_create_label: { en: 'Create a task', fr: 'Créer une tâche' }, // [FR self-authored]
  agent_tasks_create_desc: {
    en: 'Adds a task to the checklist.',
    fr: 'Ajoute une tâche à la liste.',
  }, // [FR self-authored]

  agent_tasks_complete_label: { en: 'Mark a task done', fr: 'Marquer une tâche comme terminée' }, // [FR self-authored]
  agent_tasks_complete_desc: {
    en: 'Marks an open task as done — the same toggle the checklist uses.',
    fr: 'Marque une tâche ouverte comme terminée — la même bascule que la liste.',
  }, // [FR self-authored]

  /* ── Tasks tool param descriptions ─────────────────────────────────────── */
  agent_tasks_p_title: { en: 'Task title', fr: 'Titre de la tâche' }, // [FR self-authored]
  agent_tasks_p_match_title: {
    en: 'Title (matched to an existing task)',
    fr: 'Titre (associé à une tâche existante)',
  }, // [FR self-authored]
  agent_tasks_p_priority: {
    en: 'Priority — low, medium, high or critical',
    fr: 'Priorité — basse, moyenne, haute ou critique',
  }, // [FR self-authored]
  agent_tasks_p_due: { en: 'Due date (YYYY-MM-DD)', fr: 'Échéance (AAAA-MM-JJ)' }, // [FR self-authored]
  agent_tasks_p_status: {
    en: 'Which tasks to list — open, done or all',
    fr: 'Quelles tâches lister — ouvertes, terminées ou toutes',
  }, // [FR self-authored]

  /* ── Tasks tool results ─────────────────────────────────────────────────── */
  agent_tasks_result_none: { en: 'No tasks match.', fr: 'Aucune tâche ne correspond.' }, // [FR self-authored]
  agent_tasks_result_not_found: {
    en: 'No task matches that title.',
    fr: 'Aucune tâche ne correspond à ce titre.',
  }, // [FR self-authored]

  /* ── Governance tool labels + descriptions ─────────────────────────────── */
  agent_gov_module: { en: 'Governance', fr: 'Gouvernance' }, // [FR self-authored]

  agent_gov_records_label: {
    en: 'List governance records',
    fr: 'Lister les documents de gouvernance',
  }, // [FR self-authored]
  agent_gov_records_desc: {
    en: 'Reads the corporate register — articles, by-laws, resolutions, minutes and registers.',
    fr: 'Lit le registre de gouvernance — statuts, règlements, résolutions, procès-verbaux et registres.',
  }, // [FR self-authored]

  agent_gov_decisions_label: { en: 'List decisions', fr: 'Lister les décisions' }, // [FR self-authored]
  agent_gov_decisions_desc: {
    en: 'Reads the decisions recorded in the register.',
    fr: 'Lit les décisions consignées au registre.',
  }, // [FR self-authored]

  agent_gov_officers_label: { en: 'List officers', fr: 'Lister les dirigeants' }, // [FR self-authored]
  agent_gov_officers_desc: {
    en: 'Reads the active officers and directors on file.',
    fr: 'Lit les dirigeants et administrateurs actifs au registre.',
  }, // [FR self-authored]

  agent_gov_add_decision_label: { en: 'Record a decision', fr: 'Consigner une décision' }, // [FR self-authored]
  agent_gov_add_decision_desc: {
    en: 'Adds a decision to the register — proposed unless you say it was adopted.',
    fr: 'Ajoute une décision au registre — proposée sauf si vous indiquez qu’elle est adoptée.',
  }, // [FR self-authored]

  agent_gov_adopt_decision_label: { en: 'Adopt a decision', fr: 'Adopter une décision' }, // [FR self-authored]
  agent_gov_adopt_decision_desc: {
    en: 'Marks a proposed decision as adopted.',
    fr: 'Marque une décision proposée comme adoptée.',
  }, // [FR self-authored]

  agent_gov_add_record_label: {
    en: 'File a governance record',
    fr: 'Classer un document de gouvernance',
  }, // [FR self-authored]
  agent_gov_add_record_desc: {
    en: 'Adds an entry to the register — it files the record, not the document itself.',
    fr: 'Ajoute une entrée au registre — elle consigne le document, sans y joindre le fichier.',
  }, // [FR self-authored]

  /* ── Governance tool param descriptions ────────────────────────────────── */
  agent_gov_p_title: { en: 'Title', fr: 'Titre' }, // [FR self-authored]
  agent_gov_p_record_type: {
    en: 'Record type — articles, bylaw, resolution, minutes or register',
    fr: 'Type de document — statuts, règlement, résolution, procès-verbal ou registre',
  }, // [FR self-authored]
  agent_gov_p_record_status: {
    en: 'Status filter — active, superseded or pending review',
    fr: 'Filtre de statut — actif, remplacé ou à réviser',
  }, // [FR self-authored]
  agent_gov_p_decision_status: {
    en: 'Status filter — proposed, adopted or rescinded',
    fr: 'Filtre de statut — proposée, adoptée ou annulée',
  }, // [FR self-authored]
  agent_gov_p_decision_initial: {
    en: 'Initial status — proposed, adopted or rescinded (default proposed)',
    fr: 'Statut initial — proposée, adoptée ou annulée (proposée par défaut)',
  }, // [FR self-authored]
  agent_gov_p_decided_by: {
    en: 'Who decided (e.g. Board of Directors)',
    fr: 'Décideur (p. ex. conseil d’administration)',
  }, // [FR self-authored]
  agent_gov_p_rationale: { en: 'Rationale', fr: 'Justification' }, // [FR self-authored]
  agent_gov_p_date: { en: 'Decision date (YYYY-MM-DD)', fr: 'Date de la décision (AAAA-MM-JJ)' }, // [FR self-authored]
  agent_gov_p_match_decision: {
    en: 'Title (matched to an existing decision)',
    fr: 'Titre (associé à une décision existante)',
  }, // [FR self-authored]
  agent_gov_p_jurisdiction: { en: 'Jurisdiction', fr: 'Juridiction' }, // [FR self-authored]
  agent_gov_p_effective: {
    en: 'Effective date (YYYY-MM-DD)',
    fr: 'Date d’entrée en vigueur (AAAA-MM-JJ)',
  }, // [FR self-authored]
  agent_gov_p_review_due: {
    en: 'Review due date (YYYY-MM-DD)',
    fr: 'Date de révision prévue (AAAA-MM-JJ)',
  }, // [FR self-authored]

  /* ── Governance tool results ────────────────────────────────────────────── */
  agent_gov_records_none: {
    en: 'No governance records match.',
    fr: 'Aucun document de gouvernance ne correspond.',
  }, // [FR self-authored]
  agent_gov_decisions_none: { en: 'No decisions match.', fr: 'Aucune décision ne correspond.' }, // [FR self-authored]
  agent_gov_officers_none: {
    en: 'No active officers on file.',
    fr: 'Aucun dirigeant actif au registre.',
  }, // [FR self-authored]
  agent_gov_decision_not_found: {
    en: 'No decision matches that title.',
    fr: 'Aucune décision ne correspond à ce titre.',
  }, // [FR self-authored]
  agent_gov_decision_rescinded: {
    en: 'That decision was rescinded — record a new one instead.',
    fr: 'Cette décision a été annulée — consignez-en une nouvelle.',
  }, // [FR self-authored]

  /* ── Finance tool labels + descriptions ────────────────────────────────── */
  agent_fin_module: { en: 'Finance', fr: 'Finances' }, // [FR self-authored]

  agent_fin_invoices_label: { en: 'List invoices', fr: 'Lister les factures' }, // [FR self-authored]
  agent_fin_invoices_desc: {
    en: 'Reads the sales ledger — invoice number, customer, amount and status, flagging anything past due.',
    fr: 'Lit le grand livre des ventes — numéro, client, montant et statut, en signalant les retards.',
  }, // [FR self-authored]

  agent_fin_spend_label: { en: 'List spend requests', fr: 'Lister les demandes de dépense' }, // [FR self-authored]
  agent_fin_spend_desc: {
    en: 'Reads spend requests — purpose, requester, amount and where each sits in approval.',
    fr: 'Lit les demandes de dépense — objet, demandeur, montant et étape d’approbation.',
  }, // [FR self-authored]

  agent_fin_obligations_label: {
    en: 'List tax obligations',
    fr: 'Lister les obligations fiscales',
  }, // [FR self-authored]
  agent_fin_obligations_desc: {
    en: 'Reads open tax obligations by due date — filings still owed, flagging any past due.',
    fr: 'Lit les obligations fiscales ouvertes par échéance — déclarations à produire, retards signalés.',
  }, // [FR self-authored]

  agent_fin_mark_paid_label: {
    en: 'Mark an invoice as paid',
    fr: 'Marquer une facture comme payée',
  }, // [FR self-authored]
  agent_fin_mark_paid_desc: {
    en: 'Marks an open invoice as paid — the same record the Sales screen makes.',
    fr: 'Marque une facture ouverte comme payée — le même enregistrement que l’écran Ventes.',
  }, // [FR self-authored]

  agent_fin_add_spend_label: {
    en: 'Submit a spend request',
    fr: 'Soumettre une demande de dépense',
  }, // [FR self-authored]
  agent_fin_add_spend_desc: {
    en: 'Files a spend request and submits it for approval — nothing is purchased or paid.',
    fr: 'Consigne une demande de dépense et la soumet pour approbation — rien n’est acheté ni payé.',
  }, // [FR self-authored]

  agent_fin_approve_spend_label: {
    en: 'Approve a spend request',
    fr: 'Approuver une demande de dépense',
  }, // [FR self-authored]
  agent_fin_approve_spend_desc: {
    en: 'Approves a submitted spend request — the same transition the Purchases screen offers.',
    fr: 'Approuve une demande soumise — la même transition que l’écran Achats.',
  }, // [FR self-authored]

  agent_fin_add_obligation_label: {
    en: 'File a tax obligation',
    fr: 'Consigner une obligation fiscale',
  }, // [FR self-authored]
  agent_fin_add_obligation_desc: {
    en: 'Puts a filing deadline on file — a reminder in the register, not a filed return or a payment.',
    fr: 'Consigne une échéance de déclaration — un rappel au registre, pas une déclaration produite ni un paiement.',
  }, // [FR self-authored]

  /* ── Finance tool param descriptions ───────────────────────────────────── */
  agent_fin_p_invoice_status: {
    en: 'Status filter — draft, issued, partial, paid, overdue, disputed, written off or cancelled',
    fr: 'Filtre de statut — brouillon, émise, partielle, payée, en retard, contestée, radiée ou annulée',
  }, // [FR self-authored]
  agent_fin_p_spend_status: {
    en: 'Status filter — draft, submitted, approved, rejected, committed or cancelled',
    fr: 'Filtre de statut — brouillon, soumise, approuvée, rejetée, engagée ou annulée',
  }, // [FR self-authored]
  agent_fin_p_obligation_status: {
    en: 'Status filter — open statuses by default',
    fr: 'Filtre de statut — statuts ouverts par défaut',
  }, // [FR self-authored]
  agent_fin_p_match_invoice: {
    en: 'Invoice number or customer name',
    fr: 'Numéro de facture ou nom du client',
  }, // [FR self-authored]
  agent_fin_p_match_spend: {
    en: 'Purpose (matched to an existing request)',
    fr: 'Objet (associé à une demande existante)',
  }, // [FR self-authored]
  agent_fin_p_purpose: { en: 'What the spend is for', fr: 'Objet de la dépense' }, // [FR self-authored]
  agent_fin_p_amount: { en: 'Amount (e.g. 1250.00)', fr: 'Montant (p. ex. 1250,00)' }, // [FR self-authored]
  agent_fin_p_currency: {
    en: 'Currency — CAD, USD, EUR or GBP (default CAD)',
    fr: 'Devise — CAD, USD, EUR ou GBP (CAD par défaut)',
  }, // [FR self-authored]
  agent_fin_p_requester: {
    en: 'Who is requesting (default: Workspace user)',
    fr: 'Demandeur (par défaut : utilisateur de l’espace)',
  }, // [FR self-authored]
  agent_fin_p_obligation_type: {
    en: 'Obligation type — income tax, GST/HST, QST, payroll source deductions, employer contributions or other',
    fr: 'Type d’obligation — impôt, TPS/TVH, TVQ, retenues à la source, cotisations employeur ou autre',
  }, // [FR self-authored]
  agent_fin_p_period: { en: 'Filing period (e.g. Q3 2026)', fr: 'Période visée (p. ex. T3 2026)' }, // [FR self-authored]
  agent_fin_p_due: { en: 'Due date (YYYY-MM-DD)', fr: 'Échéance (AAAA-MM-JJ)' }, // [FR self-authored]
  agent_fin_p_estimated: { en: 'Estimated amount', fr: 'Montant estimé' }, // [FR self-authored]
  agent_fin_p_jurisdiction: {
    en: 'Jurisdiction (default Canada)',
    fr: 'Juridiction (Canada par défaut)',
  }, // [FR self-authored]

  /* ── Finance tool results ───────────────────────────────────────────────── */
  agent_fin_invoices_none: { en: 'No invoices match.', fr: 'Aucune facture ne correspond.' }, // [FR self-authored]
  agent_fin_spend_none: {
    en: 'No spend requests match.',
    fr: 'Aucune demande de dépense ne correspond.',
  }, // [FR self-authored]
  agent_fin_obligations_none: {
    en: 'No open obligations on file.',
    fr: 'Aucune obligation ouverte au registre.',
  }, // [FR self-authored]
  agent_fin_invoice_not_found: {
    en: 'No invoice matches that number or customer.',
    fr: 'Aucune facture ne correspond à ce numéro ou client.',
  }, // [FR self-authored]
  agent_fin_invoice_not_payable: {
    en: 'That invoice is cancelled or written off — it can’t be marked paid.',
    fr: 'Cette facture est annulée ou radiée — elle ne peut pas être marquée payée.',
  }, // [FR self-authored]
  agent_fin_spend_not_found: {
    en: 'No spend request matches that purpose.',
    fr: 'Aucune demande de dépense ne correspond à cet objet.',
  }, // [FR self-authored]
  agent_fin_spend_not_submitted: {
    en: 'That request is still a draft — submit it before approving.',
    fr: 'Cette demande est encore en brouillon — soumettez-la avant de l’approuver.',
  }, // [FR self-authored]
  agent_fin_spend_not_approvable: {
    en: 'That request was rejected or cancelled — it can’t be approved.',
    fr: 'Cette demande a été rejetée ou annulée — elle ne peut pas être approuvée.',
  }, // [FR self-authored]
  agent_fin_result_write_failed: {
    en: 'The workspace couldn’t save that — check the Finance view for details.',
    fr: 'L’espace de travail n’a pas pu enregistrer — voyez l’écran Finances pour le détail.',
  }, // [FR self-authored]
  agent_fin_result_no_entity: {
    en: 'No legal entity is on file yet — set one up in Finance first.',
    fr: 'Aucune entité juridique au registre — configurez-en une dans Finances d’abord.',
  }, // [FR self-authored]
  agent_fin_result_bad_amount: {
    en: 'The amount needs to be a number, like 1250.00.',
    fr: 'Le montant doit être un nombre, comme 1250,00.',
  }, // [FR self-authored]

  /* ── Operations module label ────────────────────────────────────────────── */
  agent_ops_module: { en: 'Operations', fr: 'Opérations' }, // [FR self-authored]

  /* ── Operations tool labels + descriptions ─────────────────────────────── */
  agent_ops_projects_label: { en: 'List projects', fr: 'Lister les projets' }, // [FR self-authored]
  agent_ops_projects_desc: {
    en: 'Lists workspace projects — what’s in flight and where each one stands.',
    fr: 'Liste les projets de l’espace — ce qui est en cours et où chacun en est.',
  }, // [FR self-authored]
  agent_ops_vendors_label: { en: 'List vendors', fr: 'Lister les fournisseurs' }, // [FR self-authored]
  agent_ops_vendors_desc: {
    en: 'Lists vendors and flags contracts that have lapsed.',
    fr: 'Liste les fournisseurs et signale les contrats échus.',
  }, // [FR self-authored]
  agent_ops_logistics_label: { en: 'Open shipments', fr: 'Livraisons en cours' }, // [FR self-authored]
  agent_ops_logistics_desc: {
    en: 'Lists shipments still in transit or delayed — what hasn’t arrived yet.',
    fr: 'Liste les livraisons encore en transit ou retardées — ce qui n’est pas encore arrivé.',
  }, // [FR self-authored]
  agent_ops_add_vendor_label: { en: 'Add a vendor', fr: 'Ajouter un fournisseur' }, // [FR self-authored]
  agent_ops_add_vendor_desc: {
    en: 'Adds a vendor record — name and optional contract details, active by default.',
    fr: 'Ajoute une fiche fournisseur — nom et détails de contrat facultatifs, active par défaut.',
  }, // [FR self-authored]
  agent_ops_deliver_label: { en: 'Record a delivery', fr: 'Consigner une livraison' }, // [FR self-authored]
  agent_ops_deliver_desc: {
    en: 'Marks a shipment as delivered — records arrival, it doesn’t book or track a carrier.',
    fr: 'Marque une livraison comme livrée — consigne l’arrivée, sans réserver ni suivre de transporteur.',
  }, // [FR self-authored]
  agent_ops_update_project_label: {
    en: 'Update a project’s status',
    fr: 'Changer le statut d’un projet',
  }, // [FR self-authored]
  agent_ops_update_project_desc: {
    en: 'Moves a project between planning, active, on hold, completed or cancelled.',
    fr: 'Fait passer un projet entre planification, actif, en pause, terminé ou annulé.',
  }, // [FR self-authored]

  /* ── Operations tool param descriptions ────────────────────────────────── */
  agent_ops_p_project_status: {
    en: 'Status filter — planning, active, on hold, completed or cancelled',
    fr: 'Filtre de statut — planification, actif, en pause, terminé ou annulé',
  }, // [FR self-authored]
  agent_ops_p_vendor_type: {
    en: 'Vendor type — supplier, logistics, technology or professional service',
    fr: 'Type de fournisseur — fournisseur, logistique, technologie ou service professionnel',
  }, // [FR self-authored]
  agent_ops_p_vendor_status: {
    en: 'Status filter — active, inactive or under review',
    fr: 'Filtre de statut — actif, inactif ou en révision',
  }, // [FR self-authored]
  agent_ops_p_name: { en: 'Vendor name', fr: 'Nom du fournisseur' }, // [FR self-authored]
  agent_ops_p_contract_expiry: {
    en: 'Contract expiry (YYYY-MM-DD)',
    fr: 'Échéance du contrat (AAAA-MM-JJ)',
  }, // [FR self-authored]
  agent_ops_p_notes: { en: 'Notes', fr: 'Notes' }, // [FR self-authored]
  agent_ops_p_match_shipment: {
    en: 'Shipment title (matched to an existing shipment)',
    fr: 'Titre de la livraison (associé à une livraison existante)',
  }, // [FR self-authored]
  agent_ops_p_match_project: {
    en: 'Project title (matched to an existing project)',
    fr: 'Titre du projet (associé à un projet existant)',
  }, // [FR self-authored]
  agent_ops_p_project_new_status: {
    en: 'New status — planning, active, on hold, completed or cancelled',
    fr: 'Nouveau statut — planification, actif, en pause, terminé ou annulé',
  }, // [FR self-authored]

  /* ── Operations tool results ────────────────────────────────────────────── */
  agent_ops_projects_none: { en: 'No projects match.', fr: 'Aucun projet ne correspond.' }, // [FR self-authored]
  agent_ops_vendors_none: { en: 'No vendors match.', fr: 'Aucun fournisseur ne correspond.' }, // [FR self-authored]
  agent_ops_logistics_none: {
    en: 'No open shipments — everything’s arrived or returned.',
    fr: 'Aucune livraison en cours — tout est arrivé ou retourné.',
  }, // [FR self-authored]
  agent_ops_shipment_not_found: {
    en: 'No shipment matches that title.',
    fr: 'Aucune livraison ne correspond à ce titre.',
  }, // [FR self-authored]
  agent_ops_shipment_returned: {
    en: 'That shipment was returned — it can’t be marked delivered.',
    fr: 'Cette livraison a été retournée — elle ne peut pas être marquée livrée.',
  }, // [FR self-authored]
  agent_ops_project_not_found: {
    en: 'No project matches that title.',
    fr: 'Aucun projet ne correspond à ce titre.',
  }, // [FR self-authored]
  agent_ops_status_missing: {
    en: 'Which status — planning, active, on hold, completed or cancelled?',
    fr: 'Quel statut — planification, actif, en pause, terminé ou annulé ?',
  }, // [FR self-authored]

  /* ── Documents module + tool labels ─────────────────────────────────────── */
  agent_docs_module: { en: 'Documents', fr: 'Documents' },
  agent_docs_list_label: { en: 'List documents', fr: 'Lister les documents' }, // [FR self-authored]
  agent_docs_list_desc: {
    en: 'Lists generated documents with status — filterable, flags anything still out for signature.',
    fr: 'Liste les documents générés avec statut — filtrable, signale ceux encore en signature.',
  }, // [FR self-authored]
  agent_docs_templates_label: { en: 'List templates', fr: 'Lister les modèles' }, // [FR self-authored]
  agent_docs_templates_desc: {
    en: 'Lists document templates in the catalogue — filter by name, key or category.',
    fr: 'Liste les modèles du catalogue — filtrer par nom, clé ou catégorie.',
  }, // [FR self-authored]
  agent_docs_signing_label: { en: 'Signature queue', fr: 'File de signature' }, // [FR self-authored]
  agent_docs_signing_desc: {
    en: 'Lists documents out for signature and who hasn’t signed yet.',
    fr: 'Liste les documents en signature et les signataires en attente.',
  }, // [FR self-authored]
  agent_docs_approve_label: { en: 'Approve document', fr: 'Approuver le document' }, // [FR self-authored]
  agent_docs_approve_desc: {
    en: 'Marks a generated document approved — the step before it can go out for signature.',
    fr: 'Marque un document généré comme approuvé — l’étape avant l’envoi en signature.',
  }, // [FR self-authored]
  agent_docs_send_label: { en: 'Send for signature', fr: 'Envoyer pour signature' }, // [FR self-authored]
  agent_docs_send_desc: {
    en: 'Sends an approved document to one recipient for signature — in production this emails a real signing invite.',
    fr: 'Envoie un document approuvé à un signataire — en production, un vrai courriel de signature part.',
  }, // [FR self-authored]

  /* ── Documents params ───────────────────────────────────────────────────── */
  agent_docs_p_status: { en: 'Status filter', fr: 'Filtre de statut' }, // [FR self-authored]
  agent_docs_p_match_template: {
    en: 'Template name, key or category',
    fr: 'Nom, clé ou catégorie du modèle',
  }, // [FR self-authored]
  agent_docs_p_match_doc: {
    en: 'Document title or reference (matched to an existing document)',
    fr: 'Titre ou référence du document (associé à un document existant)',
  }, // [FR self-authored]
  agent_docs_p_email: {
    en: 'Recipient email — the signing invite goes here',
    fr: 'Courriel du signataire — l’invitation de signature y est envoyée',
  }, // [FR self-authored]
  agent_docs_p_name: {
    en: 'Recipient name (defaults to the email’s first part)',
    fr: 'Nom du signataire (la première partie du courriel par défaut)',
  }, // [FR self-authored]

  /* ── Documents tool results ─────────────────────────────────────────────── */
  agent_docs_list_none: { en: 'No documents match.', fr: 'Aucun document ne correspond.' }, // [FR self-authored]
  agent_docs_templates_none: { en: 'No templates match.', fr: 'Aucun modèle ne correspond.' }, // [FR self-authored]
  agent_docs_signing_none: {
    en: 'Nothing is out for signature.',
    fr: 'Rien n’est en attente de signature.',
  }, // [FR self-authored]
  agent_docs_doc_not_found: {
    en: 'No document matches that title or reference.',
    fr: 'Aucun document ne correspond à ce titre ou à cette référence.',
  }, // [FR self-authored]
  agent_docs_approve_not_allowed: {
    en: 'That document can’t be approved — it’s already been sent, signed, archived or voided.',
    fr: 'Ce document ne peut pas être approuvé — il a déjà été envoyé, signé, archivé ou annulé.',
  }, // [FR self-authored]
  agent_docs_bad_email: {
    en: 'That doesn’t look like an email address.',
    fr: 'Ça ne ressemble pas à un courriel.',
  }, // [FR self-authored]
  agent_docs_send_already_sent: {
    en: 'A signature envelope already exists for that document.',
    fr: 'Une enveloppe de signature existe déjà pour ce document.',
  }, // [FR self-authored]
  agent_docs_send_needs_approved: {
    en: 'That document must be approved before it can go out for signature.',
    fr: 'Ce document doit être approuvé avant l’envoi en signature.',
  }, // [FR self-authored]

  /* ── Security module + tool labels ──────────────────────────────────────── */
  agent_sec_module: { en: 'Security', fr: 'Sécurité' },
  agent_sec_incidents_label: { en: 'List incidents', fr: 'Lister les incidents' }, // [FR self-authored]
  agent_sec_incidents_desc: {
    en: 'Lists security incidents — open by default, filter by status.',
    fr: 'Liste les incidents de sécurité — ouverts par défaut, filtrer par statut.',
  }, // [FR self-authored]
  agent_sec_risks_label: { en: 'List risks', fr: 'Lister les risques' }, // [FR self-authored]
  agent_sec_risks_desc: {
    en: 'Lists the risk register — open risks by default.',
    fr: 'Liste le registre des risques — les risques ouverts par défaut.',
  }, // [FR self-authored]
  agent_sec_vendors_label: { en: 'Vendor reviews', fr: 'Évaluations fournisseurs' }, // [FR self-authored]
  agent_sec_vendors_desc: {
    en: 'Lists vendor security reviews — flags overdue ones and missing privacy agreements.',
    fr: 'Liste les évaluations de sécurité des fournisseurs — signale les retards et les ententes manquantes.',
  }, // [FR self-authored]
  agent_sec_access_label: { en: 'Access reviews', fr: 'Revues d’accès' }, // [FR self-authored]
  agent_sec_access_desc: {
    en: 'Lists open access reviews — what’s pending, in progress or overdue.',
    fr: 'Liste les revues d’accès en cours — en attente, en cours ou en retard.',
  }, // [FR self-authored]
  agent_sec_report_label: { en: 'Log an incident', fr: 'Consigner un incident' }, // [FR self-authored]
  agent_sec_report_desc: {
    en: 'Records a security incident in the register — open, with a severity.',
    fr: 'Consigne un incident de sécurité au registre — ouvert, avec une sévérité.',
  }, // [FR self-authored]
  agent_sec_resolve_label: { en: 'Resolve an incident', fr: 'Résoudre un incident' }, // [FR self-authored]
  agent_sec_resolve_desc: {
    en: 'Marks an open or contained incident resolved by title match.',
    fr: 'Marque un incident ouvert ou contenu comme résolu, par titre.',
  }, // [FR self-authored]
  agent_sec_complete_label: { en: 'Complete an access review', fr: 'Terminer une revue d’accès' }, // [FR self-authored]
  agent_sec_complete_desc: {
    en: 'Marks an open access review completed by title match.',
    fr: 'Marque une revue d’accès en cours comme terminée, par titre.',
  }, // [FR self-authored]

  /* ── Security params ────────────────────────────────────────────────────── */
  agent_sec_p_incident_status: {
    en: 'Status filter — open, contained, resolved or closed',
    fr: 'Filtre de statut — ouvert, contenu, résolu ou fermé',
  }, // [FR self-authored]
  agent_sec_p_risk_status: {
    en: 'Status filter — open, mitigated, accepted or closed',
    fr: 'Filtre de statut — ouvert, atténué, accepté ou fermé',
  }, // [FR self-authored]
  agent_sec_p_incident_title: {
    en: 'What happened — short incident title',
    fr: 'Ce qui s’est passé — titre court de l’incident',
  }, // [FR self-authored]
  agent_sec_p_severity: {
    en: 'Severity — critical, high, medium or low (defaults to medium)',
    fr: 'Sévérité — critique, élevée, moyenne ou faible (moyenne par défaut)',
  }, // [FR self-authored]
  agent_sec_p_summary: {
    en: 'Optional summary of what happened',
    fr: 'Résumé facultatif de ce qui s’est passé',
  }, // [FR self-authored]
  agent_sec_p_match_incident: {
    en: 'Incident title (matched to an existing incident)',
    fr: 'Titre de l’incident (associé à un incident existant)',
  }, // [FR self-authored]
  agent_sec_p_match_review: {
    en: 'Access review title (matched to an existing review)',
    fr: 'Titre de la revue d’accès (associée à une revue existante)',
  }, // [FR self-authored]

  /* ── Security tool results ──────────────────────────────────────────────── */
  agent_sec_incidents_none: { en: 'No incidents match.', fr: 'Aucun incident ne correspond.' }, // [FR self-authored]
  agent_sec_risks_none: { en: 'No risks match.', fr: 'Aucun risque ne correspond.' }, // [FR self-authored]
  agent_sec_vendors_none: {
    en: 'No vendor reviews on file.',
    fr: 'Aucune évaluation de fournisseur au dossier.',
  }, // [FR self-authored]
  agent_sec_access_none: {
    en: 'No open access reviews — all completed.',
    fr: 'Aucune revue d’accès en cours — toutes sont terminées.',
  }, // [FR self-authored]
  agent_sec_incident_not_found: {
    en: 'No incident matches that title.',
    fr: 'Aucun incident ne correspond à ce titre.',
  }, // [FR self-authored]
  agent_sec_incident_closed: {
    en: 'That incident is already closed.',
    fr: 'Cet incident est déjà fermé.',
  }, // [FR self-authored]
  agent_sec_review_not_found: {
    en: 'No access review matches that title.',
    fr: 'Aucune revue d’accès ne correspond à ce titre.',
  }, // [FR self-authored]
})
