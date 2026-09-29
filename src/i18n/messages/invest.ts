import { defineMessages } from '../core'

/**
 * Invest portal chrome — the standalone, invite-only multi-asset
 * analysis, signals, paper-trading and order surface under `/invest`.
 * Access is granted per user via the `invest_access` table; the surface
 * is informational and educational only — it never presents itself as
 * advice.
 *
 * [FR self-authored — not from a design handoff; reviewed against the blueprint.]
 */
export const investMessages = defineMessages({
  invest_title: { en: 'Invest', fr: 'Investir' },
  invest_subtitle: {
    en: 'Portfolio analysis, signals, and order tracking across asset classes.',
    fr: 'Analyse de portefeuille, signaux et suivi d’ordres, toutes classes d’actifs confondues.',
  },
  invest_info_note: {
    en: 'Informational and educational only — not investment advice. Execution decisions remain yours.',
    fr: 'Informatif et éducatif seulement — pas un conseil en placement. Les décisions d’exécution vous appartiennent.',
  },

  /* Tabs */
  invest_tab_overview: { en: 'Overview', fr: 'Aperçu' },
  invest_tab_portfolios: { en: 'Portfolios', fr: 'Portefeuilles' },
  invest_tab_orders: { en: 'Orders', fr: 'Ordres' },
  invest_tab_signals: { en: 'Signals', fr: 'Signaux' },
  invest_tab_strategies: { en: 'Bot', fr: 'Robot' },

  /* Asset classes */
  invest_asset_equity: { en: 'Equity', fr: 'Action' },
  invest_asset_etf: { en: 'ETF', fr: 'FNB' },
  invest_asset_crypto: { en: 'Crypto', fr: 'Crypto' },
  invest_asset_bond: { en: 'Bond', fr: 'Obligation' },
  invest_asset_cash: { en: 'Cash', fr: 'Encaisse' },
  invest_asset_other: { en: 'Other', fr: 'Autre' },

  /* Overview */
  invest_ov_total_value: { en: 'Portfolio value', fr: 'Valeur du portefeuille' },
  invest_ov_cash: { en: 'Cash', fr: 'Encaisse' },
  invest_ov_open_signals: { en: 'Open signals', fr: 'Signaux ouverts' },
  invest_ov_last_run: { en: 'Last bot run', fr: 'Dernière exécution du robot' },
  invest_ov_allocation: { en: 'Allocation by asset class', fr: 'Répartition par classe d’actifs' },
  invest_ov_recent_signals: { en: 'Latest signals', fr: 'Derniers signaux' },
  invest_ov_never_run: { en: 'Not run yet', fr: 'Jamais exécuté' },

  /* Portfolios */
  invest_accounts_title: { en: 'Accounts', fr: 'Comptes' },
  invest_positions_title: { en: 'Positions', fr: 'Positions' },
  invest_add_account: { en: 'Add account', fr: 'Ajouter un compte' },
  invest_add_position: { en: 'Add position', fr: 'Ajouter une position' },
  invest_account_name: { en: 'Account name', fr: 'Nom du compte' },
  invest_account_kind: { en: 'Account type', fr: 'Type de compte' },
  invest_kind_paper: { en: 'Paper', fr: 'Simulé' },
  invest_kind_live: { en: 'Live', fr: 'Réel' },
  invest_kind_external: { en: 'External', fr: 'Externe' },
  invest_field_symbol: { en: 'Symbol', fr: 'Symbole' },
  invest_field_name: { en: 'Name', fr: 'Nom' },
  invest_field_quantity: { en: 'Quantity', fr: 'Quantité' },
  invest_field_avg_cost: { en: 'Average cost', fr: 'Coût moyen' },
  invest_field_last_price: { en: 'Last price', fr: 'Dernier cours' },
  invest_field_value: { en: 'Value', fr: 'Valeur' },
  invest_field_asset_class: { en: 'Asset class', fr: 'Classe d’actifs' },
  invest_field_currency: { en: 'Currency', fr: 'Devise' },
  invest_positions_empty: {
    en: 'No positions yet — add one to start tracking.',
    fr: 'Aucune position — ajoutez-en une pour commencer le suivi.',
  },
  invest_accounts_empty: {
    en: 'No accounts yet — a paper account is created for you.',
    fr: 'Aucun compte — un compte simulé sera créé pour vous.',
  },

  /* Orders */
  invest_orders_title: { en: 'Order log', fr: 'Journal des ordres' },
  invest_new_order: { en: 'Record an order', fr: 'Enregistrer un ordre' },
  invest_order_side: { en: 'Side', fr: 'Sens' },
  invest_order_buy: { en: 'Buy', fr: 'Achat' },
  invest_order_sell: { en: 'Sell', fr: 'Vente' },
  invest_order_type: { en: 'Order type', fr: 'Type d’ordre' },
  invest_order_market: { en: 'Market', fr: 'Au marché' },
  invest_order_limit: { en: 'Limit', fr: 'À cours limité' },
  invest_order_limit_price: { en: 'Limit price', fr: 'Cours limite' },
  invest_order_fill_price: { en: 'Fill price', fr: 'Cours d’exécution' },
  invest_order_status: { en: 'Status', fr: 'Statut' },
  invest_order_executed_at: { en: 'Executed', fr: 'Exécuté le' },
  invest_order_note: { en: 'Note', fr: 'Note' },
  invest_mark_executed: { en: 'Mark executed', fr: 'Marquer exécuté' },
  invest_cancel_order: { en: 'Cancel', fr: 'Annuler' },
  invest_orders_empty: {
    en: 'No orders yet — paper executions and suggested orders land here.',
    fr: 'Aucun ordre — les exécutions simulées et les ordres suggérés apparaîtront ici.',
  },
  invest_status_draft: { en: 'Draft', fr: 'Brouillon' },
  invest_status_queued: { en: 'Queued', fr: 'En file' },
  invest_status_executed: { en: 'Executed', fr: 'Exécuté' },
  invest_status_cancelled: { en: 'Cancelled', fr: 'Annulé' },
  invest_status_failed: { en: 'Failed', fr: 'Échoué' },
  invest_mode_paper: { en: 'Paper', fr: 'Simulé' },
  invest_mode_live: { en: 'Live', fr: 'Réel' },
  invest_live_note: {
    en: 'Live orders are recorded for review — execution through a broker connection is confirmed manually.',
    fr: 'Les ordres réels sont consignés pour révision — l’exécution via une connexion de courtage est confirmée manuellement.',
  },

  /* Signals */
  invest_signals_title: { en: 'Signals', fr: 'Signaux' },
  invest_signal_kind_screen: { en: 'Screen', fr: 'Filtrage' },
  invest_signal_kind_insight: { en: 'Insight', fr: 'Analyse' },
  invest_signal_kind_alert: { en: 'Alert', fr: 'Alerte' },
  invest_signal_kind_thesis: { en: 'Thesis', fr: 'Thèse' },
  invest_signal_new: { en: 'New', fr: 'Nouveau' },
  invest_signal_acknowledged: { en: 'Acknowledged', fr: 'Pris en compte' },
  invest_signal_dismissed: { en: 'Dismissed', fr: 'Écarté' },
  invest_acknowledge: { en: 'Acknowledge', fr: 'Accuser réception' },
  invest_dismiss: { en: 'Dismiss', fr: 'Écarter' },
  invest_signals_empty: {
    en: 'No signals yet — enable a strategy and run the bot.',
    fr: 'Aucun signal — activez une stratégie et lancez le robot.',
  },
  invest_score: { en: 'Score', fr: 'Score' },

  /* Strategies / bot */
  invest_strategies_title: { en: 'Bot strategies', fr: 'Stratégies du robot' },
  invest_add_strategy: { en: 'New strategy', fr: 'Nouvelle stratégie' },
  invest_strategy_name: { en: 'Strategy name', fr: 'Nom de la stratégie' },
  invest_strategy_rules: { en: 'Rules', fr: 'Règles' },
  invest_rule_when_matches: { en: 'When this rule matches', fr: 'Quand cette règle correspond' },
  invest_rule_notify: { en: 'Notify me', fr: 'M’avertir' },
  invest_rule_propose: { en: 'Propose an order', fr: 'Proposer un ordre' },
  invest_proposal_guarantee: {
    en: 'Order proposals always require your approval. The bot never trades on its own.',
    fr: 'Les propositions d’ordre exigent toujours votre approbation. Le robot ne transige jamais seul.',
  },
  invest_rule_severity: { en: 'Severity', fr: 'Importance' },
  invest_strategy_enabled: { en: 'Enabled', fr: 'Activée' },
  invest_strategy_disabled: { en: 'Disabled', fr: 'Désactivée' },
  invest_strategy_enable: { en: 'Enable', fr: 'Activer' },
  invest_strategy_disable: { en: 'Disable', fr: 'Désactiver' },
  invest_edit: { en: 'Edit', fr: 'Modifier' },
  invest_enabled_hint: {
    en: 'Enabled — the bot evaluates this strategy on its schedule',
    fr: 'Activée — le robot évalue cette stratégie selon son calendrier',
  },
  invest_rule_metric: { en: 'Metric', fr: 'Mesure' },
  invest_rule_metric_day_change: { en: 'Day change %', fr: 'Variation quotidienne %' },
  invest_rule_metric_vs_ma50: { en: 'Price vs 50-day avg %', fr: 'Cours vs moyenne 50 j %' },
  invest_rule_metric_value_floor: { en: 'Position value below', fr: 'Valeur de position sous' },
  invest_rule_metric_weight: { en: 'Book weight %', fr: 'Poids dans le portefeuille %' },
  invest_rule_metric_gain: { en: 'Gain vs cost %', fr: 'Gain vs coût %' },
  invest_rule_metric_cash: { en: 'Cash balance', fr: 'Solde de l’encaisse' },
  invest_cadence_label: { en: 'Runs', fr: 'Fréquence' },
  invest_cadence_daily: { en: 'Daily', fr: 'Quotidienne' },
  invest_cadence_weekly: { en: 'Weekly', fr: 'Hebdomadaire' },
  invest_cadence_monthly: { en: 'Monthly', fr: 'Mensuelle' },
  invest_templates_title: { en: 'Start from a template', fr: 'Partir d’un modèle' },
  invest_templates_sub: {
    en: 'Common setups, pre-filled — adjust the numbers after adding.',
    fr: 'Configurations courantes préremplies — ajustez les seuils après ajout.',
  },
  invest_template_use: { en: 'Use template', fr: 'Utiliser' },
  invest_template_badge: { en: 'Template', fr: 'Modèle' },
  invest_ai_title: { en: 'Describe it instead', fr: 'Décrire plutôt' },
  invest_ai_sub: {
    en: 'Write the goal in plain words; the assistant drafts a reviewable strategy — nothing runs until you save and enable it.',
    fr: 'Décrivez l’objectif en mots simples; l’assistant propose une stratégie à réviser — rien ne s’exécute avant votre enregistrement et activation.',
  },
  invest_ai_placeholder: {
    en: 'e.g. Warn me when a holding passes 25% of the book, and watch TSX ETFs for 8% dips',
    fr: 'p. ex. M’avertir quand une position dépasse 25 % du portefeuille et surveiller les FNB torontois pour des creux de 8 %',
  },
  invest_ai_draft: { en: 'Draft a strategy', fr: 'Rédiger la stratégie' },
  invest_ai_drafting: { en: 'Drafting…', fr: 'Rédaction…' },
  invest_ai_review: {
    en: 'Draft ready — review the rules below before saving.',
    fr: 'Ébauche prête — révisez les règles ci-dessous avant d’enregistrer.',
  },
  invest_sync_prices: { en: 'Refresh prices', fr: 'Actualiser les cours' },
  invest_syncing: { en: 'Refreshing…', fr: 'Actualisation…' },
  invest_sync_done: {
    en: 'Prices refreshed — {count} symbol(s) updated.',
    fr: 'Cours actualisés — {count} symbole(s) mis à jour.',
  },
  invest_sync_partial: {
    en: 'Some symbols could not be priced: {symbols}',
    fr: 'Certains symboles n’ont pas pu être évalués : {symbols}',
  },
  invest_prices_as_of: { en: 'Prices as of {time}', fr: 'Cours au {time}' },
  invest_watchlist_title: { en: 'Watchlist', fr: 'Surveillance' },
  invest_watchlist_sub: {
    en: 'Symbols you don’t hold yet — priced on every refresh, and your dip rules can fire on them.',
    fr: 'Symboles que vous ne détenez pas — évalués à chaque actualisation, et vos règles de creux peuvent s’y appliquer.',
  },
  invest_watchlist_add: { en: 'Watch', fr: 'Surveiller' },
  invest_watchlist_empty: {
    en: 'Nothing watched yet — add a symbol to track its price and headlines.',
    fr: 'Aucun symbole surveillé — ajoutez-en un pour suivre son cours et ses nouvelles.',
  },
  invest_news_title: { en: 'Market news', fr: 'Actualités du marché' },
  invest_news_empty: {
    en: 'No headlines yet — they arrive with the daily market sync and the Refresh prices button.',
    fr: 'Aucune manchette pour l’instant — elles arrivent avec la synchronisation quotidienne et le bouton Actualiser les cours.',
  },
  invest_rule_operator: { en: 'Condition', fr: 'Condition' },
  invest_rule_lt: { en: 'below', fr: 'sous' },
  invest_rule_gt: { en: 'above', fr: 'au-dessus de' },
  invest_rule_value: { en: 'Threshold', fr: 'Seuil' },
  invest_rule_action: { en: 'Action', fr: 'Action' },
  invest_rule_title: { en: 'Rule label', fr: 'Étiquette de la règle' },
  invest_rule_add: { en: 'Add rule', fr: 'Ajouter une règle' },
  invest_rule_remove: { en: 'Remove', fr: 'Retirer' },
  invest_rule_fired: {
    en: 'Fired {count}× in the last 90 days',
    fr: 'Déclenchée {count}× au cours des 90 derniers jours',
  },
  invest_rule_no_history: { en: 'No history yet', fr: 'Pas encore d’historique' },
  invest_cadence_mismatch: {
    en: 'This metric only sees one day at a time — a {cadence} schedule can miss the move. Daily fits this rule.',
    fr: 'Cette mesure ne voit qu’un jour à la fois — un calendrier {cadence} peut rater le mouvement. Quotidienne convient mieux.',
  },
  invest_scope_title: {
    en: 'Scope — what this strategy scans',
    fr: 'Portée — ce que la stratégie surveille',
  },
  invest_scope_watchlist: { en: 'All tracked symbols', fr: 'Tous les symboles suivis' },
  invest_scope_symbols: { en: 'Specific symbols', fr: 'Symboles précis' },
  invest_scope_add_placeholder: {
    en: 'Add symbol (e.g. SHOP.TO)',
    fr: 'Ajouter un symbole (p. ex. SHOP.TO)',
  },
  invest_scope_required: {
    en: 'Pick what to scan — the watchlist or at least one symbol — before saving.',
    fr: 'Choisissez quoi surveiller — la liste de surveillance ou au moins un symbole — avant d’enregistrer.',
  },
  invest_qty_unit: { en: 'Quantity in', fr: 'Quantité en' },
  invest_unit_shares: { en: 'Shares', fr: 'Actions' },
  invest_unit_pct: { en: '% of position', fr: '% de la position' },
  invest_unit_currency: { en: 'Currency amount', fr: 'Montant en devise' },
  invest_notify_via: { en: 'Notify me via', fr: 'M’avertir par' },
  invest_notify_in_app: { en: 'In-app', fr: 'Dans l’app' },
  invest_notify_email: { en: 'Email', fr: 'Courriel' },
  invest_scan_now: { en: 'Scan now', fr: 'Analyser maintenant' },
  invest_scanning: { en: 'Scanning…', fr: 'Analyse…' },
  invest_scan_caption: {
    en: 'Scanning never places orders',
    fr: 'L’analyse ne passe jamais d’ordres',
  },
  invest_health_title: { en: 'Strategy health', fr: 'Santé de la stratégie' },
  invest_health_frequency: {
    en: 'Fires about {count}× per week',
    fr: 'Se déclenche environ {count}× par semaine',
  },
  invest_health_no_history: {
    en: 'No firing history yet',
    fr: 'Pas encore d’historique de déclenchement',
  },
  invest_health_warnings: { en: 'Warnings', fr: 'Avertissements' },
  invest_test_scan: { en: 'Test scan', fr: 'Analyse d’essai' },
  invest_test_scan_result: {
    en: '{symbols} symbol(s) scanned · {signals} signal(s) · {proposals} proposal(s)',
    fr: '{symbols} symbole(s) analysé(s) · {signals} signal(s) · {proposals} proposition(s)',
  },
  invest_run_scanned: { en: '{count} symbol(s) scanned', fr: '{count} symbole(s) analysé(s)' },
  invest_run_duration: { en: '{seconds}s', fr: '{seconds} s' },
  invest_runs_title: { en: 'Run history', fr: 'Historique d’exécution' },
  invest_run_summary: {
    en: '{signals} signal(s) · {proposals} proposal(s)',
    fr: '{signals} signal(s) · {proposals} proposition(s)',
  },
  invest_template_preview: { en: 'Preview rules', fr: 'Aperçu des règles' },
  invest_proposal_badge: { en: 'Proposes orders', fr: 'Propose des ordres' },
  invest_proposal_book_metric: {
    en: 'An order proposal needs a symbol-level metric — cash rules can only notify.',
    fr: 'Une proposition d’ordre exige une mesure par symbole — les règles d’encaisse ne peuvent qu’avertir.',
  },
  invest_scope_summary_watchlist: { en: 'All tracked symbols', fr: 'Tous les symboles suivis' },
  invest_strategies_empty: {
    en: 'No strategies yet — the bot evaluates enabled strategies each day.',
    fr: 'Aucune stratégie — le robot évalue chaque jour les stratégies activées.',
  },

  /* Portal chrome */
  invest_portal_title: { en: 'Dutiva Invest', fr: 'Dutiva Investir' },
  invest_portal_tagline: {
    en: 'Portfolio tracking, rules-based signals, and simulated execution — for invited accounts.',
    fr: 'Suivi de portefeuille, signaux fondés sur des règles et exécution simulée — pour les comptes invités.',
  },
  invest_access_title: { en: 'Access required', fr: 'Accès requis' },
  invest_access_body: {
    en: 'Dutiva Invest is open to invited accounts only. Contact us to request access for yours.',
    fr: 'Dutiva Investir est réservé aux comptes invités. Contactez-nous pour demander l’accès au vôtre.',
  },
  invest_access_contact: { en: 'Request access', fr: 'Demander l’accès' },
  invest_signin_title: { en: 'Sign in to Dutiva Invest', fr: 'Connexion à Dutiva Investir' },
  invest_signin_body: {
    en: 'We’ll email you a sign-in code. No password needed.',
    fr: 'Nous vous enverrons un code de connexion par courriel. Aucun mot de passe requis.',
  },
  invest_signin_email: { en: 'Email', fr: 'Courriel' },
  invest_signin_send: { en: 'Send code', fr: 'Envoyer le code' },
  invest_signin_code: { en: '6-digit code', fr: 'Code à 6 chiffres' },
  invest_signin_verify: { en: 'Sign in', fr: 'Se connecter' },
  invest_signin_sent: {
    en: 'We sent a 6-digit code to {email}. Enter it below to sign in.',
    fr: 'Nous avons envoyé un code à 6 chiffres à {email}. Saisissez-le ci-dessous pour vous connecter.',
  },
  invest_signin_error: {
    en: 'That didn’t work. Check the code and try again.',
    fr: 'La connexion a échoué. Vérifiez le code et réessayez.',
  },
  invest_sign_out: { en: 'Sign out', fr: 'Se déconnecter' },
  invest_back_home: { en: 'Back to dutiva.ca', fr: 'Retour à dutiva.ca' },

  /* Shared */
  invest_save: { en: 'Save', fr: 'Enregistrer' },
  invest_saved: { en: 'Saved', fr: 'Enregistré' },
  invest_delete: { en: 'Delete', fr: 'Supprimer' },
  invest_delete_confirm: {
    en: 'Delete this record? This cannot be undone.',
    fr: 'Supprimer cet élément ? Cette action est irréversible.',
  },
  invest_form_error: {
    en: 'Check the fields — something is missing or invalid.',
    fr: 'Vérifiez les champs — un élément est manquant ou invalide.',
  },
  invest_error_generic: {
    en: 'Something went wrong. Please try again.',
    fr: 'Une erreur s’est produite. Veuillez réessayer.',
  },
  invest_loading: { en: 'Loading…', fr: 'Chargement…' },
})
