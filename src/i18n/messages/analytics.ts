import { defineMessages } from '../core'

/**
 * Analytics view (formerly Reports) — UI-chrome strings for the rebuilt
 * dashboard: compliance score card, needs-attention list, headcount by
 * jurisdiction, open-case aging and policy acknowledgments. The rebuild has
 * no design-handoff string source, so FR is [FR self-authored] throughout,
 * reusing the vocabulary already established in the workspace catalogue
 * ('juridiction' per doclib, 'accusé de réception' per template t39).
 *
 * Registered in src/i18n/messages/workspace.ts.
 */
export const analyticsMessages = defineMessages({
  analytics_subtitle: {
    en: 'Workforce and compliance overview.',
    fr: 'Aperçu de l’effectif et de la conformité.',
  },

  /* ── Compliance score card ─────────────────────────────────────────────── */
  analytics_score_title: { en: 'Compliance score', fr: 'Score de conformité' },
  analytics_score_delta: { en: '{delta} vs {month}', fr: '{delta} c. {month}' },
  analytics_score_delta_flat: { en: 'No change vs {month}', fr: 'Aucun changement c. {month}' },
  analytics_score_chart_aria: {
    en: 'Compliance score by month: {points}.',
    fr: 'Score de conformité par mois : {points}.',
  },
  analytics_score_table_month: { en: 'Month', fr: 'Mois' },
  analytics_score_table_score: { en: 'Score', fr: 'Score' },
  analytics_score_breakdown_title: { en: 'Score breakdown', fr: 'Répartition du score' },
  analytics_score_lowest_flag: { en: 'Lowest', fr: 'Le plus bas' },
  analytics_score_empty: {
    en: 'No score data yet.',
    fr: 'Aucune donnée de score pour l’instant.',
  },
  analytics_score_first_point: {
    en: 'Score history starts here — this month is your first data point.',
    fr: 'L’historique du score commence ici — ce mois-ci est votre premier point de données.',
  },
  analytics_comp_policies: { en: 'Policies current', fr: 'Politiques à jour' },
  analytics_comp_tasks: { en: 'Tasks complete', fr: 'Tâches terminées' },
  analytics_comp_findings: {
    en: 'Findings resolved (weighted by severity)',
    fr: 'Constats résolus (pondérés selon la gravité)',
  },
  analytics_comp_obligations: {
    en: 'Obligations evidenced',
    fr: 'Obligations documentées',
  },
  analytics_comp_value: { en: '{done} of {total}', fr: '{done} sur {total}' },
  analytics_score_capped_note: {
    en: 'Capped at {ceiling} while a critical finding is open — resolve or dismiss it to lift the ceiling.',
    fr: 'Plafonné à {ceiling} tant qu’un constat critique est ouvert — résolvez-le ou rejetez-le pour lever le plafond.',
  },
  analytics_score_formula_note: {
    en: 'Earlier months were computed under a previous score formula.',
    fr: 'Les mois antérieurs ont été calculés selon une formule de score précédente.',
  },

  /* ── Score by jurisdiction (inside the score card) ─────────────────────── */
  analytics_jur_score_title: { en: 'Score by jurisdiction', fr: 'Score par juridiction' },
  analytics_jur_flag: { en: '{n} below overall', fr: '{n} sous le score global' },

  /* ── Needs attention card ──────────────────────────────────────────────── */
  analytics_attention_title: { en: 'Needs attention', fr: 'Attention requise' },
  analytics_attention_sub: {
    en: 'Overdue and upcoming compliance items.',
    fr: 'Éléments de conformité en retard et à venir.',
  },
  analytics_attention_overdue: { en: 'Overdue', fr: 'En retard' },
  analytics_attention_due_today: { en: 'Due today', fr: 'Échéance aujourd’hui' },
  analytics_attention_due_tomorrow: { en: 'Due tomorrow', fr: 'Échéance demain' },
  analytics_attention_due_days: { en: 'Due in {n} days', fr: 'Échéance dans {n} jours' },
  analytics_attention_due_date: { en: 'Due {date}', fr: 'Échéance {date}' },
  analytics_attention_affected_one: { en: '1 employee', fr: '1 employé' },
  analytics_attention_affected: { en: '{n} employees', fr: '{n} employés' },
  analytics_attention_view_all: { en: 'View all ({n})', fr: 'Tout voir ({n})' },
  analytics_attention_task_kind: { en: 'Compliance task', fr: 'Tâche de conformité' },
  analytics_attention_empty: {
    en: 'Nothing needs attention right now.',
    fr: 'Rien ne requiert votre attention pour le moment.',
  },

  /* ── Headcount card ────────────────────────────────────────────────────── */
  analytics_headcount_title: { en: 'Headcount by jurisdiction', fr: 'Effectif par juridiction' },
  analytics_headcount_total: { en: '{n} employees total', fr: '{n} employés au total' },
  analytics_headcount_footnote: {
    en: 'Federal = federally regulated roles under the Canada Labour Code.',
    fr: 'Fédéral = postes sous réglementation fédérale régis par le Code canadien du travail.',
  },
  analytics_headcount_chart_aria: {
    en: 'Headcount by jurisdiction: {points}.',
    fr: 'Effectif par juridiction : {points}.',
  },
  analytics_headcount_table_jurisdiction: { en: 'Jurisdiction', fr: 'Juridiction' },
  analytics_headcount_table_employees: { en: 'Employees', fr: 'Employés' },
  analytics_headcount_empty: { en: 'No employees yet.', fr: 'Aucun employé pour l’instant.' },

  /* ── Open cases card ───────────────────────────────────────────────────── */
  analytics_cases_title: { en: 'Open cases', fr: 'Dossiers ouverts' },
  analytics_cases_open_now: { en: 'Open now', fr: 'Ouverts actuellement' },
  analytics_cases_avg_age: { en: 'Avg. age (days)', fr: 'Âge moyen (jours)' },
  analytics_cases_oldest: { en: 'Oldest (days)', fr: 'Le plus ancien (jours)' },
  analytics_cases_day_one: { en: '1 day', fr: '1 jour' },
  analytics_cases_days: { en: '{n} days', fr: '{n} jours' },
  analytics_cases_opened: { en: 'Opened {date}', fr: 'Ouvert le {date}' },
  analytics_cases_empty: { en: 'No open cases.', fr: 'Aucun dossier ouvert.' },

  /* ── Policy acknowledgments card ───────────────────────────────────────── */
  analytics_ack_title: {
    en: 'Policy acknowledgments',
    fr: 'Accusés de réception des politiques',
  },
  analytics_ack_signed: { en: '{signed} / {total} signed', fr: '{signed} / {total} signés' },
  analytics_ack_meter_aria: {
    en: '{signed} of {total} acknowledgments signed',
    fr: '{signed} accusés de réception signés sur {total}',
  },
  analytics_ack_action: {
    en: 'Send a reminder to the {n} employees with outstanding signatures.',
    fr: 'Envoyez un rappel aux {n} employés dont la signature est en attente.',
  },
  analytics_ack_action_one: {
    en: 'Send a reminder to the employee with an outstanding signature.',
    fr: 'Envoyez un rappel à l’employé dont la signature est en attente.',
  },
  analytics_ack_complete: {
    en: 'All acknowledgments are signed.',
    fr: 'Tous les accusés de réception sont signés.',
  },
  analytics_ack_empty: {
    en: 'No acknowledgment campaigns yet.',
    fr: 'Aucune campagne d’accusé de réception pour l’instant.',
  },

  /* ── Certifications & training / document expiries (shared buckets) ────── */
  analytics_certs_title: { en: 'Certifications & training', fr: 'Attestations et formations' },
  analytics_certs_sub: { en: 'Expiring within 90 days', fr: 'Expirant d’ici 90 jours' },
  analytics_certs_empty: {
    en: 'Nothing expires within 90 days.',
    fr: 'Aucune expiration d’ici 90 jours.',
  },
  analytics_certs_prod_empty: {
    en: 'Certification records aren’t tracked in this workspace yet.',
    fr: 'Les attestations ne sont pas encore suivies dans cet espace de travail.',
  },
  analytics_bucket_expired: { en: 'Expired', fr: 'Échéance dépassée' },
  analytics_bucket_30: { en: '≤ 30 days', fr: '≤ 30 jours' },
  analytics_bucket_60: { en: '31–60 days', fr: '31–60 jours' },
  analytics_bucket_90: { en: '61–90 days', fr: '61–90 jours' },
  analytics_expiry_show: { en: 'Show list ({n})', fr: 'Afficher la liste ({n})' },
  analytics_expiry_hide: { en: 'Hide list', fr: 'Masquer la liste' },

  analytics_docs_title: { en: 'Document expiries', fr: 'Expirations de documents' },
  analytics_docs_sub: {
    en: 'Work permits, visas and dated employee documents',
    fr: 'Permis de travail, visas et documents datés des employés',
  },
  analytics_docs_empty: {
    en: 'No employee documents expire within 90 days.',
    fr: 'Aucun document d’employé n’expire d’ici 90 jours.',
  },
  analytics_docs_prod_empty: {
    en: 'Employee document expiries aren’t tracked in this workspace yet.',
    fr: 'Les expirations de documents des employés ne sont pas encore suivies dans cet espace de travail.',
  },

  /* ── Service milestones due ──────────────────────────────────────────────── */
  analytics_service_milestone_title: {
    en: 'Service milestones due',
    fr: 'Jalons de service à venir',
  },
  analytics_service_milestone_sub: { en: 'Due within 30 days', fr: 'Échus d’ici 30 jours' },
  analytics_service_milestone_ends: { en: 'Ends {date}', fr: 'Se termine le {date}' },
  analytics_service_milestone_ends_today: { en: 'Ends today', fr: 'Se termine aujourd’hui' },
  analytics_service_milestone_day_left: { en: '1 day left', fr: '1 jour restant' },
  analytics_service_milestone_days_left: { en: '{n} days left', fr: '{n} jours restants' },
  analytics_service_milestone_no_task: {
    en: 'No review task yet',
    fr: 'Aucune tâche d’évaluation créée',
  },
  analytics_service_milestone_empty: {
    en: 'No service milestones fall in the next 30 days.',
    fr: 'Aucun jalon de service n’arrive d’ici 30 jours.',
  },
  analytics_service_milestone_prod_empty: {
    en: 'Service milestone dates aren’t tracked in this workspace yet.',
    fr: 'Les dates de jalons de service ne sont pas encore suivies dans cet espace de travail.',
  },

  /* ── Leave overview ────────────────────────────────────────────────────── */
  analytics_leave_title: { en: 'Leave overview', fr: 'Aperçu des congés' },
  analytics_leave_sub: {
    en: 'On leave now and returning within 14 days — status only',
    fr: 'En congé actuellement et de retour d’ici 14 jours — statut seulement',
  },
  analytics_leave_returning: { en: 'Returning within 14 days', fr: 'De retour d’ici 14 jours' },
  analytics_leave_on_now: { en: 'On leave now', fr: 'En congé actuellement' },
  analytics_leave_protected: { en: 'Protected', fr: 'Protégé' },
  analytics_leave_returns: { en: 'Returns {date}', fr: 'Retour le {date}' },
  analytics_leave_empty: {
    en: 'No one is on leave right now.',
    fr: 'Personne n’est en congé actuellement.',
  },
  analytics_leave_prod_note: {
    en: 'Leave types and return dates aren’t tracked in this workspace yet.',
    fr: 'Les types de congé et les dates de retour ne sont pas encore suivis dans cet espace de travail.',
  },

  /* ── Headcount & turnover trend ────────────────────────────────────────── */
  analytics_trend_title: { en: 'Headcount & turnover', fr: 'Effectif et roulement' },
  analytics_trend_sub: {
    en: 'Six-month headcount and rolling turnover',
    fr: 'Effectif sur six mois et roulement glissant',
  },
  analytics_trend_chart_aria: {
    en: 'Headcount by month: {points}.',
    fr: 'Effectif par mois : {points}.',
  },
  analytics_trend_table_value: { en: 'Headcount', fr: 'Effectif' },
  analytics_turnover_label: {
    en: 'Turnover (rolling 12 months)',
    fr: 'Roulement (12 mois glissants)',
  },
  analytics_turnover_delta: { en: '{delta} pts vs {month}', fr: '{delta} pts c. {month}' },
  analytics_trend_empty: {
    en: 'No headcount history yet.',
    fr: 'Aucun historique d’effectif pour l’instant.',
  },
  analytics_trend_first_point: {
    en: 'Headcount history starts here — this month is your first data point.',
    fr: 'L’historique de l’effectif commence ici — ce mois-ci est votre premier point de données.',
  },
  analytics_turnover_prod_note: {
    en: 'Turnover needs termination history, which isn’t tracked yet.',
    fr: 'Le calcul du roulement nécessite l’historique des départs, qui n’est pas encore suivi.',
  },

  /* ── Card chrome (loading / error / empty) ─────────────────────────────── */
  analytics_loading: { en: 'Loading…', fr: 'Chargement…' },
  analytics_error: { en: 'Couldn’t load this card.', fr: 'Impossible de charger cette carte.' },
  analytics_retry: { en: 'Retry', fr: 'Réessayer' },

  /* ── Production mode ───────────────────────────────────────────────────── */
  analytics_live_note: {
    en: 'From your workspace records.',
    fr: 'À partir des dossiers de votre espace de travail.',
  },
  analytics_prod_empty_title: {
    en: 'Nothing to report yet',
    fr: 'Rien à rapporter pour l’instant',
  },
  analytics_prod_empty_body: {
    en: 'Analytics builds itself from your real workspace — add employees, cases, tasks, findings, or policies and the numbers appear here.',
    fr: 'La page Analytique se construit à partir de votre espace de travail réel — ajoutez des employés, des dossiers, des tâches, des constats ou des politiques et les chiffres apparaîtront ici.',
  },
})
