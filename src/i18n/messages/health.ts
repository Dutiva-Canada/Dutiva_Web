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
    fr: 'En crise ou si vous pensez au suicide ? Appelez ou textez le 9-8-8 (Canada, 24/7) — ou le 911 en cas de danger immédiat.',
  },

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
  health_ov_today_none: { en: 'Not yet — take a minute for a quick check-in.', fr: 'Pas encore — prenez une minute pour faire le point.' },
  health_ov_mood_7d: { en: 'Average mood (7 days)', fr: 'Humeur moyenne (7 jours)' },
  health_ov_streak: { en: 'Check-in streak', fr: 'Jours de suite' },
  health_ov_streak_days: { en: '{count} days', fr: '{count} jours' },
  health_ov_streak_day: { en: '1 day', fr: '1 jour' },
  health_ov_entries: { en: 'Journal entries', fr: 'Entrées de journal' },
  health_ov_recent: { en: 'Recent check-ins', fr: 'Points récents' },
  health_ov_latest_entry: { en: 'Latest journal entry', fr: 'Dernière entrée de journal' },
  health_ov_new_checkin: { en: 'New check-in', fr: 'Nouveau point' },
  health_ov_new_entry: { en: 'New journal entry', fr: 'Nouvelle entrée' },
  health_ov_crisis_title: { en: 'Need support right now?', fr: 'Besoin de soutien immédiat ?' },
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
  health_checkin_mood: { en: 'How are you feeling?', fr: 'Comment vous sentez-vous ?' },
  health_checkin_energy: { en: 'Energy level', fr: 'Niveau d’énergie' },
  health_checkin_note: { en: 'Anything on your mind? (optional)', fr: 'Quelque chose en tête ? (facultatif)' },
  health_checkin_note_ph: {
    en: 'A sentence or two is plenty.',
    fr: 'Une phrase ou deux suffisent.',
  },
  health_checkin_submit: { en: 'Save check-in', fr: 'Enregistrer le point' },
  health_checkin_saved: { en: 'Check-in saved.', fr: 'Point enregistré.' },
  health_checkin_history: { en: 'History', fr: 'Historique' },
  health_checkin_delete: { en: 'Delete', fr: 'Supprimer' },
  health_checkin_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  health_checkin_empty: {
    en: 'Nothing yet — your check-ins will appear here.',
    fr: 'Rien pour l’instant — vos points apparaîtront ici.',
  },
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
  health_journal_edit: { en: 'Edit', fr: 'Modifier' },
  health_journal_cancel: { en: 'Cancel', fr: 'Annuler' },
  health_journal_delete: { en: 'Delete', fr: 'Supprimer' },
  health_journal_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
  health_journal_empty: {
    en: 'No entries yet. Writing a few lines is a good place to start.',
    fr: 'Aucune entrée pour l’instant. Écrire quelques lignes est un bon point de départ.',
  },
  health_journal_untitled: { en: 'Untitled', fr: 'Sans titre' },
  health_journal_edited: { en: 'Edited {date}', fr: 'Modifiée le {date}' },
  health_journal_body_required: { en: 'Write a few words first.', fr: 'Écrivez d’abord quelques mots.' },

  /* Insights — observations, not assessments */
  health_insights_title: { en: 'Insights', fr: 'Tendances' },
  health_insights_sub: {
    en: 'Patterns from your own check-ins — observations, not assessments.',
    fr: 'Des tendances tirées de vos propres points du jour — des observations, pas une évaluation.',
  },
  health_ins_mood_14d: { en: 'Mood over the last 14 days', fr: 'Humeur des 14 derniers jours' },
  health_ins_avg_mood: { en: 'Average mood', fr: 'Humeur moyenne' },
  health_ins_avg_energy: { en: 'Average energy', fr: 'Énergie moyenne' },
  health_ins_total: { en: 'Check-ins', fr: 'Points du jour' },
  health_ins_streak: { en: 'Current streak', fr: 'Jours de suite' },
  health_ins_entries: { en: 'Journal entries', fr: 'Entrées de journal' },
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
  health_res_988_name: { en: '9-8-8: Suicide Crisis Helpline', fr: '9-8-8 : Ligne d’aide en cas de crise suicide' },
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
    en: 'Call 1-800-668-6868 or text CONNECT to 686868. Free, 24/7.',
    fr: 'Appelez le 1-800-668-6868 ou textez PARLER au 686868. Gratuit, 24/7.',
  },
  health_res_hope_name: { en: 'Hope for Wellness Helpline', fr: 'Ligne d’écoute d’espoir pour le mieux-être' },
  health_res_hope_body: {
    en: 'Support for Indigenous peoples across Canada. Call 1-855-242-3310, 24/7.',
    fr: 'Soutien pour les peuples autochtones partout au Canada. Appelez le 1-855-242-3310, 24/7.',
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
  health_habit_delete_confirm: { en: 'Click again to confirm', fr: 'Cliquez à nouveau pour confirmer' },
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
  health_tab_review: { en: 'For review', fr: 'À valider' },
  health_review_title: { en: 'For review', fr: 'À valider' },
  health_review_sub: {
    en: 'Ideas the portal’s agents surfaced — each waits on your call, nothing is added on its own.',
    fr: 'Idées soulevées par les agents du portail — chacune attend votre décision, rien ne s’ajoute seul.',
  },
  health_review_empty: {
    en: 'Nothing waiting — agent suggestions land here when there’s something worth a look.',
    fr: 'Rien en attente — les suggestions des agents arrivent ici quand quelque chose mérite un regard.',
  },
  health_review_filed_by: { en: 'Filed by an agent', fr: 'Déposé par un agent' },
  health_review_load_failed: {
    en: 'The review list didn’t load — retry.',
    fr: 'La liste n’a pas chargé — réessayez.',
  },
  health_review_ack: { en: 'Got it', fr: 'C’est noté' },
  /* A resolve call failed — the row stays pending. [FR self-authored] */
  health_review_action_failed: {
    en: 'That didn’t save — it’s still waiting here; try again.',
    fr: 'Ça n’a pas enregistré — c’est toujours en attente ; réessayez.',
  },
  health_review_accept_habit: { en: 'Add it', fr: 'L’ajouter' },
  health_review_kind_habit: { en: 'Habit', fr: 'Habitude' },
  health_seo_title_review: { en: 'For review — Dutiva Health', fr: 'À valider — Dutiva Santé' },
  /* Queue write didn't land upstream — the suggestion works but won't
     survive leaving the page. [FR self-authored] */
  health_ai_not_filed: {
    en: 'Not saved for review — it disappears if you leave this page.',
    fr: 'Non conservée pour validation — elle disparaît si vous quittez la page.',
  },

  /* Tools — self-guided pauses, not treatment */
  health_tools_title: { en: 'Tools', fr: 'Outils' },
  health_tools_sub: {
    en: 'Small self-guided exercises for the moment you’re in — a pause with some structure, not treatment.',
    fr: 'De petits exercices guidés pour le moment présent — une pause structurée, pas un traitement.',
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
  health_tool_ground_title: { en: 'Grounding: 5–4–3–2–1', fr: 'Ancrage : 5–4–3–2–1' },
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
  health_tool_grat_p1: { en: 'What’s one thing that went a little better than expected today?', fr: 'Qu’est-ce qui s’est un peu mieux passé que prévu aujourd’hui ?' },
  health_tool_grat_p2: { en: 'Who made your day a bit easier — and how?', fr: 'Qui a rendu votre journée un peu plus facile — et comment ?' },
  health_tool_grat_p3: { en: 'What’s a small thing you have now that past-you wanted?', fr: 'Quelle petite chose avez-vous maintenant que vous souhaitiez avant ?' },
  health_tool_grat_p4: { en: 'What did you enjoy eating, seeing, or hearing recently?', fr: 'Qu’avez-vous aimé manger, voir ou entendre récemment ?' },
  health_tool_grat_another: { en: 'Try another prompt', fr: 'Une autre idée' },
  health_tool_grat_ph: { en: 'A sentence or two is plenty.', fr: 'Une phrase ou deux suffit.' },
  health_tool_grat_save: { en: 'Save to journal', fr: 'Enregistrer au journal' },
  health_tool_grat_saved: { en: 'Saved to your journal.', fr: 'Enregistrée dans votre journal.' },
  health_tool_grat_entry: { en: 'Gratitude', fr: 'Gratitude' },
  health_tools_note: {
    en: 'These exercises are pauses, not treatment. If you’re struggling, the Resources page lists real people to reach.',
    fr: 'Ces exercices sont des pauses, pas un traitement. Si vous avez du mal, la page Ressources liste de vraies personnes à joindre.',
  },

  /* Layout chrome */
  health_loading: { en: 'Loading…', fr: 'Chargement…' },
  health_load_error: {
    en: 'Couldn’t load your data. Check your connection and try again.',
    fr: 'Impossible de charger vos données. Vérifiez votre connexion et réessayez.',
  },
  health_retry: { en: 'Try again', fr: 'Réessayer' },
  health_sign_out: { en: 'Sign out', fr: 'Se déconnecter' },
  health_signed_in_as: { en: 'Signed in as {email}', fr: 'Connecté : {email}' },

  /* Footer + legal */
  health_footer_nav: { en: 'Dutiva Health links', fr: 'Liens Dutiva Santé' },
  health_footer_terms: { en: 'Terms', fr: 'Conditions' },
  health_footer_privacy: { en: 'Privacy', fr: 'Confidentialité' },
  health_footer_wellness: { en: 'Wellness notice', fr: 'Avis de bien-être' },
  health_footer_support: { en: 'Support', fr: 'Soutien' },
  health_legal_back: { en: 'Back to Health', fr: 'Retour à Santé' },
  health_legal_updated: { en: 'Last updated:', fr: 'Dernière mise à jour :' },
  health_legal_effective: { en: 'Effective:', fr: 'En vigueur :' },
  health_legal_contact: { en: 'Contact', fr: 'Nous joindre' },
  health_legal_hours: { en: 'Staffed hours:', fr: 'Heures de service :' },

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
    fr: 'Mira vous tient compagnie ici — elle écoute, se souvient de cette discussion et peut noter ce que vous demandez : un point du jour, une habitude faite, une entrée de journal. C’est un logiciel, pas une personne ni une thérapeute.',
  },
  /* Her opening turn on an empty conversation — she speaks first, in one
     breath: a hello, at most one thing she noticed, and a question. Built
     client-side from HealthState so it costs no call and stays bilingual.
     [FR self-authored] */
  health_chat_hi: { en: 'Hi — I’m Mira.', fr: 'Bonjour — je suis Mira.' },
  health_chat_hi_streak: {
    en: 'I noticed “{name}” is on a {days}-day streak — nicely kept.',
    fr: 'J’ai remarqué que « {name} » se maintient depuis {days} jours — bien tenu.',
  },
  health_chat_hi_checkins: {
    en: 'You’ve checked in {count} times this week already.',
    fr: 'Vous avez déjà pris le point {count} fois cette semaine.',
  },
  health_chat_hi_ask: {
    en: 'How are you arriving today?',
    fr: 'Comment vous sentez-vous en arrivant aujourd’hui ?',
  },
  health_chat_placeholder: {
    en: 'Tell Mira how it’s going, or what to jot down…',
    fr: 'Dites à Mira comment ça va, ou quoi noter…',
  },
  health_chat_send: { en: 'Send', fr: 'Envoyer' },
  health_chat_clear: { en: 'Clear conversation', fr: 'Effacer la discussion' },
  health_chat_error: {
    en: 'That didn’t go through — try again.',
    fr: 'Ça n’a pas fonctionné — réessayez.',
  },
  /* Confirmation chips under a reply that did something. The {name} slot is
     the subject the action touched. [FR self-authored] */
  health_chat_did_mark: { en: 'Marked “{name}” done today', fr: '« {name} » marqué pour aujourd’hui' },
  health_chat_did_unmark: { en: 'Unmarked “{name}” for today', fr: '« {name} » retiré pour aujourd’hui' },
  health_chat_did_habit: { en: 'Now tracking “{name}”', fr: '« {name} » ajouté au suivi' },
  health_chat_did_checkin: { en: 'Check-in logged — {name}', fr: 'Point du jour noté — {name}' },
  health_chat_did_journal: { en: 'Journal entry saved', fr: 'Entrée de journal enregistrée' },
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
    fr: '« {name} » — {days} jours de suite.',
  },
  health_home_mira_checkin: {
    en: 'You checked in today — feeling {mood}.',
    fr: 'Vous avez pris le point aujourd’hui — {mood}.',
  },
  health_home_mira_note: {
    en: 'You wrote today: “{note}”',
    fr: 'Vous avez écrit aujourd’hui : « {note} »',
  },
  /* Quiet-return notice — someone who has history but hasn't checked in for
     a few days. Warm, not guilt-trippy: the door's open, that's all. */
  health_home_mira_away: {
    en: 'It’s been {days} days since your last check-in — the door’s open whenever.',
    fr: 'Ça fait {days} jours depuis votre dernier point — la porte reste ouverte.',
  },
  health_home_mira_open: { en: 'Chat with Mira', fr: 'Discuter avec Mira' },
  /* Thumbs rating under an assistant reply — stored on the turn.
     [FR self-authored] */
  health_chat_rate_up: { en: 'Helpful', fr: 'Utile' },
  health_chat_rate_down: { en: 'Not helpful', fr: 'Pas utile' },
  /* Internal-staff tier — shown instead of health_chat_sub when the account
     is @dutiva.ca: the server lets Mira say plainly what she'd change.
     [FR self-authored] */
  health_chat_sub_internal: {
    en: 'Mira keeps you company here — she listens, remembers this conversation, and can jot things down for you. Internal staff account: she also says plainly what she’d change.',
    fr: 'Mira vous tient compagnie ici — elle écoute, se souvient de cette discussion et peut noter ce que vous demandez. Compte interne : elle dit aussi franchement ce qu’elle changerait.',
  },
  /* Empty-state starter chips — the third differs by tier.
     [FR self-authored] */
  health_chat_starter_1: {
    en: 'How has my week been?',
    fr: 'Comment s’est passée ma semaine ?',
  },
  health_chat_starter_2: {
    en: 'What habits am I tracking?',
    fr: 'Quelles habitudes je suis en ce moment ?',
  },
  health_chat_starter_ext: {
    en: 'What’s a good wind-down routine?',
    fr: 'C’est quoi une bonne routine du soir ?',
  },
  health_chat_starter_int: {
    en: 'What would you change about my routine?',
    fr: 'Que changerais-tu à ma routine ?',
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
  health_seo_title_chat: { en: 'Mira — Dutiva Health', fr: 'Mira — Dutiva Santé' },
  health_seo_desc_chat: {
    en: 'Chat with Mira — the wellness companion who listens and keeps track with you.',
    fr: 'Discutez avec Mira — la compagne de bien-être qui vous écoute et suit le fil avec vous.',
  },
})
