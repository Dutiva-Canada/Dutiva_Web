import { defineMessages } from '../core'

/**
 * Invest strategy builder — copy for the redesigned agent surface
 * (strategy list, editor, wizard, run history). Split from invest.ts
 * when the combined file crossed the 800-line architecture budget.
 */
export const investStrategyBuilderMessages = defineMessages({
  /* ── Strategy builder (redesign) ─────────────────────────────────────────
     Copy comes from the approved strategy-builder handoff (EN/FR pairs are
     the prototype's own strings). The prototype's scan vocabulary is
     "scan/balayage" — this block follows it for the builder surface even
     though older keys above say "analyse".

     [FR self-authored] — keys the handoff does not cover:
     invest_sb_cadence_help_*, invest_sb_empty_hint, invest_sb_last_run,
     invest_sb_results_h, invest_sb_results_sub, invest_sb_no_matches,
     invest_sb_scan_failed, invest_sb_scanned_line, invest_sb_match_line,
     invest_sb_metric_at, invest_sb_balance_at, invest_sb_outcome_*,
     invest_sb_run_partial, invest_sb_run_failed, invest_sb_no_runs,
     invest_sb_deleted, invest_sb_save_failed, invest_sb_delete_strategy,
     invest_sb_wiz_step2_blank, invest_sb_draft_failed. */

  /* Header theme control — cycles Auto → Light → Dark with a toast naming
     the new scheme. */
  invest_sb_theme_label: { en: 'Colour scheme', fr: 'Jeu de couleurs' },
  invest_sb_theme_auto: { en: 'Auto', fr: 'Auto' },
  invest_sb_theme_light: { en: 'Light', fr: 'Clair' },
  invest_sb_theme_dark: { en: 'Dark', fr: 'Sombre' },

  /* List view */
  invest_sb_list_sub: {
    en: 'Rules the agent watches for you, on a schedule.',
    fr: 'Des règles que l’agent surveille pour vous, selon un horaire.',
  },
  invest_sb_scan_caption: {
    en: 'Scanning never places orders.',
    fr: 'Le balayage ne place jamais d’ordres.',
  },
  invest_sb_scan_started: { en: 'Scan started…', fr: 'Balayage commencé…' },
  invest_sb_scan_complete: { en: 'Scan complete', fr: 'Balayage terminé' },
  invest_sb_empty_hint: {
    en: 'No strategies yet — create one and the agent starts watching on schedule.',
    fr: 'Aucune stratégie — créez-en une et l’agent commence la surveillance selon l’horaire.',
  },
  /* [FR self-authored] */
  invest_sb_last_run: { en: 'Last run {time}', fr: 'Dernier balayage {time}' },

  /* Plural nouns — FR uses the singular for 0 and 1 (prototype pl()). */
  invest_sb_rule_one: { en: 'rule', fr: 'règle' },
  invest_sb_rule_many: { en: 'rules', fr: 'règles' },
  invest_sb_tracked_one: { en: 'tracked symbol', fr: 'symbole suivi' },
  invest_sb_tracked_many: { en: 'tracked symbols', fr: 'symboles suivis' },
  invest_sb_scanned_one: { en: 'symbol scanned', fr: 'symbole analysé' },
  invest_sb_scanned_many: { en: 'symbols scanned', fr: 'symboles analysés' },
  invest_sb_signal_one: { en: 'signal', fr: 'signal' },
  invest_sb_signal_many: { en: 'signals', fr: 'signaux' },
  invest_sb_proposal_one: { en: 'proposal', fr: 'proposition' },
  invest_sb_proposal_many: { en: 'proposals', fr: 'propositions' },
  invest_sb_new_signal_one: { en: 'new signal', fr: 'nouveau signal' },
  invest_sb_new_signal_many: { en: 'new signals', fr: 'nouveaux signaux' },
  invest_sb_new_proposal_one: { en: 'new proposal', fr: 'nouvelle proposition' },
  invest_sb_new_proposal_many: { en: 'new proposals', fr: 'nouvelles propositions' },
  invest_sb_share_one: { en: 'share', fr: 'action' },
  invest_sb_share_many: { en: 'shares', fr: 'actions' },

  /* Editor chrome */
  invest_sb_back: { en: 'Strategies', fr: 'Stratégies' },
  invest_sb_draft_banner: {
    en: 'Draft ready — review the rules below before saving.',
    fr: 'Brouillon prêt — vérifiez les règles ci-dessous avant d’enregistrer.',
  },
  invest_sb_pill_enabled: { en: 'Enabled', fr: 'Activée' },
  invest_sb_pill_draft: { en: 'Draft', fr: 'Brouillon' },
  invest_sb_save: { en: 'Save', fr: 'Enregistrer' },
  invest_sb_discard: { en: 'Discard', fr: 'Annuler' },
  invest_sb_no_changes: { en: 'No changes', fr: 'Aucune modification' },
  invest_sb_unsaved: { en: 'Unsaved changes', fr: 'Modifications non enregistrées' },
  invest_sb_saved: { en: 'Strategy saved', fr: 'Stratégie enregistrée' },
  invest_sb_discarded: { en: 'Changes discarded', fr: 'Modifications annulées' },
  invest_sb_unsaved_discarded: {
    en: 'Unsaved changes discarded',
    fr: 'Modifications non enregistrées annulées',
  },
  invest_sb_created: {
    en: 'Strategy created — review the draft rules',
    fr: 'Stratégie créée — vérifiez les règles provisoires',
  },
  invest_sb_deleted: { en: 'Strategy deleted', fr: 'Stratégie supprimée' },
  invest_sb_save_failed: {
    en: 'The save failed — {error}',
    fr: 'L’enregistrement a échoué — {error}',
  },

  /* Review queue — AI-drafted strategies filed while the wizard was open.
     [FR self-authored] */
  invest_review_hint: {
    en: 'Drafted by an agent — each waits on your call.',
    fr: 'Rédigées par un agent — chacune attend votre décision.',
  },
  invest_review_add: { en: 'Add it', fr: 'L’ajouter' },
  invest_review_meta: {
    en: '{rules} · {cadence} · disabled until you enable it',
    fr: '{rules} · {cadence} · désactivée tant que vous ne l’activez pas',
  },
  /* Queue write didn't land upstream — completing the wizard still saves
     the strategy, but abandoning it loses the draft. [FR self-authored] */
  invest_review_not_filed: {
    en: 'Draft ready — not kept for review; leaving the wizard loses it.',
    fr: 'Brouillon prêt — non conservé pour validation ; quitter l’assistant le perd.',
  },
  invest_sb_delete_strategy: { en: 'Delete strategy', fr: 'Supprimer la stratégie' },
  invest_sb_untitled: { en: 'Untitled strategy', fr: 'Stratégie sans titre' },

  /* Strategy settings card */
  invest_sb_settings_h: { en: 'Strategy', fr: 'Stratégie' },
  invest_sb_name: { en: 'Name', fr: 'Nom' },
  invest_sb_cadence: { en: 'Scan cadence', fr: 'Fréquence de balayage' },
  /* [FR self-authored] The sweep is a real daily cron at 7:45 UTC
     (0180 invest-bot-daily); cadence gates how often a strategy is due
     inside that sweep — the copy must say what actually happens. */
  invest_sb_cadence_help_daily: {
    en: 'Checked in the daily sweep — 7:45 AM UTC.',
    fr: 'Vérifiée au balayage quotidien — 7 h 45 UTC.',
  },
  invest_sb_cadence_help_weekly: {
    en: 'Checked in the daily sweep, once 7 days have passed since the last run — 7:45 AM UTC.',
    fr: 'Vérifiée au balayage quotidien, une fois 7 jours écoulés depuis le dernier — 7 h 45 UTC.',
  },
  invest_sb_cadence_help_monthly: {
    en: 'Checked in the daily sweep, once 30 days have passed since the last run — 7:45 AM UTC.',
    fr: 'Vérifiée au balayage quotidien, une fois 30 jours écoulés depuis le dernier — 7 h 45 UTC.',
  },
  invest_sb_scope: { en: 'Symbol scope', fr: 'Portée des symboles' },
  invest_sb_scope_all: { en: 'All tracked symbols', fr: 'Tous les symboles suivis' },
  invest_sb_scope_specific: { en: 'Specific symbols', fr: 'Symboles précis' },
  /* [FR self-authored] */
  invest_sb_scope_need_sym: {
    en: 'Add at least one symbol to continue.',
    fr: 'Ajoutez au moins un symbole pour continuer.',
  },
  /* [FR self-authored] Shown when "all tracked" is picked but nothing is
     held or watched — the strategy would scan an empty universe. */
  invest_sb_scope_none_tracked: {
    en: 'Nothing is tracked yet — this strategy won’t match anything until you hold or watch a symbol.',
    fr: 'Aucun symbole suivi — cette stratégie ne déclenchera rien tant que vous n’en détenez ou n’en surveillez un.',
  },
  /* [FR self-authored] */
  invest_sb_name_ph: {
    en: 'e.g. Buy the dip',
    fr: 'p. ex. Achat en creux',
  },
  invest_sb_manage: { en: 'Manage', fr: 'Gérer' },
  invest_sb_add_symbol: { en: 'Add symbol', fr: 'Ajouter un symbole' },
  invest_sb_sym_placeholder: { en: 'e.g. SHOP.TO', fr: 'p. ex. SHOP.TO' },
  invest_sb_remove_sym: { en: 'Remove', fr: 'Retirer' },
  invest_sb_notify_via: { en: 'Notify me via', fr: 'Me notifier par' },
  invest_sb_chan_inapp: { en: 'In-app', fr: 'Dans l’app' },
  invest_sb_chan_email: { en: 'Email', fr: 'Courriel' },
  invest_sb_chan_both: {
    en: 'You’ll get an in-app notification and one email per scan that finds something.',
    fr: 'Vous recevrez une notification dans l’app et un courriel par balayage avec des résultats.',
  },
  invest_sb_chan_app: {
    en: 'You’ll get an in-app notification for each scan that finds something.',
    fr: 'Vous recevrez une notification dans l’app pour chaque balayage avec des résultats.',
  },
  invest_sb_chan_email_help: {
    en: 'You’ll get one email per scan that finds something.',
    fr: 'Vous recevrez un courriel par balayage avec des résultats.',
  },
  invest_sb_chan_none: {
    en: 'No channels selected — you won’t be notified when this strategy’s rules match.',
    fr: 'Aucun canal sélectionné — vous ne serez pas averti lorsque les règles de cette stratégie se déclencheront.',
  },
  invest_sb_multi_match: {
    en: 'When multiple rules match',
    fr: 'Quand plusieurs règles se déclenchent',
  },
  invest_sb_mm_summary: { en: 'One summary', fr: 'Un seul résumé' },
  invest_sb_mm_each: { en: 'Each rule separately', fr: 'Chaque règle séparément' },
  invest_sb_mm_summary_help: {
    en: 'One notification per scan listing every rule that matched.',
    fr: 'Une notification par balayage listant chaque règle déclenchée.',
  },
  invest_sb_mm_each_help: {
    en: 'A separate notification for each rule that matched in a scan.',
    fr: 'Une notification distincte pour chaque règle déclenchée lors d’un balayage.',
  },
  invest_sb_enabled_help: {
    en: 'The agent evaluates this strategy on its schedule.',
    fr: 'L’agent évalue cette stratégie selon sa fréquence.',
  },
  invest_sb_safety: {
    en: 'Order proposals always require your approval. The agent never trades on its own.',
    fr: 'Les propositions d’ordres exigent toujours votre approbation. L’agent ne négocie jamais seul.',
  },

  /* Rules accordion */
  invest_sb_rules_h: { en: 'Rules', fr: 'Règles' },
  invest_sb_rules_sub: {
    en: 'Rules are checked top to bottom — reorder to set priority.',
    fr: 'Les règles sont vérifiées de haut en bas — changez l’ordre pour définir la priorité.',
  },
  invest_sb_add_rule: { en: 'Add rule', fr: 'Ajouter une règle' },
  invest_sb_metric: { en: 'Metric', fr: 'Indicateur' },
  invest_sb_condition: { en: 'Condition', fr: 'Condition' },
  invest_sb_cond_below: { en: 'below', fr: 'en dessous de' },
  invest_sb_cond_above: { en: 'above', fr: 'au-dessus de' },
  /* [FR self-authored] */
  invest_sb_cond_between: { en: 'between', fr: 'entre' },
  invest_sb_verb_below: { en: 'falls below', fr: 'passe sous' },
  invest_sb_verb_above: { en: 'rises above', fr: 'dépasse' },
  /* [FR self-authored] */
  invest_sb_verb_between: { en: 'is between', fr: 'est entre' },
  /* [FR self-authored] */
  invest_sb_and: { en: 'and', fr: 'et' },
  /* [FR self-authored] */
  invest_sb_duplicate_rule: { en: 'Duplicate rule', fr: 'Dupliquer la règle' },
  /* [FR self-authored] Suffix appended to a duplicated rule's label so its
     stored title stays distinct — the engine dedupes on title. */
  invest_sb_copy_suffix: { en: 'copy', fr: 'copie' },
  invest_sb_threshold: { en: 'Threshold', fr: 'Seuil' },
  invest_sb_threshold_cad: { en: 'Threshold in CAD', fr: 'Seuil en CAD' },
  invest_sb_rule_label: {
    en: 'Custom label (optional)',
    fr: 'Étiquette personnalisée (facultatif)',
  },
  /* [FR self-authored] Placeholder example inside the label input — a
     concrete short name is worth more than "optional" alone. */
  invest_sb_rule_label_ph: {
    en: 'e.g. Down 8% today',
    fr: 'p. ex. Baisse de 8 % aujourd’hui',
  },
  invest_sb_when_match: {
    en: 'When this rule matches',
    fr: 'Quand cette règle se déclenche',
  },
  invest_sb_notify_me: { en: 'Notify me', fr: 'Me notifier' },
  invest_sb_propose_order: { en: 'Propose an order', fr: 'Proposer un ordre' },
  invest_sb_severity: { en: 'Severity', fr: 'Gravité' },
  invest_sb_insight: { en: 'Insight', fr: 'Aperçu' },
  invest_sb_alert: { en: 'Alert', fr: 'Alerte' },
  invest_sb_severity_help: {
    en: 'Alerts are highlighted in Signals; Insights stay quiet.',
    fr: 'Les alertes sont mises en évidence dans Signaux ; les aperçus restent discrets.',
  },
  invest_sb_side: { en: 'Side', fr: 'Sens' },
  invest_sb_buy: { en: 'Buy', fr: 'Achat' },
  invest_sb_sell: { en: 'Sell', fr: 'Vente' },
  invest_sb_quantity: { en: 'Quantity', fr: 'Quantité' },
  invest_sb_qty_amount: { en: 'Quantity amount', fr: 'Montant de la quantité' },
  invest_sb_qty_unit: { en: 'Quantity unit', fr: 'Unité de quantité' },
  invest_sb_unit_shares: { en: 'shares', fr: 'actions' },
  invest_sb_unit_pct: { en: '% of position', fr: '% de la position' },
  invest_sb_unit_currency: { en: '$ amount', fr: 'montant en $' },
  invest_sb_remove_rule: { en: 'Remove rule', fr: 'Supprimer la règle' },
  invest_sb_tap_confirm: {
    en: 'Click again to confirm',
    fr: 'Cliquez à nouveau pour confirmer',
  },
  invest_sb_move_up: { en: 'Move rule up', fr: 'Déplacer la règle vers le haut' },
  invest_sb_move_down: { en: 'Move rule down', fr: 'Déplacer la règle vers le bas' },
  invest_sb_move_up_t: { en: 'Move up', fr: 'Monter' },
  invest_sb_move_down_t: { en: 'Move down', fr: 'Descendre' },
  invest_sb_expand: { en: 'Expand rule', fr: 'Développer la règle' },
  invest_sb_collapse: { en: 'Collapse rule', fr: 'Réduire la règle' },
  invest_sb_notify_chip: { en: 'Notify', fr: 'Notifier' },

  /* Quantity preview — live plain-language line under the combined
     amount/unit control. */
  invest_sb_buys: { en: 'Buys', fr: 'Achète' },
  invest_sb_sells: { en: 'Sells', fr: 'Vend' },
  invest_sb_adds_pct: {
    en: 'Adds {n}% to your existing position',
    fr: 'Ajoute {n} % à votre position existante',
  },
  invest_sb_reduces_pct: {
    en: 'Reduces your existing position by {n}%',
    fr: 'Réduit votre position existante de {n} %',
  },
  invest_sb_qty_worth: { en: '{side} ${n} worth', fr: '{side} pour {n} $' },

  /* Strategy health + test scan (real dry run against live data). */
  invest_sb_health_h: { en: 'Strategy health', fr: 'Santé de la stratégie' },
  invest_sb_no_firing: {
    en: 'No firing history yet',
    fr: 'Aucun historique de déclenchement pour l’instant',
  },
  invest_sb_test_scan: { en: 'Test scan', fr: 'Balayage d’essai' },
  invest_sb_scanning: {
    en: 'Scanning {n} symbols…',
    fr: 'Balayage de {n} symboles…',
  },
  /* [FR self-authored] */
  invest_sb_results_h: { en: 'Dry-run results', fr: 'Résultats du balayage' },
  invest_sb_results_sub: {
    en: 'Dry run only — no signals or orders were created.',
    fr: 'Balayage d’essai — aucun signal ni ordre n’a été créé.',
  },
  invest_sb_no_matches: {
    en: 'No rules matched the symbols scanned.',
    fr: 'Aucune règle n’a été déclenchée sur les symboles analysés.',
  },
  invest_sb_scan_failed: {
    en: 'The scan failed — {error} (request {id})',
    fr: 'Le balayage a échoué — {error} (demande {id})',
  },
  /* [FR self-authored] */
  invest_sb_scan_empty: {
    en: 'Nothing to scan — the scope has no symbols. Track a symbol on the watchlist or pick specific symbols above.',
    fr: 'Rien à balayer — la portée ne contient aucun symbole. Suivez un symbole dans la liste de suivi ou choisissez des symboles précis plus haut.',
  },
  invest_sb_scanned_line: {
    en: '{symbols} scanned · {signals} · {proposals}',
    fr: '{symbols} analysés · {signals} · {proposals}',
  },
  invest_sb_match_line: {
    en: 'Matched rule “{title}” — {detail}.',
    fr: 'Règle correspondante « {title} » — {detail}.',
  },
  invest_sb_metric_at: { en: '{label} is at {value}', fr: '{label} est à {value}' },
  invest_sb_balance_at: { en: 'balance {value}', fr: 'solde de {value}' },
  invest_sb_outcome_insight: {
    en: 'Outcome: insight notification',
    fr: 'Résultat : notification d’aperçu',
  },
  invest_sb_outcome_alert: {
    en: 'Outcome: alert notification',
    fr: 'Résultat : notification d’alerte',
  },
  invest_sb_outcome_order: {
    en: 'Outcome: would propose order — {detail} · awaiting your approval',
    fr: 'Résultat : proposerait un ordre — {detail} · en attente de votre approbation',
  },

  /* Run history */
  invest_sb_runs_h: { en: 'Run history', fr: 'Historique des balayages' },
  invest_sb_sweep: { en: 'Agent sweep', fr: 'Balayage de l’agent' },
  invest_sb_runs_foot: {
    en: 'Showing last 10 runs · Sweeps run on schedule even with no enabled strategies.',
    fr: 'Affichage des 10 derniers balayages · Les balayages suivent l’horaire même sans stratégie activée.',
  },
  invest_sb_run_ok: { en: 'ok', fr: 'ok' },
  invest_sb_run_partial: { en: 'partial', fr: 'partiel' },
  invest_sb_run_failed: { en: 'failed', fr: 'échoué' },
  invest_sb_no_runs: {
    en: 'No runs yet — the first sweep lands after saving an enabled strategy.',
    fr: 'Aucun balayage — le premier arrive après l’enregistrement d’une stratégie activée.',
  },

  /* Wizard */
  invest_sb_wiz_describe: { en: 'Describe', fr: 'Décrire' },
  invest_sb_wiz_review: { en: 'Review rules', fr: 'Revoir les règles' },
  invest_sb_wiz_schedule: { en: 'Schedule', fr: 'Horaire' },
  invest_sb_wiz_step1_t: { en: 'Describe your strategy', fr: 'Décrivez votre stratégie' },
  invest_sb_wiz_what: {
    en: 'What should the agent watch for?',
    fr: 'Que doit surveiller l’agent ?',
  },
  invest_sb_wiz_placeholder: {
    en: 'e.g. Alert me when tech stocks dip hard, and propose a small buy if the dip is deep.',
    fr: 'p. ex. Alertez-moi quand les technos chutent fortement, et proposez un petit achat si le creux est profond.',
  },
  invest_sb_wiz_helper: {
    en: 'Pick a template or write your own — the agent will turn it into draft rules.',
    fr: 'Choisissez un modèle ou rédigez le vôtre — l’agent le transformera en règles provisoires.',
  },
  invest_sb_wiz_step2_t: { en: 'Review draft rules', fr: 'Revoir les règles provisoires' },
  invest_sb_wiz_step2_sub: {
    en: 'The agent drafted these from your description — expand a rule to review it. Everything can be fine-tuned in the editor after creating.',
    fr: 'L’agent les a rédigées à partir de votre description — développez une règle pour la revoir. Vous pourrez tout peaufiner dans l’éditeur après la création.',
  },
  invest_sb_wiz_step2_blank: {
    en: 'No rules yet — add one, or go back and describe the strategy.',
    fr: 'Aucune règle — ajoutez-en une, ou revenez décrire la stratégie.',
  },
  invest_sb_wiz_step3_t: {
    en: 'Schedule & notifications',
    fr: 'Horaire et notifications',
  },
  invest_sb_cancel: { en: 'Cancel', fr: 'Annuler' },
  invest_sb_continue: { en: 'Continue', fr: 'Continuer' },
  invest_sb_back_btn: { en: 'Back', fr: 'Retour' },
  invest_sb_create: { en: 'Create strategy', fr: 'Créer la stratégie' },
  invest_sb_drafting: { en: 'Drafting…', fr: 'Rédaction…' },
  invest_sb_draft_failed: {
    en: 'The draft could not be created — {error}',
    fr: 'La rédaction a échoué — {error}',
  },
})
