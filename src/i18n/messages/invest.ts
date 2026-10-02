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
  invest_tab_notifications: { en: 'Notifications', fr: 'Notifications' },
  invest_tab_settings: { en: 'Settings', fr: 'Paramètres' },

  /* Per-route document head (auth-gated → noindex; titles are what the
     browser tab and shared links actually show). */
  invest_seo_title_overview: {
    en: 'Dutiva Invest — Portfolio tracking and strategy bot',
    fr: 'Dutiva Invest — Suivi de portefeuille et robot de stratégies',
  },
  invest_seo_desc_overview: {
    en: 'Track manual positions and watchlist prices; scans surface signals and order drafts you review yourself.',
    fr: 'Suivez positions saisies à la main et cours de la liste de suivi; les analyses signalent des signaux et des ébauches d’ordres que vous révisez.',
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
    en: 'Bot-proposed order drafts and manual order intents — nothing executes without your approval.',
    fr: 'Ébauches d’ordres proposées par le robot et intentions saisies à la main — rien ne s’exécute sans votre approbation.',
  },
  invest_seo_title_signals: { en: 'Dutiva Invest — Signals', fr: 'Dutiva Invest — Signaux' },
  invest_seo_desc_signals: {
    en: 'Signal history from your enabled strategies — informational only.',
    fr: 'Historique des signaux de vos stratégies activées — à titre informatif seulement.',
  },
  invest_seo_title_strategies: {
    en: 'Dutiva Invest — Strategy bot',
    fr: 'Dutiva Invest — Robot de stratégies',
  },
  invest_seo_desc_strategies: {
    en: 'Describe or pick a strategy; scans create signals and draft proposals only — never placed orders.',
    fr: 'Décrivez ou choisissez une stratégie; les analyses créent seulement signaux et ébauches — jamais d’ordres placés.',
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
    en: 'Where each strategy sends what it finds. Change destinations on the Bot tab.',
    fr: 'Où chaque stratégie envoie ses trouvailles. Les canaux se règlent dans l’onglet Robot.',
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
    en: 'Pick a template on the Bot tab and run a scan. Scans create signals and draft proposals only — never orders.',
    fr: 'Choisissez un modèle dans l’onglet Robot et lancez une analyse. Les analyses créent seulement signaux et ébauches — jamais d’ordres.',
  },
  invest_tour_dismiss: { en: 'Dismiss', fr: 'Fermer' },
  invest_tour_cta_portfolio: { en: 'Open Portfolios', fr: 'Ouvrir Portefeuilles' },
  invest_tour_cta_strategies: { en: 'Open the Bot tab', fr: 'Ouvrir l’onglet Robot' },

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
    en: 'No signals yet — enable a strategy and run the bot.',
    fr: 'Aucun signal — activez une stratégie et lancez le robot.',
  },
  invest_score: { en: 'Score', fr: 'Score' },

  /* Strategies / bot */
  invest_strategies_title: { en: 'Bot strategies', fr: 'Stratégies du robot' },
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
  invest_rule_metric_day_change: { en: 'Day change %', fr: 'Variation du jour %' },
  invest_rule_metric_vs_ma50: { en: 'Price vs 50-day avg %', fr: 'Prix vs moy. mobile 50 j %' },
  invest_rule_metric_value_floor: { en: 'Position value', fr: 'Valeur de position' },
  invest_rule_metric_weight: { en: 'Book weight %', fr: 'Poids dans le portefeuille %' },
  invest_rule_metric_gain: { en: 'Gain vs cost %', fr: 'Gain vs coût %' },
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
  invest_run_scanned: { en: '{count} symbol(s) scanned', fr: '{count} symbole(s) analysé(s)' },
  invest_run_duration: { en: '{seconds}s', fr: '{seconds} s' },
  invest_run_sweep: { en: 'Bot sweep', fr: 'Balayage général' },
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
    en: 'Rules the bot watches for you, on a schedule.',
    fr: 'Des règles que le bot surveille pour vous, selon un horaire.',
  },
  invest_sb_scan_caption: {
    en: 'Scanning never places orders.',
    fr: 'Le balayage ne place jamais d’ordres.',
  },
  invest_sb_scan_started: { en: 'Scan started…', fr: 'Balayage commencé…' },
  invest_sb_scan_complete: { en: 'Scan complete', fr: 'Balayage terminé' },
  invest_sb_empty_hint: {
    en: 'No strategies yet — create one and the bot starts watching on schedule.',
    fr: 'Aucune stratégie — créez-en une et le bot commence la surveillance selon l’horaire.',
  },
  /* [FR self-authored] */
  invest_sb_last_run: { en: 'Last run {time}', fr: 'Dernier balayage {time}' },

  /* Plural nouns — FR uses the singular for 0 and 1 (prototype pl()). */
  invest_sb_rule_one: { en: 'rule', fr: 'règle' },
  invest_sb_rule_many: { en: 'rules', fr: 'règles' },
  invest_sb_tracked_one: { en: 'tracked symbol', fr: 'symbole suivi' },
  invest_sb_tracked_many: { en: 'tracked symbols', fr: 'symboles suivis' },
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
    en: 'The bot evaluates this strategy on its schedule.',
    fr: 'Le bot évalue cette stratégie selon sa fréquence.',
  },
  invest_sb_safety: {
    en: 'Order proposals always require your approval. The bot never trades on its own.',
    fr: 'Les propositions d’ordres exigent toujours votre approbation. Le bot ne négocie jamais seul.',
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
  invest_sb_verb_below: { en: 'is below', fr: 'est en dessous de' },
  invest_sb_verb_above: { en: 'is above', fr: 'est au-dessus de' },
  invest_sb_threshold: { en: 'Threshold', fr: 'Seuil' },
  invest_sb_threshold_cad: { en: 'Threshold in CAD', fr: 'Seuil en CAD' },
  invest_sb_rule_label: { en: 'Rule label', fr: 'Étiquette de la règle' },
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
    en: 'Alerts stand out; Insights stay quiet.',
    fr: 'Les alertes ressortent; les aperçus restent discrets.',
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
    en: 'Tap again to confirm',
    fr: 'Touchez à nouveau pour confirmer',
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
    fr: 'Ajoute {n} % à votre position existante',
  },
  invest_sb_reduces_pct: {
    en: 'Reduces your existing position by {n}%',
    fr: 'Réduit votre position existante de {n} %',
  },
  invest_sb_qty_worth: { en: '{side} ${n} worth', fr: '{side} pour {n} $' },

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
  invest_sb_scanned_line: {
    en: '{symbols} scanned · {signals} · {proposals}',
    fr: '{symbols} analysés · {signals} · {proposals}',
  },
  invest_sb_match_line: {
    en: 'Matched rule “{title}” — {detail}.',
    fr: 'Règle correspondante « {title} » — {detail}.',
  },
  invest_sb_metric_at: { en: '{label} is at {value}', fr: '{label} est à {value}' },
  invest_sb_balance_at: { en: 'balance {value}', fr: 'solde de {value}' },
  invest_sb_outcome_insight: {
    en: 'Outcome: insight notification',
    fr: 'Résultat : notification d’aperçu',
  },
  invest_sb_outcome_alert: {
    en: 'Outcome: alert notification',
    fr: 'Résultat : notification d’alerte',
  },
  invest_sb_outcome_order: {
    en: 'Outcome: would propose order — {detail} · awaiting your approval',
    fr: 'Résultat : proposerait un ordre — {detail} · en attente de votre approbation',
  },

  /* Run history */
  invest_sb_runs_h: { en: 'Run history', fr: 'Historique des balayages' },
  invest_sb_sweep: { en: 'Bot sweep', fr: 'Balayage du bot' },
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
    en: 'What should the bot watch for?',
    fr: 'Que doit surveiller le bot ?',
  },
  invest_sb_wiz_placeholder: {
    en: 'e.g. Alert me when tech stocks dip hard, and propose a small buy if the dip is deep.',
    fr: 'p. ex. Alertez-moi quand les technos chutent fortement, et proposez un petit achat si le creux est profond.',
  },
  invest_sb_wiz_helper: {
    en: 'Pick a template or write your own — the bot will turn it into draft rules.',
    fr: 'Choisissez un modèle ou rédigez le vôtre — le bot le transformera en règles provisoires.',
  },
  invest_sb_wiz_step2_t: { en: 'Review draft rules', fr: 'Revoir les règles provisoires' },
  invest_sb_wiz_step2_sub: {
    en: 'The bot drafted these from your description. Expand a rule to review it — you can fine-tune everything in the editor after creating.',
    fr: 'Le bot les a rédigées à partir de votre description. Développez une règle pour la revoir — vous pourrez tout peaufiner dans l’éditeur après la création.',
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
