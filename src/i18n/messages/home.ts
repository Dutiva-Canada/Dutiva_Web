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
    en: 'Jordan Mensah’s termination is your top exposure: counsel hasn’t replied to the Jul 5 review request, and the preliminary estimate puts common-law notice at 9–12 months against the 7-week ESA floor. Do first — nudge counsel and hold the offer. Then draft the Remote Work Policy refresh: 14 months overdue, and worth +4 of your +6 predicted compliance gain.',
    fr: 'La cessation d’emploi de Jordan Mensah est votre principale exposition : le conseiller juridique n’a pas répondu à la demande du 5 juillet, et l’estimation préliminaire situe le préavis de common law entre 9 et 12 mois contre le plancher LNE de 7 semaines. À faire en premier : relancer le conseiller et retenir l’offre. Ensuite, rédiger la politique de télétravail — 14 mois de retard et +4 des +6 points de conformité prévus.',
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

  /* ── Production-mode empty state (admin-only; not in the design handoff —
     new for the production-readiness work) — [FR self-authored] ─────────── */
  home_production_title: {
    en: 'Your workspace is ready.',
    fr: 'Votre espace de travail est prêt.',
  },
  home_production_body: {
    en: 'This is your real, empty Dutiva workspace — no cases, tasks, or alerts yet. Add people, draft in Studio, run a guided process, or ask the Advisor. Switch back to Demo in Settings for a walkthrough with sample data.',
    fr: 'Voici votre espace de travail Dutiva réel et vide — aucun dossier, aucune tâche, aucune alerte pour l’instant. Ajoutez des personnes, rédigez dans le Studio, lancez un processus guidé, ou posez une question au Conseiller. Repassez en mode Démo dans les paramètres pour une visite guidée avec des données d’exemple.', // [FR self-authored]
  },
  home_production_workspace_label: { en: 'Workspace', fr: 'Espace de travail' },
  home_production_cta_employees: { en: 'Add employees', fr: 'Ajouter des employés' }, // [FR self-authored]
  home_production_cta_studio: { en: 'Open Studio', fr: 'Ouvrir le Studio' }, // [FR self-authored]
  home_production_cta_workflows: {
    en: 'Guided processes',
    fr: 'Processus guidés', // [FR self-authored]
  },
  home_production_pinned_label: {
    en: 'Start with a calculator or guide',
    fr: 'Commencer par un calculateur ou un guide', // [FR self-authored]
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
})
