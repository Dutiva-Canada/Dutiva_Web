import { defineMessages } from '../../core'

/**
 * Careers — the AI surfaces: resume/cover-letter tools,
 * Claire (the chat coach), the job search agent, and the
 * external-application log. [FR self-authored] throughout.
 */
export const careersAssistant = defineMessages({
  /* ── AI features ──────────────────────────────────────────────────────── */
  careers_ai_section_title: { en: 'AI tools (optional)', fr: 'Outils IA (optionnel)' },
  careers_ai_section_subtitle: {
    en: 'Use AI to strengthen your application. Everything here is optional — you can apply without it.',
    fr: "Utilisez l’IA pour renforcer votre candidature. Tout ici est optionnel — vous pouvez postuler sans.",
  },
  careers_ai_tailor_resume: { en: 'Tailor my resume', fr: 'Adapter mon CV' },
  careers_ai_tailor_resume_desc: {
    en: 'Highlights the experience most relevant to this role.',
    fr: "Met en évidence l’expérience la plus pertinente pour ce poste.",
  },
  careers_ai_cover_letter: { en: 'Draft a cover letter', fr: 'Rédiger une lettre de motivation' },
  careers_ai_cover_letter_desc: {
    en: 'Generates a first draft based on your profile and the job posting.',
    fr: "Génère un premier brouillon basé sur votre profil et l’offre.",
  },
  careers_ai_match_score: { en: 'Check my match', fr: 'Évaluer ma correspondance' },
  careers_ai_match_score_desc: {
    en: 'See how well your profile aligns with the role. If you run this check, the score and suggestions are included with your application and visible to the employer.',
    fr: "Voyez dans quelle mesure votre profil correspond au poste. Si vous lancez cette évaluation, le score et les suggestions sont joints à votre candidature et visibles par l’employeur.",
  },
  careers_ai_interview_prep: { en: 'Interview prep', fr: "Préparation à l’entretien" },
  careers_ai_interview_prep_desc: {
    en: 'Practice questions and talking points for this role.',
    fr: 'Questions de pratique et points de discussion pour ce poste.',
  },
  careers_ai_generating: { en: 'Generating…', fr: 'Génération…' },
  careers_ai_error: {
    en: 'AI tool unavailable. You can still apply without it.',
    fr: 'Outil IA indisponible. Vous pouvez toujours postuler sans.',
  },
  careers_ai_daily_limit: {
    en: "You’ve reached today’s AI limit. Try again tomorrow — you can still submit your application without them.",
    fr: 'Vous avez atteint la limite IA du jour. Réessayez demain — vous pouvez quand même soumettre votre candidature.',
  },
  careers_ai_match_score_label: { en: 'Match score', fr: 'Score de correspondance' },
  careers_ai_match_suggestions: { en: 'Suggestions', fr: 'Suggestions' },
  careers_ai_use_tailored: { en: 'Use this version', fr: 'Utiliser cette version' },
  careers_ai_use_cover_letter: { en: 'Use this cover letter', fr: 'Utiliser cette lettre' },
  careers_ai_interview_questions: { en: 'Practice questions', fr: 'Questions de pratique' },
  careers_ai_interview_talking_points: { en: 'Talking points', fr: 'Points de discussion' },
  careers_ai_disclaimer: {
    en: 'AI suggestions are a starting point. Review and edit before submitting.',
    fr: "Les suggestions de l’IA sont un point de départ. Révisez et modifiez avant de soumettre.",
  },

  /* ── Candidate portal — chat (Claire, the search coach) ─────────────────
     Server-side her register is tiered on the sign-in email: external
     accounts get honest reads and next steps, verified @dutiva.ca accounts
     get a coach who advises directly — hence the two subtitles. */
  careers_portal_nav_chat: { en: 'Claire', fr: 'Claire' },
  careers_chat_title: { en: 'Claire', fr: 'Claire' },
  careers_chat_sub: {
    en: 'Your search coach — ask about your applications, the jobs your agent found, or how hiring reads. She’s software, not a person or a recruiter.',
    fr: 'Votre coach de recherche — posez-lui une question sur vos candidatures, les offres que votre agent a trouvées ou le fonctionnement du recrutement. C’est un logiciel, pas une personne ni une recruteuse.',
  },
  careers_chat_sub_internal: {
    en: 'Your search coach — ask about your applications, the jobs your agent found, or how hiring reads. Internal staff account: she also advises on the search directly.',
    fr: 'Votre coach de recherche — posez-lui une question sur vos candidatures, les offres que votre agent a trouvées ou le fonctionnement du recrutement. Compte interne : elle vous conseille aussi directement sur la recherche.',
  },
  careers_chat_greeting: {
    en: 'Hi — I’m Claire, your search coach. I can see your profile, your applications, and the jobs your agent found. What do you want to work on?',
    fr: 'Bonjour — je suis Claire, votre coach de recherche. Je vois votre profil, vos candidatures et les offres que votre agent a trouvées. Sur quoi voulez-vous travailler?',
  },
  careers_chat_placeholder: { en: 'Ask about your search…', fr: 'Posez une question sur votre recherche…' },
  careers_chat_send: { en: 'Send', fr: 'Envoyer' },
  careers_chat_clear: { en: 'Clear', fr: 'Effacer' },
  careers_chat_error: {
    en: 'Claire is unavailable right now — try again in a moment.',
    fr: 'Claire est indisponible pour le moment — réessayez dans un instant.',
  },
  careers_chat_daily_limit: {
    en: 'You’ve reached today’s AI limit — Claire will be back tomorrow.',
    fr: 'Vous avez atteint la limite IA du jour — Claire sera de retour demain.',
  },
  careers_chat_rate_up: { en: 'Helpful', fr: 'Utile' },
  careers_chat_rate_down: { en: 'Not helpful', fr: 'Pas utile' },
  /* Empty-state starter chips — the third differs by tier.
     [FR self-authored] */
  careers_chat_starter_1: {
    en: 'Which discovered jobs fit me best?',
    fr: 'Quelles offres dénichées me conviennent le mieux ?',
  },
  careers_chat_starter_2: {
    en: 'How does my profile read to a recruiter?',
    fr: 'Comment mon profil se lit-il pour un recruteur ?',
  },
  careers_chat_starter_ext: {
    en: 'How do I answer “tell me about yourself”?',
    fr: 'Comment répondre à « parlez-moi de vous » ?',
  },
  careers_chat_starter_int: {
    en: 'Which application should I push on first — and why?',
    fr: 'Quelle candidature pousser en premier — et pourquoi ?',
  },
  careers_chat_internal_badge: { en: 'Internal', fr: 'Interne' },
  careers_chat_retry: { en: 'Retry', fr: 'Réessayer' },
  careers_chat_copy: { en: 'Copy reply', fr: 'Copier la réponse' },
  careers_chat_load_earlier: {
    en: 'Load earlier messages',
    fr: 'Charger les messages précédents',
  },
  careers_chat_enter_hint: {
    en: 'Enter to send · Shift+Enter for a new line',
    fr: 'Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne',
  },
  /* Conversation chrome — the thinking label, scroll pill, and the
     turn-level affordances (regenerate, reuse, stop). [FR self-authored] */
  careers_chat_typing: { en: 'Claire is thinking…', fr: 'Claire réfléchit…' },
  careers_chat_jump: { en: 'Jump to latest', fr: 'Aller au plus récent' },
  careers_chat_regenerate: { en: 'Try another answer', fr: 'Essayer une autre réponse' },
  careers_chat_reuse: { en: 'Reuse this text', fr: 'Réutiliser ce texte' },
  careers_chat_stop: { en: 'Stop', fr: 'Arrêter' },
  /* What she reads — a disclosure under the subtitle listing her data
     sources, so the surface is honest about its scope. [FR self-authored] */
  careers_chat_sees: { en: 'What Claire can see', fr: 'Ce que Claire voit' },
  careers_chat_sees_list: {
    en: 'Your profile and resume excerpt, your applications, the jobs your search agent found, and this conversation.',
    fr: 'Votre profil et l’extrait de votre CV, vos candidatures, les offres trouvées par votre agent de recherche — et cette conversation.',
  },
  /* One-tap reasons under a thumbs-down — stored with the rating.
     [FR self-authored] */
  careers_chat_reason_label: { en: 'What was off?', fr: 'Qu’est-ce qui clochait ?' },
  careers_chat_reason_wrong: { en: 'Not accurate', fr: 'Inexacte' },
  careers_chat_reason_vague: { en: 'Too vague', fr: 'Trop vague' },
  careers_chat_reason_tone: { en: 'Wrong tone', fr: 'Mauvais ton' },
  /* Named conversations — the switcher lists them; the default thread is
     always selectable as the main one. [FR self-authored] */
  careers_chat_threads: { en: 'Conversations', fr: 'Conversations' },
  careers_chat_thread_new: { en: 'New conversation', fr: 'Nouvelle conversation' },
  careers_chat_thread_default: { en: 'Main conversation', fr: 'Conversation principale' },
  careers_chat_thread_untitled: { en: 'Untitled conversation', fr: 'Conversation sans titre' },
  /* Follow-up chips the model offers with a reply — tapping one sends it.
     [FR self-authored] */
  careers_chat_followup_label: { en: 'Follow up', fr: 'Suite possible' },

  /* ── Job search agent ─────────────────────────────────────────────────── */
  careers_agent_title: { en: 'Job search agent', fr: 'Agent de recherche d’emploi' },
  careers_agent_body: {
    en: 'Dutiva checks the company job boards you list, scores each new posting against your resume, and drafts a tailored resume and cover letter for the ones that fit.',
    fr: 'Dutiva consulte les sites d’emploi des entreprises que vous indiquez, évalue chaque nouvelle offre par rapport à votre CV et rédige un CV adapté et une lettre de présentation pour celles qui correspondent.',
  },
  careers_agent_enable: { en: 'Enable agent', fr: 'Activer l’agent' },
  careers_agent_autonomy_label: { en: 'When a posting matches', fr: 'Quand une offre correspond' },
  careers_agent_review_each: { en: 'Prepare it for my review', fr: 'La préparer pour ma révision' },
  careers_agent_auto_submit: { en: 'Submit it automatically', fr: 'La soumettre automatiquement' },
  careers_agent_auto_note: {
    en: 'Automatic submission only runs on boards with an application endpoint (Greenhouse). Other matches are prepared for you to finish on the company site.',
    fr: 'La soumission automatique ne fonctionne que sur les plateformes dotées d’un point d’application (Greenhouse). Les autres offres sont préparées pour que vous les terminiez sur le site de l’entreprise.',
  },
  careers_agent_keywords: { en: 'Target roles', fr: 'Rôles visés' },
  careers_agent_keywords_hint: {
    en: 'Comma-separated — e.g. payroll, HR coordinator',
    fr: 'Séparés par des virgules — p. ex. paie, coordonnateur RH',
  },
  careers_agent_locations: { en: 'Locations', fr: 'Lieux' },
  careers_agent_locations_hint: {
    en: 'Comma-separated cities or provinces',
    fr: 'Villes ou provinces séparées par des virgules',
  },
  careers_agent_remote: { en: 'Include remote jobs', fr: 'Inclure les emplois à distance' },
  careers_agent_boards: { en: 'Company job boards', fr: 'Sites d’emploi des entreprises' },
  careers_agent_boards_hint: {
    en: 'One per line — greenhouse:company or lever:company, using the name in their careers URL',
    fr: 'Un par ligne — greenhouse:entreprise ou lever:entreprise, selon le nom dans l’URL de leur page carrières',
  },
  careers_agent_min_score: { en: 'Minimum match score (0–100)', fr: 'Score minimum (0–100)' },
  careers_agent_daily_cap: {
    en: 'Maximum submissions per day',
    fr: 'Soumissions maximales par jour',
  },
  careers_agent_save: { en: 'Save agent settings', fr: 'Enregistrer les paramètres' },
  careers_agent_saved: { en: 'Agent settings saved', fr: 'Paramètres de l’agent enregistrés' },
  careers_agent_run_now: { en: 'Run a search now', fr: 'Lancer une recherche' },
  careers_agent_running: { en: 'Searching…', fr: 'Recherche en cours…' },
  careers_agent_scan_done_one: {
    en: 'Search finished — {count} new posting found.',
    fr: 'Recherche terminée — {count} nouvelle offre trouvée.',
  },
  careers_agent_scan_done_many: {
    en: 'Search finished — {count} new postings found.',
    fr: 'Recherche terminée — {count} nouvelles offres trouvées.',
  },
  careers_agent_scan_none: {
    en: 'Search finished — nothing new this time.',
    fr: 'Recherche terminée — rien de nouveau cette fois.',
  },
  careers_agent_run_needs_setup: {
    en: 'Enable the agent and add at least one job board first.',
    fr: 'Activez l’agent et ajoutez au moins un site d’emploi d’abord.',
  },

  /* ── External applications (agent log) ──────────────────────────────────── */
  careers_external_title: { en: 'External applications', fr: 'Candidatures externes' },
  careers_external_body: {
    en: 'Every posting your agent applied to or prepared — the company, the package it used, and the outcome.',
    fr: 'Chaque offre pour laquelle votre agent a postulé ou préparé un dossier — l’entreprise, les documents utilisés et le résultat.',
  },
  careers_external_match: { en: 'Match', fr: 'Correspondance' },
  careers_external_submitted_on: { en: 'Submitted', fr: 'Soumise le' },
  careers_external_prepared_on: { en: 'Prepared', fr: 'Préparée le' },
  careers_external_open: { en: 'Open posting', fr: 'Voir l’offre' },
  careers_external_approve: { en: 'Submit application', fr: 'Soumettre la candidature' },
  careers_external_skip: { en: 'Skip', fr: 'Ignorer' },
  careers_external_via: { en: 'via {source}', fr: 'via {source}' },
  careers_external_status_needs_review: { en: 'Needs review', fr: 'À réviser' },
  careers_external_status_queued: { en: 'Queued', fr: 'En file' },
  careers_external_status_submitted: { en: 'Submitted', fr: 'Soumise' },
  careers_external_status_manual: { en: 'Finish on company site', fr: 'À compléter sur le site' },
  careers_external_status_skipped: { en: 'Skipped', fr: 'Ignorée' },
  careers_external_status_failed: { en: 'Failed', fr: 'Échec' },

  /* ── Misc ─────────────────────────────────────────────────────────────── */
  careers_loading: { en: 'Loading…', fr: 'Chargement…' },
  careers_retry: { en: 'Try again', fr: 'Réessayer' },
  careers_error_generic: {
    en: 'Something went wrong. Please try again.',
    fr: "Une erreur s’est produite. Veuillez réessayer.",
  },
  careers_agent_keywords_placeholder: { en: 'payroll, HR coordinator', fr: 'paie, coordonnateur ou coordonnatrice RH' },
  careers_agent_locations_placeholder: { en: 'Toronto, Montreal, Quebec', fr: 'Toronto, Montréal, Québec' },
})
