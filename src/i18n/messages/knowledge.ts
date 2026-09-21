import { defineMessages } from '../core'

/**
 * Knowledge Base (HR library) view — `buildKnowledgeView()` in App v2.dc.html.
 * EN strings are verbatim from the prototype (markup line 1254 placeholder,
 * `onOpen` rail text line 3527). The prototype ships NO French for either
 * string (the placeholder is hard-coded in markup and the rail text has no
 * `frDict` entry), so both FR values are self-authored Québec French.
 *
 * NOTE: registered in src/i18n/messages/index.ts by the integration owner.
 * The view resolves these via `useI18n().x(knowledgeMessages.key)`.
 */
export const knowledgeMessages = defineMessages({
  /* Markup line 1254 — FR self-authored. */
  knowledge_filter_placeholder: {
    en: 'Search HR knowledge…',
    fr: 'Rechercher dans les connaissances RH…',
  },

  /* Rail intro on opening an article (line 3527) — FR self-authored. */
  knowledge_rail_intro: {
    en: 'Here’s a summary of what this covers, and how it applies to your workspace.',
    fr: 'Voici un résumé de ce que cela couvre et de la façon dont cela s’applique à votre espace de travail.',
  },

  /* Empty state when the search filter matches nothing — FR self-authored. */
  knowledge_no_results: {
    en: 'No guides or articles match that search.',
    fr: 'Aucun guide ni article ne correspond à cette recherche.',
  },
})
