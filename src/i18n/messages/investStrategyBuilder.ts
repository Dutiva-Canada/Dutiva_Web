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
  invest_sb_pill_paused: { en: 'Paused', fr: 'En pause' },
  invest_sb_pill_draft: { en: 'Draft', fr: 'Brouillon' },
  /* [FR self-authored] */
  invest_sb_next_run: { en: 'next {time}', fr: 'prochain {time}' },
  invest_sb_next_overdue: {
    en: 'due on next sweep',
    fr: 'prévu au prochain balayage',
  },
  invest_sb_run_quiet: {
    en: 'no signals or drafts',
    fr: 'aucun signal ni projet',
  },
  invest_sb_scan_result: {
    en: 'Scan complete — {signals} · {proposals}',
    fr: 'Balayage terminé — {signals} · {proposals}',
  },
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

  /* Tally's proactive suggestions — filed by the sweep's book review, not
     by anything you asked for. [FR self-authored] */
  invest_suggest_hint: {
    en: 'Tally reviewed the book — each suggestion waits on your call.',
    fr: 'Tally a passé le carnet en revue — chaque suggestion attend votre décision.',
  },
  invest_suggest_apply: { en: 'Apply', fr: 'Appliquer' },
  /* Accept on the 'recurring' suggestion — writes the schedule row.
     [FR self-authored] */
  invest_suggest_schedule: { en: 'Schedule it', fr: 'La programmer' },
  invest_suggest_apply_rule: { en: 'Add rule', fr: 'Ajouter la règle' },
  invest_suggest_apply_scope: { en: 'Add symbols', fr: 'Ajouter les symboles' },
  invest_suggest_applied: {
    en: 'Applied — review and save to keep it',
    fr: 'Appliqué — vérifiez puis enregistrez pour le garder',
  },
  invest_suggest_added_rule: {
    en: 'Rule added to “{name}”',
    fr: 'Règle ajoutée à « {name} »',
  },
  invest_suggest_tuned: {
    en: '“{name}” updated',
    fr: '« {name} » mise à jour',
  },
  invest_suggest_scope_added: {
    en: 'Scope updated on “{name}”',
    fr: 'Portée mise à jour sur « {name} »',
  },
  /* The strategy a suggestion targets was deleted/renamed since the pass
     filed it — the row can only be dismissed. [FR self-authored] */
  invest_suggest_stale: {
    en: 'The strategy this points at no longer exists.',
    fr: 'La stratégie visée n’existe plus.',
  },
  /* [FR self-authored] */
  invest_suggest_show_all: {
    en: 'Show all {n} suggestions',
    fr: 'Afficher les {n} suggestions',
  },
  /* [FR self-authored] */
  invest_suggest_collapse: { en: 'Show fewer', fr: 'Réduire la liste' },
  /* Foreign-kind row action — a verb, not just the destination page name.
     [FR self-authored] */
  invest_suggest_open: { en: 'Open {page}', fr: 'Ouvrir {page}' },
  invest_suggest_editor_label: {
    en: 'Tally suggests for this strategy',
    fr: 'Suggestions de Tally pour cette stratégie',
  },
  /* Wizard step 1 — pending book-review drafts offered alongside the
     templates. [FR self-authored] */
  invest_suggest_wiz_label: {
    en: 'Tally’s picks from the last book review',
    fr: 'Choix de Tally depuis la dernière revue du carnet',
  },
  /* Rule summary line under a rule_add/rule_tune card — what applying
     writes. [FR self-authored] */
  invest_suggest_rule_meta: {
    en: 'On “{name}” — {rule}',
    fr: 'Sur « {name} » — {rule}',
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
  /* Dedupe makes this "something new" — a repeat match covered by an open
     signal doesn't re-email. [FR self-authored] */
  invest_sb_chan_email_help: {
    en: 'You’ll get one email per scan that finds something new.',
    fr: 'Vous recevrez un courriel par balayage avec de nouveaux résultats.',
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
  /* [FR self-authored] Honest semantics — every rule is evaluated each
     scan; the order is how the list reads, not a priority. */
  invest_sb_rules_sub: {
    en: 'Every rule is checked on each scan — the order just sets how they’re listed here.',
    fr: 'Chaque règle est vérifiée à chaque balayage — l’ordre ne change que leur présentation ici.',
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
  /* The currency follows the book, not a hardcoded CAD. [FR self-authored] */
  invest_sb_threshold_cad: { en: 'Threshold in {ccy}', fr: 'Seuil en {ccy}' },
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
  /* [FR self-authored] The grip is a real drag affordance — not decor. */
  invest_sb_drag_rule: { en: 'Drag to reorder', fr: 'Glisser pour réordonner' },
  invest_sb_expand: { en: 'Expand rule', fr: 'Développer la règle' },
  invest_sb_collapse: { en: 'Collapse rule', fr: 'Réduire la règle' },
  invest_sb_notify_chip: { en: 'Notify', fr: 'Notifier' },
  /* [FR self-authored] A daily metric on a slower cadence only sees one
     day per window — surfaced under the rule, not asserted as an error. */
  invest_sb_cadence_mismatch: {
    en: 'Reads a single day’s move — a {cadence} scan only sees one day in its window.',
    fr: 'Lit le mouvement d’une seule journée — un balayage {cadence} ne voit qu’un jour par fenêtre.',
  },

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
  /* {n} already carries the currency — "$1,000 CAD" / "1 000 $ CAD" —
     because a currency-unit quantity is denominated in the book currency,
     not always CAD. [FR self-authored] */
  invest_sb_qty_worth: { en: '{side} {n} worth', fr: '{side} pour {n}' },

  /* Strategy health + test scan (real dry run against live data). */
  invest_sb_health_h: { en: 'Strategy health', fr: 'Santé de la stratégie' },
  invest_sb_no_firing: {
    en: 'No firing history yet',
    fr: 'Aucun historique de déclenchement pour l’instant',
  },
  /* [FR self-authored] Ran-and-found-nothing is not never-ran — the two
     states used to share "No firing history yet". */
  invest_sb_no_hits: {
    en: 'Scans ran — nothing matched yet.',
    fr: 'Balayages effectués — aucun déclenchement pour l’instant.',
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
  /* [FR self-authored] The match is already covered by an open signal or
     draft — the dry run reads the same dedupe the sweep does, so it says
     "would skip", not "would fire". */
  invest_sb_outcome_suppressed: {
    en: 'already open — a real scan would skip it',
    fr: 'déjà ouvert — un vrai balayage l’omettrait',
  },
  /* [FR self-authored] Summary-line segment counting suppressed matches. */
  invest_sb_suppressed_seg: {
    en: '{n} already open',
    fr: '{n} déjà ouvert(s)',
  },
  /* [FR self-authored] Symbol slot on a book-level match card — the
     match describes the whole portfolio, not a symbol or a "sweep". */
  invest_sb_book_match: { en: 'Portfolio', fr: 'Portefeuille' },

  /* Run history */
  invest_sb_runs_h: { en: 'Run history', fr: 'Historique des balayages' },
  invest_sb_sweep: { en: 'Agent sweep', fr: 'Balayage de l’agent' },
  /* Sweep rows carry AI book observations, not rule signals — their own
     noun so "2 observations" never masquerades as "2 signals". */
  invest_sb_observation_one: { en: 'observation', fr: 'observation' },
  invest_sb_observation_many: { en: 'observations', fr: 'observations' },
  /* [FR self-authored] A strategy row with zero scanned symbols ran
     book-level metrics only — say that instead of "0 symbols scanned". */
  invest_sb_book_only: {
    en: 'book metrics only',
    fr: 'indicateurs de portefeuille',
  },
  invest_sb_runs_foot: {
    en: 'Showing last 10 runs.',
    fr: 'Affichage des 10 derniers balayages.',
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

  /* Editor back link — dirty state arms a two-tap confirm instead of
     silently discarding (same pattern as the rule-remove button).
     [FR self-authored] */
  invest_sb_confirm_discard: {
    en: 'Discard changes? Click again',
    fr: 'Abandonner les modifications ? Cliquez à nouveau',
  },

  /* Save-time rule validation — a rule that would silently drop on the
     server is named instead (the number is its position in the list).
     [FR self-authored] */
  invest_sb_rule_needs_value: {
    en: 'Rule {n} needs a threshold.',
    fr: 'La règle {n} a besoin d’un seuil.',
  },
  invest_sb_rule_needs_value2: {
    en: 'Rule {n} needs a second number — "between" takes two bounds.',
    fr: 'La règle {n} a besoin d’un deuxième nombre — « entre » exige deux bornes.',
  },
  invest_sb_rule_needs_qty: {
    en: 'Rule {n} needs an order quantity above 0.',
    fr: 'La règle {n} a besoin d’une quantité d’ordre supérieure à 0.',
  },
  /* [FR self-authored] AI-drafted rules the normalizer couldn't read —
     the saved strategy keeps the valid ones and says what was lost. */
  invest_sb_rules_dropped: {
    en: '{n} drafted rule(s) couldn’t be read — add them in the editor.',
    fr: '{n} règle(s) rédigée(s) illisible(s) — ajoutez-les dans l’éditeur.',
  },

  /* Engine warning localization — the edge function ships code+params
     twins (warningDetails) so these render per locale; unknown codes fall
     back to the engine's raw string. [FR self-authored] */
  invest_warn_fx_missing: {
    en: 'Positions quoted in {currencies} were skipped — no FX rate; their value-based rules did not run.',
    fr: 'Les positions cotées en {currencies} ont été ignorées — aucun taux de change ; leurs règles basées sur la valeur n’ont pas été exécutées.',
  },
  invest_warn_no_snapshot: {
    en: 'Positions without price data were skipped — {symbols}; their value-based rules did not run and weights exclude them.',
    fr: 'Les positions sans données de prix ont été ignorées — {symbols} ; leurs règles basées sur la valeur n’ont pas été exécutées et les pondérations les excluent.',
  },
  invest_warn_qty_unresolvable: {
    en: '"{title}": quantity could not be resolved for {symbol}.',
    fr: '« {title} » : la quantité n’a pas pu être calculée pour {symbol}.',
  },
  invest_warn_book_proposal: {
    en: '"{title}": order proposals need a symbol-level metric.',
    fr: '« {title} » : les propositions d’ordre exigent un indicateur par symbole.',
  },
  invest_warn_cash_fx: {
    en: 'Some cash balances were skipped — no FX rate for their currency.',
    fr: 'Certaines liquidités ont été ignorées — aucun taux de change pour leur devise.',
  },
  invest_warn_no_paper: {
    en: 'Order proposals were skipped — no active paper account.',
    fr: 'Les propositions d’ordre ont été ignorées — aucun compte simulé actif.',
  },
  invest_warn_email_failed: {
    en: 'Email delivery failed for "{name}".',
    fr: 'L’envoi du courriel a échoué pour « {name} ».',
  },
  invest_warn_digest_failed: {
    en: 'The digest email failed — pending items stay buffered for the next sweep.',
    fr: 'L’envoi du courriel groupé a échoué — les éléments en attente restent conservés pour le prochain balayage.',
  },
  invest_warn_history_failed: {
    en: 'The run completed but its history row could not be recorded.',
    fr: 'Le balayage s’est terminé, mais sa ligne d’historique n’a pas pu être enregistrée.',
  },

  /* ── Theses (/invest/theses) — per-holding standing claims: the story,
     the conditions that fray it (drift) and the ones that end it (break),
     plus the posture line the sweep writes. [FR self-authored] */
  invest_tab_theses: { en: 'Theses', fr: 'Thèses' },
  invest_theses_title: { en: 'Theses', fr: 'Thèses' },
  invest_theses_sub: {
    en: 'Each holding’s claim — the story and the conditions that would change your mind. Tally checks them on every sweep.',
    fr: 'La thèse de chaque position — l’histoire et les conditions qui vous feraient changer d’avis. Tally les vérifie à chaque balayage.',
  },
  invest_thesis_status_healthy: { en: 'On track', fr: 'Sur la bonne voie' },
  invest_thesis_status_drifting: { en: 'Drifting', fr: 'Dérive' },
  invest_thesis_status_broken: { en: 'Broken', fr: 'Brisée' },
  invest_thesis_intent_label: { en: 'The role it plays', fr: 'Le rôle qu’elle joue' },
  invest_thesis_intent_core: { en: 'Core', fr: 'Cœur' },
  invest_thesis_intent_growth: { en: 'Growth', fr: 'Croissance' },
  invest_thesis_intent_income: { en: 'Income', fr: 'Revenu' },
  invest_thesis_intent_speculative: { en: 'Speculative', fr: 'Spéculative' },
  invest_thesis_zone_break: { en: 'Breaks the thesis', fr: 'Brise la thèse' },
  invest_thesis_zone_drift: { en: 'Early warning', fr: 'Signal précoce' },
  invest_thesis_zone_break_hint: {
    en: 'Any one of these firing means the claim no longer holds.',
    fr: 'Une seule de ces conditions déclenchée signifie que la thèse ne tient plus.',
  },
  invest_thesis_zone_drift_hint: {
    en: 'The thesis fraying before it breaks — worth a look, not a decision yet.',
    fr: 'La thèse s’effrite avant de se briser — mérite un coup d’œil, pas encore une décision.',
  },
  invest_thesis_rule_fired: { en: 'fired', fr: 'déclenchée' },
  invest_thesis_rule_ok: { en: 'holding', fr: 'tenue' },
  invest_thesis_last_read: { en: 'Last read {value}', fr: 'Dernière lecture {value}' },
  invest_thesis_no_read: { en: 'No reading yet', fr: 'Pas encore de lecture' },
  invest_thesis_evaluated: { en: 'Checked {when}', fr: 'Vérifiée {when}' },
  invest_thesis_never: { en: 'Not evaluated yet — the next sweep reads it.', fr: 'Pas encore évaluée — le prochain balayage la lira.' },
  invest_thesis_posture: { en: 'Posture', fr: 'Position' },
  invest_thesis_edit: { en: 'Edit', fr: 'Modifier' },
  invest_thesis_delete: { en: 'Delete', fr: 'Supprimer' },
  invest_thesis_delete_confirm: { en: 'Tap again to confirm', fr: 'Retoucher pour confirmer' },
  invest_thesis_new: { en: 'New thesis', fr: 'Nouvelle thèse' },
  invest_thesis_symbol: { en: 'Symbol', fr: 'Symbole' },
  invest_thesis_pick_symbol: { en: 'Pick a holding or watched symbol', fr: 'Choisir une position ou un symbole suivi' },
  invest_thesis_name: { en: 'Company or label', fr: 'Société ou libellé' },
  invest_thesis_story_label: { en: 'The thesis', fr: 'La thèse' },
  invest_thesis_story_ph: {
    en: 'What must keep being true — e.g. “Arm keeps its phone royalties and wins data-center designs.”',
    fr: 'Ce qui doit rester vrai — p. ex. « Arm conserve ses redevances mobiles et gagne des conceptions de centres de données. »',
  },
  invest_thesis_add_break: { en: 'Break conditions', fr: 'Conditions de cassure' },
  invest_thesis_add_drift: { en: 'Drift conditions', fr: 'Conditions de dérive' },
  invest_thesis_save: { en: 'Save thesis', fr: 'Enregistrer la thèse' },
  invest_thesis_saved: { en: 'Thesis saved — the next sweep reads it.', fr: 'Thèse enregistrée — le prochain balayage la lira.' },
  invest_thesis_deleted: { en: 'Thesis removed.', fr: 'Thèse supprimée.' },
  invest_thesis_save_failed: { en: 'Couldn’t save the thesis — {error}', fr: 'Enregistrement de la thèse impossible — {error}' },
  invest_thesis_cancel: { en: 'Cancel', fr: 'Annuler' },
  invest_thesis_empty: {
    en: 'No theses yet — write the claim for a holding, or tell Tally the story and let her draft it.',
    fr: 'Aucune thèse — rédigez la thèse d’une position, ou racontez l’histoire à Tally et laissez-la la rédiger.',
  },
  invest_thesis_tally_label: { en: 'Tell Tally the story', fr: 'Raconter l’histoire à Tally' },
  invest_thesis_tally_ph: {
    en: 'In your words — why you hold it, what would prove you wrong, what would make you take profits.',
    fr: 'Dans vos mots — pourquoi vous la détenez, ce qui vous donnerait tort, ce qui vous ferait prendre des profits.',
  },
  invest_thesis_tally_draft: { en: 'Draft it', fr: 'Rédiger' },
  invest_thesis_tally_drafting: { en: 'Drafting…', fr: 'Rédaction…' },
  invest_thesis_tally_note: {
    en: 'Tally drafted the claim and its conditions — edit anything before saving.',
    fr: 'Tally a rédigé la thèse et ses conditions — modifiez avant d’enregistrer.',
  },
  invest_thesis_tally_undo: { en: 'Restore my version', fr: 'Rétablir ma version' },
  invest_thesis_no_symbols: {
    en: 'Nothing tracked yet — add a holding or a watched symbol in Portfolios first.',
    fr: 'Rien de suivi — ajoutez d’abord une position ou un symbole suivi dans Portefeuilles.',
  },
  invest_thesis_tally_failed: { en: 'Tally couldn’t draft that — try rephrasing.', fr: 'Tally n’a pas pu la rédiger — essayez autrement.' },
  invest_thesis_suggest_accept: { en: 'Start tracking', fr: 'Commencer le suivi' },
  /* [FR self-authored] */
  invest_thesis_draft_row: { en: 'Draft with Tally', fr: 'Rédiger avec Tally' },
  /* [FR self-authored] */
  invest_thesis_draft_title: { en: '{sym} — Tally’s draft', fr: '{sym} — brouillon de Tally' },
  /* [FR self-authored] */
  invest_thesis_draft_conds: {
    en: '{b} break · {d} drift conditions drafted — review before saving.',
    fr: '{b} cassure · {d} dérive rédigées — à revoir avant d’enregistrer.',
  },
  invest_thesis_suggest_stale: { en: 'A thesis already covers this symbol — dismiss to clear.', fr: 'Une thèse couvre déjà ce symbole — écartez pour nettoyer.' },
  invest_seo_title_theses: { en: 'Theses — Dutiva Invest', fr: 'Thèses — Dutiva Invest' },
  invest_seo_desc_theses: {
    en: 'Standing claims per holding — Tally flags drift and breaks as they happen.',
    fr: 'Thèses permanentes par position — Tally signale dérives et cassures au fil de l’eau.',
  },

  /* ── Analysis (0220) — goals, the scan board, and per-company SWOT. */
  invest_tab_analysis: { en: 'Analysis', fr: 'Analyse' },
  invest_analysis_title: { en: 'Book analysis', fr: 'Analyse du carnet' },
  invest_analysis_sub: {
    en: 'Goals Tally measures every sweep, the watch board for outside factors, and a SWOT beside each thesis.',
    fr: 'Objectifs que Tally mesure à chaque balayage, la veille des facteurs externes et une analyse FFOM près de chaque thèse.',
  },
  invest_analysis_pending: { en: 'Tally suggests', fr: 'Suggestions de Tally' },
  invest_analysis_goals: { en: 'Goals', fr: 'Objectifs' },
  invest_analysis_goals_sub: {
    en: 'Measurable objectives — Tally re-checks them every sweep and says when one slips or lands.',
    fr: 'Objectifs mesurables — Tally les revérifie à chaque balayage et signale ceux qui glissent ou aboutissent.',
  },
  invest_goal_new: { en: 'New goal', fr: 'Nouvel objectif' },
  invest_goal_empty: {
    en: 'No goals yet — set one, or let Tally propose measurable starters from your book.',
    fr: 'Aucun objectif — fixez-en un, ou laissez Tally en proposer de mesurables d’après votre carnet.',
  },
  invest_goal_title_ph: { en: 'e.g. “Keep any position under 25%”', fr: 'p. ex. « Garder chaque position sous 25 % »' },
  invest_goal_detail_ph: { en: 'Why it matters — optional', fr: 'Pourquoi c’est important — facultatif' },
  invest_goal_metric: { en: 'Measured on', fr: 'Mesuré sur' },
  invest_goal_metric_book_value: { en: 'Book value', fr: 'Valeur du carnet' },
  invest_goal_metric_cash_pct: { en: 'Cash share (%)', fr: 'Part de liquidités (%)' },
  invest_goal_metric_max_weight_pct: { en: 'Largest position (%)', fr: 'Plus grosse position (%)' },
  invest_goal_metric_unrealized_gain_pct: { en: 'Average gain (%)', fr: 'Gain moyen (%)' },
  invest_goal_metric_thesis_coverage: { en: 'Thesis coverage (%)', fr: 'Couverture de thèses (%)' },
  invest_goal_metric_position_count: { en: 'Position count', fr: 'Nombre de positions' },
  invest_goal_op_gte: { en: 'at least', fr: 'au moins' },
  invest_goal_op_lte: { en: 'at most', fr: 'au plus' },
  invest_goal_target: { en: 'Target', fr: 'Cible' },
  invest_goal_deadline: { en: 'Deadline', fr: 'Échéance' },
  invest_goal_deadline_none: { en: 'No deadline', fr: 'Sans échéance' },
  invest_goal_save: { en: 'Save goal', fr: 'Enregistrer l’objectif' },
  invest_goal_saved: { en: 'Goal saved — the next sweep measures it.', fr: 'Objectif enregistré — le prochain balayage le mesurera.' },
  invest_goal_deleted: { en: 'Goal removed.', fr: 'Objectif supprimé.' },
  invest_goal_failed: { en: 'Couldn’t save the goal — {error}', fr: 'Enregistrement de l’objectif impossible — {error}' },
  invest_goal_status_on_track: { en: 'On track', fr: 'En voie' },
  /* Deadline-less goals can't be behind — but "On track" at 0% would
     claim a pace there isn't. Neutral tag for the open-ended case. */
  /* [FR self-authored] */
  invest_goal_status_open: { en: 'In progress', fr: 'En cours' },
  invest_goal_status_behind: { en: 'At risk', fr: 'En péril' },
  invest_goal_status_achieved: { en: 'Achieved', fr: 'Atteint' },
  invest_goal_status_missed: { en: 'Missed', fr: 'Manqué' },
  invest_goal_current: { en: 'Now {value}', fr: 'Actuellement {value}' },
  invest_goal_never: { en: 'Measured on the next sweep.', fr: 'Mesuré au prochain balayage.' },
  invest_goal_evaluated: { en: 'Measured {when}', fr: 'Mesuré {when}' },
  invest_goal_delete: { en: 'Delete', fr: 'Supprimer' },
  invest_goal_edit: { en: 'Edit', fr: 'Modifier' },
  invest_goal_suggest_accept: { en: 'Set the goal', fr: 'Fixer l’objectif' },
  invest_analysis_scan: { en: 'Watch board', fr: 'Tableau de veille' },
  invest_analysis_scan_sub: {
    en: 'Outside factors worth monitoring — Tally links one to a holding when its thesis starts to fray.',
    fr: 'Facteurs externes à surveiller — Tally les relie à une position quand sa thèse s’effrite.',
  },
  invest_scan_new: { en: 'New watch item', fr: 'Nouvel élément de veille' },
  invest_scan_empty: {
    en: 'No watch items yet — note a factor that could touch the book, or let Tally scan for you.',
    fr: 'Aucun élément — notez un facteur qui pourrait toucher le carnet, ou laissez Tally balayer.',
  },
  invest_scan_theme: { en: 'Theme', fr: 'Thème' },
  invest_scan_theme_economy: { en: 'Economy', fr: 'Économie' },
  invest_scan_theme_policy: { en: 'Policy', fr: 'Politique' },
  invest_scan_theme_sector: { en: 'Sector', fr: 'Secteur' },
  invest_scan_theme_currency: { en: 'Currency', fr: 'Devises' },
  invest_scan_theme_geopolitical: { en: 'Geopolitical', fr: 'Géopolitique' },
  invest_scan_theme_company: { en: 'Company', fr: 'Entreprise' },
  invest_scan_direction: { en: 'Direction', fr: 'Orientation' },
  invest_scan_dir_tailwind: { en: 'Tailwind', fr: 'Vent arrière' },
  invest_scan_dir_headwind: { en: 'Headwind', fr: 'Vent contraire' },
  invest_scan_dir_monitor: { en: 'Monitor', fr: 'À surveiller' },
  invest_scan_title_ph: { en: 'e.g. “US chip export rules”', fr: 'p. ex. « Règles américaines sur les puces »' },
  invest_scan_note_ph: { en: 'Why it could matter to this book — one sentence', fr: 'Pourquoi ça peut compter pour ce carnet — une phrase' },
  invest_scan_symbols: { en: 'Symbols it could touch', fr: 'Symboles touchés' },
  invest_scan_all_book: { en: 'Whole book', fr: 'Tout le carnet' },
  invest_scan_stale: { en: 'Stale — due a review', fr: 'Périmé — à revoir' },
  invest_scan_reviewed: { en: 'Reviewed {when}', fr: 'Revue {when}' },
  invest_scan_mark: { en: 'Mark reviewed', fr: 'Marquer revue' },
  invest_scan_save: { en: 'Save item', fr: 'Enregistrer' },
  invest_scan_saved: { en: 'Watch item saved.', fr: 'Élément enregistré.' },
  invest_scan_deleted: { en: 'Watch item removed.', fr: 'Élément supprimé.' },
  invest_scan_failed: { en: 'Couldn’t save the item — {error}', fr: 'Enregistrement impossible — {error}' },
  invest_scan_tally: { en: 'Let Tally scan', fr: 'Demander à Tally' },
  invest_scan_tally_busy: { en: 'Scanning…', fr: 'Balayage…' },
  invest_scan_tally_failed: { en: 'Tally couldn’t scan right now — try again.', fr: 'Tally n’a pas pu balayer — réessayez.' },
  invest_scan_suggest_accept: { en: 'Watch it', fr: 'Surveiller' },
  invest_analysis_swot: { en: 'Company SWOT', fr: 'FFOM par entreprise' },
  invest_analysis_swot_sub: {
    en: 'The qualitative quadrant beside each thesis — the “why”, in plain terms.',
    fr: 'Le quadrant qualitatif près de chaque thèse — le « pourquoi » en termes simples.',
  },
  invest_swot_pick: { en: 'Pick a company', fr: 'Choisir une entreprise' },
  invest_swot_strengths: { en: 'Strengths', fr: 'Forces' },
  invest_swot_weaknesses: { en: 'Weaknesses', fr: 'Faiblesses' },
  invest_swot_opportunities: { en: 'Opportunities', fr: 'Occasions' },
  invest_swot_threats: { en: 'Threats', fr: 'Menaces' },
  invest_swot_empty: { en: 'Nothing noted yet.', fr: 'Rien de noté.' },
  invest_swot_add: { en: 'Add a point', fr: 'Ajouter un point' },
  invest_swot_add_ph: { en: 'One short point…', fr: 'Un point bref…' },
  invest_swot_save: { en: 'Save SWOT', fr: 'Enregistrer' },
  invest_swot_saved: { en: 'SWOT saved.', fr: 'FFOM enregistrée.' },
  invest_swot_failed: { en: 'Couldn’t save — {error}', fr: 'Enregistrement impossible — {error}' },
  invest_swot_tally: { en: 'Let Tally draft it', fr: 'Demander à Tally' },
  invest_swot_tally_busy: { en: 'Drafting…', fr: 'Rédaction…' },
  invest_swot_tally_failed: { en: 'Tally couldn’t draft that — try again.', fr: 'Tally n’a pas pu la rédiger — réessayez.' },
  invest_swot_tally_note: {
    en: 'Tally’s draft — edit any point before saving.',
    fr: 'Proposition de Tally — modifiez avant d’enregistrer.',
  },
  invest_swot_no_thesis: {
    en: 'Track a thesis for {symbol} first — the SWOT lives beside it.',
    fr: 'Suivez d’abord une thèse pour {symbol} — la FFOM vit à côté.',
  },
  invest_swot_go_thesis: { en: 'Open theses', fr: 'Ouvrir les thèses' },
  invest_swot_suggest_apply: { en: 'Apply', fr: 'Appliquer' },
  /* Accept on a stress_scenario row — writes the named scenario to the
     saved list. [FR self-authored] */
  invest_stress_suggest_save: { en: 'Save it', fr: 'L’enregistrer' },
  invest_signal_kind_goal: { en: 'Goal', fr: 'Objectif' },
  invest_signal_kind_scan: { en: 'Watch', fr: 'Veille' },
  invest_seo_title_analysis: { en: 'Analysis — Dutiva Invest', fr: 'Analyse — Dutiva Invest' },
  invest_seo_desc_analysis: {
    en: 'SMART goals Tally re-measures, a watch board for outside factors, and a SWOT per holding.',
    fr: 'Objectifs SMART remesurés par Tally, veille des facteurs externes et FFOM par position.',
  },

  /* Profile — the "what Tally knows about you" surface (0222). */
  invest_tab_profile: { en: 'Profile', fr: 'Profil' },
  invest_prof_title: { en: 'Your profile', fr: 'Votre profil' },
  invest_prof_sub: {
    en: 'What you’ve told Tally, what she remembers, and what she’s noticed — all yours to edit.',
    fr: 'Ce que vous avez dit à Tally, ce qu’elle retient et ce qu’elle a remarqué — tout est modifiable.',
  },
  invest_prof_declared: { en: 'How Tally reads you', fr: 'Comment Tally vous lit' },
  invest_prof_declared_sub: {
    en: 'The profile from Settings shapes every draft and answer — depth, what she weighs, what she never names.',
    fr: 'Le profil des Réglages oriente chaque brouillon et réponse — profondeur, ce qu’elle pèse, ce qu’elle ne nomme jamais.',
  },
  invest_prof_unset: { en: 'Not set', fr: 'Non défini' },
  invest_prof_edit_settings: { en: 'Edit in Settings', fr: 'Modifier dans Réglages' },
  invest_prof_mandate: { en: 'Your mandate', fr: 'Votre mandat' },
  invest_prof_mandate_sub: {
    en: 'Your philosophy in your own words — Tally weighs it more than any dropdown when she drafts.',
    fr: 'Votre philosophie dans vos mots — Tally l’accorde plus de poids que tout menu déroulant.',
  },
  invest_prof_mandate_ph: {
    en: 'e.g. Long-term compounding; I trim winners past 40% and never sell inside a year.',
    fr: 'p. ex. Capitalisation à long terme ; je taille les gagnants après 40 % et ne vends jamais avant un an.',
  },
  invest_prof_mandate_saved: { en: 'Mandate saved.', fr: 'Mandat enregistré.' },
  invest_prof_mandate_failed: { en: 'Couldn’t save — {error}', fr: 'Enregistrement impossible — {error}' },

  invest_prof_memories: { en: 'What Tally remembers', fr: 'Ce que Tally retient' },
  invest_prof_memories_sub: {
    en: 'Confirmed facts from your chats — they shape her answers and drafts. Nothing is remembered without your say.',
    fr: 'Faits confirmés de vos échanges — ils orientent ses réponses et brouillons. Rien n’est retenu sans votre accord.',
  },
  invest_mem_kind_preference: { en: 'Preference', fr: 'Préférence' },
  invest_mem_kind_plan: { en: 'Plan', fr: 'Projet' },
  invest_mem_kind_fact: { en: 'Fact', fr: 'Fait' },
  invest_mem_kind_philosophy: { en: 'Philosophy', fr: 'Philosophie' },
  invest_mem_source_tally: { en: 'From chat', fr: 'Du clavardage' },
  invest_mem_source_manual: { en: 'Added by you', fr: 'Ajouté par vous' },
  invest_mem_empty: {
    en: 'No memories yet — add one yourself, or let Tally review your chats for what’s worth keeping.',
    fr: 'Aucun souvenir — ajoutez-en un, ou laissez Tally réviser vos échanges pour ce qui mérite d’être retenu.',
  },
  invest_mem_add: { en: 'Add a memory', fr: 'Ajouter un souvenir' },
  invest_mem_add_ph: {
    en: 'Something Tally should keep in mind — e.g. “I bought ARM for the edge-AI moat.”',
    fr: 'Ce que Tally devrait retenir — p. ex. « J’ai acheté ARM pour le fossé IA en périphérie. »',
  },
  invest_mem_symbol_ph: { en: 'Symbol (optional)', fr: 'Symbole (facultatif)' },
  invest_mem_save: { en: 'Remember it', fr: 'Retenir' },
  invest_mem_saved: { en: 'Remembered.', fr: 'Retenu.' },
  invest_mem_exists: { en: 'Already on file.', fr: 'Déjà retenu.' },
  invest_mem_failed: { en: 'Couldn’t save — {error}', fr: 'Enregistrement impossible — {error}' },
  invest_mem_review: { en: 'Ask Tally to review', fr: 'Demander à Tally de réviser' },
  invest_mem_review_busy: { en: 'Reviewing…', fr: 'Révision…' },
  invest_mem_review_filed: {
    en: '{n} to review below — accept the ones worth keeping.',
    fr: '{n} à réviser ci-dessous — gardez ceux qui valent la peine.',
  },
  invest_mem_review_none: {
    en: 'Nothing durable to file yet — keep talking with Tally.',
    fr: 'Rien de durable à retenir pour l’instant — continuez d’échanger avec Tally.',
  },
  invest_mem_review_failed: { en: 'Tally couldn’t review right now — try again.', fr: 'Tally n’a pas pu réviser — réessayez.' },
  invest_mem_suggest_label: { en: 'Tally noticed', fr: 'Tally a remarqué' },
  invest_mem_suggest_accept: { en: 'Remember it', fr: 'Retenir' },

  invest_prof_observed: { en: 'What Tally notices', fr: 'Ce que Tally remarque' },
  invest_prof_observed_sub: {
    en: 'How you answer her suggestions shapes what she files next — this is what she’s learned so far.',
    fr: 'Vos réponses à ses suggestions orientent les prochaines — voici ce qu’elle a appris jusqu’ici.',
  },
  invest_obs_empty: {
    en: 'Nothing noticed yet — Tally learns from what you accept and dismiss.',
    fr: 'Rien de remarqué — Tally apprend de ce que vous acceptez et écartez.',
  },
  invest_obs_accept_rate: {
    en: 'You act on {rate} of Tally’s suggestions ({accepted} of {total}).',
    fr: 'Vous donnez suite à {rate} des suggestions de Tally ({accepted} sur {total}).',
  },
  invest_obs_kind_dismiss: {
    en: 'You dismiss most {kind} suggestions — Tally has cooled that kind down.',
    fr: 'Vous écartez la plupart des suggestions {kind} — Tally en dépose moins.',
  },
  invest_sugg_kind_strategy: { en: 'strategy', fr: 'stratégie' },
  invest_sugg_kind_rule_add: { en: 'rule', fr: 'règle' },
  invest_sugg_kind_rule_tune: { en: 'tuning', fr: 'ajustement' },
  invest_sugg_kind_scope_add: { en: 'scope', fr: 'portée' },
  invest_sugg_kind_thesis: { en: 'thesis', fr: 'thèse' },
  invest_sugg_kind_goal: { en: 'goal', fr: 'objectif' },
  invest_sugg_kind_scan: { en: 'watch', fr: 'veille' },
  invest_sugg_kind_swot: { en: 'SWOT', fr: 'FFOM' },
  invest_sugg_kind_memory: { en: 'memory', fr: 'souvenir' },
  invest_sugg_kind_profile: { en: 'profile', fr: 'profil' },
  invest_obs_signals_dismissed_one: {
    en: '{n} signal dismissed in the last ~2 months — loud rules earn tune-up suggestions.',
    fr: '{n} signal écarté en ~2 mois — les règles bruyantes méritent un ajustement.',
  },
  invest_obs_signals_dismissed_many: {
    en: '{n} signals dismissed in the last ~2 months — loud rules earn tune-up suggestions.',
    fr: '{n} signaux écartés en ~2 mois — les règles bruyantes méritent un ajustement.',
  },
  invest_obs_memories_one: {
    en: 'Tally remembers {n} fact about you.',
    fr: 'Tally retient {n} fait à votre sujet.',
  },
  invest_obs_memories_many: {
    en: 'Tally remembers {n} facts about you.',
    fr: 'Tally retient {n} faits à votre sujet.',
  },
  invest_prof_open: { en: 'Open profile', fr: 'Ouvrir le profil' },

  invest_seo_title_profile: { en: 'Profile — Dutiva Invest', fr: 'Profil — Dutiva Invest' },
  invest_seo_desc_profile: {
    en: 'What you told Tally, what she remembers, and what she’s noticed — the whole “knows you” layer.',
    fr: 'Ce que vous avez dit à Tally, ce qu’elle retient et ce qu’elle a remarqué — tout ce qu’elle sait de vous.',
  },
})
