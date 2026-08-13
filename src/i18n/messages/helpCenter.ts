import { defineMessages } from '../core'

/**
 * Help Centre UI chrome (hero, search, feedback widget, contact CTA). Article
 * and category *content* lives as `Bi` data in
 * `src/features/support/help/helpCenterData.ts` (rendered with `x()`); this
 * module holds only the surrounding interface strings, keyed `help_*`.
 */
export const helpCenterMessages = defineMessages({
  help_eyebrow: { en: 'Help Centre', fr: 'Centre d’aide' },
  help_h1: { en: 'How can we help?', fr: 'Comment pouvons-nous vous aider ?' },
  help_intro: {
    en: 'Search our guides, or browse by topic. Most questions are answered here — and you can always send a support request.',
    fr: 'Cherchez dans nos guides ou parcourez par sujet. La plupart des questions trouvent réponse ici — et vous pouvez toujours envoyer une demande de soutien.',
  },

  help_search_label: { en: 'Search the Help Centre', fr: 'Rechercher dans le centre d’aide' },
  help_search_placeholder: { en: 'Search for a topic…', fr: 'Rechercher un sujet…' },
  help_search_clear: { en: 'Clear search', fr: 'Effacer la recherche' },
  help_results_for: { en: 'Results for', fr: 'Résultats pour' },
  help_no_results_title: { en: 'No matching articles', fr: 'Aucun article correspondant' },
  help_no_results_body: {
    en: 'Try a different search, browse the categories below, or send us a support request.',
    fr: 'Essayez une autre recherche, parcourez les catégories ci-dessous ou envoyez-nous une demande de soutien.',
  },

  help_browse_title: { en: 'Browse by topic', fr: 'Parcourir par sujet' },
  help_back: { en: 'Back to Help Centre', fr: 'Retour au centre d’aide' },
  help_related_title: { en: 'More in this topic', fr: 'Plus dans ce sujet' },

  /* "Was this helpful?" widget. */
  help_feedback_question: { en: 'Was this article helpful?', fr: 'Cet article vous a-t-il été utile ?' },
  help_feedback_yes: { en: 'Yes', fr: 'Oui' },
  help_feedback_no: { en: 'No', fr: 'Non' },
  help_feedback_thanks_yes: { en: 'Thanks for letting us know.', fr: 'Merci de nous l’avoir indiqué.' },
  help_feedback_thanks_no: {
    en: 'Thanks — if you still need help, contact support below.',
    fr: 'Merci — si vous avez encore besoin d’aide, contactez le soutien ci-dessous.',
  },

  /* Closing contact escalation (shared by the index and article pages). */
  help_contact_title: { en: 'Still need help?', fr: 'Besoin d’aide supplémentaire ?' },
  help_contact_body: {
    en: 'If you can’t find what you’re looking for, send a support request and we’ll reply in writing.',
    fr: 'Si vous ne trouvez pas ce que vous cherchez, envoyez une demande de soutien et nous répondrons par écrit.',
  },
  help_contact_action: { en: 'Contact support', fr: 'Contacter le soutien' },
  help_contact_policy: { en: 'How support works', fr: 'Fonctionnement du soutien' },
})
