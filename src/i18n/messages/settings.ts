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
    en: 'Your data is stored in Canada. You control retention and export. Dutiva is PIPEDA-conscious and Quebec Law 25-aware.',
    fr: 'Vos données sont hébergées au Canada. Vous contrôlez la conservation et l’exportation. Dutiva est conscient de la LPRPDE et tient compte de la Loi 25 du Québec.',
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
  settings_policy_review_days: {
    en: 'Policy review interval (days)',
    fr: 'Intervalle de révision des politiques (jours)', // [FR self-authored]
  },
  settings_policy_review_days_note: {
    en: 'After this many days without a review, Dutiva marks the policy for review and emails org admins. Between 30 and 365 days.',
    fr: 'Après ce nombre de jours sans révision, Dutiva marque la politique à revoir et envoie un courriel aux administrateurs. Entre 30 et 365 jours.', // [FR self-authored]
  },
  settings_policy_review_saved: {
    en: 'Policy review interval saved',
    fr: 'Intervalle de révision enregistré', // [FR self-authored]
  },
  settings_policy_review_failed: {
    en: 'Could not save policy review interval',
    fr: 'Impossible d’enregistrer l’intervalle de révision', // [FR self-authored]
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
  settings_team_demo_note: {
    en: 'Sample Northgate roster for the demo walkthrough — not a live team list.',
    fr: 'Liste d’exemple Northgate pour la démo — pas une équipe en direct.', // [FR self-authored]
  },
  settings_team_production_note: {
    en: 'You’re on this workspace. Invites and role changes aren’t available in Settings yet.',
    fr: 'Vous êtes sur cet espace de travail. Les invitations et les changements de rôle ne sont pas encore disponibles dans Paramètres.', // [FR self-authored]
  },

  /* Workspace profile edit — [FR self-authored] */
  settings_profile_edit: {
    en: 'Edit company profile',
    fr: 'Modifier le profil de l’entreprise',
  },
  settings_profile_save: { en: 'Save profile', fr: 'Enregistrer le profil' },
  settings_profile_saved: { en: 'Company profile saved', fr: 'Profil de l’entreprise enregistré' },
  settings_profile_failed: {
    en: 'Couldn’t save the company profile. Try again.',
    fr: 'Impossible d’enregistrer le profil de l’entreprise. Réessayez.',
  },

  /* ── Notifications toggles (settingsPrefs, frDict) ─────────────────────── */
  settings_notifications: { en: 'Notifications', fr: 'Notifications' },
  settings_toggle_email_digest: {
    en: 'Daily email digest',
    fr: 'Résumé quotidien par courriel',
  },
  settings_toggle_email_digest_sub: {
    en: 'Preference saved on this device. Morning digests aren’t emailed yet.',
    fr: 'Préférence enregistrée sur cet appareil. Les résumés du matin ne sont pas encore envoyés par courriel.', // [FR self-authored]
  },
  settings_toggle_risk_alerts: {
    en: 'Real-time risk alerts',
    fr: 'Alertes de risque en temps réel',
  },
  settings_toggle_risk_alerts_sub: {
    en: 'Preference saved on this device. Push/email alerts aren’t wired yet.',
    fr: 'Préférence enregistrée sur cet appareil. Les alertes poussées ou par courriel ne sont pas encore branchées.', // [FR self-authored]
  },
  settings_toggle_auto_escalate: {
    en: 'Auto-suggest legal escalation',
    fr: 'Suggérer automatiquement une escalade juridique',
  },
  settings_toggle_auto_escalate_sub: {
    en: 'Preference saved on this device. Advisor doesn’t auto-offer counsel from this switch yet.',
    fr: 'Préférence enregistrée sur cet appareil. Le Conseiller ne propose pas encore automatiquement un examen juridique à partir de ce commutateur.', // [FR self-authored]
  },
  settings_toggle_weekly_digest: {
    en: 'Weekly compliance report',
    fr: 'Rapport de conformité hebdomadaire',
  },
  settings_toggle_weekly_digest_sub: {
    en: 'Preference saved on this device. Monday emails aren’t sent yet.',
    fr: 'Préférence enregistrée sur cet appareil. Les courriels du lundi ne sont pas encore envoyés.', // [FR self-authored]
  },
  settings_notifications_note: {
    en: 'These switches remember your choice on this browser. Delivery isn’t live yet.',
    fr: 'Ces commutateurs mémorisent votre choix dans ce navigateur. L’envoi n’est pas encore en service.', // [FR self-authored]
  },

  /* ── AI & Advisor toggles + disclaimer ──────────────────────────────────── */
  settings_ai: { en: 'AI & Advisor', fr: 'IA et Conseiller' },
  settings_toggle_ai_context: {
    en: 'Use workspace context in Advisor',
    fr: 'Utiliser le contexte de l’espace de travail dans le Conseiller',
  },
  settings_toggle_ai_context_sub: {
    en: 'Preference saved on this device. Cross-record injection still follows your plan.',
    fr: 'Préférence enregistrée sur cet appareil. L’injection transversale suit toujours votre forfait.', // [FR self-authored]
  },
  settings_toggle_ai_context_locked: {
    en: 'Cross-record Advisor memory injects on Growth. Your preference is kept; injection stays off until you upgrade.',
    fr: 'La mémoire transversale du Conseiller s’injecte avec Croissance. Votre préférence est conservée; l’injection reste inactive jusqu’à une mise à niveau.', // [FR self-authored]
  },
  settings_toggle_ai_citations: {
    en: 'Show sources on compliance answers',
    fr: 'Afficher les sources sur les réponses de conformité',
  },
  settings_toggle_ai_citations_sub: {
    en: 'Preference saved on this device. Advisor still shows sources when it has them.',
    fr: 'Préférence enregistrée sur cet appareil. Le Conseiller affiche toujours les sources lorsqu’il en a.', // [FR self-authored]
  },
  settings_ai_prefs_note: {
    en: 'Overage billing below is live. The two switches above are device preferences until server-side prefs ship.',
    fr: 'La facturation des réponses en trop ci-dessous est en service. Les deux commutateurs ci-dessus sont des préférences d’appareil jusqu’à ce que les préférences côté serveur soient livrées.', // [FR self-authored]
  },
  settings_ai_prefs_note_staff: {
    en: 'The two switches above are device preferences until server-side prefs ship. Staff accounts skip overage billing.',
    fr: 'Les deux commutateurs ci-dessus sont des préférences d’appareil jusqu’à ce que les préférences côté serveur soient livrées. Les comptes du personnel n’utilisent pas la facturation des réponses en trop.', // [FR self-authored]
  },
  settings_toggle_overage: {
    en: 'Bill extra Advisor replies this month',
    fr: 'Facturer les réponses du Conseiller en trop ce mois-ci', // [FR self-authored]
  },
  settings_toggle_overage_sub: {
    en: 'After this month’s {included} included replies and any unused pack balance, extra replies are ${price} CAD each, up to {cap}. Only bills if you have an active paid plan. Waitlist accounts are never invoiced. Packs are optional and not a plan feature.',
    fr: 'Après les {included} réponses incluses ce mois-ci et tout solde de forfait inutilisé, les réponses supplémentaires coûtent {price} $ CA chacune, jusqu’à {cap}. La facturation ne s’applique que si vous avez un forfait payant actif. Les comptes en liste d’attente ne reçoivent jamais de facture. Les forfaits de réponses sont facultatifs et ne sont pas une fonction d’abonnement.', // [FR self-authored]
  },
  settings_toggle_overage_staff_note: {
    en: 'Overage billing doesn’t apply to @dutiva.ca staff accounts.',
    fr: 'La facturation des réponses en trop ne s’applique pas aux comptes du personnel @dutiva.ca.', // [FR self-authored]
  },
  settings_billing_staff_note: {
    en: 'Internal accounts show Professional entitlement for product access. Workspace org billing in Stripe may still read Free until a paid org checkout is linked.',
    fr: 'Les comptes internes affichent l’accès Professionnel. La facturation d’organisation dans Stripe peut encore indiquer Gratuit tant qu’aucun paiement d’organisation n’est lié.', // [FR self-authored]
  },
  settings_overage_saved: {
    en: 'Advisor overage setting saved.',
    fr: 'Réglage des réponses en trop enregistré.', // [FR self-authored]
  },
  settings_overage_failed: {
    en: 'Couldn’t save that setting. Try again.',
    fr: 'Impossible d’enregistrer ce réglage. Réessayez.', // [FR self-authored]
  },
  settings_advisor_usage_title: {
    en: 'Advisor reply usage',
    fr: 'Utilisation des réponses du Conseiller', // [FR self-authored]
  },
  settings_advisor_usage_staff: {
    en: 'Internal Dutiva account — Advisor replies aren’t capped for @dutiva.ca staff.',
    fr: 'Compte interne Dutiva — les réponses du Conseiller ne sont pas plafonnées pour le personnel @dutiva.ca.', // [FR self-authored]
  },
  settings_advisor_usage_staff_meter: {
    en: 'Workspace meter (visibility only): {used} used this month against a {plan} org bank of {limit}.',
    fr: 'Compteur de l’espace (visibilité seulement) : {used} utilisées ce mois-ci sur une banque d’organisation {plan} de {limit}.', // [FR self-authored]
  },
  settings_advisor_usage_monthly: {
    en: 'This month: {remaining} of {limit} included left',
    fr: 'Ce mois-ci : {remaining} sur {limit} incluses restantes', // [FR self-authored]
  },
  settings_advisor_usage_rollover: {
    en: 'Rollover: {balance} (nearest expiry {date})',
    fr: 'Report : {balance} (échéance la plus proche {date})', // [FR self-authored]
  },
  settings_advisor_usage_rollover_none: {
    en: 'Rollover: {balance}',
    fr: 'Report : {balance}', // [FR self-authored]
  },
  settings_advisor_usage_pack: {
    en: 'Purchased pack balance: {balance}',
    fr: 'Solde de forfaits achetés : {balance}', // [FR self-authored]
  },
  settings_advisor_usage_overage: {
    en: 'Overage billing: {yesNo}',
    fr: 'Facturation des réponses en trop : {yesNo}', // [FR self-authored]
  },
  settings_advisor_usage_yes: { en: 'Yes', fr: 'Oui' }, // [FR self-authored]
  settings_advisor_usage_no: { en: 'No', fr: 'Non' }, // [FR self-authored]
  settings_advisor_usage_reset: {
    en: 'Next monthly reset: {date}',
    fr: 'Prochaine réinitialisation mensuelle : {date}', // [FR self-authored]
  },
  settings_advisor_usage_order: {
    en: 'Used in order: oldest rollover, then this month’s included replies, then packs, then overage (if on).',
    fr: 'Ordre d’utilisation : report le plus ancien, puis les réponses incluses du mois, puis les forfaits, puis les réponses en trop (si activées).', // [FR self-authored]
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
    en: 'Today workspace access uses Owner, Admin, Manager, Member, and Viewer on membership. This matrix is the finer model we intend — it isn’t editable here yet.',
    fr: 'Aujourd’hui, l’accès à l’espace de travail utilise Propriétaire, Admin, Gestionnaire, Membre et Lecteur sur l’adhésion. Cette matrice est le modèle plus fin prévu — elle n’est pas encore modifiable ici.', // [FR self-authored]
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
  settings_retention_advisor_v: {
    en: '2 years (platform default)',
    fr: '2 ans (défaut de la plateforme)', // [FR self-authored]
  },
  settings_retention_note: {
    en: 'These are the current platform defaults. Retention isn’t configurable in Settings yet.',
    fr: 'Ce sont les défauts actuels de la plateforme. La conservation n’est pas encore configurable dans Paramètres.', // [FR self-authored]
  },

  /* ── Security ───────────────────────────────────────────────────────────── */
  settings_security: { en: 'Security', fr: 'Sécurité' },
  settings_security_2fa: {
    en: 'Two-factor authentication',
    fr: 'Authentification à deux facteurs',
  },
  settings_security_2fa_v: {
    en: 'Available through your sign-in provider — not required by Dutiva yet',
    fr: 'Disponible via votre fournisseur de connexion — pas encore exigée par Dutiva', // [FR self-authored]
  },
  settings_security_sso: { en: 'Single sign-on (SSO)', fr: 'Authentification unique (SSO)' },
  settings_security_sso_v: {
    en: 'Not available yet',
    fr: 'Pas encore disponible', // [FR self-authored]
  },
  settings_security_timeout: { en: 'Session timeout', fr: 'Expiration de session' },
  settings_security_timeout_v: {
    en: 'Managed by your sign-in session',
    fr: 'Gérée par votre session de connexion', // [FR self-authored]
  },
  settings_security_residency: { en: 'Data residency', fr: 'Résidence des données' },
  settings_security_residency_v: {
    en: 'Primary database in Canada (Montréal). Advisor AI and some subprocessors may process outside Canada.',
    fr: 'Base de données principale au Canada (Montréal). L’IA du Conseiller et certains sous-traitants peuvent traiter hors du Canada.', // [FR self-authored]
  },
  settings_security_note: {
    en: 'Status lines describe the product today — not a configurable security console.',
    fr: 'Ces lignes décrivent le produit aujourd’hui — ce n’est pas une console de sécurité configurable.', // [FR self-authored]
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
    en: 'Growth plan — sample invoice line for the demo walkthrough',
    fr: 'Forfait Croissance — ligne de facture d’exemple pour la démo', // [FR self-authored]
  },
  settings_billing_btn: { en: 'Manage billing', fr: 'Gérer la facturation' },
  settings_toast_billing: {
    en: 'Demo sample — open Pricing to manage a real plan.',
    fr: 'Exemple de démo — ouvrez Tarifs pour gérer un vrai forfait.', // [FR self-authored]
  },
  settings_billing_section: { en: 'Billing', fr: 'Facturation' }, // [FR self-authored]
  settings_billing_plan_paid: {
    en: '{name} — ${price}/mo CAD',
    fr: '{name} — {price} $/mois CAD', // [FR self-authored]
  },
  settings_billing_plan_free: {
    en: '{name} — no monthly charge',
    fr: '{name} — sans frais mensuels', // [FR self-authored]
  },
  settings_billing_status: {
    en: 'Subscription status: {status}',
    fr: 'État de l’abonnement : {status}', // [FR self-authored]
  },
  settings_billing_see_plans: { en: 'See plans', fr: 'Voir les forfaits' }, // [FR self-authored]
  settings_billing_note: {
    en: 'Manage payment method and invoices in the Stripe portal when you have a customer record. Otherwise open Pricing.',
    fr: 'Gérez le mode de paiement et les factures dans le portail Stripe lorsque vous avez un dossier client. Sinon, ouvrez Tarifs.', // [FR self-authored]
  },
  settings_billing_unavailable: {
    en: 'Billing isn’t available in this environment.',
    fr: 'La facturation n’est pas disponible dans cet environnement.', // [FR self-authored]
  },
  settings_billing_portal_failed: {
    en: 'Couldn’t open the billing portal. Try again or open Pricing.',
    fr: 'Impossible d’ouvrir le portail de facturation. Réessayez ou ouvrez Tarifs.', // [FR self-authored]
  },
  settings_integrations_demo_note: {
    en: 'Sample connections for the Northgate walkthrough — not live integrations.',
    fr: 'Connexions d’exemple pour la démo Northgate — pas des intégrations en direct.', // [FR self-authored]
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
    fr: 'Le Conseiller a généré la lettre de licenciement (modèle v2.3)',
  },
  settings_audit_ev2_when: { en: 'Jul 5, 14:03', fr: '5 juill., 14 h 03' },
  settings_audit_ev3_text: {
    en: 'Riley Summers exported Termination Letter (PDF) — review gate confirmed',
    fr: 'Riley Summers a exporté la lettre de licenciement (PDF) — vérification confirmée',
  },
  settings_audit_ev3_when: { en: 'Jul 5, 14:10', fr: '5 juill., 14 h 10' },
  settings_audit_ev4_text: {
    en: 'Riley Summers requested legal review — Termination case',
    fr: 'Riley Summers a demandé une révision juridique — dossier de licenciement',
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
    en: 'Sample Northgate events for the demo walkthrough — not a live org audit trail.',
    fr: 'Événements d’exemple Northgate pour la démo — pas un journal d’audit d’organisation en direct.', // [FR self-authored]
  },
  settings_export_admin_link: {
    en: 'Open signed-in export audit (staff)',
    fr: 'Ouvrir l’audit des exportations en session (personnel)', // [FR self-authored]
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
  settings_onboarding_walkthrough: {
    en: 'Request an onboarding walkthrough',
    fr: 'Demander une démonstration d’intégration', // [FR self-authored]
  },
  settings_onboarding_walkthrough_note: {
    en: 'Included with Growth — opens a support request so we can schedule a walkthrough.',
    fr: 'Inclus avec Croissance — ouvre une demande de soutien pour planifier une démonstration.', // [FR self-authored]
  },
  settings_onboarding_call: {
    en: 'Schedule your onboarding call',
    fr: 'Planifier votre appel d’intégration', // [FR self-authored]
  },
  settings_onboarding_call_note: {
    en: 'Included with Professional — opens a support request for a scheduled founder call.',
    fr: 'Inclus avec Professionnel — ouvre une demande de soutien pour un appel planifié avec le fondateur.', // [FR self-authored]
  },
  settings_support_open: { en: 'Open', fr: 'Ouvrir' },
  settings_support_email_note: {
    en: 'If you cannot sign in, write to',
    fr: 'Si vous ne pouvez pas vous connecter, écrivez à',
  },
})
