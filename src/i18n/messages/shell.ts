import { defineMessages } from '../core'

/**
 * App shell chrome — entry stage (/app/welcome), sidebar, topbar, mobile nav.
 * EN + FR ported from `App v2.dc.html` (`buildI18n()` and `frDict()`).
 * FR strings with no source in the prototype are marked [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * Shell components resolve these via `useI18n().x(shellMessages.key)` so they
 * typecheck before registration; they can switch to `t('shell_…')` after.
 */
export const shellMessages = defineMessages({
  /* ── Entry stage (sign-in landing) ─────────────────────────────────────── */
  shell_nav_platform: { en: 'Platform', fr: 'Plateforme' },
  shell_nav_provinces: { en: 'Provinces', fr: 'Provinces' },
  shell_nav_pricing: { en: 'Pricing', fr: 'Tarifs' },
  shell_signin: { en: 'Sign in', fr: 'Se connecter' },
  shell_start_free: { en: 'Start free', fr: 'Commencer' },
  shell_hero_badge: {
    en: 'Built for Canadian employment law — Ontario, Quebec & federal (more provinces to come)',
    fr: 'Conçu pour le droit du travail canadien — Ontario, Québec et fédéral (plus de provinces à venir)',
  },
  shell_hero_title: {
    en: 'Canadian HR compliance support for documents, deadlines, and workplace decisions.',
    fr: 'Soutien à la conformité RH canadienne pour les documents, les échéances et les décisions en milieu de travail.',
  },
  shell_hero_sub: {
    en: 'Ask about a case, person, or deadline — Advisor keeps the same context across chat and your records.',
    fr: 'Posez une question sur un dossier, une personne ou une échéance — le Conseiller garde le même contexte entre le clavardage et vos dossiers.',
  },
  shell_cta_primary: { en: 'See Advisor in action', fr: 'Voir Conseiller à l’œuvre' },
  shell_cta_secondary: { en: 'Talk to sales', fr: 'Parler aux ventes' },

  /* Entry-stage Advisor preview card (hardcoded copy in the prototype markup;
     FR from frDict where it exists). */
  shell_preview_title: {
    en: 'Advisor — Terminating Jordan Mensah, Ontario',
    // [FR self-authored] composed from the prototype's chat-title translation
    // 'Cessation d’emploi de Jordan Mensah — Ontario' + Conseiller.
    fr: 'Conseiller — Cessation d’emploi de Jordan Mensah, Ontario',
  },
  shell_preview_user: {
    en: 'I need to terminate an employee in Ontario.',
    fr: 'Je dois mettre fin à l’emploi d’un salarié en Ontario.',
  },
  shell_preview_reply: {
    en: 'I can help you work through this properly — a few things first so I calculate entitlements correctly and flag any risk before you act.',
    // [FR self-authored]
    fr: 'Je peux vous aider à bien mener cette démarche — quelques précisions d’abord pour que je calcule correctement les droits et signale tout risque avant d’agir.',
  },
  shell_preview_risk: {
    en: 'No termination clause found on file — preliminary estimate: common-law notice may exceed ESA minimums. Legal review recommended.',
    // [FR self-authored] follows the prototype's phrasing for the same flag.
    fr: 'Aucune clause de cessation d’emploi trouvée au dossier — estimation préliminaire : le préavis de common law pourrait dépasser les minimums de la LNE. Examen juridique recommandé.',
  },

  /* ── Sidebar chrome ─────────────────────────────────────────────────────── */
  shell_new_conversation: { en: 'New conversation', fr: 'Nouvelle conversation' },
  shell_search: { en: 'Search', fr: 'Rechercher' },
  shell_ask_advisor: { en: 'Ask Advisor', fr: 'Demander au Conseiller' },
  shell_hr_workspace: { en: 'HR workspace', fr: 'Espace de travail RH' },
  shell_powered_by: { en: 'Powered by', fr: 'Propulsé par' },
  shell_sign_out: { en: 'Sign out', fr: 'Se déconnecter' }, // [FR self-authored]

  /* Create menu */
  shell_create: { en: 'Create', fr: 'Créer' }, // [FR self-authored]
  shell_create_conversation: { en: 'Conversation', fr: 'Conversation' },
  shell_create_workflow: { en: 'Workflow', fr: 'Processus' },
  shell_create_case: { en: 'Case', fr: 'Dossier' },
  shell_create_document: { en: 'Document', fr: 'Document' },
  shell_create_employee: { en: 'Employee record', fr: 'Dossier d’employé' }, // [FR self-authored]
  shell_create_communication: { en: 'Communication', fr: 'Communication' },
  shell_create_unavailable: { en: 'Unavailable', fr: 'Indisponible' }, // [FR self-authored]
  shell_create_unavailable_desc: {
    en: 'This creation flow is not yet available.',
    fr: 'Ce flux de création n’est pas encore disponible.',
  }, // [FR self-authored]

  /* Sidebar toggle / tooltips */
  shell_collapse_sidebar: { en: 'Collapse sidebar', fr: 'Réduire la barre latérale' }, // [FR self-authored]
  shell_expand_sidebar: { en: 'Expand sidebar', fr: 'Développer la barre latérale' }, // [FR self-authored]
  shell_user_profile_aria: { en: 'Current user profile', fr: 'Profil de l’utilisateur actuel' }, // [FR self-authored]

  /* Badge accessible descriptions — {count} is replaced at runtime */
  shell_badge_workflows_aria: {
    en: '{count} active workflows',
    fr: '{count} processus actifs',
  }, // [FR self-authored]
  shell_badge_cases_aria: {
    en: '{count} open cases requiring review',
    fr: '{count} dossiers ouverts nécessitant un examen',
  }, // [FR self-authored]
  shell_badge_compliance_aria: {
    en: '{count} unresolved compliance issues',
    fr: '{count} problèmes de conformité non résolus',
  }, // [FR self-authored]
  shell_badge_wellbeing_aria: {
    en: '{count} wellbeing follow-up',
    fr: '{count} suivi de bien-être',
  }, // [FR self-authored]

  /* Nav labels (buildI18n nav_*) */
  shell_nav_home: { en: 'Home', fr: 'Accueil' },
  shell_nav_advisor_home: { en: 'AI Advisor', fr: 'Conseiller IA' },
  shell_nav_workflows: { en: 'Workflows', fr: 'Processus' },
  shell_nav_people: { en: 'People', fr: 'Personnel' },
  shell_nav_cases: { en: 'Cases', fr: 'Dossiers' },
  /* Documents nav entry (Templates | My documents tabs inside
     DocumentsLayout). Hand-authored on purpose: doclib.ts is wholesale-
     regenerated and has no slot for these app-owned labels. */
  shell_nav_library: { en: 'Documents', fr: 'Documents' }, // [FR self-authored]
  /* Sub-tab labels. Legacy keys kept for route/topbar compatibility:
     studio → Templates, library → My documents, templates → legacy gallery. */
  shell_hr_studio_templates: { en: 'Templates', fr: 'Modèles' }, // [FR self-authored]
  shell_hr_studio_library: { en: 'My documents', fr: 'Mes documents' }, // [FR self-authored]
  shell_hr_studio_studio: { en: 'Templates', fr: 'Modèles' }, // [FR self-authored]
  shell_nav_knowledge: { en: 'Knowledge', fr: 'Connaissances' },
  shell_nav_compliance: { en: 'Compliance', fr: 'Conformité' },
  shell_nav_compensation: { en: 'Compensation', fr: 'Rémunération' },
  shell_nav_communications: { en: 'Communications', fr: 'Communications' },
  shell_nav_wellbeing: { en: 'Wellbeing', fr: 'Bien-être' },
  shell_nav_tasks: { en: 'Tasks', fr: 'Tâches' },
  shell_nav_calendar: { en: 'Calendar', fr: 'Calendrier' },
  /* Planning section (Tasks + Calendar merged into one nav entry) — short
     rail label; page chrome can still say more where space allows. */
  shell_nav_planning: { en: 'Planning', fr: 'Planification' }, // [FR self-authored]
  shell_getting_started: {
    en: 'Getting started',
    fr: 'Premiers pas',
  }, // [FR self-authored] — empty production rail cue → Home checklist
  shell_getting_started_hint: {
    en: 'Three useful first steps on Home',
    fr: 'Trois premiers pas utiles sur l’accueil',
  }, // [FR self-authored]
  /* Settings section tab labels (General + Memory) */
  shell_settings_general: { en: 'General', fr: 'Général' }, // [FR self-authored]
  shell_nav_analytics: { en: 'Analytics', fr: 'Analytique' },
  shell_nav_policies: { en: 'Policies', fr: 'Politiques' },
  shell_nav_settings: { en: 'Settings', fr: 'Paramètres' },

  /* Nav section headings (buildI18n sec_*). The prototype's third section
     ('Insights') is gone: Analytics was its only child and sat default-
     collapsed, so the item was promoted to top level and the heading
     removed. */
  shell_sec_records: { en: 'Records', fr: 'Registres' },
  shell_sec_programs: { en: 'Programs', fr: 'Programmes' },

  /* ── Route/view titles (buildI18n v_*) — topbar + mobile topbar ─────────── */
  shell_v_home: { en: 'Home', fr: 'Accueil' },
  shell_v_advisor: { en: 'Advisor', fr: 'Conseiller' },
  shell_v_workflows: { en: 'Workflows', fr: 'Processus' },
  shell_v_cases: { en: 'Cases', fr: 'Dossiers' },
  shell_v_employees: { en: 'Employees', fr: 'Employés' },
  shell_v_compliance: { en: 'Compliance', fr: 'Conformité' },
  shell_v_policies: { en: 'Policies', fr: 'Politiques' },
  shell_v_tasks: { en: 'Tasks', fr: 'Tâches' },
  shell_v_calendar: { en: 'Calendar', fr: 'Calendrier' },
  /* One name for the destination everywhere (nav, header, route): Analytics.
     The old 'Reports' header/route title is retired with the rename. */
  shell_v_analytics: { en: 'Analytics', fr: 'Analytique' },
  shell_v_templates: { en: 'Document Studio', fr: 'Studio de documents' },
  shell_v_knowledge: { en: 'Knowledge', fr: 'Connaissances' },
  shell_v_settings: { en: 'Settings', fr: 'Paramètres' },
  shell_v_compensation: { en: 'Compensation', fr: 'Rémunération' },
  shell_v_wellbeing: { en: 'Wellbeing', fr: 'Bien-être' },
  shell_v_communications: { en: 'Communications', fr: 'Communications' },

  /* Route subtitles (buildI18n sub_*) — rendered inside the views */
  shell_sub_policies: {
    en: 'Review status across your policy library.',
    fr: 'État de révision de votre bibliothèque de politiques.',
  },
  /* (The Analytics subtitle lives in the analytics message module.) */

  /* ── Topbar ─────────────────────────────────────────────────────────────── */
  shell_notifications: { en: 'Notifications', fr: 'Notifications' },
  shell_mark_all_read: { en: 'Mark all read', fr: 'Tout marquer comme lu' },
  shell_rail_fallback_text: {
    en: 'Ask about a person, case, policy, or deadline.',
    // [FR self-authored]
    fr: 'Posez une question sur une personne, un dossier, une politique ou une échéance.',
  },

  /* ── Mobile chrome (buildI18n tab_*) ────────────────────────────────────── */
  shell_tab_home: { en: 'Home', fr: 'Accueil' },
  shell_tab_ask: { en: 'Ask', fr: 'Demander' },
  shell_tab_more: { en: 'More', fr: 'Plus' },

  /* ── A11y-only labels ───────────────────────────────────────────────────── */
  shell_open_menu: { en: 'Open menu', fr: 'Ouvrir le menu' }, // [FR self-authored]
  shell_close_menu: { en: 'Close menu', fr: 'Fermer le menu' }, // [FR self-authored]
  shell_primary_nav: { en: 'Primary navigation', fr: 'Navigation principale' }, // [FR self-authored]

  /* ── Workspace context banner (prototype `contextBanner`, markup 309–326;
        labels at logic 4947 + `contextLabelFor` 4103–4108 + buildI18n 5082) ── */
  shell_ctx_using: { en: 'Advisor is using · ', fr: 'Le Conseiller utilise · ' },
  shell_ctx_employee: { en: 'Working with', fr: 'Travaille avec' },
  shell_ctx_document: { en: 'Editing', fr: 'Modifie' },
  shell_ctx_compliance: { en: 'Reviewing', fr: 'Examine' },
  shell_ctx_compensation: { en: 'Reviewing pay for', fr: 'Examine la rémunération de' },
  shell_ctx_wellbeing: { en: 'Supporting', fr: 'Soutient' },
  shell_ctx_case: { en: 'On case', fr: 'Sur le dossier' },
  shell_open_record: { en: 'Open record', fr: 'Ouvrir le dossier' },
  shell_ctx_remove_aria: { en: 'Remove this context item', fr: 'Retirer cet élément de contexte' }, // [FR self-authored]
  shell_ctx_clear_aria: { en: 'Clear context', fr: 'Effacer le contexte' }, // [FR self-authored]

  /* ── Advisor-mode module banner (prototype `moduleContext`, markup 328–333;
        specialties at logic 4954–4961, FR from frDict) ────────────────────── */
  shell_advisor_mode: { en: 'Advisor mode', fr: 'Mode Conseiller' },
  shell_mod_compensation: { en: 'Compensation specialist', fr: 'Spécialiste de la rémunération' },
  shell_mod_compensation_note: {
    en: 'I’ll frame answers around pay bands, equity, and market benchmarks.',
    fr: 'Je cadrerai les réponses autour des échelles salariales, de l’équité et des repères du marché.',
  },
  shell_mod_compliance: { en: 'Compliance consultant', fr: 'Conseiller en conformité' },
  shell_mod_compliance_note: {
    en: 'I’ll weigh jurisdiction, applicable legislation, and risk on every answer.',
    fr: 'Je pèserai la compétence, la législation applicable et le risque dans chaque réponse.',
  },
  shell_mod_wellbeing: { en: 'Wellbeing & accommodation', fr: 'Bien-être et accommodement' },
  shell_mod_wellbeing_note: {
    en: 'I’ll keep guidance supportive and non-diagnostic.',
    fr: 'Je garderai des conseils bienveillants et non diagnostiques.',
  },
  shell_mod_communications: { en: 'Communications', fr: 'Communications' },
  shell_mod_communications_note: {
    en: 'I’ll check jurisdiction and tone before anything goes out.',
    fr: 'Je vérifierai la compétence et le ton avant tout envoi.',
  },
  shell_mod_templates: { en: 'Documentation', fr: 'Documentation' },
  shell_mod_templates_note: {
    en: 'I’ll draft and tailor documents to the right jurisdiction.',
    fr: 'Je rédigerai et adapterai les documents à la bonne compétence.',
  },
  shell_mod_cases: { en: 'Case coordination', fr: 'Coordination des dossiers' },
  shell_mod_cases_note: {
    en: 'I’ll connect tasks, documents, and compliance across the file.',
    fr: 'Je relierai les tâches, les documents et la conformité dans tout le dossier.',
  },

  /* Public demo workspace (/demo) */
  demo_banner_text: {
    en: 'Sample data · read-only preview. Sign in to save records and generate live documents.',
    fr: 'Données types · aperçu en lecture seule. Connectez-vous pour enregistrer des dossiers et générer des documents en direct.',
  },
  demo_banner_cta: {
    en: 'Sign in',
    fr: 'Se connecter',
  },
  demo_tour_label: {
    en: 'Product tour',
    fr: 'Visite du produit',
  },
  demo_tour_eyebrow: {
    en: 'Guided tour — click a stop to explore',
    fr: 'Visite guidée — cliquez sur une étape pour explorer',
  },
  demo_tour_step: {
    en: 'Stop',
    fr: 'Étape',
  },
  demo_tour_signin: {
    en: 'Sign in for your workspace',
    fr: 'Connectez-vous pour votre espace',
  },
  demo_tour_all_stops: {
    en: 'All stops',
    fr: 'Toutes les étapes',
  },
  demo_tour_hide_stops: {
    en: 'Hide stops',
    fr: 'Masquer les étapes',
  },
  demo_tour_next: {
    en: 'Next',
    fr: 'Suivant',
  },
})
