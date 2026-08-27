import { defineMessages } from '../core'

/**
 * /guides — index of HR guides, linked from the landing page's Guides
 * section ("Browse all guides"). Card copy comes from the article registry
 * (`src/features/marketing/articles`), which the landing teaser and each
 * guide page also render; this module only carries the page hero, the
 * cross-link to `/blog`, and the CTA framing.
 *
 * Voice: the guides answer **"what do I write, and how"** for a document or
 * decision already in front of the reader — contracts, probation,
 * accommodation, termination. `/blog` answers the other half, "what applies to
 * my workplace", for a reader who does not yet know which regime governs them.
 * The split is documented in
 * `features/marketing/articles/articleModel.ts`; keep this copy on its side of
 * it, since both indexes once described themselves in the same words.
 */
export const guidesIndexMessages = defineMessages({
  guidesIdx_eyebrow: {
    en: 'Guides',
    fr: 'Guides',
  },
  guidesIdx_h1: {
    en: 'Guidance for the documents you have to get right.',
    fr: 'Des repères pour les documents que vous devez réussir.',
  },
  guidesIdx_intro: {
    en: 'Plain-language guides to help Canadian employers understand and comply with employment law — contracts, probation, accommodation, termination, and more — designed to complement our AI Advisor and document templates. If you have any doubts or concerns, legal counsel should always be your first port of call.',
    fr: 'Des guides en langage clair pour aider les employeurs canadiens à comprendre le droit du travail et à s’y conformer — contrats, probation, accommodement, cessation d’emploi, et plus encore — conçus pour compléter notre Conseiller IA et nos modèles de documents. En cas de doute ou d’inquiétude, un avocat devrait toujours être votre premier recours.', // [FR self-authored]
  },
  /* SEO meta only — page hero keeps the longer guidesIdx_intro. */
  guidesIdx_meta_description: {
    en: 'Practical HR guides for Canadian employers — contracts, probation, accommodation, and termination, written to complement Dutiva templates and AI guidance.',
    fr: 'Guides RH pratiques pour employeurs canadiens — contrats, probation, accommodement et cessation, pour compléter les modèles et le Conseiller IA de Dutiva.',
  },
  guidesIdx_section_title: {
    en: 'All guides',
    fr: 'Tous les guides',
  },
  guidesIdx_toBlog_t: {
    en: 'Not sure which rules apply to you?',
    fr: 'Vous ne savez pas quelles règles s’appliquent ?',
  },
  guidesIdx_toBlog_p: {
    en: 'The blog covers the obligations behind these documents — which employment regime governs your workplace, which policies you are expected to maintain, and which records you have to keep.',
    fr: 'Le blogue porte sur les obligations qui sous-tendent ces documents — quel régime d’emploi régit votre entreprise, quelles politiques vous devez tenir à jour et quels dossiers vous devez conserver.',
  },
  guidesIdx_toBlog_link: {
    en: 'Read the blog',
    fr: 'Lire le blogue',
  },
  guidesIdx_cta_t: {
    en: 'Have a question a guide doesn’t answer?',
    fr: 'Une question sans réponse dans nos guides ?',
  },
  guidesIdx_cta_p: {
    en: 'Ask the AI Advisor inside the workspace, or reach out directly.',
    fr: 'Posez la question au Conseiller IA dans l’espace de travail, ou contactez-nous directement.',
  },
  guidesIdx_cta_btn: {
    en: 'See plans',
    fr: 'Voir les forfaits',
  },
})
