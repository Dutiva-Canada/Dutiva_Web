import { defineMessages } from '../core'

/**
 * Blog index — page-specific EN + FR strings, extracted from the Dutiva marketing
 * prototype (blog.dc.html). Shared header/footer chrome already lives in landing.ts —
 * reuse those keys; do not duplicate them here. Register the spread below in
 * src/i18n/messages/index.ts. Keys are feature-prefixed per CONVENTIONS.md.
 *
 * Voice: the blog answers **"what applies to my workplace"** — which regime
 * governs the employer, which policies they must maintain, which records they
 * must keep. `/guides` answers the other half, "what do I write and how", for a
 * document already on the desk. The split is documented in
 * `features/marketing/articles/articleModel.ts`; this copy previously described
 * the guides almost word for word (its CTA read "Put these guides to work"),
 * which is what made the two indexes read as the same page twice.
 */
export const blogMessages = defineMessages({
  blog_eyebrow: { en: 'Blog', fr: 'Blogue' },
  blog_h1: {
    en: 'Know what applies to your workplace.',
    fr: 'Sachez ce qui s’applique à votre entreprise.',
  },
  blog_intro: {
    en: 'Which employment regime governs you, which policies you are expected to maintain, and which records you have to keep — the obligations that sit behind every HR document you produce.',
    fr: 'Quel régime d’emploi vous régit, quelles politiques vous devez tenir à jour et quels dossiers vous devez conserver — les obligations qui sous-tendent chaque document RH que vous produisez.',
  },
  blog_toGuides_t: {
    en: 'Looking for the document itself?',
    fr: 'Vous cherchez plutôt le document ?',
  },
  blog_toGuides_p: {
    en: 'The guides cover what sits on the other side of these obligations — the documents and decisions themselves: contracts, probation, accommodation, and termination.',
    fr: 'Les guides portent sur l’autre versant de ces obligations — les documents et les décisions eux-mêmes : contrats, probation, accommodement et cessation d’emploi.',
  },
  blog_toGuides_link: { en: 'Browse the guides', fr: 'Parcourir les guides' },
  blog_cta_t: {
    en: 'Once you know what applies, put it on paper.',
    fr: 'Une fois vos obligations connues, mettez-les par écrit.',
  },
  blog_cta_p: {
    en: 'Open Dutiva and turn these obligations into review-ready documents for Ontario, Quebec, and the federal regime.',
    fr: 'Ouvrez Dutiva et transformez ces obligations en documents prêts à réviser pour l’Ontario, le Québec et le régime fédéral.',
  },
  blog_cta_btn: { en: 'Start free', fr: 'Commencer' },
})
