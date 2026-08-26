import { defineMessages } from '../core'

/**
 * Messages for the jurisdiction-scoping questionnaire tool — a public,
 * indexable, linkable marketing page that helps an employer determine
 * which Canadian employment standards jurisdiction likely applies to a
 * given employment relationship.
 *
 * The tool works within the editorial rule in `articleModel.ts`: no
 * statutory figures (notice periods, dollar thresholds, deadline counts).
 * It names the statute and points to the official text, never the numbers.
 */
export const jurisdictionToolMessages = defineMessages({
  jur_tool_eyebrow: { en: 'Free tool', fr: 'Outil gratuit' },
  jur_tool_h1: {
    en: 'Which employment standards jurisdiction applies to your employee?',
    fr: 'Quelle juridiction en matière de normes d’emploi s’applique à votre employé ?',
  },
  jur_tool_intro: {
    en: 'Answer three questions to determine whether Ontario (ESA), Quebec (LNT), or federal (Canada Labour Code) employment standards likely apply. This tool names the statute and links to the official text — it does not state notice periods, thresholds, or deadlines, because those vary by fact pattern and go stale.',
    fr: 'Répondez à trois questions pour déterminer si les normes d’emploi de l’Ontario (LNE), du Québec (LNT) ou du fédéral (Code canadien du travail) s’appliquent probablement. Cet outil nomme la loi et renvoie au texte officiel — il n’indique pas les préavis, les seuils ni les échéances, car ceux-ci varient selon la situation et deviennent rapidement obsolètes.',
  },
  /* SEO meta only — page hero keeps the longer jur_tool_intro. */
  jur_tool_meta_description: {
    en: 'Free tool: determine whether Ontario, Quebec, or federal employment standards apply. Three questions, links to official statutes, no statutory figures.',
    fr: 'Outil gratuit : déterminez si les normes d’emploi ON, QC ou fédéral s’appliquent. Trois questions, liens vers les lois officielles, sans chiffres.',
  },
  jur_tool_step: { en: 'Question', fr: 'Question' },
  jur_tool_of: { en: 'of', fr: 'sur' },
  jur_tool_reset: { en: 'Start over', fr: 'Recommencer' },
  jur_tool_result_heading: {
    en: 'Likely applicable jurisdiction',
    fr: 'Juridiction probablement applicable',
  },
  jur_tool_result_statute: { en: 'Applicable statute', fr: 'Loi applicable' },
  jur_tool_result_source: { en: 'Official source', fr: 'Source officielle' },
  jur_tool_result_explanation: { en: 'Why', fr: 'Pourquoi' },
  jur_tool_unsupported_heading: {
    en: 'Outside Dutiva’s current scope',
    fr: 'Hors du champ actuel de Dutiva',
  },
  jur_tool_unsupported_body: {
    en: 'Dutiva currently supports Ontario, Quebec, and federally regulated workplaces. Alberta and British Columbia are on the roadmap. For other provinces or territories, consult the employment standards of the province where the employee primarily works.',
    fr: 'Dutiva prend actuellement en charge l’Ontario, le Québec et les milieux de travail sous réglementation fédérale. L’Alberta et la Colombie-Britannique sont prévues. Pour les autres provinces ou territoires, consultez les normes d’emploi de la province où l’employé travaille principalement.',
  },
  jur_tool_cta_title: {
    en: 'Dutiva handles this for you',
    fr: 'Dutiva s’en occupe pour vous',
  },
  jur_tool_cta_body: {
    en: 'Once you know the jurisdiction, Dutiva generates jurisdiction-specific HR documents, tracks deadlines, and provides AI-assisted guidance — all within the correct legal framework for your province.',
    fr: 'Une fois la juridiction connue, Dutiva génère des documents RH propres à la juridiction, suit les échéances et offre un accompagnement assisté par l’IA — le tout dans le cadre juridique correct pour votre province.',
  },
  jur_tool_cta_btn: { en: 'See plans', fr: 'Voir les forfaits' },
})
