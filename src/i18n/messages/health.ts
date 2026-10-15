import { defineMessages } from '../core'

/**
 * Dutiva Health portal chrome — the standalone, invite-only mental-wellness
 * surface under `/health`: daily check-ins, a private journal, gentle trend
 * views, and a curated list of real support resources.
 *
 * Positioning is strict because Dutiva is not a licensed provider: this is a
 * self-tracking and reflection tool. Nothing here is diagnosis, treatment,
 * therapy, or crisis response — and the copy must never drift there. Trends
 * are framed as observations the user can bring to a professional, not
 * assessments. Crisis copy points at real services (9-8-8, 911, established
 * helplines); Dutiva itself never presents as support.
 *
 * [FR self-authored — not from a design handoff; hedge strength matched.]
 */
export const healthMessages = defineMessages({
  health_title: { en: 'Health', fr: 'Santé' },
  health_portal_title: { en: 'HEALTH', fr: 'SANTÉ' },
  health_subtitle: {
    en: 'A private space to check in with yourself, keep a journal, and notice patterns over time.',
    fr: 'Un espace privé pour faire le point avec vous-même, tenir un journal et repérer des tendances au fil du temps.',
  },
  health_info_note: {
    en: 'Dutiva Health is a self-tracking and reflection tool. It does not provide medical or mental-health advice, diagnosis, or treatment — and it is not a crisis service.',
    fr: 'Dutiva Santé est un outil d’autosurveillance et de réflexion. Il n’offre ni conseil médical ou en santé mentale, ni diagnostic, ni traitement — et ce n’est pas un service de crise.',
  },
  health_crisis_note: {
    en: 'In crisis or thinking about suicide? Call or text 9-8-8 (Canada, 24/7) — or 911 if you’re in immediate danger.',
    fr: 'En crise ou si vous pensez au suicide ? Appelez ou textez le 9-8-8 (Canada, 24/7) — ou le 911 en cas de danger immédiat.',
  },

  /* The standing crisis line — CrisisNote renders these as one sentence
     whose verbs are the links: Call → tel:988, text → sms:988, 911 →
     tel:911. The number itself stays unlinked text so both actions share
     it. health_crisis_note above is the same sentence as one string for
     contexts that need it plain. */
  health_cn_q: {
    en: 'In crisis or thinking about suicide?',
    fr: 'En crise ou si vous pensez au suicide ?',
  },
  health_cn_call: { en: 'Call', fr: 'Appelez' },
  health_cn_or: { en: 'or', fr: 'ou' },
  health_cn_text: { en: 'text', fr: 'textez' },
  health_cn_988: { en: '9-8-8 (Canada, 24/7) — or', fr: 'le 9-8-8 (Canada, 24/7) — ou le' },
  health_cn_911: { en: '911', fr: '911' },
  health_cn_end: {
    en: 'if you’re in immediate danger.',
    fr: 'en cas de danger immédiat.',
  },
  health_cn_more: { en: 'All support options', fr: 'Toutes les options' },

  /* Tabs */
  health_tab_overview: { en: 'Overview', fr: 'Aperçu' },
  health_tab_checkin: { en: 'Check-in', fr: 'Point du jour' },
  health_tab_habits: { en: 'Habits', fr: 'Habitudes' },
  health_tab_journal: { en: 'Journal', fr: 'Journal' },
  health_tab_tools: { en: 'Tools', fr: 'Outils' },
  health_tab_insights: { en: 'Insights', fr: 'Tendances' },
  health_tab_resources: { en: 'Resources', fr: 'Ressources' },

  /* Sign-in wall + access gate */
  health_signin_title: { en: 'Sign in to Dutiva Health', fr: 'Se connecter à Dutiva Santé' },
  health_signin_body: {
    en: 'Enter your email and we’ll send you a one-time sign-in code. No password needed.',
    fr: 'Entrez votre courriel et nous vous enverrons un code de connexion à usage unique. Aucun mot de passe requis.',
  },
  health_signin_email: { en: 'Email', fr: 'Courriel' },
  health_signin_send: { en: 'Send code', fr: 'Envoyer le code' },
  health_signin_sent: {
    en: 'We sent a sign-in code to {email}. It expires shortly — check your spam folder if it doesn’t arrive.',
    fr: 'Nous avons envoyé un code de connexion à {email}. Il expire bientôt — vérifiez vos courriers indésirables s’il n’arrive pas.',
  },
  health_signin_code: { en: 'Sign-in code', fr: 'Code de connexion' },
  health_signin_verify: { en: 'Sign in', fr: 'Se connecter' },
  health_signin_error: {
    en: 'Something went wrong. Check the code and try again.',
    fr: 'Une erreur s’est produite. Vérifiez le code et réessayez.',
  },
  /* The send step fails before a code exists — different words than the
     verify step's "check the code". */
  health_signin_send_error: {
    en: 'Couldn’t send the code — check the address and try again.',
    fr: 'Impossible d’envoyer le code — vérifiez l’adresse et réessayez.',
  },
  health_access_title: { en: 'Access required', fr: 'Accès requis' },
  health_access_body: {
    en: 'Dutiva Health is invite-only while it’s in early access. Your account doesn’t have a Health grant yet — contact support to request one.',
    fr: 'Dutiva Santé est sur invitation pendant son accès anticipé. Votre compte n’a pas encore d’accès Santé — contactez le soutien pour en faire la demande.',
  },
  health_access_contact: { en: 'Contact support', fr: 'Contacter le soutien' },
  health_back_site: { en: 'Back to dutiva.ca', fr: 'Retour à dutiva.ca' },

  /* Overview */
  health_ov_title: { en: 'Overview', fr: 'Aperçu' },
  health_ov_sub: {
    en: 'A quiet summary of your recent check-ins and journal entries.',
    fr: 'Un résumé discret de vos points du jour et de vos entrées de journal récentes.',
  },
  health_ov_today: { en: 'Today’s check-in', fr: 'Point d’aujourd’hui' },
  health_ov_today_done: { en: 'Done — you checked in today.', fr: 'Fait — vous avez pris le point aujourd’hui.' },
  /* The card links to the check-in page — the value names the action, the
     "about a minute" pitch lives once in the empty state below. */
  health_ov_today_none: { en: 'Not yet — start here.', fr: 'Pas encore — commencez ici.' },
  health_ov_mood_7d: { en: 'Average mood (7 days)', fr: 'Humeur moyenne (7 jours)' },
  health_ov_streak: { en: 'Check-in streak', fr: 'Jours de suite' },
  health_ov_streak_days: { en: '{count} days', fr: '{count} jours' },
  health_ov_streak_day: { en: '1 day', fr: '1 jour' },
  /* The streak counts back from yesterday — today is still open. A quiet
     qualifier, not a guilt trip. */
  health_ov_streak_pending: { en: 'Today pending', fr: 'Aujourd’hui en attente' },
  health_ov_entries: { en: 'Journal entries', fr: 'Entrées de journal' },
  /* Stat-card no-data spoken value — '—' shows visually, this is what a
     screen reader hears. */
  health_ov_none: { en: 'No data yet', fr: 'Aucune donnée' },
  health_ov_habits_none: { en: 'None set up', fr: 'Aucune habitude' },
  health_ov_habits_frac: { en: '{done} of {total}', fr: '{done} sur {total}' },
  health_ov_view_all: { en: 'View all', fr: 'Tout voir' },
  health_ov_empty_cta: { en: 'Start a check-in', fr: 'Faire le point' },
  health_ov_recent: { en: 'Recent check-ins', fr: 'Points récents' },
  health_ov_latest_entry: { en: 'Latest journal entry', fr: 'Dernière entrée de journal' },
  health_ov_open_journal: { en: 'Open journal', fr: 'Ouvrir le journal' },
  health_ov_new_checkin: { en: 'New check-in', fr: 'Nouveau point' },
  health_ov_new_entry: { en: 'New journal entry', fr: 'Nouvelle entrée' },
  /* First-run subtitle — nothing to summarize yet, so it points at the
     first action instead of describing an empty summary. */
  health_ov_sub_empty: {
    en: 'Start with a one-minute check-in — the summary builds from there.',
    fr: 'Commencez par un point d’une minute — le résumé se construit à partir de là.',
  },
  health_ov_last_checkin: { en: 'Last check-in: {date}', fr: 'Dernier point : {date}' },
  /* Pending review queue — a strip, with the count carried by fill(). */
  health_ov_review_one: { en: '1 suggestion is waiting for your call', fr: '1 suggestion attend votre décision' },
  health_ov_review_many: {
    en: '{count} suggestions are waiting for your call',
    fr: '{count} suggestions attendent votre décision',
  },
  health_ov_review_link: { en: 'Review them', fr: 'Les valider' },
  /* Inline check-in on the home page — two taps instead of a trip to the
     check-in tab. Same fields, minus the note. */
  health_ov_quick_title: { en: 'Quick check-in', fr: 'Point rapide' },
  health_ov_quick_full: { en: 'Full check-in', fr: 'Point complet' },
  health_ov_crisis_title: { en: 'Need support right now?', fr: 'Besoin de soutien immédiat ?' },
  health_ov_crisis_body: {
    en: 'Call or text 9-8-8 — Canada’s suicide crisis helpline, free and available 24/7. If you’re in immediate danger, call 911.',
    fr: 'Appelez ou textez le 9-8-8 — la ligne d’aide en cas de crise suicide au Canada, gratuite et ouverte 24/7. En cas de danger immédiat, appelez le 911.',
  },
  health_ov_crisis_link: { en: 'See all resources', fr: 'Voir toutes les ressources' },
  health_ov_empty: {
    en: 'No check-ins yet. Your first one takes about a minute.',
    fr: 'Aucun point pour l’instant. Le premier prend environ une minute.',
  },

  /* Check-in */
  health_checkin_title: { en: 'Daily check-in', fr: 'Point du jour' },
  health_checkin_sub: {
    en: 'A minute to note how things actually are — mood, energy, and anything worth remembering.',
    fr: 'Une minute pour noter comment ça va vraiment — humeur, énergie et tout ce qui vaut la peine d’être retenu.',
  },
  health_checkin_mood: { en: 'How are you feeling?', fr: 'Comment vous sentez-vous ?' },
  health_checkin_energy: { en: 'Energy level', fr: 'Niveau d’énergie' },
  health_checkin_note: { en: 'Anything on your mind? (optional)', fr: 'Quelque chose en tête ? (facultatif)' },
  health_checkin_note_ph: {
    en: 'A sentence or two is plenty.',
    fr: 'Une phrase ou deux suffisent.',
  },
  health_checkin_submit: { en: 'Save check-in', fr: 'Enregistrer le point' },
  health_checkin_saved: { en: 'Check-in saved.', fr: 'Point enregistré.' },
  health_checkin_history: { en: 'History', fr: 'Historique' },
  health_checkin_delete: { en: 'Delete', fr: 'Supprimer' },
  /* [FR self-authored] — inline edit of a saved check-in. */
  health_checkin_edit: { en: 'Edit', fr: 'Modifier' },
  health_checkin_save: { en: 'Save changes', fr: 'Enregistrer' },
  health_checkin_cancel: { en: 'Cancel', fr: 'Annuler' },
  health_checkin_updated: { en: 'Check-in updated.', fr: 'Bilan mis à jour.' },
  health_checkin_empty: {
    en: 'Nothing yet — your check-ins will appear here.',
    fr: 'Rien pour l’instant — vos points apparaîtront ici.',
  },
  /* [FR self-authored] — inline hints + named controls on the check-in page. */
  health_checkin_failed: {
    en: 'Couldn’t save the check-in — try again.',
    fr: 'Enregistrement du point impossible — réessayez.',
  },
  health_checkin_need_mood: { en: 'Pick a mood first — it’s the one required piece.', fr: 'Choisissez d’abord une humeur — c’est le seul champ requis.' },
  health_checkin_clear_hint: { en: 'Pick it again to clear it.', fr: 'Sélectionnez-la à nouveau pour l’effacer.' },
  health_checkin_logged_today: {
    en: 'Already logged today — your check-ins are below.',
    fr: 'Déjà pointé aujourd’hui — vos points sont en bas.',
  },
  health_checkin_edit_named: { en: 'Edit check-in from {when}', fr: 'Modifier le point du {when}' },
  health_checkin_delete_named: { en: 'Delete check-in from {when}', fr: 'Supprimer le point du {when}' },
  /* Two-step cancel on a dirty edit — same guard the journal editor has. */
  health_checkin_cancel_confirm: {
    en: 'Discard changes?',
    fr: 'Ignorer les modifications ?',
  },
  /* History renders the newest 30; the rest unfold on demand so a mature
     account doesn't mount hundreds of rows. [FR self-authored] */
  health_checkin_show_all: { en: 'Show all {count} check-ins', fr: 'Afficher les {count} points' },
  health_mood_1: { en: 'Rough', fr: 'Difficile' },
  health_mood_2: { en: 'Low', fr: 'Bas' },
  health_mood_3: { en: 'Okay', fr: 'Correct' },
  health_mood_4: { en: 'Good', fr: 'Bien' },
  health_mood_5: { en: 'Great', fr: 'Excellent' },
  health_energy_1: { en: 'Drained', fr: 'Vidé' },
  health_energy_2: { en: 'Low', fr: 'Faible' },
  health_energy_3: { en: 'Steady', fr: 'Stable' },
  health_energy_4: { en: 'Energized', fr: 'Énergique' },
  health_energy_5: { en: 'Charged', fr: 'Plein d’énergie' },
  health_checkin_mood_short: { en: 'Mood', fr: 'Humeur' },
  health_checkin_energy_short: { en: 'Energy', fr: 'Énergie' },

  /* Journal */
  health_journal_title: { en: 'Journal', fr: 'Journal' },
  health_journal_sub: {
    en: 'A private place to write things out. Only you can read what’s here.',
    fr: 'Un endroit privé pour écrire ce que vous avez sur le cœur. Vous êtes la seule personne à pouvoir le lire.',
  },
  health_journal_new: { en: 'New entry', fr: 'Nouvelle entrée' },
  health_journal_entry_title: { en: 'Title (optional)', fr: 'Titre (facultatif)' },
  health_journal_title_ph: { en: 'Give it a name if you like.', fr: 'Donnez-lui un titre si vous voulez.' },
  health_journal_body: { en: 'Entry', fr: 'Entrée' },
  health_journal_body_ph: {
    en: 'Write freely — this stays private.',
    fr: 'Écrivez librement — tout cela reste privé.',
  },
  health_journal_save: { en: 'Save entry', fr: 'Enregistrer' },
  health_journal_saved: { en: 'Entry saved.', fr: 'Entrée enregistrée.' },
  health_journal_save_failed: {
    en: 'Couldn’t save — your entry is still here. Try again.',
    fr: 'Enregistrement impossible — votre entrée est toujours là. Réessayez.',
  },
  health_journal_edit: { en: 'Edit', fr: 'Modifier' },
  health_journal_cancel: { en: 'Cancel', fr: 'Annuler' },
  health_journal_delete: { en: 'Delete', fr: 'Supprimer' },
  health_journal_empty: {
    en: 'No entries yet. Writing a few lines is a good place to start.',
    fr: 'Aucune entrée pour l’instant. Écrire quelques lignes est un bon point de départ.',
  },
  health_journal_empty_cta: { en: 'Write your first entry', fr: 'Écrire une première entrée' },
  /* The archive is paged — newest JOURNAL_CAP ship with the state, this
     walks back one page at a time. */
  health_journal_load_more: { en: 'Load earlier entries', fr: 'Charger les entrées précédentes' },
  health_journal_untitled: { en: 'Untitled', fr: 'Sans titre' },
  health_journal_edited: { en: 'Edited {date}', fr: 'Modifiée le {date}' },
  health_journal_body_required: { en: 'Write a few words first.', fr: 'Écrivez d’abord quelques mots.' },
  /* [FR self-authored] — archive affordances, search, and the shared-entry
     filter on the journal list. */
  health_journal_load_failed: {
    en: 'Couldn’t load earlier entries — try again.',
    fr: 'Chargement des entrées précédentes impossible — réessayez.',
  },
  health_journal_expand: { en: 'Read more', fr: 'Lire la suite' },
  health_journal_collapse: { en: 'Show less', fr: 'Réduire' },
  health_journal_search: { en: 'Search entries', fr: 'Rechercher dans les entrées' },
  health_journal_no_results: {
    en: 'No loaded entries match — load earlier entries to search further back.',
    fr: 'Aucune entrée chargée ne correspond — chargez les entrées précédentes pour remonter plus loin.',
  },
  /* When the whole archive is already loaded, a search miss is a real
     miss — no "load earlier" tail to offer. */
  health_journal_no_match: {
    en: 'No entries match that.',
    fr: 'Aucune entrée ne correspond.',
  },
  /* Whole-journal clipboard copy — same portability shape as the chat
     transcript. [FR self-authored] */
  health_journal_copy_all: { en: 'Copy all', fr: 'Copier tout' },
  health_journal_copy_hint: {
    en: 'Copies every entry, oldest to newest, to the clipboard.',
    fr: 'Copie toutes les entrées, de la plus ancienne à la plus récente.',
  },
  health_journal_copied: { en: 'Entries copied.', fr: 'Entrées copiées.' },
  health_journal_copy_failed: {
    en: 'Couldn’t copy — try again.',
    fr: 'Copie impossible — réessayez.',
  },
  /* Photo attachments — one optional image per entry, private bucket,
     gated on migration 0226 actually existing. Never reaches Mira: her
     context stays text-only. [FR self-authored] */
  health_journal_photo_label: { en: 'Photo (optional)', fr: 'Photo (facultative)' },
  health_journal_photo_add: { en: 'Add a photo', fr: 'Ajouter une photo' },
  health_journal_photo_remove: { en: 'Remove photo', fr: 'Retirer la photo' },
  health_journal_photo_open: { en: 'Open the photo full size', fr: 'Ouvrir la photo en grand' },
  health_journal_photo_alt: {
    en: 'Photo attached to “{title}”',
    fr: 'Photo jointe à « {title} »',
  },
  health_journal_photo_failed: {
    en: 'Entry saved, but the photo didn’t upload — edit the entry to try again.',
    fr: 'Entrée enregistrée, mais la photo n’a pas été téléversée — modifiez l’entrée pour réessayer.',
  },
  health_journal_photo_too_big: {
    en: 'That photo is over 5 MB — pick a smaller one.',
    fr: 'Cette photo dépasse 5 Mo — choisissez-en une plus petite.',
  },
  health_journal_photo_type: {
    en: 'That file isn’t a supported photo (JPEG, PNG, WebP, GIF, HEIC).',
    fr: 'Ce fichier n’est pas une photo prise en charge (JPEG, PNG, WebP, GIF, HEIC).',
  },
  health_journal_photo_attached: { en: '(photo attached)', fr: '(photo jointe)' },
  health_journal_filter_shared: { en: 'Shared with Mira', fr: 'Partagées avec Mira' },
  health_journal_shared_edit_hint: {
    en: 'Shared — Mira reads the latest saved version.',
    fr: 'Partagée — Mira lit la dernière version enregistrée.',
  },
  /* Two-step cancel — a dirty editor asks before dropping the draft. */
  health_journal_cancel_confirm: {
    en: 'Discard what you wrote?',
    fr: 'Jeter ce que vous avez écrit ?',
  },
  health_journal_share_named: { en: 'Let Mira read “{title}”', fr: 'Laisser Mira lire « {title} »' },
  health_journal_unshare_named: { en: 'Stop sharing “{title}” with Mira', fr: 'Retirer le partage de « {title} » avec Mira' },
  health_journal_edit_named: { en: 'Edit “{title}”', fr: 'Modifier « {title} »' },
  health_journal_delete_named: { en: 'Delete “{title}”', fr: 'Supprimer « {title} »' },

  /* "Suggest a prompt" is disabled while a draft is open — the prompt is
     seed text, and swapping it under half-written prose surprises. */
  health_journal_prompt_busy: {
    en: 'Finish or clear this draft to get a fresh prompt.',
    fr: 'Terminez ou effacez ce brouillon pour obtenir une nouvelle invite.',
  },

  /* Insights — observations, not assessments */
  health_insights_title: { en: 'Insights', fr: 'Tendances' },
  health_insights_sub: {
    en: 'Patterns from your own check-ins — observations, not assessments.',
    fr: 'Des tendances tirées de vos propres points du jour — des observations, pas une évaluation.',
  },
  health_ins_mood_14d: { en: 'Mood over the last 14 days', fr: 'Humeur des 14 derniers jours' },
  /* The averages and the chart now share per-day semantics — label carries
     the window so the three windows on the page stay legible. */
  health_ins_avg_mood: { en: 'Average mood (30 days)', fr: 'Humeur moyenne (30 jours)' },
  health_ins_avg_energy: { en: 'Average energy (30 days)', fr: 'Énergie moyenne (30 jours)' },
  health_ins_total: { en: 'Check-ins', fr: 'Points du jour' },
  /* Same metric as Overview's "Check-in streak" — one name, one concept. */
  health_ins_streak: { en: 'Check-in streak', fr: 'Jours de suite' },
  health_ins_entries: { en: 'Journal entries', fr: 'Entrées de journal' },
  /* Spoken summary carried on the chart's role="img" label — the bars
     themselves are decoration; this is what AT hears. [FR self-authored] */
  health_ins_chart_summary: {
    en: '{logged} of {total} days logged · average mood {avg}',
    fr: '{logged} jours pointés sur {total} · humeur moyenne {avg}',
  },
  health_ins_chart_summary_none: {
    en: '{logged} of {total} days logged',
    fr: '{logged} jours pointés sur {total}',
  },
  health_ins_checkin_cta: { en: 'Check in now', fr: 'Pointer maintenant' },
  /* Tooltip on an empty chart day — distinguishes "nothing logged" from a
     genuinely low day. [FR self-authored] */
  health_ins_day_none: { en: '{day} — no check-in', fr: '{day} — aucun point' },
  health_ins_note: {
    en: 'These are simple counts and averages of what you recorded — they describe your inputs, not your health. If a trend concerns you, bring it to a qualified professional.',
    fr: 'Ce sont de simples décomptes et moyennes de ce que vous avez noté — ils décrivent vos saisies, pas votre santé. Si une tendance vous préoccupe, parlez-en à un professionnel qualifié.',
  },
  health_ins_no_data: {
    en: 'Nothing to chart yet. A few check-ins will start to show a pattern.',
    fr: 'Rien à afficher pour l’instant. Quelques points du jour commenceront à dessiner une tendance.',
  },
  health_ins_low_day: { en: 'Toughest day this week', fr: 'Journée la plus difficile cette semaine' },
  health_ins_best_day: { en: 'Best day this week', fr: 'Meilleure journée cette semaine' },

  /* Resources — real services only; Dutiva never presents as one */
  health_res_title: { en: 'Resources', fr: 'Ressources' },
  health_res_sub: {
    en: 'Real places to reach people. Dutiva Health is a reflection tool, not a support service — these are.',
    fr: 'De vrais endroits pour joindre des gens. Dutiva Santé est un outil de réflexion, pas un service de soutien — eux le sont.',
  },
  health_res_crisis_title: { en: 'If you’re in crisis right now', fr: 'Si vous êtes en crise en ce moment' },
  health_res_988_name: { en: '9-8-8: Suicide Crisis Helpline', fr: '9-8-8 : Ligne d’aide en cas de crise suicide' },
  health_res_988_body: {
    en: 'Call or text 9-8-8. Free, confidential, bilingual, 24/7, anywhere in Canada.',
    fr: 'Appelez ou textez le 9-8-8. Gratuit, confidentiel, bilingue, 24/7, partout au Canada.',
  },
  health_res_911_name: { en: '911 — immediate danger', fr: '911 — danger immédiat' },
  health_res_911_body: {
    en: 'If you or someone near you is in immediate danger, call 911 now.',
    fr: 'Si vous ou une personne près de vous êtes en danger immédiat, appelez le 911 maintenant.',
  },
  health_res_talk_title: { en: 'Talk to someone', fr: 'Parler à quelqu’un' },
  health_res_khp_name: { en: 'Kids Help Phone (up to age 29)', fr: 'Jeunesse, J’écoute (29 ans et moins)' },
  health_res_khp_body: {
    en: 'Call 1-800-668-6868, text CONNECT to 686868, or chat at kidshelpphone.ca. Free, 24/7.',
    fr: 'Appelez le 1-800-668-6868, textez PARLER au 686868 ou clavardez sur jeunessejecoute.ca. Gratuit, 24/7.',
  },
  health_res_hope_name: { en: 'Hope for Wellness Helpline', fr: 'Ligne d’écoute d’espoir pour le mieux-être' },
  health_res_hope_body: {
    en: 'Support for Indigenous peoples across Canada. Call 1-855-242-3310 or chat at hopeforwellness.ca, 24/7.',
    fr: 'Soutien pour les peuples autochtones partout au Canada. Appelez le 1-855-242-3310 ou clavardez sur hopeforwellness.ca, 24/7.',
  },
  health_res_qc_name: { en: 'Suicide.ca (Quebec)', fr: 'Suicide.ca (Québec)' },
  health_res_qc_body: {
    en: 'Call 1-866-277-3553, 24/7, or chat online at suicide.ca.',
    fr: 'Appelez le 1-866-277-3553, 24/7, ou clavardez sur suicide.ca.',
  },
  health_res_prof_title: { en: 'Find ongoing support', fr: 'Trouver un soutien continu' },
  health_res_prof_body: {
    en: 'A good starting point is your family doctor or nurse practitioner — they can refer you to the right professional. Many employers offer an employee assistance program (EAP) with free short-term counselling. You can also search the register of your province’s college of psychologists or the Canadian Mental Health Association’s local branches.',
    fr: 'Un bon point de départ est votre médecin de famille ou votre infirmière praticienne — ils peuvent vous orienter vers le bon professionnel. Plusieurs employeurs offrent un programme d’aide aux employés (PAE) avec du counselling gratuit à court terme. Vous pouvez aussi consulter le répertoire de l’ordre des psychologues de votre province ou les filiales locales de l’Association canadienne pour la santé mentale.',
  },
  health_res_811_name: { en: '811 — health information', fr: '811 — info-santé' },
  health_res_811_body: {
    en: 'In most provinces, dialling 8-1-1 reaches a nurse line that can point you to local mental-health services.',
    fr: 'Dans la plupart des provinces, le 8-1-1 vous met en contact avec une infirmière qui peut vous orienter vers des services de santé mentale locaux.',
  },
  health_res_note: {
    en: 'Dutiva Health isn’t a care provider and can’t respond to anything you write here — including entries about feeling unsafe. If that’s where you are, please use one of the services above.',
    fr: 'Dutiva Santé n’est pas un fournisseur de soins et ne peut pas répondre à ce que vous écrivez ici — y compris aux entrées où vous ne vous sentez pas en sécurité. Si c’est votre cas, utilisez l’un des services ci-dessus.',
  },
  /* Link-chip labels — the contact methods are tappable, not just printed.
     [FR self-authored] */
  health_res_call: { en: 'Call', fr: 'Appeler le' },
  health_res_text: { en: 'Text', fr: 'Texter le' },
  health_res_chat_online: { en: 'Chat online', fr: 'Clavarder' },
  health_res_mira_line: {
    en: 'Not urgent? Mira can think it through with you.',
    fr: 'Pas urgent ? Mira peut en parler avec vous.',
  },
  health_res_mira_link: { en: 'Open chat', fr: 'Ouvrir la conversation' },

  /* Ongoing support + community resources — vetted external links only;
     each is a real service that responds, never an endorsement of paid care.
     [FR self-authored] */
  health_res_visit: { en: 'Visit', fr: 'Visiter' },
  health_res_pt_name: {
    en: 'Psychology Today — therapist directory',
    fr: 'Psychology Today — répertoire de thérapeutes',
  },
  health_res_pt_body: {
    en: 'A widely used directory of therapists across Canada — filter by city, concern, approach, and language.',
    fr: 'Un répertoire de thérapeutes bien établi au Canada — filtrez par ville, préoccupation, approche et langue.',
  },
  health_res_atn_name: { en: 'Affordable Therapy Network', fr: 'Affordable Therapy Network' },
  health_res_atn_body: {
    en: 'A Canadian directory of therapists offering low-cost and sliding-scale sessions, online and in person.',
    fr: 'Un répertoire canadien de thérapeutes qui offrent des séances à faible coût ou à tarif ajusté au revenu, en ligne et en personne.',
  },
  health_res_op_name: { en: 'Open Path Collective', fr: 'Open Path Collective' },
  health_res_op_body: {
    en: 'A nonprofit connecting you with therapists at reduced rates for a one-time membership fee — it serves Canada.',
    fr: 'Un organisme sans but lucratif qui vous relie à des thérapeutes à tarifs réduits moyennant des frais d’adhésion uniques — il dessert le Canada.',
  },
  health_res_cmha_name: { en: 'CMHA — local programs', fr: 'ACSM — programmes locaux' },
  health_res_cmha_body: {
    en: 'Community mental-health programs across Canada — peer support, courses, and local services. The branch finder on their site shows what’s near you.',
    fr: 'Des programmes communautaires en santé mentale partout au Canada — soutien par les pairs, cours et services locaux. Le localisateur de filiales sur leur site indique ce qui existe près de chez vous.',
  },
  health_res_camh_name: { en: 'CAMH — mental-health guides', fr: 'CAMH — guides en santé mentale' },
  health_res_camh_body: {
    en: 'Free, plain-language explainers on conditions, treatment, and coping — including the Mental Health 101 series. In English and French.',
    fr: 'Des explications gratuites en langage simple sur les troubles, les traitements et les moyens d’y faire face — dont la série Santé mentale 101. En français et en anglais.',
  },
  health_res_7cups_name: { en: '7 Cups — someone to talk to', fr: '7 Cups — quelqu’un à qui parler' },
  health_res_7cups_body: {
    en: 'Free, anonymous chat with trained volunteer listeners, day or night — for when you need to talk but it isn’t a crisis. Dedicated listeners for teens 13–17.',
    fr: 'Clavardage gratuit et anonyme avec des écoutants bénévoles formés, jour et nuit — quand vous avez besoin de parler sans être en crise. Des écoutants sont dédiés aux 13 à 17 ans.',
  },
  /* Listed because users will find it anyway — labeled paid so the
     commercial option reads differently from the free ones. */
  health_res_bh_name: {
    en: 'BetterHelp — online therapy (paid)',
    fr: 'BetterHelp — thérapie en ligne (payant)',
  },
  health_res_bh_body: {
    en: 'Video, phone, or messaging sessions with a matched therapist — a paid subscription service.',
    fr: 'Des séances par vidéo, téléphone ou messagerie avec un thérapeute jumelé — un service payant par abonnement.',
  },
  health_res_community_title: { en: 'Community supports', fr: 'Soutiens communautaires' },
  health_res_211_name: {
    en: '211 — community services navigator',
    fr: '211 — navigation des services communautaires',
  },
  health_res_211_body: {
    en: 'One free number for the essentials — housing, food, money trouble, legal aid, senior and newcomer services. Confidential, 24/7, in over 150 languages.',
    fr: 'Un numéro gratuit pour l’essentiel — logement, alimentation, difficultés financières, aide juridique, services aux aînés et aux nouveaux arrivants. Confidentiel, 24/7, dans plus de 150 langues.',
  },
  health_res_benefits_name: {
    en: 'Benefits Finder — Government of Canada',
    fr: 'Chercheur de prestations — Gouvernement du Canada',
  },
  health_res_benefits_body: {
    en: 'Answer a few questions to see which federal benefits you may qualify for — disability, caregiving, job loss, housing, family.',
    fr: 'Répondez à quelques questions pour voir quelles prestations fédérales pourraient s’appliquer — invalidité, proche aidance, perte d’emploi, logement, famille.',
  },
  health_res_food_name: {
    en: 'Food Banks Canada — find a food bank',
    fr: 'Banques alimentaires Canada — trouver une banque',
  },
  health_res_food_body: {
    en: 'Search the national map for a food bank near you — if nothing comes up, 211 knows the smaller programs.',
    fr: 'Cherchez une banque alimentaire près de chez vous sur la carte nationale — si rien n’apparaît, le 211 connaît les plus petits programmes.',
  },
  health_res_credit_name: { en: 'Credit Counselling Canada', fr: 'Conseil en crédit du Canada' },
  health_res_credit_body: {
    en: 'Non-profit agencies that help with debt — free first sessions, repayment plans, and alternatives to consolidation loans.',
    fr: 'Des organismes sans but lucratif qui aident à gérer les dettes — premières séances gratuites, plans de remboursement et solutions de rechange aux prêts de consolidation.',
  },
  health_res_learn_name: { en: 'Learn at Home — Ontario', fr: 'Apprentissage à la maison — Ontario' },
  health_res_learn_body: {
    en: 'The province’s hub of free K–12 learning resources for kids — curriculum, activities, and supports for parents.',
    fr: 'Le carrefour provincial de ressources d’apprentissage gratuites pour les enfants de la maternelle à la 12e année — curriculum, activités et soutiens pour les parents.',
  },

  /* Habits — gentle routine tracking, nothing diagnostic */
  health_habits_title: { en: 'Habits', fr: 'Habitudes' },
  health_habits_sub: {
    en: 'Small daily things you want to keep up — tick them off, watch the streak.',
    fr: 'Les petites choses quotidiennes que vous voulez garder — cochez-les, suivez la suite.',
  },
  health_habit_new: { en: 'New habit', fr: 'Nouvelle habitude' },
  health_habit_ph: { en: 'e.g. a ten-minute walk', fr: 'p. ex. une marche de dix minutes' },
  health_habit_add: { en: 'Add habit', fr: 'Ajouter l’habitude' },
  health_habit_added: { en: 'Habit added.', fr: 'Habitude ajoutée.' },
  health_habit_done: { en: 'Done today', fr: 'Fait aujourd’hui' },
  health_habit_mark: { en: 'Mark done', fr: 'Marquer fait' },
  health_habit_streak_one: { en: '1-day streak', fr: '1 jour de suite' },
  health_habit_streak_many: { en: '{count}-day streak', fr: '{count} jours de suite' },
  health_habit_week: { en: 'Last 7 days', fr: '7 derniers jours' },
  health_habit_delete: { en: 'Delete', fr: 'Supprimer' },
  health_habit_rename: { en: 'Rename', fr: 'Renommer' },
  health_habit_renamed: { en: 'Habit renamed.', fr: 'Habitude renommée.' },
  health_habit_exists: {
    en: 'You’re already tracking a habit with that name.',
    fr: 'Une habitude porte déjà ce nom.',
  },
  /* Spoken summary + per-dot labels for the 7-day strip — the dots are
     toggleable buttons for backfilling, so each carries its day and state.
     [FR self-authored] */
  health_habit_week_summary: { en: '{done}/{total} this week', fr: '{done}/{total} cette semaine' },
  health_habit_month_summary: { en: '{done} of the last 30 days', fr: '{done} des 30 derniers jours' },
  /* Younger habits get honest denominators — "0 of 30" would scold a
     habit that only just started existing. [FR self-authored] */
  health_habit_since_summary: {
    en: '{done} of {total} days since it started',
    fr: '{done} des {total} jours depuis le début',
  },
  health_habit_started_today: { en: 'Started today', fr: 'Commencée aujourd’hui' },
  health_habit_week_tracked: {
    en: '{done} of {total} days tracked',
    fr: '{done} des {total} jours suivis',
  },
  /* Days before the habit existed stay tappable (the practice may predate
     the tracking) but read differently — not "missed", just "not yet". */
  health_habit_dot_before: {
    en: '{day} — before tracking started',
    fr: '{day} — avant le début du suivi',
  },
  health_habit_best: { en: 'Best run: {count} days', fr: 'Record : {count} jours' },
  health_habit_dot_done: { en: '{day} — done', fr: '{day} — fait' },
  health_habit_dot_open: { en: '{day} — not done', fr: '{day} — non fait' },
  /* Suggest-a-habit outcomes that aren't new rows. [FR self-authored] */
  health_ai_habit_dupe: {
    en: 'You’re already tracking that — ask again for a different idea.',
    fr: 'Vous la suivez déjà — demandez une autre idée.',
  },
  health_ai_habit_same: {
    en: 'Same idea again — add it or dismiss it first.',
    fr: 'Même idée — ajoutez-la ou ignorez-la d’abord.',
  },
  health_habits_empty: {
    en: 'No habits yet. Pick one small thing you’d like to do most days — a walk, a stretch, a screen-free meal.',
    fr: 'Aucune habitude pour l’instant. Choisissez une petite chose à faire la plupart des jours — une marche, un étirement, un repas sans écran.',
  },
  health_habits_note: {
    en: 'Habits here are gentle routine-tracking — not treatment, and a missed day doesn’t break anything.',
    fr: 'Les habitudes ici servent à suivre une routine en douceur — ce n’est pas un traitement, et une journée manquée ne gâche rien.',
  },
  health_ov_habits: { en: 'Habits today', fr: 'Habitudes du jour' },

  /* Notifications — one gentle evening nudge, only when a live streak
     isn't checked off yet. */
  health_notify_label: { en: 'Email me if a streak is at risk', fr: 'M’écrire si une suite est à risque' },
  health_notify_hint: {
    en: 'One email a day at most, only when a habit with a streak isn’t checked off yet.',
    fr: 'Un courriel par jour au plus, seulement quand une habitude avec une suite n’est pas encore cochée.',
  },

  /* AI assists — Mira reads the user's own check-in notes and journal
     excerpts alongside the numbers (disclosed in the wellness notice).
     Reflection, not advice. */
  health_ai_prompt_btn: { en: 'Suggest a prompt', fr: 'Suggérer une amorce' },
  health_ai_prompt_loading: { en: 'Thinking…', fr: 'Réflexion…' },
  health_ai_prompt_label: {
    en: 'An idea to write about — Mira reads your numbers and what you’ve written.',
    fr: 'Une idée à explorer — Mira lit vos chiffres et vos écrits.',
  },
  health_ai_recap_btn: { en: 'Summarize my week', fr: 'Résumer ma semaine' },
  health_ai_recap_loading: { en: 'Summarizing…', fr: 'Résumé en cours…' },
  health_ai_recap_title: { en: 'Your week', fr: 'Votre semaine' },
  health_ai_note: {
    en: 'Mira reads your numbers and what you wrote to respond. A reflection, not advice.',
    fr: 'Mira lit vos chiffres et vos écrits pour répondre. Une réflexion, pas un conseil.',
  },
  health_ai_failed: {
    en: 'Mira isn’t available right now.',
    fr: 'Mira n’est pas disponible pour le moment.',
  },
  health_ai_habit_btn: { en: 'Suggest a habit', fr: 'Suggérer une habitude' },
  health_ai_habit_loading: { en: 'Thinking…', fr: 'Réflexion…' },
  health_ai_habit_add: { en: 'Add it', fr: 'L’ajouter' },
  health_ai_habit_dismiss: { en: 'Dismiss', fr: 'Ignorer' },
  health_ai_habit_failed: {
    en: 'No suggestion right now — your own ideas work just as well.',
    fr: 'Pas de suggestion pour l’instant — vos propres idées conviennent aussi.',
  },

  /* For review — work agents filed for a human decision */
  health_tab_review: { en: 'Review', fr: 'À valider' },
  health_review_title: { en: 'For review', fr: 'À valider' },
  health_review_sub: {
    en: 'Ideas the portal’s agents surfaced — each waits on your call, nothing is added on its own.',
    fr: 'Idées soulevées par les agents du portail — chacune attend votre décision, rien ne s’ajoute seul.',
  },
  health_review_empty: {
    en: 'Nothing waiting — agent suggestions land here when there’s something worth a look.',
    fr: 'Rien en attente — les suggestions des agents arrivent ici quand quelque chose mérite un regard.',
  },
  /* On Health only Mira files suggestions — name her, not "an agent". */
  health_review_filed_by: { en: 'Mira suggested this', fr: 'Suggestion de Mira' },
  health_review_dismissed: { en: 'Dismissed.', fr: 'Ignorée.' },
  health_review_load_failed: {
    en: 'The review list didn’t load — retry.',
    fr: 'La liste n’a pas chargé — réessayez.',
  },
  health_review_ack: { en: 'Got it', fr: 'C’est noté' },
  /* A resolve call failed — the row stays pending. [FR self-authored] */
  health_review_action_failed: {
    en: 'That didn’t save — it’s still waiting here; try again.',
    fr: 'Ça n’a pas enregistré — c’est toujours en attente ; réessayez.',
  },
  health_review_accept_habit: { en: 'Add it', fr: 'L’ajouter' },
  health_review_kind_habit: { en: 'Habit', fr: 'Habitude' },
  /* Recently-resolved rail + the shared-entries consent ledger — what Mira
     can currently read, with revoke right on the row. [FR self-authored] */
  health_review_resolved_title: { en: 'Recently resolved', fr: 'Récemment tranchées' },
  health_review_resolved_accepted: { en: 'accepted', fr: 'acceptée' },
  health_review_resolved_dismissed: { en: 'dismissed', fr: 'écartée' },
  health_review_resolved_putback: { en: 'Put back', fr: 'Remettre en attente' },
  health_review_resolved_putback_named: {
    en: 'Put “{title}” back on the list',
    fr: 'Remettre « {title} » dans la liste',
  },
  health_review_resolved_restored: { en: 'Back on the list.', fr: 'De retour dans la liste.' },
  /* Accepting before the provider's first load lands would dedupe against
     an empty list — ask for a moment instead. */
  health_review_wait_load: {
    en: 'Still loading your data — try again in a moment.',
    fr: 'Vos données chargent encore — réessayez dans un instant.',
  },
  health_review_shared_title: { en: 'Shared with Mira', fr: 'Partagées avec Mira' },
  health_review_shared_sub: {
    en: 'Journal entries Mira can read until you stop sharing — the same toggle the journal page offers.',
    fr: 'Les entrées de journal que Mira peut lire tant que vous ne retirez pas le partage — le même réglage que dans le journal.',
  },
  health_review_shared_empty: { en: 'Nothing shared right now.', fr: 'Rien de partagé pour l’instant.' },
  health_review_shared_revoked: { en: 'Stopped sharing.', fr: 'Partage retiré.' },
  /* [FR self-authored] — memory suggestions Mira proposed in chat. */
  health_review_accept_memory: { en: 'Remember it', fr: 'S’en souvenir' },
  health_review_kind_memory: { en: 'Memory', fr: 'Souvenir' },
  /* [FR self-authored] — the Home "What Mira remembers" card. */
  health_mem_title: { en: 'What Mira remembers', fr: 'Ce dont Mira se souvient' },
  health_mem_sub: {
    en: 'Things you’ve asked her to keep — she holds these until you remove them.',
    fr: 'Ce que vous lui avez demandé de retenir — elle le garde jusqu’à ce que vous le retiriez.',
  },
  health_mem_ph: {
    en: 'Something you want Mira to remember — a preference, a context, a boundary.',
    fr: 'Ce que vous voulez qu’elle retienne — une préférence, un contexte, une limite.',
  },
  health_mem_add: { en: 'Remember this', fr: 'Retenir ceci' },
  health_mem_added: { en: 'Mira will remember that.', fr: 'Mira s’en souviendra.' },
  health_mem_empty: {
    en: 'Nothing yet — tell her once and she keeps it.',
    fr: 'Rien pour l’instant — dites-le une fois et elle le garde.',
  },
  health_mem_delete: { en: 'Remove', fr: 'Retirer' },
  health_mem_from_mira: { en: 'proposed by Mira', fr: 'proposé par Mira' },
  health_mem_label: { en: 'New memory', fr: 'Nouvelle mémoire' },
  /* Scope note under the list — what she does with these, and who sees it.
     Matches the journal's own "only you" hedge. */
  health_mem_scope: {
    en: 'Mira draws on these in your chats — the list itself stays between you two.',
    fr: 'Mira s’en sert dans vos discussions — la liste reste entre vous.',
  },
  health_mem_edit: { en: 'Edit', fr: 'Modifier' },
  /* Named controls — every memory row's buttons name their row's snippet,
     same convention as the check-in/journal rows. */
  health_mem_edit_named: { en: 'Edit “{text}”', fr: 'Modifier « {text} »' },
  health_mem_delete_named: { en: 'Remove “{text}”', fr: 'Retirer « {text} »' },
  /* Accessible name for the inline edit field — the visible button says
     "Edit", but a field needs a noun. */
  health_mem_edit_label: { en: 'Edit memory', fr: 'Modifier la mémoire' },
  health_mem_updated: { en: 'Memory updated.', fr: 'Mémoire mise à jour.' },
  health_mem_save_failed: {
    en: 'That didn’t save — try again.',
    fr: 'Ça n’a pas enregistré — réessayez.',
  },
  health_seo_title_review: { en: 'For review — Dutiva Health', fr: 'À valider — Dutiva Santé' },
  /* Queue write didn't land upstream — the suggestion works but won't
     survive leaving the page. [FR self-authored] */
  health_ai_not_filed: {
    en: 'Not saved for review — it disappears if you leave this page.',
    fr: 'Non conservée pour validation — elle disparaît si vous quittez la page.',
  },

  /* Tools — self-guided pauses, not treatment */
  health_tools_title: { en: 'Tools', fr: 'Outils' },
  health_tools_tabs_aria: { en: 'Tools sections', fr: 'Sections des outils' },
  health_tools_tab_exercises: { en: 'Exercises', fr: 'Exercices' },
  health_tools_sub: {
    en: 'Small self-guided exercises for the moment you’re in — a pause with some structure, not treatment.',
    fr: 'De petits exercices à faire soi-même pour le moment présent — une pause structurée, pas un traitement.',
  },
  health_tool_breath_title: { en: 'Box breathing', fr: 'Respiration carrée' },
  health_tool_breath_body: {
    en: 'Four counts in, four held, four out, four held. A few rounds is enough.',
    fr: 'Quatre temps pour inspirer, quatre pour retenir, quatre pour expirer, quatre pour retenir. Quelques cycles suffisent.',
  },
  health_tool_breath_start: { en: 'Start', fr: 'Commencer' },
  health_tool_breath_stop: { en: 'Stop', fr: 'Arrêter' },
  health_tool_breath_in: { en: 'Breathe in', fr: 'Inspirez' },
  health_tool_breath_hold: { en: 'Hold', fr: 'Retenez' },
  health_tool_breath_out: { en: 'Breathe out', fr: 'Expirez' },
  health_tool_breath_cycle: { en: 'Cycle {count}', fr: 'Cycle {count}' },
  health_tool_breath_mode_label: { en: 'Pace', fr: 'Rythme' },
  health_tool_breath_mode_box: { en: 'Box', fr: 'Carrée' },
  /* The eyes-closed affordance — a soft tone and a short pulse mark each
     phase change so the screen can go unread. [FR self-authored] */
  health_tool_breath_cues: { en: 'Chime', fr: 'Carillon' },
  health_tool_breath_cues_hint: {
    en: 'A soft tone — and a short pulse on phones — marks each phase change.',
    fr: 'Une note douce — et une courte vibration sur mobile — marque chaque changement de phase.',
  },
  health_tool_breath_nudge: {
    en: 'A few rounds in — a good place to pause, or keep going.',
    fr: 'Quelques cycles — un bon moment pour faire une pause, ou continuer.',
  },
  health_tool_checkin_link: {
    en: 'Log how you feel now',
    fr: 'Notez comment vous vous sentez',
  },
  health_tool_ground_title: { en: 'Grounding: 5–4–3–2–1', fr: 'Ancrage : 5–4–3–2–1' },
  health_tool_ground_body: {
    en: 'Name things around you, counting down through the senses.',
    fr: 'Nommez ce qui vous entoure, en descendant les sens un à un.',
  },
  health_tool_ground_s5: { en: '5 things you can see', fr: '5 choses que vous voyez' },
  health_tool_ground_s4: { en: '4 things you can touch', fr: '4 choses que vous pouvez toucher' },
  health_tool_ground_s3: { en: '3 things you can hear', fr: '3 choses que vous entendez' },
  health_tool_ground_s2: { en: '2 things you can smell', fr: '2 odeurs que vous remarquez' },
  health_tool_ground_s1: { en: '1 thing you can taste', fr: '1 chose que vous goûtez' },
  health_tool_ground_next: { en: 'Next', fr: 'Suivant' },
  health_tool_ground_back: { en: 'Back', fr: 'Retour' },
  health_tool_ground_restart: { en: 'Start over', fr: 'Recommencer' },
  health_tool_ground_done: {
    en: 'That’s the exercise — take one more breath before you go back.',
    fr: 'C’est tout — prenez une dernière respiration avant de repartir.',
  },
  health_tool_grat_title: { en: 'Gratitude note', fr: 'Note de gratitude' },
  health_tool_grat_body: {
    en: 'One small thing that went okay today — write it down.',
    fr: 'Une petite chose qui s’est bien passée aujourd’hui — notez-la.',
  },
  health_tool_grat_p1: { en: 'What’s one thing that went a little better than expected today?', fr: 'Qu’est-ce qui s’est un peu mieux passé que prévu aujourd’hui ?' },
  health_tool_grat_p2: { en: 'Who made your day a bit easier — and how?', fr: 'Qui a rendu votre journée un peu plus facile — et comment ?' },
  health_tool_grat_p3: { en: 'What’s a small thing you have now that past-you wanted?', fr: 'Quelle petite chose avez-vous maintenant que vous souhaitiez avant ?' },
  health_tool_grat_p4: { en: 'What did you enjoy eating, seeing, or hearing recently?', fr: 'Qu’avez-vous aimé manger, voir ou entendre récemment ?' },
  health_tool_grat_another: { en: 'Try another prompt', fr: 'Une autre idée' },
  health_tool_grat_ph: { en: 'A sentence or two is plenty.', fr: 'Une phrase ou deux suffit.' },
  health_tool_grat_save: { en: 'Save to journal', fr: 'Enregistrer au journal' },
  health_tool_grat_saved: { en: 'Saved to your journal.', fr: 'Enregistrée dans votre journal.' },
  health_tool_grat_view: { en: 'View journal', fr: 'Voir le journal' },
  health_tool_grat_failed: {
    en: 'Couldn’t save — your note is still here. Try again.',
    fr: 'Enregistrement impossible — votre note est toujours là. Réessayez.',
  },
  health_tool_grat_share: {
    en: 'Let Mira read this note',
    fr: 'Laisser Mira lire cette note',
  },
  health_tool_grat_share_failed: {
    en: 'Saved — but sharing with Mira didn’t work.',
    fr: 'Enregistrée — mais le partage avec Mira n’a pas fonctionné.',
  },
  health_tool_grat_count: { en: '{count} characters left', fr: '{count} caractères restants' },
  health_tool_grat_p5: { en: 'What did you get through this week that you weren’t sure you would?', fr: 'Qu’avez-vous traversé cette semaine sans être sûr d’y arriver ?' },
  health_tool_grat_p6: { en: 'What’s a sound, smell, or place that settles you a little?', fr: 'Quel son, quelle odeur ou quel endroit vous apaise un peu ?' },
  health_tool_grat_p7: { en: 'What’s something your body did for you today?', fr: 'Qu’est-ce que votre corps a fait pour vous aujourd’hui ?' },
  health_tool_grat_p8: { en: 'What are you looking forward to, even slightly?', fr: 'Qu’attendez-vous avec un peu d’impatience, même légèrement ?' },
  health_tool_grat_entry: { en: 'Gratitude', fr: 'Gratitude' },
  /* [FR self-authored] — the modality library header and actions. */
  health_tools_practice_title: { en: 'Practices with Mira', fr: 'Pratiques avec Mira' },
  health_tools_practice_sub: {
    en: 'The approaches she knows — exercises she can guide in chat, and the clinician-led ones she can only explain.',
    fr: 'Les approches qu’elle connaît — des exercices qu’elle peut guider dans la discussion, et celles, réservées aux cliniciens, qu’elle peut seulement expliquer.',
  },
  health_tool_practice_guided: { en: 'Exercises she can guide', fr: 'Exercices qu’elle peut guider' },
  health_tool_practice_explains: { en: 'Where she stands', fr: 'Où elle se place' },
  health_tool_practice_go: { en: 'Practice with Mira', fr: 'Pratiquer avec Mira' },
  health_tool_practice_ask: { en: 'Ask Mira', fr: 'Demander à Mira' },
  health_tool_practice_ask_label: { en: 'Ask Mira about {name}', fr: 'Demander à Mira : {name}' },
  health_tool_practice_go_label: { en: 'Practice {name} with Mira', fr: 'Pratiquer {name} avec Mira' },
  health_tool_practice_clinician: { en: 'Clinician-led', fr: 'Sous guidance clinique' },
  health_tool_practice_int: {
    en: 'Guided practice is limited to Dutiva staff accounts — Ask Mira still works everywhere.',
    fr: 'La pratique guidée est réservée aux comptes de l’équipe Dutiva — « Demander à Mira » fonctionne partout.',
  },
  health_tools_group_guided: { en: 'Mira can guide these', fr: 'Mira peut les guider' },
  health_tools_group_clinician: {
    en: 'Clinician-led — she explains, never conducts',
    fr: 'Sous guidance clinique — elle explique, sans jamais les pratiquer',
  },
  health_tools_note: {
    en: 'These exercises are pauses, not treatment.',
    fr: 'Ces exercices sont des pauses, pas un traitement.',
  },
  health_tools_note_link: {
    en: 'If you’re struggling, the Resources page lists real people to reach.',
    fr: 'Si vous avez du mal, la page Ressources liste de vraies personnes à joindre.',
  },

  /* Layout chrome */
  health_loading: { en: 'Loading…', fr: 'Chargement…' },
  health_skip: { en: 'Skip to content', fr: 'Aller au contenu' },
  /* sr-only suffix on the Review tab when the queue has pending rows —
     the visible badge is aria-hidden so this is the spoken count. */
  health_nav_pending: { en: '{count} pending', fr: '{count} en attente' },
  health_load_error: {
    en: 'Couldn’t load your data. Check your connection and try again.',
    fr: 'Impossible de charger vos données. Vérifiez votre connexion et réessayez.',
  },
  health_retry: { en: 'Try again', fr: 'Réessayer' },
  /* Shown inline when a refresh fails but loaded data is still on screen —
     the page keeps working off the last good snapshot. [FR self-authored] */
  health_refresh_stale: {
    en: 'Couldn’t refresh — showing the last saved data.',
    fr: 'Actualisation impossible — les dernières données enregistrées s’affichent.',
  },
  health_save_failed: {
    en: 'Couldn’t save — try again.',
    fr: 'Enregistrement impossible — réessayez.',
  },
  health_delete_failed: {
    en: 'Couldn’t delete — it’s still here.',
    fr: 'Suppression impossible — l’élément est toujours là.',
  },
  /* [FR self-authored] — undo toasts for the portal's row deletes. The row
     hides at once and the real delete fires only when the toast lapses, so
     the window's copy stays past-tense. */
  health_undo_deleted: { en: 'Deleted “{label}”.', fr: '« {label} » supprimé.' },
  health_undo_deleted_history: {
    en: 'Deleted “{label}” and its history.',
    fr: '« {label} » et son historique supprimés.',
  },
  health_undo_deleted_checkin: { en: 'Check-in deleted.', fr: 'Check-in supprimé.' },
  health_undo_restored: { en: 'Restored.', fr: 'Restauré.' },
  health_dismiss: { en: 'Dismiss', fr: 'Ignorer' },
  health_cancel: { en: 'Cancel', fr: 'Annuler' },
  /* Compact relative day labels used in history timestamps.
     [FR self-authored] */
  health_day_today: { en: 'Today', fr: 'Aujourd’hui' },
  health_day_yesterday: { en: 'Yesterday', fr: 'Hier' },
  health_sign_out: { en: 'Sign out', fr: 'Se déconnecter' },
  health_signed_in_as: { en: 'Signed in as {email}', fr: 'Connecté : {email}' },

  /* Footer + legal */
  health_footer_nav: { en: 'Dutiva Health links', fr: 'Liens Dutiva Santé' },
  health_footer_terms: { en: 'Terms', fr: 'Conditions' },
  health_footer_privacy: { en: 'Privacy', fr: 'Confidentialité' },
  health_footer_wellness: { en: 'Wellness notice', fr: 'Avis de bien-être' },
  health_footer_support: { en: 'Support', fr: 'Soutien' },
  health_legal_back: { en: 'Back to Health', fr: 'Retour à Santé' },
  health_legal_updated: { en: 'Last updated:', fr: 'Dernière mise à jour :' },
  health_legal_effective: { en: 'Effective:', fr: 'En vigueur :' },
  health_legal_contact: { en: 'Contact', fr: 'Nous joindre' },
  health_legal_hours: { en: 'Staffed hours:', fr: 'Heures de service :' },

  /* SEO/head titles */
  health_seo_title: { en: 'Dutiva Health', fr: 'Dutiva Santé' },
  health_seo_title_terms: { en: 'Terms — Dutiva Health', fr: 'Conditions — Dutiva Santé' },
  health_seo_title_privacy: { en: 'Privacy — Dutiva Health', fr: 'Confidentialité — Dutiva Santé' },
  health_seo_title_support: { en: 'Support — Dutiva Health', fr: 'Soutien — Dutiva Santé' },
  health_seo_title_wellness: { en: 'Wellness notice — Dutiva Health', fr: 'Avis de bien-être — Dutiva Santé' },
  health_seo_title_habits: { en: 'Habits — Dutiva Health', fr: 'Habitudes — Dutiva Santé' },
  health_seo_title_tools: { en: 'Tools — Dutiva Health', fr: 'Outils — Dutiva Santé' },
  health_seo_desc_habits: {
    en: 'Small daily habits you track yourself.',
    fr: 'De petites habitudes quotidiennes à suivre vous-même.',
  },
  health_seo_desc_tools: {
    en: 'Self-guided pauses — breathing, grounding, gratitude.',
    fr: 'Des pauses guidées — respiration, ancrage, gratitude.',
  },
  health_seo_desc_terms: {
    en: 'Terms of use for Dutiva Health.',
    fr: 'Conditions d’utilisation de Dutiva Santé.',
  },
  health_seo_desc_privacy: {
    en: 'How Dutiva Health handles your data.',
    fr: 'Comment Dutiva Santé traite vos données.',
  },
  health_seo_desc_support: {
    en: 'How to reach Dutiva support.',
    fr: 'Comment joindre le soutien Dutiva.',
  },
  health_seo_desc_wellness: {
    en: 'What Dutiva Health is and is not — a reflection tool, not medical care.',
    fr: 'Ce qu’est et n’est pas Dutiva Santé — un outil de réflexion, pas des soins médicaux.',
  },

  /* Chat — Mira, the portal companion. She sees the aggregate numbers, the
     habit board, this conversation, and the person's own recent words
     (check-in notes, journal excerpts) — keeping company means hearing what
     was shared. Still non-clinical: she listens and she jots things down —
     she never advises on health, and the copy always says she's software.
     [FR self-authored] */
  health_tab_chat: { en: 'Mira', fr: 'Mira' },
  health_chat_title: { en: 'Mira', fr: 'Mira' },
  health_chat_sub: {
    en: 'Mira keeps you company here — she listens, remembers this conversation, and can jot things down for you: a check-in, a habit done, a journal entry. She’s software, not a person or a therapist.',
    fr: 'Mira vous tient compagnie ici — elle écoute, se souvient de cette discussion et peut noter ce que vous demandez : un point du jour, une habitude faite, une entrée de journal. C’est un logiciel, pas une personne ni une thérapeute.',
  },
  /* Her opening turn on an empty conversation — she speaks first, in one
     breath: a hello, at most one thing she noticed, and a question. Built
     client-side from HealthState so it costs no call and stays bilingual.
     [FR self-authored] */
  health_chat_hi: { en: 'Hi — I’m Mira.', fr: 'Bonjour — je suis Mira.' },
  health_chat_hi_streak: {
    en: 'I noticed “{name}” is on a {days}-day streak — nicely kept.',
    fr: 'J’ai remarqué que « {name} » se maintient depuis {days} jours — bien tenu.',
  },
  /* A run that ended yesterday — named as a pause, not a failure; the
     greeting goes on to the arrival question, so no advice needed here.
     [FR self-authored] */
  health_chat_hi_broke: {
    en: 'I noticed “{name}” paused after a {days}-day streak.',
    fr: 'J’ai remarqué que « {name} » a fait une pause après {days} jours de suite.',
  },
  health_chat_hi_checkins: {
    en: 'You’ve checked in {count} times this week already.',
    fr: 'Vous avez déjà pris le point {count} fois cette semaine.',
  },
  health_chat_hi_ask: {
    en: 'How are you arriving today?',
    fr: 'Comment vous sentez-vous en arrivant aujourd’hui ?',
  },
  health_chat_placeholder: {
    en: 'Tell Mira how it’s going, or what to jot down…',
    fr: 'Dites à Mira comment ça va, ou quoi noter…',
  },
  health_chat_send: { en: 'Send', fr: 'Envoyer' },
  /* Scoped to the open thread — "this" so a named conversation's Clear
     can't read as wiping them all. */
  health_chat_clear: { en: 'Clear this conversation', fr: 'Effacer cette discussion' },
  /* Second tap of the two-step clear. [FR self-authored] */
  health_chat_clear_confirm: {
    en: 'Click again to confirm',
    fr: 'Cliquez à nouveau pour confirmer',
  },
  health_chat_error: {
    en: 'That didn’t go through — try again.',
    fr: 'Ça n’a pas fonctionné — réessayez.',
  },
  /* Confirmation chips under a reply that did something. The {name} slot is
     the subject the action touched. [FR self-authored] */
  health_chat_did_mark: { en: 'Marked “{name}” done today', fr: '« {name} » marqué pour aujourd’hui' },
  health_chat_did_unmark: { en: 'Unmarked “{name}” for today', fr: '« {name} » retiré pour aujourd’hui' },
  health_chat_did_habit: { en: 'Now tracking “{name}”', fr: '« {name} » ajouté au suivi' },
  health_chat_did_checkin: { en: 'Check-in logged — {name}', fr: 'Point du jour noté — {name}' },
  health_chat_did_journal: { en: 'Journal entry saved', fr: 'Entrée de journal enregistrée' },
  /* [FR self-authored] — propose_memory files to the review queue. */
  health_chat_did_memory: { en: 'Memory proposed — “{name}”', fr: 'Souvenir proposé — « {name} »' },
  health_chat_action_failed: {
    en: 'That write didn’t save — the reply above still stands.',
    fr: 'L’écriture n’a pas été enregistrée — la réponse ci-dessus demeure.',
  },
  /* Reactions — Mira responds inline where the action happened (check-in,
     habit, journal); the same words also land in the conversation.
     [FR self-authored] */
  health_journal_share_mira: { en: 'Let Mira read this', fr: 'Laisser Mira le lire' },
  health_journal_share_mira_loading: { en: 'Mira is reading…', fr: 'Mira lit…' },
  /* Per-entry consent, stated at the button. [FR self-authored] */
  health_journal_share_mira_hint: {
    en: 'She reads only this entry — her reply lands here and in your chat.',
    fr: 'Elle lit seulement cette entrée — sa réponse arrive ici et dans votre discussion.',
  },
  health_journal_share_failed: {
    en: 'Mira couldn’t read it right now — try again.',
    fr: 'Mira n’a pas pu le lire — réessayez.',
  },
  /* Undo on an action chip — reverses the write (unmark the habit, remove
     the added row); the chip then reads Undone. [FR self-authored] */
  health_chat_undo: { en: 'Undo', fr: 'Annuler' },
  health_chat_undone: { en: 'Undone', fr: 'Annulé' },
  health_chat_undo_failed: {
    en: 'Couldn’t undo that — try again.',
    fr: 'Impossible d’annuler — réessayez.',
  },
  /* Journal share state — entry rows where shared_at is set read as shared;
     Stop sharing revokes it and her context loses the excerpt at once.
     [FR self-authored] */
  health_journal_shared_mira: { en: 'Shared with Mira', fr: 'Partagé avec Mira' },
  health_journal_unshare_mira: { en: 'Stop sharing', fr: 'Retirer le partage' },
  health_journal_unshare_hint: {
    en: 'She stops seeing this entry right away.',
    fr: 'Elle ne voit plus cette entrée dès maintenant.',
  },
  health_journal_unshare_failed: {
    en: 'Couldn’t stop sharing — try again.',
    fr: 'Impossible de retirer le partage — réessayez.',
  },
  /* Overview strip — one thing she noticed, built locally (no call). The
     {mood} slot is a lowercase scale label; {note} a trimmed quote.
     [FR self-authored] */
  health_home_mira_label: { en: 'Mira noticed', fr: 'Mira a remarqué' },
  health_home_mira_streak: {
    en: '“{name}” — {days} days running.',
    fr: '« {name} » — {days} jours de suite.',
  },
  /* A run that ended yesterday — a pause, not a verdict. [FR self-authored] */
  health_home_mira_broke: {
    en: '“{name}” paused after a {days}-day streak.',
    fr: '« {name} » a fait une pause après {days} jours de suite.',
  },
  health_home_mira_checkin: {
    en: 'You checked in today — feeling {mood}.',
    fr: 'Vous avez pris le point aujourd’hui — {mood}.',
  },
  health_home_mira_note: {
    en: 'You wrote today: “{note}”',
    fr: 'Vous avez écrit aujourd’hui : « {note} »',
  },
  /* Quiet-return notice — someone who has history but hasn't checked in for
     a few days. Warm, not guilt-trippy: the door's open, that's all. */
  health_home_mira_away: {
    en: 'It’s been {days} days since your last check-in — the door’s open whenever.',
    fr: 'Ça fait {days} jours depuis votre dernier point — la porte reste ouverte.',
  },
  health_home_mira_open: { en: 'Chat with Mira', fr: 'Discuter avec Mira' },
  /* The strip's own week-count wording — the greeting's "already" fits a
     hello, not an observation. */
  health_home_mira_week: {
    en: 'You’ve checked in {count} times this week.',
    fr: 'Vous avez pris le point {count} fois cette semaine.',
  },
  /* Thumbs rating under an assistant reply — stored on the turn.
     [FR self-authored] */
  health_chat_rate_up: { en: 'Helpful', fr: 'Utile' },
  health_chat_rate_down: { en: 'Not helpful', fr: 'Pas utile' },
  /* Internal-staff tier — shown instead of health_chat_sub when the account
     is @dutiva.ca: the server lets Mira say plainly what she'd change.
     [FR self-authored] */
  health_chat_sub_internal: {
    en: 'Mira keeps you company here — she listens, remembers this conversation, and can jot things down for you: a check-in, a habit done, a journal entry. She’s software, not a person or a therapist — but on this internal account she says plainly what she’d change.',
    fr: 'Mira vous tient compagnie ici — elle écoute, se souvient de cette discussion et peut noter ce que vous demandez : un point du jour, une habitude faite, une entrée de journal. C’est un logiciel, pas une personne ni une thérapeute — mais sur ce compte interne, elle dit franchement ce qu’elle changerait.',
  },
  /* Empty-state starter chips — the third differs by tier.
     [FR self-authored] */
  health_chat_starter_1: {
    en: 'How has my week been?',
    fr: 'Comment s’est passée ma semaine ?',
  },
  health_chat_starter_2: {
    en: 'What habits am I tracking?',
    fr: 'Quelles habitudes est-ce que je suis en ce moment ?',
  },
  health_chat_starter_ext: {
    en: 'What’s a good wind-down routine?',
    fr: 'C’est quoi une bonne routine du soir ?',
  },
  health_chat_starter_int: {
    en: 'What would you change about my routine?',
    fr: 'Que changerais-tu à ma routine ?',
  },
  health_chat_internal_badge: { en: 'Internal', fr: 'Interne' },
  health_chat_retry: { en: 'Retry', fr: 'Réessayer' },
  health_chat_view: { en: 'View', fr: 'Voir' },
  health_chat_copy: { en: 'Copy reply', fr: 'Copier la réponse' },
  health_chat_load_earlier: {
    en: 'Load earlier messages',
    fr: 'Charger les messages précédents',
  },
  health_chat_enter_hint: {
    en: 'Enter to send · Shift+Enter for a new line',
    fr: 'Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne',
  },
  /* Conversation chrome — the thinking label, scroll pill, and the
     turn-level affordances (regenerate, reuse, stop). [FR self-authored] */
  health_chat_typing: { en: 'Mira is thinking…', fr: 'Mira réfléchit…' },
  /* The model's thinking trace — disclosure on an assistant turn.
     [FR self-authored] */
  health_chat_reasoning: { en: 'Mira’s notes', fr: 'Notes de Mira' },
  /* Tooltip on the reasoning disclosure — frames the trace as raw working
     so a mid-stream guess isn't read as a verified claim.
     [FR self-authored] */
  health_chat_reasoning_hint: {
    en: 'Raw working notes — guesses and false starts included',
    fr: 'Notes de travail brutes — essais et hypothèses compris',
  },
  health_chat_jump: { en: 'Jump to latest', fr: 'Aller au plus récent' },
  health_chat_regenerate: { en: 'Try another answer', fr: 'Essayer une autre réponse' },
  health_chat_reuse: { en: 'Reuse this text', fr: 'Réutiliser ce texte' },
  health_chat_stop: { en: 'Stop', fr: 'Arrêter' },
  /* What she reads — a disclosure under the subtitle listing her data
     sources, so the surface is honest about its scope. [FR self-authored] */
  health_chat_sees: { en: 'What Mira can see', fr: 'Ce que Mira voit' },
  health_chat_sees_list: {
    en: 'Your check-ins, habit names and streaks, journal entries you’ve shared, things you asked her to remember — and this conversation.',
    fr: 'Vos bilans, le nom et les séries de vos habitudes, les entrées de journal que vous avez partagées, ce que vous lui avez demandé de retenir — et cette conversation.',
  },
  /* One-tap reasons under a thumbs-down — stored with the rating.
     [FR self-authored] */
  health_chat_reason_label: { en: 'What was off?', fr: 'Qu’est-ce qui clochait ?' },
  health_chat_reason_wrong: { en: 'Not accurate', fr: 'Inexacte' },
  health_chat_reason_vague: { en: 'Too vague', fr: 'Trop vague' },
  health_chat_reason_tone: { en: 'Wrong tone', fr: 'Mauvais ton' },
  /* Named conversations — the switcher lists them; the default thread is
     always selectable as the main one. [FR self-authored] */
  health_chat_threads: { en: 'Conversations', fr: 'Conversations' },
  health_chat_thread_new: { en: 'New conversation', fr: 'Nouvelle conversation' },
  health_chat_thread_default: { en: 'Main conversation', fr: 'Conversation principale' },
  health_chat_thread_untitled: { en: 'Untitled conversation', fr: 'Conversation sans titre' },
  /* Follow-up chips the model offers with a reply — tapping one sends it.
     [FR self-authored] */
  health_chat_followup_label: { en: 'Follow up', fr: 'Suite possible' },
  /* Transcript + composer chrome. [FR self-authored] */
  health_chat_log_label: { en: 'Conversation', fr: 'Discussion' },
  /* The textarea's accessible name — the placeholder is a prompt, not a
     field name. [FR self-authored] */
  health_chat_input_label: { en: 'Message Mira', fr: 'Message à Mira' },
  health_chat_loading: {
    en: 'Loading the conversation…',
    fr: 'Chargement de la discussion…',
  },
  /* History failed — the greeting can't claim a fresh start over turns
     that may exist; an inline row with retry tells the truth instead. */
  health_chat_load_failed: {
    en: 'The conversation didn’t load.',
    fr: 'La discussion n’a pas chargé.',
  },
  /* Kept after the Stop pill — a partial answer must not pass for a
     finished one. */
  health_chat_stopped: { en: 'Stopped early', fr: 'Interrompue' },
  /* Day separators — relative when the turn is recent.
     [FR self-authored] */
  health_chat_day_today: { en: 'Today', fr: 'Aujourd’hui' },
  health_chat_day_yesterday: { en: 'Yesterday', fr: 'Hier' },
  /* Per-turn delete — the privacy escape short of clearing the thread. A
     user turn takes its paired reply with it. [FR self-authored] */
  health_chat_turn_delete: { en: 'Delete this message', fr: 'Supprimer ce message' },
  /* Armed second tap on a small icon button — fits where the icon sat. */
  health_chat_sure: { en: 'Sure?', fr: 'Confirmer ?' },
  /* Thread ops in the switcher — rename opens an inline input.
     [FR self-authored] */
  health_chat_thread_rename: { en: 'Rename', fr: 'Renommer' },
  health_chat_thread_delete: { en: 'Delete', fr: 'Supprimer' },
  health_chat_thread_name: {
    en: 'Conversation name',
    fr: 'Nom de la conversation',
  },
  /* The unseen-activity dot on the switcher and its rows.
     [FR self-authored] */
  health_chat_thread_activity: { en: 'New activity', fr: 'Nouvelle activité' },
  /* "Drew on" — the per-reply transparency line listing the context kinds
     the answer could see. Counts only, never content. [FR self-authored] */
  health_chat_ctx_label: { en: 'Drew on', fr: 'S’est appuyée sur' },
  health_chat_ctx_checkin_one: { en: '{count} check-in', fr: '{count} bilan' },
  health_chat_ctx_checkin_many: { en: '{count} check-ins', fr: '{count} bilans' },
  health_chat_ctx_habit_one: { en: '{count} habit', fr: '{count} habitude' },
  health_chat_ctx_habit_many: { en: '{count} habits', fr: '{count} habitudes' },
  health_chat_ctx_memory_one: {
    en: '{count} saved memory',
    fr: '{count} souvenir enregistré',
  },
  health_chat_ctx_memory_many: {
    en: '{count} saved memories',
    fr: '{count} souvenirs enregistrés',
  },
  health_chat_ctx_journal_one: {
    en: '{count} shared journal entry',
    fr: '{count} entrée de journal partagée',
  },
  health_chat_ctx_journal_many: {
    en: '{count} shared journal entries',
    fr: '{count} entrées de journal partagées',
  },
  /* Second paragraph in the "what she can see" disclosure — how replies
     happen, not just what she reads. [FR self-authored] */
  health_chat_how: {
    en: 'She answers over the context above and can take the small writes that appear as chips — every one is undoable. Memory suggestions wait in your Review queue; nothing is kept without you.',
    fr: 'Elle répond à partir du contexte ci-dessus et peut faire les petites écritures affichées en pastilles — chacune est annulable. Les souvenirs proposés attendent dans votre file de revue ; rien n’est gardé sans vous.',
  },
  /* Quiet label over the empty-state chips — and reused when starters
     resurface over a conversation that's been quiet a day.
     [FR self-authored] */
  health_chat_starters_label: { en: 'Start with', fr: 'Pour commencer' },
  /* Whole-transcript copy in the header — data portability by clipboard.
     [FR self-authored] */
  health_chat_export: { en: 'Copy conversation', fr: 'Copier la discussion' },
  health_chat_export_done: {
    en: 'Conversation copied.',
    fr: 'Discussion copiée.',
  },
  /* Empty-state shortcut — a link, not a chip, so it doesn't read as a
     prompt she answers. [FR self-authored] */
  health_chat_recap_link: {
    en: 'Or open your weekly recap',
    fr: 'Ou ouvrez votre bilan de la semaine',
  },
  /* Exit on the downvote reason chips — a changed mind shouldn't have to
     pick one. [FR self-authored] */
  health_chat_reason_dismiss: { en: 'Dismiss', fr: 'Ignorer' },
  health_seo_title_chat: { en: 'Mira — Dutiva Health', fr: 'Mira — Dutiva Santé' },
  health_seo_desc_chat: {
    en: 'Chat with Mira — the wellness companion who listens and keeps track with you.',
    fr: 'Discutez avec Mira — la compagne de bien-être qui vous écoute et suit le fil avec vous.',
  },
})
