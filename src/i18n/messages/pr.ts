import { defineMessages } from '../core'

/**
 * Dutiva PR portal chrome — the standalone, invite-only communications
 * surface under `/pr`: campaigns, a content desk, a media-contact list,
 * keyword tracking, and a coverage log for one communications function.
 *
 * Positioning: this is a planning and tracking desk. It records intent —
 * drafts, schedules, contacts, positions — and it never publishes, posts,
 * or sends anything itself. A "scheduled" item is a reminder of when the
 * user means to publish it by hand; no automation acts on it.
 *
 * [FR self-authored — not from a design handoff; hedge strength matched.]
 */
export const prMessages = defineMessages({
  pr_title: { en: 'PR', fr: 'RP' },
  pr_portal_title: { en: 'PR', fr: 'RP' },
  pr_subtitle: {
    en: 'One desk for campaigns, content, media, search, and coverage.',
    fr: 'Un seul bureau pour les campagnes, le contenu, les médias, le référencement et les retombées.',
  },
  pr_note: {
    en: 'Dutiva PR is a planning and tracking desk. It records what you intend to publish — it never posts, sends, or publishes anything on its own.',
    fr: 'Dutiva RP est un bureau de planification et de suivi. Il consigne ce que vous comptez publier — il ne publie, n’envoie ni ne diffuse rien lui-même.',
  },

  /* Tabs */
  pr_tab_overview: { en: 'Overview', fr: 'Aperçu' },
  pr_tab_campaigns: { en: 'Campaigns', fr: 'Campagnes' },
  pr_tab_content: { en: 'Content', fr: 'Contenu' },
  pr_tab_media: { en: 'Media', fr: 'Médias' },
  pr_tab_seo: { en: 'SEO', fr: 'SEO' },
  pr_tab_mentions: { en: 'Coverage', fr: 'Retombées' },
  pr_tab_answers: { en: 'AI answers', fr: 'Réponses IA' },
  pr_tab_report: { en: 'Report', fr: 'Rapport' },
  pr_tab_review: { en: 'For review', fr: 'À valider' },

  /* Sign-in wall + access gate */
  pr_signin_title: { en: 'Sign in to Dutiva PR', fr: 'Se connecter à Dutiva RP' },
  pr_signin_body: {
    en: 'Enter your email and we’ll send you a one-time sign-in code. No password needed.',
    fr: 'Entrez votre courriel et nous vous enverrons un code de connexion à usage unique. Aucun mot de passe requis.',
  },
  pr_signin_email: { en: 'Email', fr: 'Courriel' },
  pr_signin_send: { en: 'Send code', fr: 'Envoyer le code' },
  pr_signin_sent: {
    en: 'We sent a sign-in code to {email}. It expires shortly — check your spam folder if it doesn’t arrive.',
    fr: 'Nous avons envoyé un code de connexion à {email}. Il expire bientôt — vérifiez vos courriers indésirables s’il n’arrive pas.',
  },
  pr_signin_code: { en: 'Sign-in code', fr: 'Code de connexion' },
  pr_signin_verify: { en: 'Sign in', fr: 'Se connecter' },
  pr_signin_error: {
    en: 'Something went wrong. Check the code and try again.',
    fr: 'Une erreur s’est produite. Vérifiez le code et réessayez.',
  },
  pr_access_title: { en: 'Access required', fr: 'Accès requis' },
  pr_access_body: {
    en: 'Dutiva PR is invite-only while it’s in early access. Your account doesn’t have a PR grant yet — contact support to request one.',
    fr: 'Dutiva RP est sur invitation pendant son accès anticipé. Votre compte n’a pas encore d’accès RP — contactez le soutien pour en faire la demande.',
  },
  pr_access_contact: { en: 'Contact support', fr: 'Contacter le soutien' },

  /* Overview */
  pr_ov_title: { en: 'Overview', fr: 'Aperçu' },
  pr_ov_sub: {
    en: 'What’s planned, what’s scheduled, and what people are saying.',
    fr: 'Ce qui est prévu, ce qui est programmé et ce qu’on en dit.',
  },
  pr_ov_active: { en: 'Active campaigns', fr: 'Campagnes actives' },
  pr_ov_scheduled: { en: 'Scheduled content', fr: 'Contenu programmé' },
  pr_ov_contacts: { en: 'Media contacts', fr: 'Contacts médias' },
  pr_ov_mentions_30d: { en: 'Coverage (30 days)', fr: 'Retombées (30 jours)' },
  pr_ov_answers: { en: 'AI answers cited', fr: 'Réponses IA citées' },
  pr_ov_upcoming: { en: 'Coming up', fr: 'À venir' },
  pr_ov_latest_mentions: { en: 'Latest coverage', fr: 'Dernières retombées' },
  pr_ov_new_campaign: { en: 'New campaign', fr: 'Nouvelle campagne' },
  pr_ov_new_content: { en: 'Draft content', fr: 'Rédiger du contenu' },
  pr_ov_empty_mentions: {
    en: 'No coverage logged yet. Add the first mention.',
    fr: 'Aucune retombée consignée pour l’instant. Ajoutez la première mention.',
  },
  pr_ov_empty_upcoming: {
    en: 'Nothing scheduled. Draft content and pick a date to see it here.',
    fr: 'Rien de programmé. Rédigez du contenu et choisissez une date pour le voir ici.',
  },

  /* Campaigns */
  pr_camp_title: { en: 'Campaigns', fr: 'Campagnes' },
  pr_camp_sub: {
    en: 'The pushes you’re running — across social, search, press, and anywhere else you show up.',
    fr: 'Les actions que vous menez — sur les réseaux sociaux, les moteurs de recherche, la presse et partout où vous êtes présent.',
  },
  pr_camp_new: { en: 'New campaign', fr: 'Nouvelle campagne' },
  pr_camp_name: { en: 'Name', fr: 'Nom' },
  pr_camp_name_ph: { en: 'e.g. Fall launch push', fr: 'p. ex. Lancement d’automne' },
  pr_camp_channel: { en: 'Channel', fr: 'Canal' },
  pr_camp_status: { en: 'Status', fr: 'Statut' },
  pr_camp_objective: { en: 'Objective', fr: 'Objectif' },
  pr_camp_objective_ph: {
    en: 'What should this campaign change?',
    fr: 'Que doit changer cette campagne ?',
  },
  pr_camp_budget: { en: 'Budget', fr: 'Budget' },
  pr_camp_start: { en: 'Starts', fr: 'Début' },
  pr_camp_end: { en: 'Ends', fr: 'Fin' },
  pr_camp_save: { en: 'Save campaign', fr: 'Enregistrer la campagne' },
  pr_camp_saved: { en: 'Campaign saved.', fr: 'Campagne enregistrée.' },
  pr_camp_edit: { en: 'Edit', fr: 'Modifier' },
  pr_camp_cancel: { en: 'Cancel', fr: 'Annuler' },
  pr_camp_delete: { en: 'Delete', fr: 'Supprimer' },
  pr_camp_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  pr_camp_empty: {
    en: 'No campaigns yet. Create one to start planning a push.',
    fr: 'Aucune campagne pour l’instant. Créez-en une pour planifier une action.',
  },
  pr_camp_items: { en: '{count} items', fr: '{count} éléments' },

  /* Channel + status vocabularies (campaigns, content) */
  pr_chan_mixed: { en: 'Mixed', fr: 'Mixte' },
  pr_chan_social: { en: 'Social', fr: 'Réseaux sociaux' },
  pr_chan_search: { en: 'Search', fr: 'Recherche' },
  pr_chan_display: { en: 'Display', fr: 'Affichage' },
  pr_chan_email: { en: 'Email', fr: 'Courriel' },
  pr_chan_press: { en: 'Press', fr: 'Presse' },
  pr_chan_events: { en: 'Events', fr: 'Événements' },
  pr_chan_other: { en: 'Other', fr: 'Autre' },
  pr_status_draft: { en: 'Draft', fr: 'Brouillon' },
  pr_status_active: { en: 'Active', fr: 'Active' },
  pr_status_paused: { en: 'Paused', fr: 'En pause' },
  pr_status_done: { en: 'Done', fr: 'Terminée' },
  pr_status_scheduled: { en: 'Scheduled', fr: 'Programmé' },
  pr_status_published: { en: 'Published', fr: 'Publié' },

  /* Content desk */
  pr_content_title: { en: 'Content desk', fr: 'Bureau de contenu' },
  pr_content_sub: {
    en: 'Draft posts, releases, and ad copy in one place — then schedule when each goes out.',
    fr: 'Rédigez publications, communiqués et textes publicitaires au même endroit — puis choisissez quand chacun paraît.',
  },
  pr_content_new: { en: 'New item', fr: 'Nouvel élément' },
  pr_content_kind: { en: 'Type', fr: 'Type' },
  pr_kind_post: { en: 'Social post', fr: 'Publication' },
  pr_kind_release: { en: 'Press release', fr: 'Communiqué' },
  pr_kind_ad: { en: 'Ad copy', fr: 'Texte publicitaire' },
  pr_kind_article: { en: 'Article', fr: 'Article' },
  pr_kind_brief: { en: 'Brief', fr: 'Note d’information' },
  pr_content_title_field: { en: 'Title', fr: 'Titre' },
  pr_content_title_ph: { en: 'Headline or working title.', fr: 'Manchette ou titre de travail.' },
  pr_content_body: { en: 'Body', fr: 'Texte' },
  pr_content_body_ph: {
    en: 'The copy itself — paste a draft or write it here.',
    fr: 'Le texte même — collez une ébauche ou rédigez-la ici.',
  },
  pr_content_channel: { en: 'Channel (optional)', fr: 'Canal (facultatif)' },
  pr_content_channel_ph: { en: 'e.g. LinkedIn, wire, blog', fr: 'p. ex. LinkedIn, fil de presse, blogue' },
  pr_content_campaign: { en: 'Campaign (optional)', fr: 'Campagne (facultatif)' },
  pr_content_no_campaign: { en: 'No campaign', fr: 'Aucune campagne' },
  pr_content_status: { en: 'Status', fr: 'Statut' },
  pr_content_when: { en: 'Scheduled for', fr: 'Programmé pour' },
  pr_content_save: { en: 'Save item', fr: 'Enregistrer l’élément' },
  pr_content_saved: { en: 'Item saved.', fr: 'Élément enregistré.' },
  pr_content_edit: { en: 'Edit', fr: 'Modifier' },
  pr_content_cancel: { en: 'Cancel', fr: 'Annuler' },
  pr_content_delete: { en: 'Delete', fr: 'Supprimer' },
  pr_content_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  pr_content_empty: {
    en: 'Nothing drafted yet. Start with a post, release, or ad.',
    fr: 'Rien de rédigé pour l’instant. Commencez par une publication, un communiqué ou une annonce.',
  },
  pr_content_note: {
    en: 'Scheduling here is a plan, not an autopilot — nothing posts itself.',
    fr: 'La programmation ici est un plan, pas un pilote automatique — rien ne se publie tout seul.',
  },
  pr_content_untitled: { en: 'Untitled', fr: 'Sans titre' },
  pr_content_live_url: { en: 'Live URL', fr: 'URL en ligne' },
  pr_content_live_url_ph: {
    en: 'Where it actually went out — the link you’ll want later.',
    fr: 'Où il a réellement paru — le lien que vous voudrez plus tard.',
  },
  pr_content_live: { en: 'Live', fr: 'En ligne' },

  /* Media contacts */
  pr_media_title: { en: 'Media list', fr: 'Liste de médias' },
  pr_media_sub: {
    en: 'The journalists, editors, and outlets you work with — and what they cover.',
    fr: 'Les journalistes, rédacteurs et médias avec qui vous travaillez — et ce qu’ils couvrent.',
  },
  pr_media_new: { en: 'Add contact', fr: 'Ajouter un contact' },
  pr_media_name: { en: 'Name', fr: 'Nom' },
  pr_media_name_ph: { en: 'e.g. Alex Tremblay', fr: 'p. ex. Alex Tremblay' },
  pr_media_outlet: { en: 'Outlet', fr: 'Média' },
  pr_media_outlet_ph: { en: 'e.g. The Gazette', fr: 'p. ex. La Presse' },
  pr_media_beat: { en: 'Beat', fr: 'Sujet couvert' },
  pr_media_beat_ph: { en: 'e.g. Tech, municipal affairs', fr: 'p. ex. Techno, affaires municipales' },
  pr_media_email: { en: 'Email', fr: 'Courriel' },
  pr_media_note: { en: 'Note (optional)', fr: 'Note (facultatif)' },
  pr_media_note_ph: { en: 'Preferred beat, last pitch, anything useful.', fr: 'Sujet préféré, dernier pitch, tout ce qui est utile.' },
  pr_media_save: { en: 'Save contact', fr: 'Enregistrer le contact' },
  pr_media_saved: { en: 'Contact saved.', fr: 'Contact enregistré.' },
  pr_media_delete: { en: 'Delete', fr: 'Supprimer' },
  pr_media_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  pr_media_empty: {
    en: 'No contacts yet. Add the first journalist or outlet you pitch.',
    fr: 'Aucun contact pour l’instant. Ajoutez le premier journaliste ou média.',
  },

  /* SEO keywords */
  pr_seo_title: { en: 'SEO tracking', fr: 'Suivi SEO' },
  pr_seo_sub: {
    en: 'The keywords you care about and where they rank — updated by hand when you check.',
    fr: 'Les mots-clés qui comptent et leur position — mis à jour manuellement quand vous vérifiez.',
  },
  pr_seo_new: { en: 'Track keyword', fr: 'Suivre un mot-clé' },
  pr_seo_keyword: { en: 'Keyword', fr: 'Mot-clé' },
  pr_seo_keyword_ph: { en: 'e.g. HR compliance Canada', fr: 'p. ex. conformité RH Canada' },
  pr_seo_url: { en: 'Target URL (optional)', fr: 'URL cible (facultatif)' },
  pr_seo_url_ph: { en: 'https://dutiva.ca/…', fr: 'https://dutiva.ca/…' },
  pr_seo_position: { en: 'Current position', fr: 'Position actuelle' },
  pr_seo_position_ph: { en: 'e.g. 12', fr: 'p. ex. 12' },
  pr_seo_update_position: { en: 'Update position', fr: 'Mettre à jour' },
  pr_seo_save: { en: 'Save keyword', fr: 'Enregistrer le mot-clé' },
  pr_seo_saved: { en: 'Keyword saved.', fr: 'Mot-clé enregistré.' },
  pr_seo_delete: { en: 'Delete', fr: 'Supprimer' },
  pr_seo_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  pr_seo_empty: {
    en: 'No keywords tracked yet. Add the searches you want to watch.',
    fr: 'Aucun mot-clé suivi pour l’instant. Ajoutez les recherches à surveiller.',
  },
  pr_seo_pos_col: { en: 'Position', fr: 'Position' },
  pr_seo_delta_col: { en: 'Change', fr: 'Variation' },
  pr_seo_url_col: { en: 'Target URL', fr: 'URL cible' },
  pr_seo_checked: { en: 'Checked {date}', fr: 'Vérifié le {date}' },
  pr_seo_never: { en: 'Not checked yet', fr: 'Pas encore vérifié' },
  pr_seo_unranked: { en: 'Unranked', fr: 'Non classé' },
  pr_seo_note: {
    en: 'Positions are manual snapshots, not live rankings — update them when you check a search.',
    fr: 'Les positions sont des relevés manuels, pas des classements en direct — mettez-les à jour quand vous faites une recherche.',
  },
  pr_seo_import: { en: 'Import', fr: 'Importer' },
  pr_seo_import_title: { en: 'Import keywords', fr: 'Importer des mots-clés' },
  pr_seo_import_body: {
    en: 'One per line: keyword, position, URL. Paste a column from Search Console or a spreadsheet — commas or tabs both work.',
    fr: 'Un par ligne : mot-clé, position, URL. Collez une colonne de Search Console ou d’un tableur — virgules et tabulations fonctionnent.',
  },
  pr_seo_import_ph: {
    en: 'HR compliance Canada, 12, https://dutiva.ca/\ntermination letter template Ontario, 22\nDutiva',
    fr: 'conformité RH Canada, 12, https://dutiva.ca/fr\nmodèle de lettre de congédiement Ontario, 22\nDutiva',
  },
  pr_seo_import_go: { en: 'Import {count} keywords', fr: 'Importer {count} mots-clés' },
  pr_seo_import_done: { en: '{count} keywords imported.', fr: '{count} mots-clés importés.' },
  pr_seo_import_none: {
    en: 'Nothing to import — each line needs at least a keyword.',
    fr: 'Rien à importer — chaque ligne doit au moins contenir un mot-clé.',
  },
  pr_seo_cancel: { en: 'Cancel', fr: 'Annuler' },

  /* Mentions / coverage log */
  pr_men_title: { en: 'Coverage', fr: 'Retombées' },
  pr_men_sub: {
    en: 'Every place you were mentioned — press, blogs, social. The log you’ll point to later.',
    fr: 'Partout où l’on a parlé de vous — presse, blogues, réseaux sociaux. Le registre que vous montrerez plus tard.',
  },
  pr_men_new: { en: 'Log coverage', fr: 'Consigner une retombée' },
  pr_men_source: { en: 'Source', fr: 'Source' },
  pr_men_source_ph: { en: 'e.g. CBC, a trade blog', fr: 'p. ex. Radio-Canada, un blogue spécialisé' },
  pr_men_headline: { en: 'Headline', fr: 'Manchette' },
  pr_men_headline_ph: { en: 'What they called it.', fr: 'Le titre qu’ils ont choisi.' },
  pr_men_url: { en: 'Link (optional)', fr: 'Lien (facultatif)' },
  pr_men_url_ph: { en: 'https://…', fr: 'https://…' },
  pr_men_sentiment: { en: 'Tone', fr: 'Ton' },
  pr_men_positive: { en: 'Positive', fr: 'Positif' },
  pr_men_neutral: { en: 'Neutral', fr: 'Neutre' },
  pr_men_negative: { en: 'Negative', fr: 'Négatif' },
  pr_men_date: { en: 'Date', fr: 'Date' },
  pr_men_save: { en: 'Save mention', fr: 'Enregistrer la retombée' },
  pr_men_saved: { en: 'Coverage logged.', fr: 'Retombée consignée.' },
  pr_men_delete: { en: 'Delete', fr: 'Supprimer' },
  pr_men_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  pr_men_empty: {
    en: 'Nothing logged yet. When someone covers you, record it here.',
    fr: 'Rien de consigné pour l’instant. Quand on parle de vous, notez-le ici.',
  },
  pr_men_view: { en: 'View', fr: 'Voir' },
  pr_men_fetch: { en: 'Fetch details', fr: 'Récupérer les détails' },
  pr_men_fetching: { en: 'Fetching…', fr: 'Récupération…' },
  pr_men_fetched: {
    en: 'Details filled in — check them before saving.',
    fr: 'Détails remplis — vérifiez-les avant d’enregistrer.',
  },
  pr_men_fetch_fail: {
    en: 'Couldn’t read that page. Fill in the details yourself.',
    fr: 'Impossible de lire cette page. Remplissez les détails vous-même.',
  },

  /* Coverage feeds — paste a Google Alerts RSS link; new items land as
     mentions on their own. Neutral tone until you review them. */
  pr_men_feeds_title: { en: 'Coverage feeds', fr: 'Fils de retombées' },
  pr_men_feeds_sub: {
    en: 'Paste a Google Alerts RSS link (or any news feed) — new items become coverage entries on their own.',
    fr: 'Collez un lien RSS Google Alerts (ou n’importe quel fil d’actualités) — les nouveaux éléments deviennent des retombées automatiquement.',
  },
  pr_men_feed_url: { en: 'Feed URL', fr: 'Adresse du fil' },
  pr_men_feed_url_ph: { en: 'https://www.google.com/alerts/feeds/…', fr: 'https://www.google.com/alerts/feeds/…' },
  pr_men_feed_label: { en: 'Name (optional)', fr: 'Nom (facultatif)' },
  pr_men_feed_label_ph: { en: 'e.g. “Dutiva” alerts', fr: 'p. ex. alertes « Dutiva »' },
  pr_men_feed_add: { en: 'Add feed', fr: 'Ajouter le fil' },
  pr_men_feed_added: { en: 'Feed saved.', fr: 'Fil enregistré.' },
  pr_men_feed_invalid: {
    en: 'That doesn’t look like a feed URL — paste the RSS link.',
    fr: 'Cette adresse ne ressemble pas à un fil — collez le lien RSS.',
  },
  pr_men_feed_sync: { en: 'Sync now', fr: 'Synchroniser' },
  pr_men_feed_syncing: { en: 'Syncing…', fr: 'Synchronisation…' },
  pr_men_feed_synced_one: { en: 'Sync done — 1 new mention added.', fr: 'Synchronisation terminée — 1 nouvelle retombée ajoutée.' },
  pr_men_feed_synced_many: { en: 'Sync done — {count} new mentions added.', fr: 'Synchronisation terminée — {count} nouvelles retombées ajoutées.' },
  pr_men_feed_synced_none: { en: 'Sync done — nothing new.', fr: 'Synchronisation terminée — rien de nouveau.' },
  pr_men_feed_last: { en: 'Last synced {date}', fr: 'Synchronisé le {date}' },
  pr_men_feed_never: {
    en: 'Not synced yet — runs daily and on demand.',
    fr: 'Pas encore synchronisé — s’exécute chaque jour et sur demande.',
  },
  pr_men_feed_delete: { en: 'Remove', fr: 'Retirer' },
  pr_men_feed_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  pr_men_feeds_empty: {
    en: 'No feeds yet. In Google Alerts, set “Deliver to: RSS feed” and paste the link here.',
    fr: 'Aucun fil pour l’instant. Dans Google Alerts, choisissez « Envoyer à : flux RSS » et collez le lien ici.',
  },

  /* AI answers (GEO) — manual spot-checks of assistant visibility */
  pr_ans_title: { en: 'AI answers', fr: 'Réponses IA' },
  pr_ans_sub: {
    en: 'The questions people actually ask ChatGPT, Perplexity, and friends — and whether you come up.',
    fr: 'Les questions que les gens posent vraiment à ChatGPT, Perplexity et les autres — et si vous y figurez.',
  },
  pr_ans_new: { en: 'Track a prompt', fr: 'Suivre une question' },
  pr_ans_prompt: { en: 'Prompt', fr: 'Question' },
  pr_ans_prompt_ph: {
    en: 'e.g. best HR compliance tools for a small Canadian business',
    fr: 'p. ex. meilleurs outils de conformité RH pour une petite entreprise canadienne',
  },
  pr_ans_engine: { en: 'Assistant', fr: 'Assistant' },
  pr_ans_engine_chatgpt: { en: 'ChatGPT', fr: 'ChatGPT' },
  pr_ans_engine_perplexity: { en: 'Perplexity', fr: 'Perplexity' },
  pr_ans_engine_gemini: { en: 'Gemini', fr: 'Gemini' },
  pr_ans_engine_copilot: { en: 'Copilot', fr: 'Copilot' },
  pr_ans_engine_other: { en: 'Other', fr: 'Autre' },
  pr_ans_result: { en: 'Last result', fr: 'Dernier résultat' },
  pr_ans_res_unchecked: { en: 'Not checked', fr: 'Pas vérifié' },
  pr_ans_res_cited: { en: 'Cited', fr: 'Citée' },
  pr_ans_res_mentioned: { en: 'Mentioned', fr: 'Mentionnée' },
  pr_ans_res_absent: { en: 'Not found', fr: 'Absente' },
  pr_ans_note: { en: 'Note (optional)', fr: 'Note (facultatif)' },
  pr_ans_note_ph: {
    en: 'e.g. named third, no link; suggested a competitor',
    fr: 'p. ex. nommée troisième, sans lien ; a suggéré un concurrent',
  },
  pr_ans_check: { en: 'Log result', fr: 'Consigner' },
  pr_ans_checked: { en: 'Checked {date}', fr: 'Vérifié le {date}' },
  pr_ans_never: { en: 'Not checked yet', fr: 'Pas encore vérifié' },
  pr_ans_save: { en: 'Save prompt', fr: 'Enregistrer la question' },
  pr_ans_saved: { en: 'Prompt saved.', fr: 'Question enregistrée.' },
  pr_ans_updated: { en: 'Result logged.', fr: 'Résultat consigné.' },
  pr_ans_delete: { en: 'Delete', fr: 'Supprimer' },
  pr_ans_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  pr_ans_empty: {
    en: 'No prompts tracked yet. Add the questions you’d want to be named in.',
    fr: 'Aucune question suivie pour l’instant. Ajoutez celles où vous voudriez être nommé.',
  },
  pr_ans_note_banner: {
    en: 'These are your own spot-checks — assistants personalize answers, so treat results as directional, not definitive.',
    fr: 'Ce sont vos propres vérifications ponctuelles — les assistants personnalisent leurs réponses, alors prenez les résultats comme indicatifs, pas définitifs.',
  },

  /* Auto-checks — the tracked prompt is sent to the configured AI model on a
     daily schedule (and on demand); its answer is scored for a Dutiva link or
     brand mention. Directional by design — it measures what one model says,
     not what ChatGPT/Perplexity show a given user. */
  pr_ans_run: { en: 'Run checks', fr: 'Vérifier maintenant' },
  pr_ans_running: { en: 'Checking…', fr: 'Vérification…' },
  pr_ans_ran_one: {
    en: '1 prompt checked against the configured model.',
    fr: '1 question vérifiée avec le modèle configuré.',
  },
  pr_ans_ran_many: {
    en: '{count} prompts checked against the configured model.',
    fr: '{count} questions vérifiées avec le modèle configuré.',
  },
  pr_ans_run_fail: {
    en: 'Checks didn’t run — the model may be unavailable. Try again in a bit.',
    fr: 'La vérification a échoué — le modèle est peut-être indisponible. Réessayez dans un moment.',
  },
  pr_ans_via_auto: { en: 'Auto-check', fr: 'Vérif. auto' },
  pr_ans_via_manual: { en: 'Manual', fr: 'Manuelle' },
  pr_ans_auto_note: {
    en: 'Auto-checks run daily through the configured AI model and record whether its answer names or links to the brand — a directional signal, not what a specific assistant shows your customers.',
    fr: 'Les vérifications automatiques s’exécutent chaque jour avec le modèle d’IA configuré et notent si sa réponse nomme ou cite la marque — un signal indicatif, pas ce qu’un assistant précis montre à vos clients.',
  },

  /* Connections — external platforms the desk can reach once their OAuth
     apps clear review. Rows render pending until a real flow lands. */
  pr_ov_conn_title: { en: 'Connections', fr: 'Connexions' },
  pr_ov_conn_sub: {
    en: 'External platforms the desk can post to or pull reports from.',
    fr: 'Les plateformes externes où le bureau peut publier ou tirer des rapports.',
  },
  pr_ov_conn_buffer: { en: 'Buffer', fr: 'Buffer' },
  pr_ov_conn_linkedin: { en: 'LinkedIn', fr: 'LinkedIn' },
  pr_ov_conn_meta: { en: 'Meta', fr: 'Meta' },
  pr_ov_conn_search_console: { en: 'Google Search Console', fr: 'Google Search Console' },
  pr_ov_conn_pending: { en: 'Pending setup', fr: 'En attente' },
  pr_ov_conn_connected: { en: 'Connected', fr: 'Connecté' },
  pr_ov_conn_error: { en: 'Needs attention', fr: 'À vérifier' },
  pr_ov_conn_disconnected: { en: 'Disconnected', fr: 'Déconnecté' },
  pr_ov_conn_note: {
    en: 'Publishing and Search Console connections need platform-approved OAuth apps — setup is in progress. Nothing here posts on its own.',
    fr: 'Les connexions de publication et de Search Console exigent des applications OAuth approuvées par les plateformes — la configuration est en cours. Rien ici ne publie tout seul.',
  },

  /* Notifications — coverage digests piggyback on the daily feed sync; one
     email a day at most, only when new items actually landed. */
  pr_notify_label: { en: 'Email me new coverage', fr: 'M’envoyer les nouvelles retombées' },
  pr_notify_hint: {
    en: 'One email a day at most, only when a feed adds something.',
    fr: 'Un courriel par jour au plus, seulement quand un fil ajoute quelque chose.',
  },

  /* Monthly report — derived from the desk’s own rows, exported as Markdown. */
  pr_rep_title: { en: 'Monthly report', fr: 'Rapport mensuel' },
  pr_rep_sub: {
    en: 'What the desk recorded this month — coverage, output, and movement.',
    fr: 'Ce que le bureau a noté ce mois-ci — retombées, production et mouvements.',
  },
  pr_rep_month: { en: 'Month', fr: 'Mois' },
  pr_rep_export: { en: 'Download Markdown', fr: 'Télécharger en Markdown' },
  pr_rep_coverage: { en: 'Coverage', fr: 'Retombées' },
  pr_rep_coverage_tone: { en: '{pos} positive · {neu} neutral · {neg} negative', fr: '{pos} positive · {neu} neutre · {neg} négative' },
  pr_rep_coverage_empty: { en: 'Nothing logged this month.', fr: 'Rien de consigné ce mois-ci.' },
  pr_rep_top_outlets: { en: 'Top outlets', fr: 'Médias principaux' },
  pr_rep_content: { en: 'Published content', fr: 'Contenus publiés' },
  pr_rep_content_line: { en: '{count} piece(s) marked published', fr: '{count} contenu(s) marqué(s) publié(s)' },
  pr_rep_content_empty: { en: 'Nothing marked published this month.', fr: 'Rien de marqué publié ce mois-ci.' },
  pr_rep_campaigns: { en: 'Campaigns now', fr: 'Campagnes actuelles' },
  pr_rep_campaigns_line: {
    en: '{active} active · {draft} planning · {paused} paused · {done} done',
    fr: '{active} active(s) · {draft} en planification · {paused} en pause · {done} terminée(s)',
  },
  pr_rep_search: { en: 'Search positions', fr: 'Positions en recherche' },
  pr_rep_search_line: { en: '{up} up · {down} down · {flat} flat of {total} checked', fr: '{up} en hausse · {down} en baisse · {flat} stable(s) sur {total} vérifié(s)' },
  pr_rep_search_empty: { en: 'No keywords checked this month.', fr: 'Aucun mot-clé vérifié ce mois-ci.' },
  pr_rep_answers: { en: 'AI answers', fr: 'Réponses IA' },
  pr_rep_answers_line: {
    en: '{cited} cited · {mentioned} mentioned · {absent} absent of {total} checks',
    fr: '{cited} citée · {mentioned} mentionnée · {absent} absente sur {total} vérifications',
  },
  pr_rep_answers_via: { en: '{auto} auto · {manual} manual', fr: '{auto} auto · {manual} manuelles' },
  pr_rep_answers_empty: { en: 'No prompts checked this month.', fr: 'Aucune question vérifiée ce mois-ci.' },
  pr_rep_note: {
    en: 'A snapshot of what you recorded — nothing here is measured beyond your own entries and feed pulls.',
    fr: 'Un aperçu de ce que vous avez consigné — rien ici n’est mesuré au-delà de vos propres entrées et des fils.',
  },
  pr_rep_file_name: { en: 'dutiva-pr-report', fr: 'rapport-dutiva-rp' },

  /* AI assists — every model output lands as a suggestion the human edits
     or overrides; nothing ships straight from the model. */
  pr_ai_tone_suggest: { en: 'Suggest', fr: 'Suggérer' },
  pr_ai_tone_suggesting: { en: 'Guessing…', fr: 'Suggestion…' },
  pr_ai_tone_tag: { en: 'AI', fr: 'IA' },
  pr_ai_tone_failed: {
    en: 'No tone suggestion right now — pick one yourself.',
    fr: 'Pas de suggestion pour le moment — choisissez-en une.',
  },
  pr_ai_draft_btn: { en: 'Draft with AI', fr: 'Rédiger avec l’IA' },
  pr_ai_drafting: { en: 'Drafting…', fr: 'Rédaction…' },
  pr_ai_draft_note: {
    en: 'AI draft — read it over and edit before saving.',
    fr: 'Ébauche IA — relisez et modifiez avant d’enregistrer.',
  },
  pr_ai_draft_failed: {
    en: 'Drafting failed — write it yourself for now.',
    fr: 'La rédaction a échoué — rédigez vous-même pour l’instant.',
  },
  pr_ai_intro_btn: { en: 'Write an intro', fr: 'Rédiger une intro' },
  pr_ai_intro_writing: { en: 'Writing…', fr: 'Rédaction…' },
  pr_ai_intro_tag: {
    en: 'AI intro — it describes the numbers below, nothing more.',
    fr: 'Intro IA — elle décrit les chiffres ci-dessous, rien de plus.',
  },
  pr_ai_intro_failed: {
    en: 'No intro this time — the numbers still speak for themselves.',
    fr: 'Pas d’intro cette fois — les chiffres parlent d’eux-mêmes.',
  },
  pr_ai_intro_md: { en: 'Intro (AI draft)', fr: 'Intro (ébauche IA)' },
  pr_ai_themes_btn: { en: 'Find themes', fr: 'Dégager les thèmes' },
  pr_ai_themes_working: { en: 'Grouping…', fr: 'Regroupement…' },
  pr_ai_themes_tag: {
    en: 'AI grouping — headlines, sorted roughly. Your read may differ.',
    fr: 'Regroupement IA — un premier tri des manchettes. Votre lecture peut différer.',
  },
  pr_ai_themes_failed: {
    en: 'No themes came back — the coverage list is still all there.',
    fr: 'Aucun thème n’est revenu — la liste de couverture est toujours là.',
  },
  pr_ai_prompts_btn: { en: 'Suggest questions', fr: 'Suggérer des questions' },
  pr_ai_prompts_working: { en: 'Thinking…', fr: 'Réflexion…' },
  pr_ai_prompts_hint: {
    en: 'Suggested — add any worth tracking.',
    fr: 'Suggestions — ajoutez celles qui valent le suivi.',
  },
  pr_ai_prompts_failed: {
    en: 'No suggestions right now — your own questions work too.',
    fr: 'Pas de suggestions pour l’instant — vos propres questions conviennent aussi.',
  },
  pr_ai_add: { en: 'Add', fr: 'Ajouter' },
  pr_ai_dismiss: { en: 'Dismiss', fr: 'Ignorer' },
  pr_ai_pitch_btn: { en: 'Draft a pitch', fr: 'Rédiger un pitch' },
  pr_ai_pitch_working: { en: 'Drafting…', fr: 'Rédaction…' },
  pr_ai_pitch_note: {
    en: 'AI draft — edit it and send it yourself; nothing goes out from here.',
    fr: 'Ébauche IA — modifiez-la et envoyez-la vous-même ; rien ne part d’ici.',
  },
  pr_ai_pitch_failed: {
    en: 'No draft right now — write it yourself for now.',
    fr: 'Pas d’ébauche pour l’instant — rédigez-la vous-même.',
  },
  pr_ai_pitch_copy: { en: 'Copy', fr: 'Copier' },
  pr_ai_pitch_copied: { en: 'Copied', fr: 'Copié' },
  pr_ai_pitch_mailto: { en: 'Open in email', fr: 'Ouvrir dans le courriel' },
  /* Queue write didn't land upstream — the suggestion works but won't
     survive leaving the page. [FR self-authored] */
  pr_ai_not_filed: {
    en: 'Not saved for review — it disappears if you leave this page.',
    fr: 'Non conservée pour validation — elle disparaît si vous quittez la page.',
  },

  /* For review — work agents filed for a human decision */
  pr_review_title: { en: 'For review', fr: 'À valider' },
  pr_review_sub: {
    en: 'Drafts and ideas the desk’s agents produced — each waits on your call, nothing acts on its own.',
    fr: 'Ébauches et idées produites par les agents du bureau — chacune attend votre décision, rien n’agit seul.',
  },
  pr_review_empty: {
    en: 'Nothing waiting — when an agent drafts something worth your eye, it lands here.',
    fr: 'Rien en attente — quand un agent prépare quelque chose qui mérite votre œil, ça arrive ici.',
  },
  pr_review_filed_by: { en: 'Filed by an agent', fr: 'Déposé par un agent' },
  pr_review_load_failed: {
    en: 'The review list didn’t load — retry.',
    fr: 'La liste n’a pas chargé — réessayez.',
  },
  pr_review_ack: { en: 'Got it', fr: 'C’est noté' },
  /* A resolve call failed — the row stays pending. [FR self-authored] */
  pr_review_action_failed: {
    en: 'That didn’t save — it’s still waiting here; try again.',
    fr: 'Ça n’a pas enregistré — c’est toujours en attente ; réessayez.',
  },
  pr_review_accept_pitch_copy: { en: 'Copy', fr: 'Copier' },
  pr_review_accept_pitch_mail: { en: 'Open in email', fr: 'Ouvrir dans le courriel' },
  pr_review_accept_prompt: { en: 'Track it', fr: 'La suivre' },
  pr_review_kind_pitch: { en: 'Pitch', fr: 'Pitch' },
  pr_review_kind_geo_prompt: { en: 'AI answers question', fr: 'Question réponses IA' },
  pr_seo_title_review: { en: 'For review — Dutiva PR', fr: 'À valider — Dutiva RP' },
  pr_review_saved: { en: 'Added.', fr: 'Ajouté.' },

  /* Layout chrome */
  pr_loading: { en: 'Loading…', fr: 'Chargement…' },
  pr_load_error: {
    en: 'Couldn’t load your data. Check your connection and try again.',
    fr: 'Impossible de charger vos données. Vérifiez votre connexion et réessayez.',
  },
  pr_retry: { en: 'Try again', fr: 'Réessayer' },
  pr_sign_out: { en: 'Sign out', fr: 'Se déconnecter' },

  /* Footer + legal */
  pr_footer_nav: { en: 'Dutiva PR links', fr: 'Liens Dutiva RP' },
  pr_footer_terms: { en: 'Terms', fr: 'Conditions' },
  pr_footer_privacy: { en: 'Privacy', fr: 'Confidentialité' },
  pr_footer_support: { en: 'Support', fr: 'Soutien' },
  pr_legal_back: { en: 'Back to PR', fr: 'Retour à RP' },
  pr_legal_updated: { en: 'Last updated:', fr: 'Dernière mise à jour :' },
  pr_legal_effective: { en: 'Effective:', fr: 'En vigueur :' },
  pr_legal_contact: { en: 'Contact', fr: 'Nous joindre' },
  pr_legal_hours: { en: 'Staffed hours:', fr: 'Heures de service :' },

  /* SEO/head titles */
  pr_seo_doc_title: { en: 'Dutiva PR', fr: 'Dutiva RP' },
  pr_seo_title_report: { en: 'Monthly report — Dutiva PR', fr: 'Rapport mensuel — Dutiva RP' },
  pr_seo_title_terms: { en: 'Terms — Dutiva PR', fr: 'Conditions — Dutiva RP' },
  pr_seo_title_privacy: { en: 'Privacy — Dutiva PR', fr: 'Confidentialité — Dutiva RP' },
  pr_seo_title_support: { en: 'Support — Dutiva PR', fr: 'Soutien — Dutiva RP' },
  pr_seo_desc_terms: {
    en: 'Terms of use for Dutiva PR.',
    fr: 'Conditions d’utilisation de Dutiva RP.',
  },
  pr_seo_desc_privacy: {
    en: 'How Dutiva PR handles your data.',
    fr: 'Comment Dutiva RP traite vos données.',
  },
  pr_seo_desc_support: {
    en: 'How to reach Dutiva support.',
    fr: 'Comment joindre le soutien Dutiva.',
  },

  /* Chat — the desk assistant. Sees the desk's own rows (campaigns, content,
     contacts, keywords, coverage, GEO prompts, connections) and can record
     what the user asks it to — everything lands as a draft or log entry.
     [FR self-authored] */
  pr_tab_chat: { en: 'Paige', fr: 'Paige' },
  pr_chat_title: { en: 'Paige', fr: 'Paige' },
  pr_chat_sub: {
    en: 'Your press specialist — ask about your desk, or tell her what to record. She’s software, not a person or an agency; drafts always wait for your review.',
    fr: 'Votre spécialiste presse — posez-lui une question sur vos données, ou dites-lui quoi noter. C’est un logiciel, pas une personne ni une agence ; les brouillons attendent toujours votre validation.',
  },
  /* Her opening turn on an empty conversation — a hello, at most one thing
     she noticed from the desk, and a question. Built client-side from
     PrState so it costs no call and stays bilingual. [FR self-authored] */
  pr_chat_hi: { en: 'Hi — I’m Paige, your press specialist.', fr: 'Bonjour — je suis Paige, votre spécialiste presse.' },
  pr_chat_hi_drafts: {
    en: 'You have {count} drafts waiting in Content.',
    fr: 'Vous avez {count} brouillons en attente au contenu.',
  },
  pr_chat_hi_mentions: {
    en: 'Coverage picked up — {count} mentions logged in the last 30 days.',
    fr: 'La couverture a bougé — {count} retombées notées dans les 30 derniers jours.',
  },
  pr_chat_hi_campaigns: {
    en: '{count} campaigns are active right now.',
    fr: '{count} campagnes sont actives en ce moment.',
  },
  pr_chat_hi_ask: {
    en: 'What are we working on today?',
    fr: 'Sur quoi travaille-t-on aujourd’hui ?',
  },
  pr_chat_empty: {
    en: 'Nothing yet. Try “what campaigns are active?” or “add a contact at a trade outlet.”',
    fr: 'Rien pour l’instant. Essayez « quelles campagnes sont actives ? » ou « ajoute un contact dans un média spécialisé ».',
  },
  pr_chat_placeholder: {
    en: 'Ask Paige about the desk, or tell her what to record…',
    fr: 'Demandez à Paige sur vos données, ou dites-lui quoi noter…',
  },
  pr_chat_send: { en: 'Send', fr: 'Envoyer' },
  pr_chat_clear: { en: 'Clear conversation', fr: 'Effacer la discussion' },
  pr_chat_error: {
    en: 'That didn’t go through — try again.',
    fr: 'Ça n’a pas fonctionné — réessayez.',
  },
  /* Confirmation chips under a reply that did something. The {name} slot is
     the subject the action touched. [FR self-authored] */
  pr_chat_did_campaign: { en: 'Campaign “{name}” created as draft', fr: 'Campagne « {name} » créée en brouillon' },
  pr_chat_did_content: { en: 'Draft “{name}” saved to Content', fr: 'Brouillon « {name} » enregistré au contenu' },
  pr_chat_did_contact: { en: 'Contact “{name}” added', fr: 'Contact « {name} » ajouté' },
  pr_chat_did_mention: { en: 'Mention “{name}” logged', fr: 'Retombée « {name} » notée' },
  pr_chat_did_keyword: { en: 'Now tracking “{name}”', fr: '« {name} » ajouté au suivi' },
  pr_chat_did_geo: { en: 'Now tracking the question “{name}”', fr: 'Question « {name} » ajoutée au suivi' },
  pr_chat_did_campstatus: { en: 'Campaign “{name}” status updated', fr: 'Statut de la campagne « {name} » modifié' },
  pr_chat_action_failed: {
    en: 'That write didn’t save — the reply above still stands.',
    fr: 'L’écriture n’a pas été enregistrée — la réponse ci-dessus demeure.',
  },
  /* Undo on an action chip — deletes the row the action created; the chip
     then reads Undone. [FR self-authored] */
  pr_chat_undo: { en: 'Undo', fr: 'Annuler' },
  pr_chat_undone: { en: 'Undone', fr: 'Annulé' },
  pr_chat_undo_failed: {
    en: 'Couldn’t undo that — try again.',
    fr: 'Impossible d’annuler — réessayez.',
  },
  /* Thumbs rating under an assistant reply — stored on the turn.
     [FR self-authored] */
  pr_chat_rate_up: { en: 'Helpful', fr: 'Utile' },
  pr_chat_rate_down: { en: 'Not helpful', fr: 'Pas utile' },
  /* Internal-staff tier — shown instead of pr_chat_sub when the account is
     @dutiva.ca: the server lets Paige advise on the desk directly.
     [FR self-authored] */
  pr_chat_sub_internal: {
    en: 'Your press specialist — ask about your desk, or tell her what to record. Internal staff account: she also advises on the desk directly.',
    fr: 'Votre spécialiste presse — posez-lui une question sur vos données, ou dites-lui quoi noter. Compte interne : elle vous conseille aussi directement sur votre travail.',
  },
  /* Empty-state starter chips — the third differs by tier.
     [FR self-authored] */
  pr_chat_starter_1: {
    en: 'Any new mentions I should see?',
    fr: 'De nouvelles mentions à voir ?',
  },
  pr_chat_starter_2: { en: 'What campaigns are active?', fr: 'Quelles campagnes sont actives ?' },
  pr_chat_starter_ext: {
    en: 'What makes a good pitch subject line?',
    fr: 'Qu’est-ce qu’une bonne accroche de pitch ?',
  },
  pr_chat_starter_int: {
    en: 'Which campaign would you push next — and why?',
    fr: 'Quelle campagne pousserais-tu ensuite — et pourquoi ?',
  },
  pr_chat_internal_badge: { en: 'Internal', fr: 'Interne' },
  pr_chat_retry: { en: 'Retry', fr: 'Réessayer' },
  pr_chat_view: { en: 'View', fr: 'Voir' },
  pr_chat_copy: { en: 'Copy reply', fr: 'Copier la réponse' },
  pr_chat_load_earlier: {
    en: 'Load earlier messages',
    fr: 'Charger les messages précédents',
  },
  pr_chat_enter_hint: {
    en: 'Enter to send · Shift+Enter for a new line',
    fr: 'Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne',
  },
  /* Overview strip — one thing she noticed, built locally (no call).
     [FR self-authored] */
  pr_home_paige_label: { en: 'Paige noticed', fr: 'Paige a remarqué' },
  pr_home_paige_drafts: {
    en: '{count} drafts sit in Content waiting for review.',
    fr: '{count} brouillons attendent votre validation au contenu.',
  },
  pr_home_paige_mentions: {
    en: '{count} mentions logged in the last 30 days.',
    fr: '{count} retombées notées dans les 30 derniers jours.',
  },
  pr_home_paige_campaigns: {
    en: '{count} active campaigns on the books.',
    fr: '{count} campagnes actives au programme.',
  },
  pr_home_paige_open: { en: 'Chat with Paige', fr: 'Discuter avec Paige' },
  pr_seo_title_chat: { en: 'Paige — Dutiva PR', fr: 'Paige — Dutiva RP' },
  pr_seo_desc_chat: {
    en: 'Chat with Paige — the desk’s press specialist — about your own PR data.',
    fr: 'Discutez avec Paige — la spécialiste presse du portail — de vos propres données.',
  },
})
