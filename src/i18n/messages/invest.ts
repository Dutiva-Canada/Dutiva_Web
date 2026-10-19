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
  invest_tab_more: { en: 'More', fr: 'Plus' },

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
  invest_legal_hours: { en: 'Staffed hours:', fr: 'Heures de service :' },

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
  /* [FR self-authored] Bell-icon a11y suffix — "{n} pending" announces the
     badge count the sr-hidden dot can't. Matches invest_notif_attention. */
  invest_notif_badge: {
    en: '{n} pending',
    fr: '{n} à traiter',
  },
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
  invest_settings_appearance: { en: 'Appearance', fr: 'Apparence' },
  invest_settings_start_page: { en: 'Start page', fr: 'Page de départ' },
  invest_settings_start_page_note: {
    en: 'Where Invest opens the first time you enter the portal each session.',
    fr: 'Où Invest s’ouvre à la première entrée dans le portail de chaque session.',
  },
  invest_settings_currency: { en: 'Display currency', fr: 'Devise d’affichage' },
  invest_settings_currency_note: {
    en: 'Blended totals convert into this currency. “Book default” uses your first account’s base currency.',
    fr: 'Les totaux combinés sont convertis dans cette devise. « Devise du livre » utilise la devise de base du premier compte.',
  },
  invest_settings_currency_auto: { en: 'Book default', fr: 'Devise du livre' },
  invest_settings_defaults: { en: 'Defaults', fr: 'Valeurs par défaut' },
  invest_settings_order_mode: { en: 'New orders default to', fr: 'Les nouveaux ordres passent en' },
  invest_settings_badge: { en: 'Unread badge counts', fr: 'Le badge compte' },
  invest_settings_badge_all: { en: 'Signals + draft orders', fr: 'Signaux + brouillons d’ordres' },
  invest_settings_badge_signals: { en: 'New signals only', fr: 'Nouveaux signaux seulement' },
  invest_settings_data: { en: 'My data', fr: 'Mes données' },
  invest_settings_export: { en: 'Download my data', fr: 'Télécharger mes données' },
  invest_settings_export_note: {
    en: 'A JSON snapshot of everything the portal has loaded — accounts, positions, watchlist, strategies, signals, and orders.',
    fr: 'Un instantané JSON de tout ce que le portail a chargé — comptes, positions, liste de suivi, stratégies, signaux et ordres.',
  },
  invest_settings_clear_chat: { en: 'Clear Tally history', fr: 'Effacer l’historique de Tally' },
  invest_settings_clear_chat_note: {
    en: 'Deletes every Tally conversation on this account. Book data is untouched.',
    fr: 'Supprime toutes les conversations Tally de ce compte. Les données du livre sont intactes.',
  },
  invest_settings_clear_chat_confirm: {
    en: 'Delete the whole Tally history? This cannot be undone.',
    fr: 'Supprimer tout l’historique de Tally ? Cette action est irréversible.',
  },
  invest_settings_clear_chat_yes: { en: 'Delete permanently', fr: 'Supprimer définitivement' },
  invest_settings_clear_chat_done: { en: 'History cleared.', fr: 'Historique effacé.' },
  invest_settings_notifications: { en: 'Notifications', fr: 'Notifications' },
  invest_settings_email_cadence: { en: 'Email alerts', fr: 'Alertes par courriel' },
  invest_settings_email_cadence_note: {
    en: 'Applies to strategies with email on. Immediate sends one summary per scan; digests bundle hits into a single email.',
    fr: 'S’applique aux stratégies avec courriel activé. Immédiat envoie un sommaire par analyse; les sommaires groupés réunissent les déclenchements.',
  },
  invest_cadence_email_immediate: { en: 'Immediate', fr: 'Immédiat' },
  invest_cadence_email_daily: { en: 'Daily digest', fr: 'Sommaire quotidien' },
  invest_cadence_email_weekly: { en: 'Weekly digest', fr: 'Sommaire hebdomadaire' },
  invest_settings_wipe: { en: 'Delete all Invest data', fr: 'Supprimer toutes les données Invest' },
  invest_settings_wipe_note: {
    en: 'Deletes accounts, positions, watchlist, strategies, signals, orders, chats, and preferences. Your portal access stays.',
    fr: 'Supprime comptes, positions, liste de suivi, stratégies, signaux, ordres, conversations et préférences. Votre accès au portail demeure.',
  },
  invest_settings_wipe_type: {
    en: 'Type DELETE to confirm',
    fr: 'Tapez DELETE pour confirmer',
  },
  invest_settings_wipe_done: {
    en: 'All Invest data deleted.',
    fr: 'Toutes les données Invest ont été supprimées.',
  },
  invest_settings_profile: { en: 'Your profile', fr: 'Votre profil' },
  invest_settings_profile_note: {
    en: 'Tally reads this to shape its answers — how deep to go, what to weigh, what to leave out. It never changes what Tally may say.',
    fr: 'Tally s’en sert pour adapter ses réponses — profondeur, pondération, exclusions. Cela ne change jamais ce que Tally peut dire.',
  },
  invest_profile_risk: { en: 'Risk tolerance', fr: 'Tolérance au risque' },
  invest_profile_horizon: { en: 'Horizon', fr: 'Horizon' },
  invest_profile_goal: { en: 'Goal', fr: 'Objectif' },
  invest_profile_experience: { en: 'Experience', fr: 'Expérience' },
  invest_profile_style: { en: 'Answer style', fr: 'Style de réponse' },
  invest_profile_sectors: { en: 'Sectors you follow', fr: 'Secteurs suivis' },
  invest_profile_exclusions: { en: 'Screened out', fr: 'Secteurs exclus' },
  invest_profile_tags_hint: {
    en: 'Comma-separated — e.g. technology, energy',
    fr: 'Séparés par des virgules — p. ex. technologie, énergie',
  },
  invest_opt_not_set: { en: 'Not set', fr: 'Non défini' },
  invest_risk_conservative: { en: 'Conservative', fr: 'Prudent' },
  invest_opt_balanced: { en: 'Balanced', fr: 'Équilibré' },
  invest_risk_aggressive: { en: 'Aggressive', fr: 'Audacieux' },
  invest_horizon_short: { en: 'Short (under 3 years)', fr: 'Court (moins de 3 ans)' },
  invest_horizon_medium: { en: 'Medium (3–10 years)', fr: 'Moyen (3 à 10 ans)' },
  invest_horizon_long: { en: 'Long (10+ years)', fr: 'Long (10 ans et plus)' },
  invest_goal_growth: { en: 'Growth', fr: 'Croissance' },
  invest_goal_income: { en: 'Income', fr: 'Revenu' },
  invest_goal_preservation: { en: 'Capital preservation', fr: 'Préservation du capital' },
  invest_goal_learn: { en: 'Learning', fr: 'Apprentissage' },
  invest_exp_new: { en: 'New to markets', fr: 'Débutant' },
  invest_exp_intermediate: { en: 'Intermediate', fr: 'Intermédiaire' },
  invest_exp_experienced: { en: 'Experienced', fr: 'Expérimenté' },
  invest_style_concise: { en: 'Concise', fr: 'Concis' },
  invest_style_teach: { en: 'Explain the reasoning', fr: 'Expliquer le raisonnement' },
  invest_saving: { en: 'Saving…', fr: 'Enregistrement…' },
  invest_save_error: {
    en: 'Couldn’t save — try again.',
    fr: 'Enregistrement impossible — réessayez.',
  },
  invest_delivery_edit_aria: {
    en: 'Edit {name} delivery',
    fr: 'Modifier l’envoi de {name}',
  },

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
  /* Tile qualifier — what kind of run the timestamp belongs to. A sweep
     evaluated nothing (heartbeat); an evaluation ran a strategy. */
  /* [FR self-authored] */
  invest_ov_last_run_sweep: { en: 'sweep', fr: 'balayage' },
  /* [FR self-authored] */
  invest_ov_last_run_overdue: { en: 'overdue', fr: 'en retard' },
  /* [FR self-authored] */
  invest_ov_last_run_overdue_hint: {
    en: 'The daily agent sweep hasn’t landed in over a day — see the Agent page.',
    fr: 'Le balayage quotidien n’a pas eu lieu depuis plus d’un jour — voir la page Agent.',
  },
  /* [FR self-authored] */
  invest_ov_last_run_eval: { en: 'evaluation', fr: 'évaluation' },
  invest_ov_allocation: { en: 'Allocation by asset class', fr: 'Répartition par classe d’actifs' },
  invest_ov_recent_signals: { en: 'Latest signals', fr: 'Derniers signaux' },
  invest_ov_never_run: { en: 'Not run yet', fr: 'Jamais exécuté' },

  /* Portfolios */
  invest_accounts_title: { en: 'Accounts', fr: 'Comptes' },
  invest_positions_title: { en: 'Positions', fr: 'Positions' },
  invest_add_account: { en: 'Add account', fr: 'Ajouter un compte' },
  invest_add_position: { en: 'Add position', fr: 'Ajouter une position' },
  invest_account_name: { en: 'Account name', fr: 'Nom du compte' },
  /* [FR self-authored] */
  invest_account_name_ph: { en: 'Paper book', fr: 'Livre simulé' },
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
  invest_field_pnl: { en: 'P&L', fr: 'P/L' },
  invest_positions_total: { en: 'Total', fr: 'Total' },
  invest_set_price: { en: 'Set price', fr: 'Fixer le cours' },
  invest_remove_confirm: { en: 'Remove?', fr: 'Retirer ?' },
  invest_price_asof: { en: 'as of', fr: 'au' },
  invest_positions_no_quote: {
    en: '— no quote on file; priced rows only count toward value and P&L. Refresh prices loads one.',
    fr: '— aucun cours en dossier; seules les positions cotées comptent dans la valeur et le P/L. « Actualiser les cours » en charge un.',
  },
  invest_positions_no_fx: {
    en: '— the quote is in another currency and no FX rate is on file; the cells stay blank rather than show a wrong number.',
    fr: '— le cours est dans une autre devise et aucun taux de change n’est en dossier; les cellules restent vides plutôt que d’afficher un chiffre inexact.',
  },
  invest_fx_note: {
    en: '≈ converted at ECB reference rates — {pairs} ({date}). Indicative only.',
    fr: '≈ converti aux taux de référence de la BCE — {pairs} ({date}). À titre indicatif.',
  },
  invest_home_fx_split: {
    en: 'No FX rate on file — totals stay per currency, not blended. Refresh prices retries it.',
    fr: 'Aucun taux de change en dossier — les totaux restent par devise, sans mélange. « Actualiser les cours » réessaie.',
  },
  /* FX table loaded but the book holds a currency it doesn't cover —
     name it instead of implying no rates exist at all. */
  invest_home_fx_uncovered: {
    en: 'No {curs} rate on file — those amounts stay in their own currency.',
    fr: 'Aucun taux {curs} en dossier — ces montants restent dans leur devise.',
  },
  invest_ov_total_value_split: {
    en: 'Value by currency',
    fr: 'Valeur par devise',
  },
  /* Share of the same-currency slice of the book — the honest proportion
     when no single total exists. */
  invest_alloc_of_cur: {
    en: '{amt} · {pct}% in {cur}',
    fr: '{amt} · {pct} % en {cur}',
  },
  invest_field_asset_class: { en: 'Asset class', fr: 'Classe d’actifs' },
  invest_field_currency: { en: 'Currency', fr: 'Devise' },
  invest_field_account: { en: 'Account', fr: 'Compte' },
  invest_position_exists: {
    en: '{symbol} is already in this account — edit the existing row instead.',
    fr: '{symbol} est déjà dans ce compte — modifiez plutôt la ligne existante.',
  },
  invest_position_added: {
    en: 'Added {symbol} — fetching a quote…',
    fr: '{symbol} ajouté — recherche du cours…',
  },
  invest_currency_hint: {
    en: 'The currency your numbers are in.',
    fr: 'La devise des chiffres saisis.',
  },
  invest_currency_hint_quote: {
    en: '{symbol} quotes in {cur} — costs usually follow the quote.',
    fr: '{symbol} cote en {cur} — le coût suit d’habitude le cours.',
  },
  invest_bulk_add: { en: 'Add many', fr: 'Ajout groupé' },
  invest_bulk_hint: {
    en: 'One holding per line — symbol, quantity, average cost, currency optional.',
    fr: 'Un titre par ligne — symbole, quantité, coût moyen, devise facultative.',
  },
  invest_bulk_lines: { en: 'Holdings', fr: 'Titres' },
  invest_bulk_submit: { en: 'Add positions', fr: 'Ajouter les titres' },
  invest_bulk_done: {
    en: 'Added {count} — fetching quotes…',
    fr: '{count} ajoutées — récupération des cours…',
  },
  invest_bulk_skipped: {
    en: '{count} line(s) skipped — they’re still in the box.',
    fr: '{count} ligne(s) ignorée(s) — elles sont encore dans la boîte.',
  },
  invest_account_remove_confirm: {
    en: 'Remove + its positions?',
    fr: 'Retirer avec ses positions ?',
  },
  invest_position_one: { en: 'position', fr: 'position' },
  invest_position_many: { en: 'positions', fr: 'positions' },
  invest_account_remove_detail: {
    en: 'Also deletes its {count} — {symbols}.',
    fr: 'Supprime aussi ses {count} — {symbols}.',
  },
  invest_account_removed: {
    en: 'Removed {name}.',
    fr: '« {name} » retiré.',
  },
  invest_account_removed_cascade: {
    en: 'Removed {name} — {count} went with it.',
    fr: '« {name} » retiré, avec {count}.',
  },
  invest_positions_empty: {
    en: 'No positions yet — add one to start tracking.',
    fr: 'Aucune position — ajoutez-en une pour commencer le suivi.',
  },
  invest_positions_empty_filtered: {
    en: 'No positions match {symbol} — clear the filter to see the book.',
    fr: 'Aucune position ne correspond à {symbol} — retirez le filtre pour voir le portefeuille.',
  },
  invest_filter_show_all: {
    en: 'Show all',
    fr: 'Tout afficher',
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
  invest_signal_reopen: { en: 'Reopen', fr: 'Rouvrir' },
  invest_signals_show_dismissed: {
    en: 'Show {count} dismissed',
    fr: 'Afficher {count} écartés',
  },
  invest_signals_hide_dismissed: {
    en: 'Hide dismissed',
    fr: 'Masquer les écartés',
  },
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
    en: 'Prices refreshed — {symbols} updated.',
    fr: 'Cours actualisés — {symbols} mis à jour.',
  },
  invest_sync_symbol_one: { en: 'symbol', fr: 'symbole' },
  invest_sync_symbol_many: { en: 'symbols', fr: 'symboles' },
  invest_sync_partial: {
    en: 'Some symbols could not be priced: {symbols}',
    fr: 'Certains symboles n’ont pas pu être évalués : {symbols}',
  },
  invest_prices_as_of: { en: 'Prices as of {time}', fr: 'Cours au {time}' },
  invest_prices_stale: { en: 'stale', fr: 'obsolète' },
  invest_prices_stale_hint: {
    en: 'The price feed missed its usual window — marks may be old. Try Refresh prices.',
    fr: 'Le flux de cours a raté sa fenêtre habituelle — les valorisations peuvent dater. Essayez Actualiser les cours.',
  },
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
  /* The third-party attribution lives in the note below — not doubled
     in the title. */
  invest_news_title: {
    en: 'Market headlines',
    fr: 'Manchettes du marché',
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
  invest_news_via: {
    en: 'via {theme}',
    fr: 'via {theme}',
  },
  /* [FR self-authored] */
  invest_news_count: {
    en: '{count} headlines',
    fr: '{count} manchettes',
  },
  /* [FR self-authored] */
  invest_news_book: { en: 'Your book', fr: 'Votre portefeuille' },
  /* [FR self-authored] */
  invest_news_all: { en: 'All', fr: 'Tout' },
  /* [FR self-authored] */
  invest_news_range_aria: { en: 'Headline window', fr: 'Période des manchettes' },
  /* [FR self-authored] */
  invest_news_range_7d: { en: '7 days', fr: '7 jours' },
  /* [FR self-authored] */
  invest_news_range_14d: { en: '14 days', fr: '14 jours' },
  /* [FR self-authored] */
  invest_news_range_30d: { en: '30 days', fr: '30 jours' },
  /* [FR self-authored] Day-group headers over the headline list. */
  invest_news_today: { en: 'Today', fr: 'Aujourd’hui' },
  /* [FR self-authored] */
  invest_news_yesterday: { en: 'Yesterday', fr: 'Hier' },
  /* [FR self-authored] */
  invest_news_undated: { en: 'Undated', fr: 'Non datées' },
  /* [FR self-authored] Unscoped rows — no ticker, no theme link. */
  invest_news_general: { en: 'General market', fr: 'Marché général' },
  /* [FR self-authored] */
  invest_news_filter_aria: { en: 'Filter headlines', fr: 'Filtrer les manchettes' },
  /* [FR self-authored] Facet menu — symbols and asset classes the
     current feed carries, one pick at a time. */
  invest_news_filter_btn: { en: 'Filter', fr: 'Filtrer' },
  /* [FR self-authored] */
  invest_news_filter_symbols: { en: 'Symbols', fr: 'Symboles' },
  /* [FR self-authored] The picked facet shows as a token — its × clears. */
  invest_news_filter_clear: { en: 'Clear filter', fr: 'Effacer le filtre' },
  /* [FR self-authored] Scope + facet intersected to nothing — a real
     answer, not a bug. */
  invest_news_no_match: {
    en: 'No headlines match the current filters.',
    fr: 'Aucune manchette ne correspond aux filtres.',
  },
  /* [FR self-authored] Per-card control — mutes the publisher, not just
     this headline. */
  invest_news_mute: { en: 'Hide {source} headlines', fr: 'Masquer les manchettes de {source}' },
  /* [FR self-authored] Label over the chips of muted publishers. */
  invest_news_muted: { en: 'Muted:', fr: 'Masquées :' },
  /* [FR self-authored] */
  invest_news_unmute: { en: 'Show {source} again', fr: 'Réafficher {source}' },
  /* [FR self-authored] Headline-kind badges — what the story is, not
     whether it matters: something happened / an analyst note or opinion
     / a writeup about the price itself. */
  invest_news_kind_event: { en: 'Event', fr: 'Événement' },
  /* [FR self-authored] */
  invest_news_kind_view: { en: 'Analysis', fr: 'Analyse' },
  /* [FR self-authored] */
  invest_news_kind_move: { en: 'Price move', fr: 'Mouvement de cours' },
  /* [FR self-authored] Position-disclosure churn — 'X Raises Holdings
     in Y' restates a filing; badged so it reads as what it is. */
  invest_news_kind_filing: { en: 'Filing', fr: 'Dépôt' },
  /* [FR self-authored] Paywall toggle — state + action on one chip, same
     shape as the muted-source chips. The count is headlines, not
     publishers — it's what 'show' would reveal in the current view. */
  invest_news_paywalled_hidden: {
    en: '{n} subscription-only headlines hidden — show',
    fr: '{n} manchettes de sources payantes masquées — afficher',
  },
  /* [FR self-authored] */
  invest_news_paywalled_shown: {
    en: 'Subscription-only sources shown — hide',
    fr: 'Sources payantes affichées — masquer',
  },
  /* [FR self-authored] Chip tooltip naming the hidden publishers. */
  invest_news_paywalled_sources: {
    en: 'Subscription-only sources: {sources}',
    fr: 'Sources payantes : {sources}',
  },
  /* [FR self-authored] When the window is empty the feed falls back to
     all headlines on file — the chip stays pressed, so say so. */
  invest_news_range_fallback: {
    en: 'Quiet window — showing older headlines on file.',
    fr: 'Période creuse — manchettes plus anciennes affichées.',
  },
  /* [FR self-authored] A mute write failed — surface it rather than
     let the click die silently. */
  invest_news_mute_failed: {
    en: "Couldn't update that source filter — try again.",
    fr: 'Impossible de modifier ce filtre — réessayez.',
  },
  /* [FR self-authored] Every row in view is filtered out (mutes or
     paywall defaults) — an empty list with no note reads as a bug. */
  invest_news_all_filtered: {
    en: 'All headlines here are hidden by source filters.',
    fr: 'Toutes les manchettes sont masquées par les filtres de source.',
  },

  /* Track record (0223) — one mark per sweep-day; deposits and
     withdrawals are backed out so the change reads as performance,
     not as money you moved. */
  /* [FR self-authored] */
  invest_curve_title: { en: 'Track record', fr: 'Historique' },
  /* [FR self-authored] */
  invest_curve_note: {
    en: 'One mark per sweep',
    fr: 'Un relevé par balayage',
  },
  /* [FR self-authored] */
  invest_curve_empty: {
    en: 'No marks yet — the curve starts with the next sweep.',
    fr: 'Aucun relevé — la courbe commence au prochain balayage.',
  },
  /* [FR self-authored] */
  invest_curve_empty_one: {
    en: 'One mark so far — the curve starts with the next sweep.',
    fr: 'Un seul relevé — la courbe commence au prochain balayage.',
  },
  /* [FR self-authored] */
  invest_curve_range_1m: { en: '1M', fr: '1 m' },
  /* [FR self-authored] */
  invest_curve_range_3m: { en: '3M', fr: '3 m' },
  /* [FR self-authored] */
  invest_curve_range_1y: { en: '1Y', fr: '1 a' },
  /* [FR self-authored] */
  invest_curve_range_all: { en: 'All', fr: 'Tout' },
  /* [FR self-authored] */
  invest_curve_change: { en: 'Change', fr: 'Variation' },
  /* [FR self-authored] */
  invest_curve_net_flows: {
    en: 'net of recorded deposits and withdrawals',
    fr: 'nette des dépôts et retraits inscrits',
  },
  /* [FR self-authored] */
  invest_curve_maxdd: { en: 'Deepest dip', fr: 'Creux maximal' },
  /* [FR self-authored] */
  invest_curve_since: { en: 'since {date}', fr: 'depuis le {date}' },
  /* [FR self-authored] */
  invest_curve_benchmark_note: {
    en: 'dashed — {sym} from the same start',
    fr: 'pointillés — {sym} depuis le même départ',
  },
  /* [FR self-authored] */
  invest_curve_benchmark_row: { en: '{sym} (same start)', fr: '{sym} (même départ)' },
  /* [FR self-authored] */
  invest_curve_vs_bench: { en: 'vs {sym}', fr: 'vs {sym}' },
  /* [FR self-authored] */
  invest_curve_invested: { en: 'Invested', fr: 'Investi' },
  /* [FR self-authored] */
  invest_curve_cash: { en: 'Cash', fr: 'Liquidités' },
  /* [FR self-authored] */
  invest_curve_fx_note: {
    en: '≈ mark converted to {ccy}',
    fr: '≈ relevé converti en {ccy}',
  },
  /* [FR self-authored] */
  invest_curve_alt: {
    en: 'Book value marks: {vfrom} on {from}, {vto} on {to}.',
    fr: 'Valeur du portefeuille : {vfrom} le {from}, {vto} le {to}.',
  },
  /* [FR self-authored] */
  invest_rule_metric_price: { en: 'Price', fr: 'Cours' },

  /* Cash ledger (0223) */
  /* [FR self-authored] */
  invest_ledger_title: { en: 'Cash movements', fr: 'Mouvements de liquidités' },
  /* [FR self-authored] */
  invest_ledger_note: {
    en: 'Each entry moves the account balance. Deposits and withdrawals are backed out of the track record’s change — money moved never reads as performance.',
    fr: 'Chaque inscription ajuste le solde du compte. Les dépôts et retraits sont retranchés de la variation de l’historique — l’argent déplacé ne passe jamais pour du rendement.',
  },
  /* [FR self-authored] */
  invest_ledger_kind: { en: 'Kind', fr: 'Type' },
  /* [FR self-authored] */
  invest_ledger_deposit: { en: 'Deposit', fr: 'Dépôt' },
  /* [FR self-authored] */
  invest_ledger_withdrawal: { en: 'Withdrawal', fr: 'Retrait' },
  /* [FR self-authored] */
  invest_ledger_dividend: { en: 'Dividend', fr: 'Dividende' },
  /* [FR self-authored] */
  invest_ledger_amount: { en: 'Amount', fr: 'Montant' },
  /* [FR self-authored] */
  invest_ledger_date: { en: 'Date', fr: 'Date' },
  /* [FR self-authored] */
  invest_ledger_memo: { en: 'Note (optional)', fr: 'Note (facultative)' },
  /* [FR self-authored] */
  invest_ledger_record: { en: 'Record', fr: 'Inscrire' },
  /* [FR self-authored] */
  invest_ledger_empty: {
    en: 'Nothing recorded yet — deposits and withdrawals you log here stop counting as performance.',
    fr: 'Rien d’inscrit — les dépôts et retraits consignés ici cessent de compter comme du rendement.',
  },
  /* [FR self-authored] */
  invest_ledger_confirm_del: { en: 'Remove & reverse?', fr: 'Retirer et renverser ?' },
  /* [FR self-authored] */
  invest_ledger_more: { en: '{count} movements on file', fr: '{count} mouvements inscrits' },

  /* Rebalance (0223) */
  /* [FR self-authored] */
  invest_rebal_title: { en: 'Rebalance', fr: 'Rééquilibrage' },
  /* [FR self-authored] */
  invest_rebal_note: {
    en: 'Weights are marked in {ccy}. Set a target share; a draft order closes the gap — nothing moves on its own.',
    fr: 'Les poids sont évalués en {ccy}. Fixez une part cible; un ordre brouillon comble l’écart — rien ne bouge tout seul.',
  },
  /* [FR self-authored] */
  invest_rebal_weight: { en: 'Weight', fr: 'Poids' },
  /* [FR self-authored] */
  invest_rebal_target: { en: 'Target', fr: 'Cible' },
  /* [FR self-authored] */
  invest_rebal_drift: { en: 'Drift', fr: 'Écart' },
  /* [FR self-authored] */
  invest_rebal_set: { en: 'Set', fr: 'Définir' },
  /* [FR self-authored] */
  invest_rebal_draft_sell: { en: 'Draft sell', fr: 'Vente brouillon' },
  /* [FR self-authored] */
  invest_rebal_draft_buy: { en: 'Draft buy', fr: 'Achat brouillon' },
  /* [FR self-authored] */
  invest_rebal_empty: {
    en: 'No targets yet — set one on any row to start measuring drift.',
    fr: 'Aucune cible — définissez-en une sur une ligne pour mesurer l’écart.',
  },
  /* [FR self-authored] */
  invest_rebal_review: {
    en: 'Draft orders land on the Orders tab for your review — they never fill on their own.',
    fr: 'Les ordres brouillons arrivent dans l’onglet Ordres pour votre revue — ils ne s’exécutent jamais seuls.',
  },

  /* Allocation donut (0223) */
  /* [FR self-authored] */
  invest_alloc_title: { en: 'Holdings allocation', fr: 'Répartition des positions' },
  /* [FR self-authored] */
  invest_alloc_top: {
    en: '{symbol} is {pct}% of your book.',
    fr: '{symbol} représente {pct} % du portefeuille.',
  },
  /* [FR self-authored] */
  invest_alloc_other: { en: 'Other', fr: 'Autres' },
  /* [FR self-authored] */
  invest_alloc_skipped: {
    en: 'Unpriced positions don’t appear.',
    fr: 'Les positions sans cours n’y figurent pas.',
  },
  /* [FR self-authored] */
  invest_export_csv: { en: 'Export CSV', fr: 'Exporter en CSV' },

  /* Watchlist price alert (0223) — writes a real 'price'-metric
     strategy; the Agent tab owns it from there. */
  /* [FR self-authored] */
  invest_watch_alert_aria: { en: 'Set a price alert for {symbol}', fr: 'Créer une alerte de cours sur {symbol}' },
  /* [FR self-authored] */
  invest_watch_alert_lead: { en: 'Alert me when {symbol} is', fr: 'M’alerter quand {symbol} est' },
  /* [FR self-authored] */
  invest_watch_alert_now: { en: '(now {price} {ccy})', fr: '(actuellement {price} {ccy})' },
  /* [FR self-authored] */
  invest_watch_alert_above: { en: 'above', fr: 'au-dessus de' },
  /* [FR self-authored] */
  invest_watch_alert_below: { en: 'below', fr: 'sous' },
  /* [FR self-authored] */
  invest_watch_alert_save: { en: 'Save alert', fr: 'Enregistrer l’alerte' },
  /* [FR self-authored] */
  invest_watch_alert_saved: {
    en: 'Price alert saved for {symbol} — it fires on the next sweep.',
    fr: 'Alerte de cours enregistrée pour {symbol} — elle se déclenche au prochain balayage.',
  },

  /* Stress test (0223) — client-side scenario math over the user's own
     rules, theses, and goals. Nothing is written; the panel reads like
     the sweep's verdict would. */
  /* [FR self-authored] */
  invest_stress_title: { en: 'Stress test', fr: 'Simulation de choc' },
  /* [FR self-authored] */
  invest_stress_sub: {
    en: 'Replay the book under a sharp move — which rules fire, which theses bend, which goals slip. Scenario math, not a forecast.',
    fr: 'Rejouez le portefeuille sous un mouvement brusque — quelles règles se déclenchent, quelles thèses plient, quels objectifs reculent. Un scénario, pas une prévision.',
  },
  /* [FR self-authored] */
  invest_stress_empty: {
    en: 'Add a holding or a watched symbol first — the scenario needs marks to shock.',
    fr: 'Ajoutez d’abord une position ou un symbole suivi — le scénario a besoin de cours à choquer.',
  },
  /* [FR self-authored] */
  invest_stress_scenario_all10: { en: 'Everything −10%', fr: 'Tout −10 %' },
  /* [FR self-authored] */
  invest_stress_scenario_top15: { en: 'Top holding −15%', fr: 'Première position −15 %' },
  /* [FR self-authored] */
  invest_stress_scenario_cad5: { en: '{ccy} +5%', fr: '{ccy} +5 %' },
  /* [FR self-authored] */
  invest_stress_scenario_winners: { en: 'Winners give back 20%', fr: 'Les gagnants rendent 20 %' },
  /* [FR self-authored] */
  invest_stress_scenario_custom: { en: 'Custom', fr: 'Sur mesure' },
  /* [FR self-authored] */
  invest_stress_presets: { en: 'Preset scenarios', fr: 'Scénarios prédéfinis' },
  /* [FR self-authored] */
  invest_stress_pick_symbol: { en: 'Pick a symbol', fr: 'Choisir un symbole' },
  /* [FR self-authored] */
  invest_stress_pct_label: { en: 'Move in percent', fr: 'Mouvement en pourcentage' },
  /* [FR self-authored] */
  invest_stress_run: { en: 'Run', fr: 'Lancer' },
  /* [FR self-authored] */
  invest_stress_book: { en: 'Book under the scenario', fr: 'Portefeuille sous le scénario' },
  /* [FR self-authored] */
  invest_stress_unmatched: {
    en: 'No market data for {symbols} — skipped.',
    fr: 'Pas de données de marché pour {symbols} — ignoré.',
  },
  /* [FR self-authored] */
  invest_stress_none: {
    en: 'Nothing fires under that scenario — the book just takes the hit.',
    fr: 'Rien ne se déclenche sous ce scénario — le portefeuille encaisse en silence.',
  },
  /* [FR self-authored] */
  invest_stress_strategies: { en: 'Rules that would fire', fr: 'Règles qui se déclencheraient' },
  /* [FR self-authored] */
  invest_stress_theses: { en: 'Theses that would move', fr: 'Thèses qui bougeraient' },
  /* [FR self-authored] */
  invest_stress_goals: { en: 'Goals under the scenario', fr: 'Objectifs sous le scénario' },
  /* [FR self-authored] */
  invest_stress_goal_holds: { en: 'holds', fr: 'tient' },
  /* [FR self-authored] */
  invest_stress_goal_slips: { en: 'slips', fr: 'recule' },
  /* [FR self-authored] */
  invest_stress_goal_unknown: { en: 'can’t read', fr: 'illisible' },
  /* [FR self-authored] */
  invest_stress_note: {
    en: 'Runs on the latest marks, your rules — the same math the sweep uses. Nothing here is written or filed.',
    fr: 'Calculé sur les derniers cours et vos règles — les mêmes calculs que le balayage. Rien n’est écrit ni proposé.',
  },
  /* Template gallery (0223) — seeds a real draft in the editor; scope is
     the user's pick before saving. */
  /* [FR self-authored] */
  invest_tpl_gallery_title: { en: 'Start from a template', fr: 'Partir d’un gabarit' },
  /* [FR self-authored] */
  invest_tpl_gallery_sub: {
    en: 'A starting point, not a locked product — you pick what it scans, then save.',
    fr: 'Un point de départ, pas un produit figé — vous choisissez ce qu’elle surveille, puis vous enregistrez.',
  },
  /* [FR self-authored] */
  invest_tpl_use: { en: 'Use this template', fr: 'Utiliser ce gabarit' },
  /* Run inspector (0223) — expandable detail under a run row: what the
     sweep read and which rules matched. */
  /* [FR self-authored] */
  invest_run_detail_read: { en: 'Read', fr: 'Lus' },
  /* [FR self-authored] */
  invest_run_detail_hits: { en: 'Rules matched', fr: 'Règles déclenchées' },
  /* [FR self-authored] */
  invest_run_detail_none: {
    en: 'Nothing recorded for this run.',
    fr: 'Rien de consigné pour ce passage.',
  },
  /* Morning brief (0223) — the digest card atop Overview: overnight
     movers, fresh signals, bent theses, slipping goals, queued orders.
     Dismiss once and it stays down until tomorrow. */
  /* [FR self-authored] */
  invest_brief_title: { en: 'This morning', fr: 'Ce matin' },
  /* [FR self-authored] */
  invest_brief_title_day: { en: 'Today', fr: "Aujourd'hui" },
  /* [FR self-authored] */
  invest_brief_movers: { en: 'Overnight: {list}', fr: 'Pendant la nuit : {list}' },
  /* Day variant — after noon the same numbers are today's session moves,
     not overnight gaps. */
  /* [FR self-authored] */
  invest_brief_movers_day: { en: 'Session: {list}', fr: 'Séance : {list}' },
  /* Mover context tails — "ASTS −8.5% — thesis broken, below your cost".
     The strongest two attach so a bare % never stands in for why a move
     matters to this book. */
  /* [FR self-authored] */
  invest_brief_mover_broken: { en: 'thesis broken', fr: 'thèse brisée' },
  /* [FR self-authored] */
  invest_brief_mover_drifting: { en: 'thesis drifting', fr: 'thèse en dérive' },
  /* [FR self-authored] */
  invest_brief_mover_signal: { en: 'signal fired', fr: 'signal déclenché' },
  /* [FR self-authored] */
  invest_brief_mover_below_cost: { en: 'below your cost', fr: 'sous votre coût' },
  /* [FR self-authored] */
  invest_brief_mover_below_ma: {
    en: 'below its 50-day average',
    fr: 'sous sa moyenne de 50 jours',
  },
  /* Plural tails — shared when several movers carry the identical tag
     set, so the line never reads "its" about four positions at once. */
  /* [FR self-authored] */
  invest_brief_mover_broken_many: { en: 'theses broken', fr: 'thèses brisées' },
  /* [FR self-authored] */
  invest_brief_mover_drifting_many: { en: 'theses drifting', fr: 'thèses en dérive' },
  /* [FR self-authored] */
  invest_brief_mover_signal_many: { en: 'signals fired', fr: 'signaux déclenchés' },
  /* [FR self-authored] */
  invest_brief_mover_below_ma_many: {
    en: 'below their 50-day averages',
    fr: 'sous leur moyenne de 50 jours',
  },
  /* [FR self-authored] */
  invest_brief_signal_one: { en: 'signal fired since yesterday', fr: 'signal déclenché depuis hier' },
  /* [FR self-authored] */
  invest_brief_signal_many: { en: 'signals fired since yesterday', fr: 'signaux déclenchés depuis hier' },
  /* [FR self-authored] */
  invest_brief_theses: {
    en: 'Theses: {broken} broken · {drifting} drifting',
    fr: 'Thèses : {broken} brisée(s) · {drifting} en dérive',
  },
  /* [FR self-authored] */
  invest_brief_goal_one: { en: 'goal off pace', fr: 'objectif qui recule' },
  /* [FR self-authored] */
  invest_brief_goal_many: { en: 'goals off pace', fr: 'objectifs qui reculent' },
  /* [FR self-authored] */
  invest_brief_order_one: { en: 'order waiting for a decision', fr: 'ordre en attente de décision' },
  /* [FR self-authored] */
  invest_brief_order_many: { en: 'orders waiting for a decision', fr: 'ordres en attente de décision' },
  /* [FR self-authored] */
  invest_brief_open: { en: 'Open the signals feed', fr: 'Ouvrir les signaux' },
  /* [FR self-authored] */
  invest_brief_dismiss: { en: 'Dismiss', fr: 'Ignorer' },
  /* Suggestion accept paths (0223) — a crossed limit executes AT the
     limit the user set; a broken thesis turns into a sell draft on
     Orders, never an execution. */
  /* [FR self-authored] */
  invest_cross_execute: { en: 'Execute at {price}', fr: 'Exécuter à {price}' },
  /* [FR self-authored] */
  invest_cross_stale: {
    en: 'That order already moved on.',
    fr: 'Cet ordre n’attend plus.',
  },
  /* [FR self-authored] */
  invest_exit_accept: { en: 'Queue the sell', fr: 'Mettre la vente en file' },
  /* [FR self-authored] */
  invest_exit_stale: {
    en: 'The position is already closed.',
    fr: 'La position est déjà fermée.',
  },
  /* [FR self-authored] */
  invest_exit_drafted: {
    en: 'Sell order queued — review it in Orders.',
    fr: 'Ordre de vente en file — passez-le en revue dans Ordres.',
  },
  /* [FR self-authored] */
  invest_exit_failed: {
    en: 'Couldn’t queue the sell — {error}',
    fr: 'Impossible de mettre la vente en file — {error}',
  },

  /* Vocabulary glosses (0224) — terms explained where they're read, not
     just where they're chosen. One hint per concept cluster; the legend
     spells out all three account kinds at once since they only differ in
     meaning, not mechanics. */
  invest_hint_aria: { en: 'What does this mean?', fr: 'Qu’est-ce que ça veut dire ?' },
  /* [FR self-authored] */
  invest_legend_account_kinds: {
    en: 'Paper — simulated practice, nothing real at stake. Live — your real book: Dutiva never places a trade, you confirm each fill yourself. External — a manual mirror of an account you hold elsewhere; nothing syncs.',
    fr: 'Simulé — pratique sans argent réel. Réel — votre vrai portefeuille : Dutiva ne place jamais d’ordre, vous confirmez chaque exécution vous-même. Externe — copie manuelle d’un compte détenu ailleurs ; rien ne se synchronise.',
  },
  /* [FR self-authored] */
  invest_hint_order_mode_aria: { en: 'Paper vs live orders', fr: 'Ordres simulés ou réels' },
  /* [FR self-authored] */
  invest_hint_order_mode: {
    en: 'Paper fills at the current price right away — practice. Live records a trade you placed at your broker: you enter the fill price you actually got.',
    fr: 'Simulé s’exécute au cours affiché — pratique. Réel consigne une opération placée chez votre courtier : vous entrez le prix d’exécution obtenu.',
  },
  /* [FR self-authored] */
  invest_hint_signal_kinds_aria: { en: 'Signal types', fr: 'Types de signaux' },
  /* [FR self-authored] */
  invest_hint_signal_kinds: {
    en: 'Screen — a scan result. Insight — worth knowing, no urgency. Alert — a line you set got crossed. Thesis, Goal and Scan signals come from your theses, goals and watch board.',
    fr: 'Filtrage — résultat d’analyse. Analyse — à savoir, sans urgence. Alerte — une ligne que vous avez fixée a été franchie. Les signaux Thèse, Objectif et Veille viennent de vos thèses, objectifs et liste de veille.',
  },
  /* [FR self-authored] */
  invest_hint_thesis_status_aria: { en: 'Thesis statuses', fr: 'États des thèses' },
  /* [FR self-authored] */
  invest_hint_thesis_status: {
    en: 'Healthy — every watch condition holds. Drifting — a condition tripped; worth a look. Broken — the case failed; the sweep proposes an exit order.',
    fr: 'Saine — toutes les conditions tiennent. En dérive — une condition a été franchie ; à revoir. Brisée — la thèse a échoué ; l’analyse propose un ordre de sortie.',
  },
  /* [FR self-authored] */
  invest_hint_goal_status_aria: { en: 'Goal statuses', fr: 'États des objectifs' },
  /* [FR self-authored] */
  invest_hint_goal_status: {
    en: 'On track or behind — how the last sweep measured it. Achieved when met; missed once the deadline passes unmet.',
    fr: 'En bonne voie ou en retard — selon la dernière analyse. Atteint une fois rempli ; manqué si l’échéance passe sans qu’il le soit.',
  },
  /* Goal metrics — one line each, shown under the "Measured on" select so
     the choice is informed. [FR self-authored] */
  invest_goal_gloss_book_value: {
    en: 'The whole book — cash plus positions, in the book’s currency.',
    fr: 'Tout le portefeuille — encaisse et positions, dans la devise du compte.',
  },
  invest_goal_gloss_cash_pct: {
    en: 'Cash as a share of the whole book.',
    fr: 'L’encaisse en part du portefeuille.',
  },
  invest_goal_gloss_max_weight_pct: {
    en: 'The biggest position’s share of the book — a concentration check.',
    fr: 'La part de la plus grosse position — une mesure de concentration.',
  },
  invest_goal_gloss_unrealized_gain_pct: {
    en: 'Average gain across positions versus what you paid. Negative targets are allowed — a loss floor.',
    fr: 'Gain moyen des positions par rapport au coût. Les cibles négatives sont permises — un plancher de perte.',
  },
  invest_goal_gloss_thesis_coverage: {
    en: 'Share of positions with a written thesis.',
    fr: 'Part des positions qui ont une thèse écrite.',
  },
  invest_goal_gloss_position_count: {
    en: 'How many positions the book holds.',
    fr: 'Le nombre de positions dans le portefeuille.',
  },
  /* [FR self-authored] */
  invest_order_mode_label: { en: 'Paper or live', fr: 'Simulé ou réel' },
  invest_hint_order_status_aria: { en: 'Order statuses', fr: 'États des ordres' },
  /* [FR self-authored] */
  invest_hint_order_status: {
    en: 'Queued orders wait for you — nothing fills on its own. Executed is settled; cancelled and expired are done.',
    fr: 'Les ordres en file attendent votre décision — rien ne s’exécute seul. Exécuté veut dire réglé ; annulé et expiré sont clos.',
  },
  /* "How Tally works" — the review-loop contract in four lines, as a
     collapsible note atop Chat. [FR self-authored] */
  invest_tally_how_title: { en: 'How Tally works', fr: 'Comment Tally fonctionne' },
  invest_tally_how_1: {
    en: 'On each sweep Tally reads your book — prices, strategies, theses, goals.',
    fr: 'À chaque analyse, Tally lit votre portefeuille — cours, stratégies, thèses, objectifs.',
  },
  invest_tally_how_2: {
    en: 'Crossed a line you set? It lands in the review strip — never acted on silently.',
    fr: 'Une ligne franchie ? Ça arrive dans la file de revue — jamais d’action silencieuse.',
  },
  invest_tally_how_3: {
    en: 'Accepting a suggestion writes it for real — a rule tuned, a draft order queued.',
    fr: 'Accepter une suggestion l’écrit pour de bon — règle ajustée, ordre mis en file.',
  },
  invest_tally_how_4: {
    en: 'Orders stay queued until you execute them. Live orders ask the fill price you actually got.',
    fr: 'Les ordres restent en file jusqu’à votre exécution. Les ordres réels demandent le prix obtenu.',
  },

  /* 0224 — fill recording, closed trades, external backfill.
     [FR self-authored] */
  invest_fills_progress: {
    en: '{filled} of {total} filled',
    fr: '{filled} sur {total} exécutés',
  },
  invest_fills_count: { en: '{count} fills', fr: '{count} exécutions' },
  invest_fill_price_mark_hint: { en: 'blank = current mark', fr: 'vide = cours actuel' },
  invest_fill_date: { en: 'Fill date (optional)', fr: 'Date d’exécution (optionnel)' },
  invest_fill_partial: { en: 'Record partial fill', fr: 'Exécution partielle' },
  invest_fill_record: { en: 'Record fill', fr: 'Enregistrer l’exécution' },
  invest_fill_note: { en: 'Note', fr: 'Note' },
  invest_closed_title: { en: 'Closed trades', fr: 'Transactions closes' },
  invest_closed_avg_cost: { en: 'Avg cost', fr: 'Coût moyen' },
  invest_closed_sold_at: { en: 'Sold at', fr: 'Vendu à' },
  invest_closed_realized: { en: 'Realized', fr: 'Réalisé' },
  invest_closed_date: { en: 'Date', fr: 'Date' },
  invest_closed_total: { en: 'Realized ({ccy})', fr: 'Réalisé ({ccy})' },
  invest_hint_closed_aria: { en: 'About closed trades', fr: 'À propos des transactions closes' },
  invest_hint_closed: {
    en: 'Each sell fill is scored against what the shares cost when it landed — that gap is your realized gain or loss. Unrealized moves on open positions stay on the Overview.',
    fr: 'Chaque vente exécutée se compare au coût des titres au moment de l’exécution — l’écart est votre gain ou perte réalisé. Les variations sur positions ouvertes restent dans l’aperçu.',
  },
  invest_import_open: { en: 'Import fills', fr: 'Importer des exécutions' },
  invest_import_title: { en: 'Import fill history', fr: 'Importer un historique' },
  invest_import_help: {
    en: 'One fill per line: symbol, buy or sell, quantity, price, date (YYYY-MM-DD). Lines import oldest-first so average cost lands right.',
    fr: 'Une exécution par ligne : symbole, buy ou sell, quantité, prix, date (AAAA-MM-JJ). Les lignes s’importent de la plus ancienne à la plus récente pour un coût moyen exact.',
  },
  invest_import_rows: { en: 'Fills', fr: 'Exécutions' },
  invest_import_placeholder: {
    en: 'SHOP, buy, 10, 82.50, 2024-03-14',
    fr: 'SHOP, buy, 10, 82,50, 2024-03-14',
  },
  invest_import_apply_book: {
    en: 'Update positions and cash — off records history only, for books already mirrored by hand',
    fr: 'Mettre à jour positions et liquidités — désactivé, l’historique seul s’enregistre, pour les livres déjà saisis à la main',
  },
  invest_import_run: { en: 'Import', fr: 'Importer' },
  invest_import_bad_line: { en: 'Line {line}: skipped — needs symbol, buy|sell, qty, price, date', fr: 'Ligne {line} : ignorée — symbole, buy|sell, quantité, prix et date requis' },
  invest_hint_import_aria: { en: 'About importing fills', fr: 'À propos de l’import' },
  invest_hint_import: {
    en: 'For an account you mirror from elsewhere: paste the fills that built it and the book reconstructs itself. Nothing syncs — this is history you type in once.',
    fr: 'Pour un compte que vous reflétez d’ailleurs : collez les exécutions qui l’ont bâti et le livre se reconstruit. Rien ne se synchronise — c’est un historique saisi une fois.',
  },

  /* Position shortcuts + recurring contributions + curve scope (0224).
     [FR self-authored] */
  invest_dividend_record: { en: 'Record dividend', fr: 'Enregistrer un dividende' },
  invest_dividend_per_share: { en: 'Per share', fr: 'Par action' },
  /* [FR self-authored] */
  invest_dividend_note: { en: 'Dividend — {sym} {ps} × {qty}', fr: 'Dividende — {sym} {ps} × {qty}' },
  invest_split_record: { en: 'Record split', fr: 'Enregistrer une division' },
  invest_split_ratio: { en: 'Split ratio', fr: 'Ratio de division' },
  invest_split_ratio_hint: { en: '2 = two-for-one', fr: '2 = deux pour une' },
  invest_recur_title: { en: 'Recurring contributions', fr: 'Versements périodiques' },
  invest_recur_sub: {
    en: 'A deposit the sweep writes automatically when its date lands — the curve still backs it out of performance.',
    fr: 'Un dépôt que l’analyse inscrit automatiquement à la date prévue — la courbe l’exclut toujours du rendement.',
  },
  invest_recur_amount: { en: 'Amount', fr: 'Montant' },
  /* Options pair with the "Frequency" label and read standalone in the
     row list ("$500 · Monthly"). */
  invest_recur_cadence: { en: 'Frequency', fr: 'Fréquence' },
  invest_recur_weekly: { en: 'Weekly', fr: 'Hebdomadaire' },
  invest_recur_monthly: { en: 'Monthly', fr: 'Mensuelle' },
  /* [FR self-authored] */
  invest_recur_empty: {
    en: 'Nothing scheduled yet — set an amount and a first date above.',
    fr: 'Rien de programmé — indiquez un montant et une première date ci-dessus.',
  },
  invest_recur_next_date: { en: 'First deposit on', fr: 'Premier versement le' },
  invest_recur_next: { en: 'next {date}', fr: 'prochain {date}' },
  invest_recur_add: { en: 'Schedule', fr: 'Programmer' },
  invest_recur_pause: { en: 'Pause', fr: 'Suspendre' },
  invest_recur_resume: { en: 'Resume', fr: 'Reprendre' },
  invest_recur_paused: { en: 'Paused', fr: 'Suspendu' },
  invest_hint_recur_aria: { en: 'About recurring contributions', fr: 'À propos des versements' },
  invest_hint_recur: {
    en: 'When a due date lands, the sweep records a real deposit on the account and bumps the next date — weekly or monthly. Pausing stops new deposits; past ones stay in the ledger.',
    fr: 'À la date prévue, l’analyse inscrit un vrai dépôt sur le compte et reporte l’échéance — hebdomadaire ou mensuelle. Suspendre arrête les prochains versements ; ceux passés restent au registre.',
  },
  invest_curve_scope_all: { en: 'Whole book', fr: 'Tout le livre' },
  invest_curve_scope_aria: { en: 'Curve scope', fr: 'Portée de la courbe' },
  /* Saved stress scenarios (0224). [FR self-authored] */
  invest_stress_saved_label: { en: 'Saved scenarios…', fr: 'Scénarios enregistrés…' },
  invest_stress_delete_saved: { en: 'Delete saved scenario', fr: 'Supprimer le scénario' },
  invest_stress_save_name: { en: 'Name this scenario', fr: 'Nommer ce scénario' },
  invest_stress_save: { en: 'Save scenario', fr: 'Enregistrer' },

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
  invest_cancel: { en: 'Cancel', fr: 'Annuler' },
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
  invest_error_load: {
    en: 'Your book could not be loaded — refresh to try again.',
    fr: 'Votre livre n’a pas pu être chargé — actualisez pour réessayer.',
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
  /* Internal-staff tier — shown instead of invest_chat_sub when the signed-in
     account is @dutiva.ca: the server lets Tally advise on this book directly,
     so "never investment advice" would be untrue. [FR self-authored] */
  invest_chat_sub_internal: {
    en: 'The book’s watch clerk — ask about your positions or tell her what to record. Internal staff account: she also advises on this book directly.',
    fr: 'La surveillante du carnet — posez-lui une question sur vos positions ou dites-lui quoi noter. Compte interne : elle vous conseille aussi directement sur ce portefeuille.',
  },
  /* Her opening turn on an empty conversation — a hello, at most one thing
     she noticed from the book, and a question. Built client-side from
     InvestState so it costs no call and stays bilingual. [FR self-authored] */
  invest_chat_hi: { en: 'Hi — I’m Tally, the book’s watch clerk.', fr: 'Bonjour — je suis Tally, la surveillante du carnet.' },
  invest_chat_hi_watch_one: {
    en: 'symbol is on the watchlist.',
    fr: 'symbole est sous surveillance.',
  },
  invest_chat_hi_watch_many: {
    en: 'symbols are on the watchlist.',
    fr: 'symboles sont sous surveillance.',
  },
  invest_chat_hi_orders_one: {
    en: 'order is waiting on you.',
    fr: 'ordre attend votre validation.',
  },
  invest_chat_hi_orders_many: {
    en: 'orders are waiting on you.',
    fr: 'ordres attendent votre validation.',
  },
  invest_chat_hi_signals_one: {
    en: 'open signal on the board.',
    fr: 'signal ouvert au tableau.',
  },
  invest_chat_hi_signals_many: {
    en: 'open signals on the board.',
    fr: 'signaux ouverts au tableau.',
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
  invest_chat_did_watch: { en: 'Now watching “{name}”', fr: '« {name} » ajouté à la liste' },
  invest_chat_did_unwatch: { en: '“{name}” removed from the watchlist', fr: '« {name} » retiré de la liste' },
  invest_chat_did_order: { en: 'Draft order queued — {name}', fr: 'Ordre mis en file — {name}' },
  invest_chat_did_signal: { en: 'Signal “{name}” updated', fr: 'Signal « {name} » mis à jour' },
  invest_chat_did_strategy: { en: 'Strategy “{name}” filed for review', fr: 'Stratégie « {name} » déposée pour validation' },
  invest_chat_did_position: { en: 'Position logged — {name}', fr: 'Position notée — {name}' },
  /* [FR self-authored] */
  invest_chat_did_thesis: { en: 'Thesis draft filed — {name}', fr: 'Thèse déposée — {name}' },
  /* [FR self-authored] */
  invest_chat_did_goal: { en: 'Goal set — {name}', fr: 'Objectif noté — {name}' },
  /* [FR self-authored] */
  invest_chat_did_cash: { en: 'Cash movement recorded — {name}', fr: 'Mouvement de trésorerie noté — {name}' },
  /* [FR self-authored] */
  invest_chat_did_recurring: { en: 'Recurring contribution scheduled — {name}', fr: 'Versement récurrent programmé — {name}' },
  /* [FR self-authored] */
  invest_chat_did_dividend: { en: 'Dividend recorded — {name}', fr: 'Dividende noté — {name}' },
  /* [FR self-authored] */
  invest_chat_did_split: { en: 'Split recorded — {name}', fr: 'Fractionnement noté — {name}' },
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
  /* Empty-state starter chips — tappable prompts that teach the surface.
     The third differs by tier: staff get an advice-shaped ask.
     [FR self-authored] */
  invest_chat_starter_1: {
    en: 'What’s on my watchlist right now?',
    fr: 'Qu’est-ce que je surveille en ce moment ?',
  },
  invest_chat_starter_2: { en: 'Show my open orders', fr: 'Montre mes ordres en attente' },
  invest_chat_starter_ext: {
    en: 'Explain what a limit order is',
    fr: 'Explique ce qu’est un ordre à cours limité',
  },
  invest_chat_starter_int: {
    en: 'What should I buy first for a 5–10 year growth goal?',
    fr: 'Qu’achèterais-tu en premier pour un objectif de croissance de 5 à 10 ans ?',
  },
  invest_chat_internal_badge: { en: 'Internal', fr: 'Interne' },
  invest_chat_retry: { en: 'Retry', fr: 'Réessayer' },
  invest_chat_view: { en: 'View', fr: 'Voir' },
  invest_chat_copy: { en: 'Copy reply', fr: 'Copier la réponse' },
  /* Day separators — relative when the turn is recent. [FR self-authored] */
  invest_chat_day_today: { en: 'Today', fr: 'Aujourd’hui' },
  invest_chat_day_yesterday: { en: 'Yesterday', fr: 'Hier' },
  invest_chat_load_earlier: {
    en: 'Load earlier messages',
    fr: 'Charger les messages précédents',
  },
  invest_chat_enter_hint: {
    en: 'Enter to send · Shift+Enter for a new line',
    fr: 'Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne',
  },
  /* Conversation chrome — the thinking label, scroll pill, and the
     turn-level affordances (regenerate, reuse, stop). [FR self-authored] */
  invest_chat_typing: { en: 'Tally is thinking…', fr: 'Tally réfléchit…' },
  invest_chat_jump: { en: 'Jump to latest', fr: 'Aller au plus récent' },
  invest_chat_regenerate: { en: 'Try another answer', fr: 'Essayer une autre réponse' },
  invest_chat_reuse: { en: 'Reuse this text', fr: 'Réutiliser ce texte' },
  invest_chat_stop: { en: 'Stop', fr: 'Arrêter' },
  /* The model's thinking trace — disclosure on an assistant turn holding
     its reasoning_content. [FR self-authored] */
  invest_chat_reasoning: { en: 'Reasoning', fr: 'Raisonnement' },
  /* Tooltip on the reasoning disclosure — frames the trace as raw working
     so a mid-stream guess isn't read as a verified claim.
     [FR self-authored] */
  invest_chat_reasoning_hint: {
    en: 'Raw working notes — guesses and false starts included',
    fr: 'Notes de travail brutes — essais et hypothèses compris',
  },
  /* The grounding sources behind a reply — collapsed disclosure under an
     assistant turn listing the rows/links it leaned on. [FR self-authored] */
  invest_chat_sources: { en: 'Sources', fr: 'Sources' },
  /* Pending-bubble status while the model's live web lookup runs —
     replaces the typing line until the reply starts streaming.
     [FR self-authored] */
  invest_chat_searching: { en: 'Searching the web…', fr: 'Recherche sur le web…' },
  /* What she reads — a disclosure under the subtitle listing her data
     sources, so the advice surface is honest about its scope.
     [FR self-authored] */
  invest_chat_sees: { en: 'What Tally can see', fr: 'Ce que Tally voit' },
  invest_chat_sees_list: {
    en: 'Your accounts, positions, watchlist, orders, signals, and strategies — and this conversation.',
    fr: 'Vos comptes, positions, liste de suivi, ordres, signaux et stratégies — et cette conversation.',
  },
  /* One-tap reasons under a thumbs-down — stored with the rating.
     [FR self-authored] */
  invest_chat_reason_label: { en: 'What was off?', fr: 'Qu’est-ce qui clochait ?' },
  invest_chat_reason_wrong: { en: 'Not accurate', fr: 'Inexacte' },
  invest_chat_reason_vague: { en: 'Too vague', fr: 'Trop vague' },
  invest_chat_reason_tone: { en: 'Wrong tone', fr: 'Mauvais ton' },
  /* Named conversations — the switcher lists them; the default thread is
     always selectable as the main one. [FR self-authored] */
  invest_chat_threads: { en: 'Conversations', fr: 'Conversations' },
  invest_chat_thread_new: { en: 'New conversation', fr: 'Nouvelle conversation' },
  invest_chat_thread_default: { en: 'Main conversation', fr: 'Conversation principale' },
  invest_chat_thread_untitled: { en: 'Untitled conversation', fr: 'Conversation sans titre' },
  /* Follow-up chips the model offers with a reply — tapping one sends it.
     [FR self-authored] */
  invest_chat_followup_label: { en: 'Follow up', fr: 'Suite possible' },
  /* Overview strip — one thing she noticed, built locally (no call).
     [FR self-authored] */
  invest_home_tally_label: { en: 'Tally noticed', fr: 'Tally a remarqué' },
  /* pl() one/many pairs — the order count covers drafts too, so it says
     'waiting on you', not 'queued'. */
  invest_home_tally_orders_one: {
    en: 'order is waiting on you.',
    fr: 'ordre attend votre validation.',
  },
  invest_home_tally_orders_many: {
    en: 'orders are waiting on you.',
    fr: 'ordres attendent votre validation.',
  },
  invest_home_tally_signals_one: {
    en: 'open signal on the board.',
    fr: 'signal ouvert au tableau.',
  },
  invest_home_tally_signals_many: {
    en: 'open signals on the board.',
    fr: 'signaux ouverts au tableau.',
  },
  invest_home_tally_watch_one: {
    en: 'symbol on the watchlist.',
    fr: 'symbole sous surveillance.',
  },
  invest_home_tally_watch_many: {
    en: 'symbols on the watchlist.',
    fr: 'symboles sous surveillance.',
  },
  invest_home_tally_open: { en: 'Chat with Tally', fr: 'Discuter avec Tally' },
  /* Tally's reads — deterministic one-liners on the computed cards. She
     names the number and the gap, never the verdict, so they're safe for
     every advice tier. The × on a line and the Settings toggle write the
     same pref. [FR self-authored] */
  invest_reads_hide: {
    en: 'Hide Tally’s reads on the charts',
    fr: 'Masquer les lectures de Tally sur les graphiques',
  },
  invest_settings_reads: {
    en: 'Tally’s chart reads',
    fr: 'Lectures de Tally sur les graphiques',
  },
  invest_settings_reads_on: { en: 'On', fr: 'Activées' },
  invest_settings_reads_off: { en: 'Off', fr: 'Désactivées' },
  invest_read_donut_cash: {
    en: 'the biggest slice is cash — {pct}% of the book.',
    fr: 'la plus grande part est en liquidités — {pct} % du carnet.',
  },
  invest_read_donut_status: {
    en: '{symbol} leads at {pct}% — the thesis on it reads “{status}”.',
    fr: '{symbol} arrive en tête à {pct} % — sa thèse est « {status} ».',
  },
  invest_read_donut_bare: {
    en: '{symbol} leads at {pct}% — the biggest slice carries no thesis.',
    fr: '{symbol} arrive en tête à {pct} % — la plus grande part n’a pas de thèse.',
  },
  invest_read_donut_even: {
    en: 'the largest position is {pct}% — the spread is even.',
    fr: 'la plus grande position représente {pct} % — la répartition est équilibrée.',
  },
  invest_read_rebal_fine: {
    en: 'every targeted position sits inside its band.',
    fr: 'chaque position ciblée respecte sa bande.',
  },
  invest_read_rebal_drift: {
    en: '{symbol} is {drift} pts {side} target — the widest drift on the card.',
    fr: '{symbol} est à {drift} pts {side} sa cible — l’écart le plus large du panneau.',
  },
  invest_read_rebal_side_over: { en: 'over', fr: 'au-dessus de' },
  invest_read_rebal_side_under: { en: 'under', fr: 'sous' },
  invest_read_rebal_unwatched: {
    en: 'No strategy watches it.',
    fr: 'Aucune stratégie ne la surveille.',
  },
  invest_read_rebal_more: {
    en: '{n} more sit outside the band.',
    fr: '{n} autres sortent de leur bande.',
  },
  invest_read_curve_up: {
    en: 'up {chg} over the window — the deepest dip was {dd}.',
    fr: 'en hausse de {chg} sur la période — le creux le plus profond a été {dd}.',
  },
  invest_read_curve_up_nodip: {
    en: 'up {chg} over the window — never below the start.',
    fr: 'en hausse de {chg} sur la période — jamais sous le point de départ.',
  },
  invest_read_curve_down: {
    en: 'down {chg} over the window — the deepest dip reached {dd}.',
    fr: 'en baisse de {chg} sur la période — le creux le plus profond a atteint {dd}.',
  },
  /* Rare but real — deposits can mask a decline the curve never dips
     through. The dip clause drops, the sign stays honest. */
  invest_read_curve_down_nodip: {
    en: 'down {chg} over the window — never below the start.',
    fr: 'en baisse de {chg} sur la période — jamais sous le point de départ.',
  },
  /* The other no-dip case: a slide where the last mark is the deepest
     point — 'never below the start' would state the opposite. */
  invest_read_curve_down_slide: {
    en: 'down {chg} over the window — the last mark is the low.',
    fr: 'en baisse de {chg} sur la période — le dernier relevé est le creux.',
  },
  invest_read_curve_flat: {
    en: 'flat over the window — inside a tenth of a point either way.',
    fr: 'stable sur la période — à moins d’un dixième de point dans les deux sens.',
  },
  /* A one-day span isn't a 'window' — say so rather than sounding a verdict. */
  invest_read_curve_first_day: {
    en: '{chg} across its first day on the books.',
    fr: '{chg} pour son premier jour suivi.',
  },
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
