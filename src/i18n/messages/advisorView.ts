import { defineMessages } from '../core'

/**
 * Advisor view (full-page AI chat) — UI-chrome strings for the advisor home
 * empty state, the in-view thread list, the transcript chrome, and the chat
 * composer/footer.
 *
 * EN verbatim from `App v2.dc.html` (`buildI18n()`, `buildAdvisorHomeWidgets`,
 * `renderVals`); FR from the prototype's `buildI18n()` fr table, `frDict()`
 * and inline `L(en, fr)` pairs. FR strings with no source in the prototype
 * are marked [FR self-authored].
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 */
export const advisorViewMessages = defineMessages({
  /* ── Advisor home (empty state) ─────────────────────────────────────────── */
  advisorview_greeting: { en: 'Good to see you, Riley.', fr: 'Bonjour, Riley.' },
  advisorview_digest_sub: {
    en: "Here's what Advisor noticed since yesterday.",
    fr: 'Voici ce que le Conseiller a remarqué depuis hier.',
  },
  advisorview_daily_brief: { en: "Advisor's daily brief", fr: 'Bilan quotidien du Conseiller' },
  advisorview_priorities_title: { en: 'Priorities today', fr: 'Priorités du jour' },
  advisorview_signals_label: { en: 'signals', fr: 'signaux' },
  advisorview_why: { en: 'Why', fr: 'Pourquoi' },

  /* Metric tiles (prototype `buildAdvisorHomeWidgets`, inline L pairs). */
  advisorview_metric_compliance: { en: 'Compliance score', fr: 'Score de conformité' },
  advisorview_metric_risk: { en: 'Open risk items', fr: 'Éléments à risque ouverts' },
  advisorview_metric_cases: { en: 'Active cases', fr: 'Dossiers actifs' },
  advisorview_metric_signals: { en: 'Support signals', fr: 'Signaux de soutien' },
  /* Trend lines live in advisorHomeData.ts as interpolated bi() values. */

  /* ── Composer + footer ──────────────────────────────────────────────────── */
  advisorview_composer_home: {
    en: 'Ask Advisor anything about your team…',
    fr: 'Demandez au Conseiller à propos de votre équipe…',
  },

  /* Production-mode starter prompts (shown below the home composer). */
  advisorview_prod_prompt_policy: {
    en: 'Which policies in my workspace need attention?',
    fr: 'Quelles politiques de mon espace de travail demandent de l’attention ?',
  },
  advisorview_prod_prompt_probation: {
    en: 'What should I include in a probation review?',
    fr: 'Que devrais-je inclure dans une évaluation de probation ?',
  },
  advisorview_prod_prompt_comms: {
    en: 'Help me draft a sensitive employee communication.',
    fr: 'Aidez-moi à rédiger une communication sensible à un employé.',
  },
  advisorview_composer_msg: { en: 'Message Advisor…', fr: 'Écrire au Conseiller…' },

  /* ── Thread list ────────────────────────────────────────────────────────── */
  advisorview_new_conversation: { en: 'New conversation', fr: 'Nouvelle conversation' },
  advisorview_threads_aria: { en: 'Conversations', fr: 'Conversations' }, // [FR self-authored]
  advisorview_open_threads: {
    en: 'Open conversations',
    fr: 'Ouvrir les conversations',
  },
  advisorview_close_threads: {
    en: 'Hide conversations',
    fr: 'Masquer les conversations',
  }, // [FR self-authored]
  advisorview_group_pinned: { en: 'Pinned', fr: 'Épinglé' },
  advisorview_group_today: { en: 'Today', fr: 'Aujourd’hui' },
  advisorview_group_week: { en: 'Previous 7 days', fr: '7 derniers jours' },
  advisorview_group_older: { en: 'Older', fr: 'Plus anciennes' },
  advisorview_show_older: {
    en: 'Show older conversations',
    fr: 'Afficher les conversations plus anciennes',
  }, // [FR self-authored]
  advisorview_delete_conversation: {
    en: 'Delete conversation',
    fr: 'Supprimer la conversation',
  }, // [FR self-authored]
  advisorview_delete_confirm: {
    en: 'Delete this conversation permanently? This can’t be undone.',
    fr: 'Supprimer cette conversation définitivement ? Cette action est irréversible.',
  }, // [FR self-authored]
  advisorview_delete_ok: {
    en: 'Conversation deleted',
    fr: 'Conversation supprimée',
  }, // [FR self-authored]
  advisorview_delete_failed: {
    en: 'Couldn’t delete that conversation. Try again.',
    fr: 'Impossible de supprimer cette conversation. Réessayez.',
  }, // [FR self-authored]

  /* ── Transcript chrome ──────────────────────────────────────────────────── */
  advisorview_copy: { en: 'Copy', fr: 'Copier' },
  advisorview_export: { en: 'Export', fr: 'Exporter' },
  advisorview_generate: { en: 'Generate', fr: 'Générer' }, // [FR self-authored]

  /* Escalation toast (prototype `handleFollowup` → pushToast). */
  advisorview_toast_counsel: {
    en: 'Case shared with employment counsel',
    fr: 'Dossier partagé avec le conseiller juridique en emploi', // [FR self-authored]
  },

  /* Real advisor-chat backend failure (no prototype counterpart). */
  advisorview_real_chat_error: {
    en: 'The AI Advisor is temporarily unavailable.',
    fr: 'L’Advisor IA est temporairement indisponible.',
  },
  advisorview_real_chat_retry_prompt: {
    en: 'Send your question again to retry.',
    fr: 'Renvoyez votre question pour réessayer.',
  },

  /* Beta AI usage guardrail (supabase/functions/_shared/aiUsage.ts). Shown as
     an ordinary Advisor reply, not the red error turn: nothing is broken, the
     answer is simply deferred, and the error turn's Retry button would only
     invite a second refusal. `{wait}` is filled from the server's Retry-After
     by usageLimitReply() in ../../features/app/advisor/usageLimit.ts. */
  advisorview_usage_limit_personal: {
    en: "You've hit the beta Advisor limit — back in about {wait}. Everything else in Dutiva still works.",
    fr: 'Vous avez atteint la limite bêta du Conseiller — de retour dans environ {wait}. Tout le reste de Dutiva fonctionne encore.', // [FR self-authored]
  },
  advisorview_usage_limit_platform: {
    en: "Advisor's at its beta-wide limit — back in about {wait}. On us. Rest of Dutiva still works.",
    fr: 'Le Conseiller a atteint son plafond pour toute la bêta — de retour dans environ {wait}. C’est de notre côté. Le reste de Dutiva fonctionne encore.', // [FR self-authored]
  },
  advisorview_usage_wait_minute: { en: 'a minute', fr: 'une minute' }, // [FR self-authored]
  advisorview_usage_wait_minutes: { en: '{count} minutes', fr: '{count} minutes' }, // [FR self-authored]
  advisorview_usage_wait_hour: { en: 'an hour', fr: 'une heure' }, // [FR self-authored]
  advisorview_usage_wait_hours: { en: '{count} hours', fr: '{count} heures' }, // [FR self-authored]

  advisorview_usage_limit_commercial: {
    en: "You've used this month's {included} included Advisor replies. Packs of {pack50} are ${price50} CAD, or {pack200} for ${price200} CAD. Packs are not a plan feature — paying for a plan still buys support, not extra modules.",
    fr: 'Vous avez utilisé les {included} réponses du Conseiller incluses ce mois-ci. Un forfait de {pack50} réponses coûte {price50} $ CA, ou {pack200} pour {price200} $ CA. Ces forfaits ne sont pas une fonction d’abonnement — payer un forfait achète du soutien, pas des modules supplémentaires.', // [FR self-authored]
  },
  advisorview_pack_buy_heading: {
    en: 'Buy more Advisor replies',
    fr: 'Acheter plus de réponses du Conseiller', // [FR self-authored]
  },
  advisorview_pack_buy: {
    en: '{count} replies — ${price} CAD',
    fr: '{count} réponses — {price} $ CA', // [FR self-authored]
  },
  advisorview_pack_internal_skip: {
    en: 'Internal Dutiva accounts skip Advisor reply packs.',
    fr: 'Les comptes internes Dutiva n’achètent pas de forfaits de réponses.', // [FR self-authored]
  },
  advisorview_pack_checkout_failed: {
    en: 'Could not start pack checkout. Try again, or email support@dutiva.ca.',
    fr: 'Impossible de démarrer le paiement du forfait. Réessayez, ou écrivez à support@dutiva.ca.', // [FR self-authored]
  },

  /* Crisis intercept (AGENT.md §8) — deterministic, maintained copy shown
     instead of any model reply when the crisis pre-classifier fires. The
     9-8-8 sentence is the handoff's verbatim resource: maintained from
     public sources, never model-generated. Single literals on purpose — the
     maintained sentence must stay greppable in full. */
  advisorview_crisis_support: {
    en: "I'm really sorry you're going through this — thank you for saying it here. What you're feeling matters, and you don't have to carry it alone. It can help to step back for a moment and talk to someone you trust — a friend, a family member, your doctor, or an employee assistance program if one is available to you. If you ever feel you might be in crisis, please contact 9-8-8 — the Suicide Crisis Helpline, available 24/7 by call or text. I'm here when you're ready to continue, at whatever pace works for you.",
    fr: 'Je suis vraiment désolé que vous traversiez cela — merci de l’avoir dit ici. Ce que vous ressentez compte, et vous n’avez pas à porter tout cela sans soutien. Il peut être utile de prendre un moment de recul et de parler à une personne de confiance — un ami, un proche, votre médecin, ou un programme d’aide aux employés si vous y avez accès. Si vous sentez que vous pourriez être en crise, veuillez contacter le 9-8-8 — la Ligne d’aide en cas de crise de suicide, offerte 24 h sur 24, 7 jours sur 7, par appel ou texto. Je suis là quand vous voudrez continuer, à votre rythme.', // [FR self-authored]
  },
  advisorview_crisis_thread_title: { en: 'Support', fr: 'Soutien' }, // [FR self-authored]
  /* EF3: title for the export audit row when a user copies an Advisor message. */
  advisorview_chat_copy_title: { en: 'Advisor chat copy', fr: 'Copie de conversation Conseiller' }, // [FR self-authored]
})
