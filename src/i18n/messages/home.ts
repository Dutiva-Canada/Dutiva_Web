import { defineMessages } from '../core'

/**
 * Home — Command Centre chrome strings, ported from `App v2.dc.html`
 * (`buildHomeView()` lines 4778–4856 and `buildI18n()` lines 3181–3315).
 * EN verbatim from the prototype; FR from its inline `fr ? … : …` pairs and
 * `buildI18n()` — no self-authored FR in this module.
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * Components resolve these via `useI18n().x(homeMessages.key)`.
 */
export const homeMessages = defineMessages({
  /* ── Header ─────────────────────────────────────────────────────────────── */
  home_date_label: { en: 'Tuesday, July 7', fr: 'mardi 7 juillet' },
  home_greeting: { en: 'Good to see you, Riley.', fr: 'Bonjour, Riley.' },
  home_sub: {
    en: 'Your workspace, read and prioritized — two decisions need you today.',
    fr: 'Votre espace de travail, lu et priorisé — deux décisions vous attendent aujourd’hui.',
  },

  /* ── Advisor daily brief hero ───────────────────────────────────────────── */
  home_brief_title: { en: 'Advisor’s daily brief', fr: 'Résumé quotidien du Conseiller' },
  home_brief_lead: {
    en: 'Jordan Mensah’s termination is your top exposure: counsel hasn’t replied to the Jul 5 review request, and the preliminary estimate puts common-law notice at 9–12 months against the 8-week ESA termination notice/pay minimum. Do first — nudge counsel and hold the offer. Then draft the Remote Work Policy refresh: 14 months overdue, and worth +4 of your +6 predicted compliance gain.',
    fr: 'Le licenciement de Jordan Mensah est votre principale exposition : le conseiller juridique n’a pas répondu à la demande du 5 juillet, et l’estimation préliminaire situe le préavis de common law entre 9 et 12 mois contre le minimum LNE de 8 semaines de préavis ou d’indemnité de licenciement. À faire en premier : relancer le conseiller et retenir l’offre. Ensuite, rédiger la politique de télétravail — 14 mois de retard et +4 des +6 points de conformité prévus.',
  },
  home_brief_rest: {
    en: 'Everything else can wait. Amara’s accommodation review is due Jul 14, Devon’s PIP check-in is Jul 22, and Théo’s pay review can hold for the next comp cycle.',
    fr: 'Tout le reste peut attendre. L’examen d’accommodement d’Amara est dû le 14 juillet, le suivi du PAR de Devon le 22 juillet, et la révision salariale de Théo peut attendre le prochain cycle.',
  },
  home_brief_owner: { en: 'Owner: Riley Summers (HR Lead)', fr: 'Resp. : Riley Summers (RH)' },
  home_brief_due: {
    en: 'Deadline: counsel follow-up today',
    fr: 'Échéance : relance du conseiller aujourd’hui',
  },
  home_brief_next: {
    en: 'Next action: nudge counsel, hold the offer',
    fr: 'Prochaine action : relancer le conseiller et retenir l’offre',
  },
  home_brief_ask: {
    en: 'Ask about this brief',
    fr: 'Poser une question sur ce résumé',
  },

  /* ── Priority queue section titles ──────────────────────────────────────── */
  home_act_now: { en: 'Act now', fr: 'À traiter maintenant' },
  home_this_week: { en: 'This week', fr: 'Cette semaine' },
  home_watching: { en: 'Watching', fr: 'Sous surveillance' },
  home_ask_advisor: { en: 'Ask Advisor', fr: 'Demander au Conseiller' },

  /* ── Compliance prediction card ─────────────────────────────────────────── */
  home_compliance_title: { en: 'Compliance', fr: 'Conformité' },
  home_predicted_chip: { en: 'Predicted ↑', fr: 'Prévu ↑' },
  home_predicted_in: { en: 'in 90 days', fr: 'dans 90 jours' },
  home_predicted_note: {
    en: 'Projected +6 if both Act now items clear: policy refresh +4, termination review +2.',
    fr: '+6 prévu si les deux éléments « À traiter maintenant » sont réglés : politique de télétravail +4, examen de la cessation +2.',
  },
  home_lever_label: { en: 'Top lever', fr: 'Meilleur levier' },
  home_lever_text: { en: 'Remote Work Policy refresh', fr: 'Politique de télétravail' },
  home_lever_cta: { en: 'Draft refresh', fr: 'Rédiger' },

  /* ── Workflows ──────────────────────────────────────────────────────────── */
  home_wf_title: { en: 'Workflows in flight', fr: 'Processus en cours' },
  home_wf_all: { en: 'All workflows →', fr: 'Tous les processus →' },
  home_wf_next: { en: 'Next', fr: 'Prochaine étape' },
  home_start_workflow: { en: 'Start a workflow', fr: 'Démarrer un processus' },

  /* ── Composer ───────────────────────────────────────────────────────────── */
  home_composer_placeholder: {
    en: 'Ask Advisor anything about your team…',
    fr: 'Demandez au Conseiller à propos de votre équipe…',
  },

  /* ── Production-mode empty state — first-run checklist
     (docs/EMPTY_WORKSPACE_ONBOARDING.md). [FR self-authored] ─────────────── */
  home_production_title: {
    en: 'Your workspace is ready.',
    fr: 'Votre espace de travail est prêt.',
  },
  home_production_body: {
    en: 'Nothing here yet — that’s expected. The setup path below walks you through the essentials in order, and stays on Home until it’s done.',
    fr: 'Rien ici pour l’instant — c’est normal. Le parcours ci-dessous vous guide à travers l’essentiel, dans l’ordre, et reste sur l’accueil tant qu’il n’est pas terminé.', // [FR self-authored]
  },
  home_production_workspace_label: { en: 'Workspace', fr: 'Espace de travail' },
  home_production_demo_link: {
    en: 'Want a walkthrough with sample data? Open Demo in Settings',
    fr: 'Vous voulez une visite avec des données d’exemple ? Ouvrez la Démo dans les paramètres', // [FR self-authored]
  },

  /* ── Production setup path — foundation-first ordering for workspaces with
     no employees yet (docs/EMPTY_WORKSPACE_ONBOARDING.md). [FR self-authored] ── */
  home_setup_label: {
    en: 'Your setup path',
    fr: 'Votre parcours de démarrage', // [FR self-authored]
  },
  home_setup_step_profile: {
    en: 'Confirm your company profile',
    fr: 'Confirmez le profil de votre entreprise', // [FR self-authored]
  },
  home_setup_step_profile_hint: {
    en: 'Where you operate and your industry — they scope what Dutiva monitors for you.',
    fr: 'Votre province et votre industrie — elles déterminent ce que Dutiva surveille pour vous.', // [FR self-authored]
  },
  home_setup_step_documents: {
    en: 'Prepare your first-hire documents',
    fr: 'Préparez vos documents d’embauche', // [FR self-authored]
  },
  home_setup_step_documents_hint: {
    en: 'Start from a Canadian HR template in Studio — agreements, letters, policies.',
    fr: 'Partez d’un modèle RH canadien dans le Studio — contrats, lettres, politiques.', // [FR self-authored]
  },
  home_setup_step_policies: {
    en: 'Start your policy register',
    fr: 'Ouvrez votre registre de politiques', // [FR self-authored]
  },
  home_setup_step_policies_hint: {
    en: 'Track the policies you have — and the gaps you’ll want to close as you grow.',
    fr: 'Suivez les politiques en place — et les lacunes à combler au fil de votre croissance.', // [FR self-authored]
  },
  home_setup_step_explore: {
    en: 'See how a guided process works',
    fr: 'Découvrez un processus guidé', // [FR self-authored]
  },
  home_setup_step_explore_hint: {
    en: 'Notice, severance, accommodation — Dutiva walks you through step by step.',
    fr: 'Préavis, indemnité de départ, accommodement — Dutiva vous guide étape par étape.', // [FR self-authored]
  },
  home_setup_step_people: {
    en: 'Add your first person when you’re ready',
    fr: 'Ajoutez votre première personne quand vous êtes prêt', // [FR self-authored]
  },
  home_setup_step_people_hint: {
    en: 'Solo for now? This step waits — team records start here.',
    fr: 'Solo pour l’instant ? Cette étape attend — les dossiers d’équipe commencent ici.', // [FR self-authored]
  },
  home_setup_add_tasks: {
    en: 'Add the remaining steps to Tasks',
    fr: 'Ajouter les étapes restantes aux tâches', // [FR self-authored]
  },
  home_setup_adding_tasks: {
    en: 'Adding…',
    fr: 'Ajout…', // [FR self-authored]
  },
  home_setup_tasks_done: {
    en: 'Steps added to Tasks.',
    fr: 'Étapes ajoutées aux tâches.', // [FR self-authored]
  },
  home_setup_tasks_failed: {
    en: 'Couldn’t add the steps to Tasks — try again.',
    fr: 'Impossible d’ajouter les étapes aux tâches — réessayez.', // [FR self-authored]
  },
  home_setup_ask_label: {
    en: 'Or ask the Advisor',
    fr: 'Ou demandez au Conseiller', // [FR self-authored]
  },
  home_setup_prompt_solo: {
    en: 'I’m a solo founder with no employees yet — what should I set up first?',
    fr: 'Je suis un fondateur solo sans employé — par quoi dois-je commencer ?', // [FR self-authored]
  },
  home_setup_prompt_first_hire: {
    en: 'What should I have in place before my first hire?',
    fr: 'Que dois-je avoir en place avant ma première embauche ?', // [FR self-authored]
  },

  /* ── Keep-going card on the populated Home — the same path, kept visible
     until done or dismissed (device-local). [FR self-authored] ─────────────── */
  home_setup_card_title: {
    en: 'Finish setting up',
    fr: 'Terminez la configuration', // [FR self-authored]
  },
  home_setup_card_done: {
    en: 'steps done',
    fr: 'étapes terminées', // [FR self-authored]
  },
  home_setup_card_dismiss: {
    en: 'Hide this',
    fr: 'Masquer', // [FR self-authored]
  },

  /* ── Production command centre (live counts once the workspace has data —
     no design-handoff counterpart; [FR self-authored] throughout) ────────── */
  home_prod_greeting: { en: 'Welcome back.', fr: 'Bon retour.' },
  home_prod_sub: {
    en: 'Live from your records.',
    fr: 'En direct à partir de vos dossiers.',
  },
  home_prod_loading: { en: 'Loading…', fr: 'Chargement…' },
  home_prod_error: {
    en: 'Couldn’t load your workspace summary.',
    fr: 'Impossible de charger le sommaire de votre espace de travail.',
  },
  home_prod_retry: { en: 'Retry', fr: 'Réessayer' },
  home_prod_stat_employees: { en: 'Employees', fr: 'Employés' },
  home_prod_stat_open_cases: { en: 'Open cases', fr: 'Dossiers ouverts' },
  home_prod_stat_open_tasks: { en: 'Open tasks', fr: 'Tâches ouvertes' },
  home_prod_stat_open_findings: { en: 'Open findings', fr: 'Constats ouverts' },
  home_prod_due_title: { en: 'Due soon', fr: 'Échéances à venir' },
  home_prod_due_none: {
    en: 'Nothing with a due date on the horizon.',
    fr: 'Aucune échéance à l’horizon.',
  },
  home_prod_overdue: { en: 'Overdue', fr: 'En retard' },
  home_prod_kind_case: { en: 'Case', fr: 'Dossier' },
  home_prod_kind_task: { en: 'Task', fr: 'Tâche' },
  home_prod_policy_attention_one: {
    en: 'policy needs attention',
    fr: 'politique demande votre attention',
  },
  home_prod_policy_attention_many: {
    en: 'policies need attention',
    fr: 'politiques demandent votre attention',
  },
  home_prod_policy_open: { en: 'Open policies', fr: 'Ouvrir les politiques' },

  /* Plan gate — Free/Starter keep guided setup; Growth unlocks the dashboard.
     [FR self-authored] */
  home_prod_dashboard_upgrade: {
    en: 'The operational dashboard and analytics unlock on Growth.',
    fr: 'Le tableau de bord opérationnel et les analyses se débloquent avec Croissance.',
  },

  /* Role-aware production cockpit. [FR self-authored] */
  home_role_title_manager: { en: 'Manager workspace', fr: 'Espace gestionnaire' },
  home_role_title_professional: { en: 'Professional workspace', fr: 'Espace professionnel' },
  home_role_title_member: { en: 'My workspace', fr: 'Mon espace de travail' },
  home_role_title_consultant: { en: 'Consultant workspace', fr: 'Espace consultant' },
  home_role_title_viewer: { en: 'Read-only summary', fr: 'Résumé en lecture seule' },
  home_role_sub_manager: {
    en: 'Team priorities, approvals, and team health.',
    fr: 'Priorités d’équipe, approbations et santé de l’équipe.',
  },
  home_role_sub_professional: {
    en: 'Active work queue, assigned records, and due dates.',
    fr: 'File de travail active, dossiers assignés et échéances.',
  },
  home_role_sub_member: {
    en: 'Assigned tasks, deadlines, policies, and wellbeing.',
    fr: 'Tâches assignées, échéances, politiques et bien-être.',
  },
  home_role_sub_consultant: {
    en: 'Scoped work queue and assigned module metrics.',
    fr: 'File de travail ciblée et indicateurs des modules assignés.',
  },
  home_role_sub_viewer: {
    en: 'Read-only summary of selected records.',
    fr: 'Résumé en lecture seule des dossiers sélectionnés.',
  },
  home_role_empty_title: { en: 'No assigned items', fr: 'Aucun élément assigné' },
  home_role_empty_body: {
    en: 'Your workspace is ready. Assigned tasks and records will appear here as they are shared with you.',
    fr: 'Votre espace de travail est prêt. Les tâches et dossiers assignés apparaîtront ici dès qu’ils vous seront partagés.',
  },
})
