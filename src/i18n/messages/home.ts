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
    en: 'Nothing here yet — that’s expected. Start with a person, a document, or a guided process. Or ask the Advisor.',
    fr: 'Rien ici pour l’instant — c’est normal. Commencez par une personne, un document ou un processus guidé. Ou posez une question au Conseiller.', // [FR self-authored]
  },
  home_production_workspace_label: { en: 'Workspace', fr: 'Espace de travail' },
  home_production_checklist_label: {
    en: 'Three useful first steps',
    fr: 'Trois premiers pas utiles', // [FR self-authored]
  },
  home_production_step_person: {
    en: 'Add a person',
    fr: 'Ajouter une personne', // [FR self-authored]
  },
  home_production_step_person_hint: {
    en: 'Name, role, and location for your first employee',
    fr: 'Nom, rôle et lieu pour votre premier employé', // [FR self-authored]
  },
  home_production_step_studio: {
    en: 'Draft in Studio',
    fr: 'Rédiger dans le Studio', // [FR self-authored]
  },
  home_production_step_studio_hint: {
    en: 'Start from a Canadian HR template',
    fr: 'Partez d’un modèle RH canadien', // [FR self-authored]
  },
  home_production_step_workflow: {
    en: 'Run a guided process',
    fr: 'Lancer un processus guidé', // [FR self-authored]
  },
  home_production_step_workflow_hint: {
    en: 'Notice, severance, or accommodation — Ontario pinned below',
    fr: 'Préavis, indemnité de départ ou accommodement — Ontario ci-dessous', // [FR self-authored]
  },
  home_production_demo_link: {
    en: 'Want a walkthrough with sample data? Open Demo in Settings',
    fr: 'Vous voulez une visite avec des données d’exemple ? Ouvrez la Démo dans les paramètres', // [FR self-authored]
  },
  home_production_pinned_label: {
    en: 'Or jump into a calculator',
    fr: 'Ou ouvrez un calculateur', // [FR self-authored]
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
})
