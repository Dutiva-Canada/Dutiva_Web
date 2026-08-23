import { defineMessages } from '../core'

/**
 * Settings view — the workspace's largest static view (App v2.dc.html markup
 * 1267–1435, logic `buildSettingsView()` 3539–3622).
 *
 * EN verbatim from the prototype; FR from its `buildI18n()` (`str.appearance`,
 * `str.privacy_note`, `str.disclaimer_full`, …), `frDict()` (toggle rows,
 * provinces) and the inline `L(en, fr)` pairs inside `buildSettingsView()`.
 * No self-authored FR — every string has a prototype source.
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * The view resolves these via `useI18n().x(settingsMessages.key)`.
 */
export const settingsMessages = defineMessages({
  /* ── Appearance & language (buildI18n) ─────────────────────────────────── */
  settings_appearance: { en: 'Appearance', fr: 'Apparence' },
  settings_theme_light: { en: 'Light', fr: 'Clair' },
  settings_theme_dark: { en: 'Dark', fr: 'Sombre' },
  settings_language: { en: 'Language', fr: 'Langue' },

  /* ── Data & privacy (buildI18n str.privacy / str.privacy_note) ─────────── */
  settings_privacy: { en: 'Data & privacy', fr: 'Données et confidentialité' },
  settings_privacy_note: {
    en: 'Your data is stored in Canada. Dutiva is PIPEDA-conscious and Quebec Law 25-aware — you control retention and export.',
    fr: 'Vos données sont hébergées au Canada. Dutiva respecte la LPRPDE et tient compte de la Loi 25 du Québec — vous contrôlez la conservation et l’exportation.',
  },

  /* ── Workspace (lbl.workspaceLabel / company / provincesOfOp) ──────────── */
  settings_workspace: { en: 'Workspace', fr: 'Espace de travail' },
  settings_company: { en: 'Company', fr: 'Entreprise' },
  settings_provinces_of_op: { en: 'Provinces of operation', fr: 'Provinces d’exploitation' },
  settings_prov_ontario: { en: 'Ontario', fr: 'Ontario' },
  settings_prov_bc: { en: 'British Columbia', fr: 'Colombie-Britannique' },
  settings_prov_quebec: { en: 'Quebec', fr: 'Québec' },
  settings_prov_alberta: { en: 'Alberta', fr: 'Alberta' },
  settings_prov_federal: { en: 'Federally regulated', fr: 'Sous réglementation fédérale' },
  settings_locations: { en: 'Locations', fr: 'Emplacements' },
  settings_locations_value: {
    en: 'Ottawa (HQ) · Montréal · Vancouver',
    fr: 'Ottawa (siège) · Montréal · Vancouver',
  },

  /* ── Workspace mode toggle (admin-only; not in the design handoff — new for
     the production-readiness work) — [FR self-authored] ──────────────────── */
  settings_workspace_mode: { en: 'Workspace mode', fr: 'Mode de l’espace de travail' },
  settings_workspace_mode_demo: { en: 'Demo', fr: 'Démo' },
  settings_workspace_mode_production: { en: 'Production', fr: 'Production' },
  settings_workspace_mode_note: {
    en: 'Demo shows Northgate Logistics Inc. sample data for training and walkthroughs. Production is your real, empty Dutiva workspace — visible only to you.',
    fr: 'Le mode Démo affiche les données d’exemple de Northgate Logistics Inc. pour la formation et les démonstrations. Le mode Production est votre espace de travail Dutiva réel et vide — visible pour vous seul.',
  },
  /* Signing reminder cadence — [FR self-authored] */
  settings_signing_reminder_days: {
    en: 'Signing reminder interval (days)',
    fr: 'Intervalle de rappel de signature (jours)',
  },
  settings_signing_reminder_days_note: {
    en: 'How long after the invite (or last reminder) before Dutiva emails the current signer again. Between 1 and 14 days.',
    fr: 'Délai après l’invitation (ou le dernier rappel) avant que Dutiva renvoie un courriel au signataire en cours. Entre 1 et 14 jours.',
  },
  settings_signing_reminder_saved: {
    en: 'Reminder interval saved',
    fr: 'Intervalle de rappel enregistré',
  },
  settings_signing_reminder_failed: {
    en: 'Could not save reminder interval',
    fr: 'Impossible d’enregistrer l’intervalle de rappel',
  },

  /* ── Users & team ───────────────────────────────────────────────────────── */
  settings_team: { en: 'Users & team', fr: 'Équipe et utilisateurs' },
  settings_role_owner: { en: 'Owner / Admin', fr: 'Propriétaire / Admin' },
  settings_role_hr: { en: 'HR Manager', fr: 'Responsable RH' },
  settings_role_manager: { en: 'Manager', fr: 'Gestionnaire' },
  settings_role_finance: { en: 'Finance', fr: 'Finances' },
  settings_role_legal: { en: 'Legal / Counsel', fr: 'Juridique / Conseiller' },
  settings_role_viewer: { en: 'Viewer', fr: 'Lecture seule' },
  settings_team_counsel_name: {
    en: 'Partner counsel (external)',
    fr: 'Conseiller partenaire (externe)',
  },
  settings_team_counsel_role: {
    en: 'Legal / Counsel — assigned cases only',
    fr: 'Juridique / Conseiller — dossiers assignés seulement',
  },
  settings_team_pending_name: { en: 'Invitation pending', fr: 'Invitation en attente' },
  settings_team_pending_role: { en: 'Viewer (read-only)', fr: 'Lecture seule' },

  /* ── Notifications toggles (settingsPrefs, frDict) ─────────────────────── */
  settings_notifications: { en: 'Notifications', fr: 'Notifications' },
  settings_toggle_email_digest: {
    en: 'Daily email digest',
    fr: 'Résumé quotidien par courriel',
  },
  settings_toggle_email_digest_sub: {
    en: 'A summary of what Advisor noticed each morning',
    fr: 'Un résumé de ce que le Conseiller a remarqué chaque matin',
  },
  settings_toggle_risk_alerts: {
    en: 'Real-time risk alerts',
    fr: 'Alertes de risque en temps réel',
  },
  settings_toggle_risk_alerts_sub: {
    en: 'Notify immediately when a high-severity risk is flagged',
    fr: 'Aviser immédiatement lorsqu’un risque élevé est signalé',
  },
  settings_toggle_auto_escalate: {
    en: 'Auto-suggest legal escalation',
    fr: 'Suggérer automatiquement une escalade juridique',
  },
  settings_toggle_auto_escalate_sub: {
    en: 'Advisor proactively offers counsel review on high-risk cases',
    fr: 'Le Conseiller propose de façon proactive un examen juridique pour les dossiers à risque élevé',
  },
  settings_toggle_weekly_digest: {
    en: 'Weekly compliance report',
    fr: 'Rapport de conformité hebdomadaire',
  },
  settings_toggle_weekly_digest_sub: {
    en: 'Emailed every Monday to workspace admins',
    fr: 'Envoyé par courriel chaque lundi aux administrateurs de l’espace de travail',
  },

  /* ── AI & Advisor toggles + disclaimer ──────────────────────────────────── */
  settings_ai: { en: 'AI & Advisor', fr: 'IA et Conseiller' },
  settings_toggle_ai_context: {
    en: 'Use workspace context in Advisor',
    fr: 'Utiliser le contexte de l’espace de travail dans le Conseiller',
  },
  settings_toggle_ai_context_sub: {
    en: 'Advisor reads the case, employee, and document context you attach — removable per question',
    fr: 'Le Conseiller lit le contexte de dossier, d’employé et de document que vous joignez — retirable pour chaque question',
  },
  settings_toggle_ai_citations: {
    en: 'Show sources on compliance answers',
    fr: 'Afficher les sources sur les réponses de conformité',
  },
  settings_toggle_ai_citations_sub: {
    en: 'Statute and section references shown on jurisdiction-specific guidance',
    fr: 'Références aux lois et articles affichées sur les conseils propres à la compétence',
  },
  settings_disclaimer_label: { en: 'Legal disclaimer', fr: 'Avis juridique' },
  settings_disclaimer_note: {
    en: 'Shown in Advisor, Document Studio, and every high-risk workflow. Wording is fixed at the workspace level.',
    fr: 'Affiché dans le Conseiller, le Studio de documents et chaque processus à risque élevé. Le libellé est fixé au niveau de l’espace de travail.',
  },

  /* ── Roles & permissions matrix ─────────────────────────────────────────── */
  settings_roles: { en: 'Roles & permissions', fr: 'Rôles et permissions' },
  settings_col_role: { en: 'Role', fr: 'Rôle' },
  settings_col_records: { en: 'Employee records', fr: 'Dossiers d’employés' },
  settings_col_comp: { en: 'Compensation', fr: 'Rémunération' },
  settings_col_cases: { en: 'Sensitive cases', fr: 'Dossiers sensibles' },
  settings_col_signals: { en: 'Support signals', fr: 'Signaux de soutien' },
  settings_perm_full: { en: 'Full', fr: 'Complet' },
  settings_perm_view: { en: 'View', fr: 'Lecture' },
  settings_perm_none: { en: 'None', fr: 'Aucun' },
  settings_perm_team: { en: 'Team only', fr: 'Équipe' },
  settings_perm_assigned: { en: 'Assigned', fr: 'Assignés' },
  settings_roles_note: {
    en: 'Permission changes require Owner/Admin and are recorded in the audit log. Restricted areas across the app enforce this matrix.',
    fr: 'Les changements de permissions exigent Propriétaire/Admin et sont consignés au journal d’audit. Les zones restreintes de l’application appliquent cette matrice.',
  },

  /* ── Data retention ─────────────────────────────────────────────────────── */
  settings_retention: { en: 'Data retention', fr: 'Conservation des données' },
  settings_retention_employment: {
    en: 'Employment & payroll records',
    fr: 'Dossiers d’emploi et de paie',
  },
  settings_retention_employment_v: {
    en: '7 years after employment ends (ESA/CRA)',
    fr: '7 ans après la fin de l’emploi (LNE/ARC)',
  },
  settings_retention_cases: { en: 'Case files', fr: 'Dossiers' },
  settings_retention_cases_v: {
    en: '3 years after the case closes',
    fr: '3 ans après la fermeture du dossier',
  },
  settings_retention_accommodation: {
    en: 'Accommodation records',
    fr: 'Dossiers d’accommodement',
  },
  settings_retention_accommodation_v: {
    en: 'Duration of employment + 3 years',
    fr: 'Durée de l’emploi + 3 ans',
  },
  settings_retention_advisor: {
    en: 'Advisor conversations',
    fr: 'Conversations avec le Conseiller',
  },
  settings_retention_advisor_v: { en: '2 years — configurable', fr: '2 ans — configurable' },
  settings_retention_note: {
    en: 'Retention changes require Owner/Admin and are recorded in the audit log.',
    fr: 'Les changements de conservation exigent Propriétaire/Admin et sont consignés au journal d’audit.',
  },

  /* ── Security ───────────────────────────────────────────────────────────── */
  settings_security: { en: 'Security', fr: 'Sécurité' },
  settings_security_2fa: {
    en: 'Two-factor authentication',
    fr: 'Authentification à deux facteurs',
  },
  settings_security_2fa_v: { en: 'Required for all roles', fr: 'Requise pour tous les rôles' },
  settings_security_sso: { en: 'Single sign-on (SSO)', fr: 'Authentification unique (SSO)' },
  settings_security_sso_v: { en: 'Not configured', fr: 'Non configurée' },
  settings_security_timeout: { en: 'Session timeout', fr: 'Expiration de session' },
  settings_security_timeout_v: { en: '8 hours', fr: '8 heures' },
  settings_security_residency: { en: 'Data residency', fr: 'Résidence des données' },
  settings_security_residency_v: {
    en: 'Canada (Montréal region)',
    fr: 'Canada (région de Montréal)',
  },

  /* ── Integrations & billing ─────────────────────────────────────────────── */
  settings_integrations: { en: 'Integrations & billing', fr: 'Intégrations et facturation' },
  settings_int_esign: { en: 'E-signature', fr: 'Signature électronique' },
  settings_int_payroll: { en: 'Payroll provider', fr: 'Fournisseur de paie' },
  settings_int_calendar: { en: 'Calendar sync', fr: 'Synchronisation du calendrier' },
  /* FR gender agrees with the connected service (prototype: Connectée / Connecté). */
  settings_int_connected_f: { en: 'Connected', fr: 'Connectée' },
  settings_int_connected_m: { en: 'Connected', fr: 'Connecté' },
  settings_int_error: { en: 'Connection error', fr: 'Erreur de connexion' },
  settings_int_retry: { en: 'Retry', fr: 'Réessayer' },
  settings_toast_reconnected: { en: 'Calendar reconnected', fr: 'Calendrier reconnecté' },
  settings_billing: {
    en: 'Growth plan — $49/mo CAD · Next invoice Aug 1, 2026',
    fr: 'Forfait Croissance — 49 $/mois CAD · Prochaine facture le 1er août 2026',
  },
  settings_billing_btn: { en: 'Manage billing', fr: 'Gérer la facturation' },
  settings_toast_billing: {
    en: 'Billing portal opens here in production',
    fr: 'Le portail de facturation s’ouvre ici en production',
  },

  /* ── Audit log ──────────────────────────────────────────────────────────── */
  settings_audit: { en: 'Audit log', fr: 'Journal d’audit' },
  settings_audit_kind_restricted: { en: 'Restricted view', fr: 'Consultation restreinte' },
  settings_audit_kind_document: { en: 'Document', fr: 'Document' },
  settings_audit_kind_export: { en: 'Export', fr: 'Exportation' },
  settings_audit_kind_legal: { en: 'Legal review', fr: 'Révision juridique' },
  settings_audit_kind_case: { en: 'Case', fr: 'Dossier' },
  settings_audit_kind_comp: { en: 'Compensation', fr: 'Rémunération' },
  settings_audit_kind_permissions: { en: 'Permissions', fr: 'Permissions' },
  settings_audit_kind_retention: { en: 'Retention', fr: 'Conservation' },
  settings_audit_ev1_text: {
    en: 'Riley Summers viewed compensation — Jordan Mensah',
    fr: 'Riley Summers a consulté la rémunération — Jordan Mensah',
  },
  settings_audit_ev1_when: { en: 'Today 09:12', fr: 'Aujourd’hui 9 h 12' },
  settings_audit_ev2_text: {
    en: 'Advisor generated Termination Letter (template v2.3)',
    fr: 'Le Conseiller a généré la lettre de cessation (modèle v2.3)',
  },
  settings_audit_ev2_when: { en: 'Jul 5, 14:03', fr: '5 juill., 14 h 03' },
  settings_audit_ev3_text: {
    en: 'Riley Summers exported Termination Letter (PDF) — review gate confirmed',
    fr: 'Riley Summers a exporté la lettre de cessation (PDF) — vérification confirmée',
  },
  settings_audit_ev3_when: { en: 'Jul 5, 14:10', fr: '5 juill., 14 h 10' },
  settings_audit_ev4_text: {
    en: 'Riley Summers requested legal review — Termination case',
    fr: 'Riley Summers a demandé une révision juridique — dossier de cessation',
  },
  settings_audit_ev4_when: { en: 'Jul 5, 14:18', fr: '5 juill., 14 h 18' },
  settings_audit_ev5_text: {
    en: 'Fatima Haddad changed case status — Onboarding → Resolved',
    fr: 'Fatima Haddad a changé l’état du dossier — Intégration → Résolu',
  },
  settings_audit_ev5_when: { en: 'Jul 2, 11:40', fr: '2 juill., 11 h 40' },
  settings_audit_ev6_text: {
    en: 'Marcus Bell created a compensation change request — Devon Clarke',
    fr: 'Marcus Bell a créé une demande de changement de rémunération — Devon Clarke',
  },
  settings_audit_ev6_when: { en: 'Jun 30, 16:22', fr: '30 juin, 16 h 22' },
  settings_audit_ev7_text: {
    en: 'Riley Summers changed permissions — Marcus Bell → Finance',
    fr: 'Riley Summers a modifié les permissions — Marcus Bell → Finances',
  },
  settings_audit_ev7_when: { en: 'Jun 12, 10:05', fr: '12 juin, 10 h 05' },
  settings_audit_ev8_text: {
    en: 'Riley Summers updated retention — case files: 3 years after close',
    fr: 'Riley Summers a mis à jour la conservation — dossiers : 3 ans après fermeture',
  },
  settings_audit_ev8_when: { en: 'Jun 12, 10:02', fr: '12 juin, 10 h 02' },
  settings_audit_note: {
    en: 'Immutable log — every sensitive view, document action, permission change, and retention change is recorded with actor and timestamp.',
    fr: 'Journal immuable — chaque consultation sensible, action documentaire, changement de permission et changement de conservation est consigné avec l’acteur et l’horodatage.',
  },

  /* ── Help & support (account-surface entry point) ───────────────────────── */
  settings_support: { en: 'Help and support', fr: 'Aide et soutien' },
  settings_support_help_centre: { en: 'Help Centre', fr: 'Centre d’aide' },
  settings_support_help_centre_note: {
    en: 'Guides and answers to common questions — the fastest route for most issues.',
    fr: 'Guides et réponses aux questions courantes — la voie la plus rapide pour la plupart des situations.',
  },
  settings_support_request: { en: 'Send a support request', fr: 'Envoyer une demande de soutien' },
  settings_support_request_note: {
    en: 'Opens a written ticket you can track here, with a reference and a response target.',
    fr: 'Ouvre un billet écrit que vous pouvez suivre ici, avec une référence et une cible de réponse.',
  },
  settings_support_open: { en: 'Open', fr: 'Ouvrir' },
  settings_support_email_note: {
    en: 'If you cannot sign in, write to',
    fr: 'Si vous ne pouvez pas vous connecter, écrivez à',
  },
})
