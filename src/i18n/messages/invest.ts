import { defineMessages } from '../core'
import { investStrategyBuilderMessages } from './investStrategyBuilder'

/**
 * Invest portal chrome — the standalone, invite-only multi-asset
 * analysis, signals, paper-trading and order surface under `/invest`.
 * Access is granted per user via the `invest_access` table; the surface
 * is informational and educational only — it never presents itself as
 * advice.
 *
 * [FR self-authored — not from a design handoff; reviewed against the blueprint.]
 */
const investCoreMessages = defineMessages({
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
  invest_tab_strategies: { en: 'Agent', fr: 'Agent' },
  invest_tab_notifications: { en: 'Notifications', fr: 'Notifications' },
  invest_tab_settings: { en: 'Settings', fr: 'Paramètres' },

  /* Per-route document head (auth-gated → noindex; titles are what the
     browser tab and shared links actually show). */
  invest_seo_title_overview: {
    en: 'Dutiva Invest — Portfolio tracking and strategy agent',
    fr: 'Dutiva Invest — Suivi de portefeuille et agent de stratégies',
  },
  invest_seo_desc_overview: {
    en: 'Track manual positions and watchlist prices; scans surface signals and order drafts you review yourself.',
    fr: 'Suivez positions saisies à la main et cours de la liste de suivi ; les analyses signalent des signaux et des ébauches d’ordres que vous révisez.',
  },
  invest_seo_title_portfolio: {
    en: 'Dutiva Invest — Portfolios',
    fr: 'Dutiva Invest — Portefeuilles',
  },
  invest_seo_desc_portfolio: {
    en: 'Manual portfolio records — accounts, positions, and watchlist prices you enter and update yourself.',
    fr: 'Relevés saisis à la main — comptes, positions et cours de la liste de suivi que vous entrez et mettez à jour.',
  },
  invest_seo_title_orders: { en: 'Dutiva Invest — Orders', fr: 'Dutiva Invest — Ordres' },
  invest_seo_desc_orders: {
    en: 'Agent-proposed order drafts and manual order intents — nothing executes without your approval.',
    fr: 'Ébauches d’ordres proposées par l’agent et intentions saisies à la main — rien ne s’exécute sans votre approbation.',
  },
  invest_seo_title_signals: { en: 'Dutiva Invest — Signals', fr: 'Dutiva Invest — Signaux' },
  invest_seo_desc_signals: {
    en: 'Signal history from your enabled strategies — informational only.',
    fr: 'Historique des signaux de vos stratégies activées — à titre informatif seulement.',
  },
  invest_seo_title_strategies: {
    en: 'Dutiva Invest — Strategy agent',
    fr: 'Dutiva Invest — Agent de stratégies',
  },
  invest_seo_desc_strategies: {
    en: 'Describe or pick a strategy; scans create signals and draft proposals only — never placed orders.',
    fr: 'Décrivez ou choisissez une stratégie ; les analyses créent seulement signaux et ébauches — jamais d’ordres placés.',
  },
  invest_seo_title_notifications: {
    en: 'Dutiva Invest — Notifications',
    fr: 'Dutiva Invest — Notifications',
  },
  invest_seo_desc_notifications: {
    en: 'Signals and proposals that need your attention, plus where each strategy delivers them.',
    fr: 'Signaux et propositions qui attendent votre attention, et où chaque stratégie les envoie.',
  },
  invest_seo_title_settings: {
    en: 'Dutiva Invest — Settings',
    fr: 'Dutiva Invest — Paramètres',
  },
  invest_seo_desc_settings: {
    en: 'Language, notification delivery, and your sign-in session.',
    fr: 'Langue, canaux de notification et votre session de connexion.',
  },
  invest_seo_title_terms: {
    en: 'Dutiva Invest — Terms of Service',
    fr: 'Dutiva Invest — Conditions d’utilisation',
  },
  invest_seo_desc_terms: {
    en: 'The terms that govern your use of Dutiva Invest.',
    fr: 'Les conditions qui encadrent votre utilisation de Dutiva Invest.',
  },
  invest_seo_title_privacy: {
    en: 'Dutiva Invest — Privacy Policy',
    fr: 'Dutiva Invest — Politique de confidentialité',
  },
  invest_seo_desc_privacy: {
    en: 'How Dutiva collects, uses, and protects personal information.',
    fr: 'Comment Dutiva collecte, utilise et protège les renseignements personnels.',
  },
  invest_seo_title_risk: {
    en: 'Dutiva Invest — Risk disclosure',
    fr: 'Dutiva Invest — Avertissement sur les risques',
  },
  invest_seo_desc_risk: {
    en: 'Invest is informational and educational only — not investment advice. Nothing executes automatically.',
    fr: 'Invest est informatif et éducatif seulement — pas un conseil en placement. Rien ne s’exécute automatiquement.',
  },
  invest_seo_title_support: {
    en: 'Dutiva Invest — Support',
    fr: 'Dutiva Invest — Assistance',
  },
  invest_seo_desc_support: {
    en: 'How to reach Dutiva support and what to expect.',
    fr: 'Comment joindre l’assistance Dutiva et à quoi vous attendre.',
  },

  /* Footer + legal pages */
  invest_footer_nav: { en: 'Legal', fr: 'Mentions légales' },
  invest_footer_terms: { en: 'Terms of Service', fr: 'Conditions d’utilisation' },
  invest_footer_privacy: { en: 'Privacy Policy', fr: 'Politique de confidentialité' },
  invest_footer_risk: { en: 'Risk disclosure', fr: 'Avertissement sur les risques' },
  invest_footer_support: { en: 'Support', fr: 'Assistance' },
  invest_legal_back: { en: 'Back to Invest', fr: 'Retour à Invest' },
  invest_legal_updated: { en: 'Last updated:', fr: 'Dernière mise à jour :' },
  invest_legal_effective: { en: 'Effective:', fr: 'Entrée en vigueur :' },
  invest_legal_contact: { en: 'Contact support', fr: 'Joindre l’assistance' },
  invest_legal_hours: { en: 'Staffed', fr: 'Présence' },

  /* Notifications */
  invest_notif_title: { en: 'Notifications', fr: 'Notifications' },
  invest_notif_attention: { en: 'Needs your attention', fr: 'À traiter' },
  invest_notif_empty: {
    en: 'Nothing waiting — new signals and draft proposals land here.',
    fr: 'Rien en attente — les nouveaux signaux et ébauches arrivent ici.',
  },
  invest_notif_drafts: {
    en: '{n} draft proposal(s) waiting in Orders',
    fr: '{n} ébauche(s) d’ordre en attente dans Ordres',
  },
  invest_notif_review_orders: { en: 'Review in Orders', fr: 'Voir dans Ordres' },
  invest_delivery_title: { en: 'Delivery per strategy', fr: 'Envoi par stratégie' },
  invest_delivery_note: {
    en: 'Where each strategy sends what it finds. Change destinations on the Agent tab.',
    fr: 'Où chaque stratégie envoie ses trouvailles. Les canaux se règlent dans l’onglet Agent.',
  },
  invest_delivery_empty: {
    en: 'No strategies yet — delivery options appear once you create one.',
    fr: 'Aucune stratégie — les canaux s’affichent dès que vous en créez une.',
  },
  invest_delivery_inapp: { en: 'In-app', fr: 'Dans l’app' },
  invest_delivery_email: { en: 'Email', fr: 'Courriel' },
  invest_delivery_off: { en: 'Off', fr: 'Désactivées' },
  invest_delivery_edit: { en: 'Edit', fr: 'Modifier' },

  /* Settings */
  invest_settings_language: { en: 'Language', fr: 'Langue' },
  invest_settings_tour: { en: 'Getting-started tour', fr: 'Visite de départ' },
  invest_settings_tour_note: {
    en: 'The four-step tour shows on the Overview until dismissed — replay it any time.',
    fr: 'La visite en quatre étapes s’affiche dans l’Aperçu jusqu’à ce que vous la fermiez — rejouez-la quand vous voulez.',
  },
  invest_settings_tour_open: { en: 'Replay the tour', fr: 'Revoir la visite' },
  invest_settings_account: { en: 'Account', fr: 'Compte' },
  invest_settings_email: { en: 'Signed in as', fr: 'Connecté en tant que' },
  invest_settings_method: { en: 'Sign-in method', fr: 'Mode de connexion' },
  invest_settings_method_value: {
    en: 'Passwordless email code',
    fr: 'Code par courriel sans mot de passe',
  },
  invest_settings_signout_all: { en: 'Sign out everywhere', fr: 'Se déconnecter partout' },

  /* First-run tour */
  invest_tour_title: { en: 'Get set up in four steps', fr: 'Prêt en quatre étapes' },
  invest_tour_step1_title: {
    en: 'What Invest does — and doesn’t',
    fr: 'Ce qu’Invest fait — et ne fait pas',
  },
  invest_tour_step1_body: {
    en: 'Invest tracks positions you enter yourself and scans them for signals and order drafts. It never places orders — every proposal waits for your review.',
    fr: 'Invest suit les positions que vous saisissez et les analyse pour produire signaux et ébauches d’ordres. Il ne place jamais d’ordre — chaque proposition attend votre revue.',
  },
  invest_tour_step2_title: { en: 'Your paper account', fr: 'Votre compte simulé' },
  invest_tour_step2_body: {
    en: 'A simulated account was opened for you. Add cash or a position under Portfolios to start tracking.',
    fr: 'Un compte simulé a été ouvert pour vous. Ajoutez de l’encaisse ou une position dans Portefeuilles pour commencer le suivi.',
  },
  invest_tour_step3_title: { en: 'Watch a symbol', fr: 'Suivre un symbole' },
  invest_tour_step3_body: {
    en: 'Add a ticker to the watchlist on Portfolios — prices update on demand or on the daily sync.',
    fr: 'Ajoutez un symbole à la liste de suivi dans Portefeuilles — les cours se mettent à jour sur demande ou à la synchro quotidienne.',
  },
  invest_tour_step4_title: { en: 'Turn on a strategy', fr: 'Activer une stratégie' },
  invest_tour_step4_body: {
    en: 'Pick a template on the Agent tab and run a scan. Scans create signals and draft proposals only — never orders.',
    fr: 'Choisissez un modèle dans l’onglet Agent et lancez une analyse. Les analyses créent seulement signaux et ébauches — jamais d’ordres.',
  },
  invest_tour_dismiss: { en: 'Dismiss', fr: 'Fermer' },
  invest_tour_cta_portfolio: { en: 'Open Portfolios', fr: 'Ouvrir Portefeuilles' },
  invest_tour_cta_strategies: { en: 'Open the Agent tab', fr: 'Ouvrir l’onglet Agent' },

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
  invest_ov_last_run: { en: 'Last agent run', fr: 'Dernière exécution de l’agent' },
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
  invest_kind_help_paper: {
    en: 'Simulated — test the workflow without real money.',
    fr: 'Simulé — testez le fonctionnement sans argent réel.',
  },
  invest_kind_help_live: {
    en: 'No broker connection — order intents are recorded for review and you confirm each fill manually.',
    fr: 'Aucune connexion de courtier — les ordres sont enregistrés pour revue et vous confirmez chaque exécution à la main.',
  },
  invest_kind_help_external: {
    en: 'A manual mirror of an account you hold elsewhere — nothing syncs.',
    fr: 'Copie manuelle d’un compte détenu ailleurs — rien ne se synchronise.',
  },
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
  invest_positions_manual: {
    en: 'Positions you enter by hand — they’re not synced from any broker or account.',
    fr: 'Positions saisies à la main — elles ne sont synchronisées avec aucun courtier ni compte.',
  },
  invest_positions_need_account: {
    en: 'Create an account above first — positions record into one.',
    fr: 'Créez d’abord un compte ci-dessus — les positions s’y enregistrent.',
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
  invest_status_expired: { en: 'Expired', fr: 'Expiré' },
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
    en: 'No signals yet — enable a strategy and run the agent.',
    fr: 'Aucun signal — activez une stratégie et lancez l’agent.',
  },
  invest_score: { en: 'Score', fr: 'Score' },

  /* Strategies / agent */
  invest_strategies_title: { en: 'Agent strategies', fr: 'Stratégies de l’agent' },
  invest_add_strategy: { en: 'New strategy', fr: 'Nouvelle stratégie' },
  invest_create_sub: {
    en: 'Describe it in words, pick a template, or start blank.',
    fr: 'Décrivez-la en mots, choisissez un modèle ou partez de zéro.',
  },
  invest_create_blank: { en: 'Start blank', fr: 'Partir de zéro' },
  invest_strategy_name: { en: 'Strategy name', fr: 'Nom de la stratégie' },
  invest_strategy_rules: { en: 'Rules', fr: 'Règles' },
  invest_rule_when_matches: { en: 'When this rule matches', fr: 'Quand cette règle correspond' },
  invest_rule_notify: { en: 'Notify me', fr: 'M’avertir' },
  invest_rule_propose: { en: 'Propose an order', fr: 'Proposer un ordre' },
  invest_proposal_guarantee: {
    en: 'Order proposals always require your approval. The agent never trades on its own.',
    fr: 'Les propositions d’ordre exigent toujours votre approbation. L’agent ne transige jamais seul.',
  },
  invest_rule_severity: { en: 'Severity', fr: 'Importance' },
  invest_strategy_enabled: { en: 'Enabled', fr: 'Activée' },
  invest_strategy_disabled: { en: 'Disabled', fr: 'Désactivée' },
  invest_strategy_enable: { en: 'Enable', fr: 'Activer' },
  invest_strategy_disable: { en: 'Disable', fr: 'Désactiver' },
  invest_edit: { en: 'Edit', fr: 'Modifier' },
  invest_enabled_hint: {
    en: 'Enabled — the agent evaluates this strategy on its schedule',
    fr: 'Activée — l’agent évalue cette stratégie selon son calendrier',
  },
  invest_rule_metric: { en: 'Metric', fr: 'Mesure' },
  invest_rule_metric_day_change: { en: 'Day change', fr: 'Variation du jour' },
  invest_rule_metric_vs_ma50: {
    en: 'Price vs 50-day average',
    fr: 'Prix vs moyenne mobile 50 j',
  },
  invest_rule_metric_value_floor: { en: 'Position value', fr: 'Valeur de position' },
  invest_rule_metric_weight: {
    en: 'Portfolio weight',
    fr: 'Poids dans le portefeuille',
  },
  invest_rule_metric_gain: { en: 'Gain vs cost', fr: 'Gain vs coût' },
  invest_rule_metric_cash: { en: 'Cash balance', fr: 'Solde en espèces' },
  invest_cadence_label: { en: 'Scan cadence', fr: 'Fréquence d’analyse' },
  invest_cadence_daily: { en: 'Daily', fr: 'Quotidienne' },
  invest_cadence_weekly: { en: 'Weekly', fr: 'Hebdomadaire' },
  invest_cadence_monthly: { en: 'Monthly', fr: 'Mensuelle' },
  invest_templates_title: { en: 'Start from a template', fr: 'Partir d’un modèle' },
  invest_templates_sub: {
    en: 'Common setups, pre-filled — adjust the numbers after adding.',
    fr: 'Configurations courantes préremplies — ajustez les seuils après ajout.',
  },
  invest_template_use: { en: 'Use template', fr: 'Utiliser' },
  invest_template_busy: {
    en: 'A save or scan is in progress — available when it finishes.',
    fr: 'Enregistrement ou analyse en cours — disponible à la fin.',
  },
  invest_template_badge: { en: 'Template', fr: 'Modèle' },
  invest_ai_title: { en: 'Describe it instead', fr: 'Décrire plutôt' },
  invest_ai_sub: {
    en: 'Write the goal in plain words; Tally drafts a reviewable strategy — nothing runs until you save and enable it.',
    fr: 'Décrivez l’objectif en mots simples ; Tally propose une stratégie à réviser — rien ne s’exécute avant votre enregistrement et activation.',
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
  invest_news_title: {
    en: 'Market headlines (third-party)',
    fr: 'Manchettes du marché (tiers)',
  },
  invest_news_note: {
    en: 'Headlines come from third-party publishers — context, not recommendations.',
    fr: 'Les manchettes proviennent de publications externes — un contexte, pas des recommandations.',
  },
  invest_news_external: {
    en: 'Opens in a new tab — external site',
    fr: 'S’ouvre dans un nouvel onglet — site externe',
  },
  invest_news_empty: {
    en: 'No headlines yet — they arrive with the daily market sync and the Refresh prices button.',
    fr: 'Aucune manchette pour l’instant — elles arrivent avec la synchronisation quotidienne et le bouton Actualiser les cours.',
  },
  /* [FR self-authored] */
  invest_news_more: {
    en: 'Show all {count} headlines',
    fr: 'Afficher les {count} manchettes',
  },
  /* [FR self-authored] */
  invest_news_less: {
    en: 'Show fewer',
    fr: 'Réduire la liste',
  },
  /* [FR self-authored] */
  invest_news_count: {
    en: '{count} headlines',
    fr: '{count} manchettes',
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
  invest_notify_email_note: {
    en: 'You’ll get one email per scan that finds something.',
    fr: 'Vous recevez un courriel à chaque analyse qui détecte quelque chose.',
  },
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
  invest_health_no_price: {
    en: '{symbols}: no price data yet — prices sync daily.',
    fr: '{symbols} : aucun cours — synchronisation quotidienne.',
  },
  invest_health_stale_price: {
    en: '{symbols}: price is over 48 h old — check Refresh prices.',
    fr: '{symbols} : cours vieux de plus de 48 h — essayez Actualiser les cours.',
  },
  invest_test_scan: { en: 'Test scan', fr: 'Analyse d’essai' },
  invest_test_scan_result: {
    en: '{symbols} symbol(s) scanned · {signals} signal(s) · {proposals} proposal(s)',
    fr: '{symbols} symbole(s) analysé(s) · {signals} signal(s) · {proposals} proposition(s)',
  },
  invest_run_deleted_strategy: { en: 'deleted strategy', fr: 'stratégie supprimée' },
  invest_run_view_orders: { en: 'Review in Orders', fr: 'Voir dans Ordres' },
  invest_time_now: { en: 'just now', fr: 'à l’instant' },
  invest_time_min_ago: { en: '{count} min ago', fr: 'il y a {count} min' },
  invest_time_hr_ago: { en: '{count} h ago', fr: 'il y a {count} h' },
  invest_time_day_ago: { en: '{count} d ago', fr: 'il y a {count} j' },
  invest_order_proposed: { en: 'proposed {ago}', fr: 'proposé {ago}' },
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
    en: 'No strategies yet — the agent evaluates enabled strategies each day.',
    fr: 'Aucune stratégie — l’agent évalue chaque jour les stratégies activées.',
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

  /* Chat — the book assistant. Answers over the user's own rows (accounts,
     positions, watchlist, signals, orders, strategies) and can record what
     the user asks — watchlist changes, a QUEUED draft order, a signal
     status, a strategy draft for review. Never investment advice; nothing
     executes itself. [FR self-authored] */
  invest_tab_chat: { en: 'Tally', fr: 'Tally' },
  invest_chat_title: { en: 'Tally', fr: 'Tally' },
  invest_chat_sub: {
    en: 'The book’s watch clerk — ask about your positions or tell her what to record. She’s software, not a person or an advisor; never investment advice.',
    fr: 'La surveillante du carnet — posez-lui une question sur vos positions ou dites-lui quoi noter. C’est un logiciel, pas une personne ni une conseillère ; jamais de conseil en placement.',
  },
  /* Her opening turn on an empty conversation — a hello, at most one thing
     she noticed from the book, and a question. Built client-side from
     InvestState so it costs no call and stays bilingual. [FR self-authored] */
  invest_chat_hi: { en: 'Hi — I’m Tally, the book’s watch clerk.', fr: 'Bonjour — je suis Tally, la surveillante du carnet.' },
  invest_chat_hi_watch: {
    en: '{count} symbols are on the watchlist.',
    fr: '{count} symboles sont sous surveillance.',
  },
  invest_chat_hi_orders: {
    en: '{count} orders are queued waiting on you.',
    fr: '{count} ordres attendent votre validation.',
  },
  invest_chat_hi_signals: {
    en: '{count} open signals on the board.',
    fr: '{count} signaux ouverts au tableau.',
  },
  invest_chat_hi_ask: {
    en: 'What should the book record today?',
    fr: 'Qu’est-ce que le carnet note aujourd’hui ?',
  },
  invest_chat_empty: {
    en: 'Nothing yet. Try “what’s on my watchlist?” or “watch XEQT for me.”',
    fr: 'Rien pour l’instant. Essayez « qu’est-ce que je surveille ? » ou « ajoute XEQT à ma liste ».',
  },
  invest_chat_placeholder: {
    en: 'Ask Tally about the book, or tell her what to record…',
    fr: 'Demandez à Tally sur le carnet, ou dites-lui quoi noter…',
  },
  invest_chat_send: { en: 'Send', fr: 'Envoyer' },
  invest_chat_clear: { en: 'Clear conversation', fr: 'Effacer la discussion' },
  invest_chat_error: {
    en: 'That didn’t go through — try again.',
    fr: 'Ça n’a pas fonctionné — réessayez.',
  },
  /* Confirmation chips under a reply that did something. The {name} slot is
     the subject the action touched. [FR self-authored] */
  invest_chat_did_watch: { en: 'Now watching "{name}"', fr: '« {name} » ajouté à la liste' },
  invest_chat_did_unwatch: { en: '"{name}" removed from the watchlist', fr: '« {name} » retiré de la liste' },
  invest_chat_did_order: { en: 'Draft order queued — {name}', fr: 'Ordre mis en file — {name}' },
  invest_chat_did_signal: { en: 'Signal "{name}" updated', fr: 'Signal « {name} » mis à jour' },
  invest_chat_did_strategy: { en: 'Strategy "{name}" filed for review', fr: 'Stratégie « {name} » déposée pour validation' },
  invest_chat_did_position: { en: 'Position logged — {name}', fr: 'Position notée — {name}' },
  invest_chat_action_failed: {
    en: 'That write didn’t save — the reply above still stands.',
    fr: 'L’écriture n’a pas été enregistrée — la réponse ci-dessus demeure.',
  },
  /* Undo on an action chip — reverses the write while it's still
     reversible (a queued order untouched, a watch row, a signal status,
     a filed draft); the chip then reads Undone. [FR self-authored] */
  invest_chat_undo: { en: 'Undo', fr: 'Annuler' },
  invest_chat_undone: { en: 'Undone', fr: 'Annulé' },
  invest_chat_undo_failed: {
    en: 'Couldn’t undo that — try again.',
    fr: 'Impossible d’annuler — réessayez.',
  },
  /* Thumbs rating under an assistant reply — stored on the turn.
     [FR self-authored] */
  invest_chat_rate_up: { en: 'Helpful', fr: 'Utile' },
  invest_chat_rate_down: { en: 'Not helpful', fr: 'Pas utile' },
  /* Overview strip — one thing she noticed, built locally (no call).
     [FR self-authored] */
  invest_home_tally_label: { en: 'Tally noticed', fr: 'Tally a remarqué' },
  invest_home_tally_orders: {
    en: '{count} orders are queued waiting on you.',
    fr: '{count} ordres attendent votre validation.',
  },
  invest_home_tally_signals: {
    en: '{count} open signals on the board.',
    fr: '{count} signaux ouverts au tableau.',
  },
  invest_home_tally_watch: {
    en: 'Watching {count} symbols.',
    fr: '{count} symboles sous surveillance.',
  },
  invest_home_tally_open: { en: 'Chat with Tally', fr: 'Discuter avec Tally' },
  invest_seo_title_chat: { en: 'Tally — Dutiva Invest', fr: 'Tally — Dutiva Invest' },
  invest_seo_desc_chat: {
    en: 'Chat with Tally — the book’s watch clerk — about your own book data.',
    fr: 'Discutez avec Tally — la surveillante du carnet — de vos propres données.',
  },
})

/* The strategy-builder block lives in investStrategyBuilder.ts (this file
   crossed the 800-line architecture budget); `investMessages` stays the
   combined export so existing consumers keep one import. */
export const investMessages = {
  ...investCoreMessages,
  ...investStrategyBuilderMessages,
}
