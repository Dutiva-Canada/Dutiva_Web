import { defineMessages } from '../core'

/**
 * Marketing meta descriptions / intro copy consumed eagerly by
 * `src/seo/routes.ts` (entry chunk) — kept in one tiny module so the route
 * registry never has to import the full `marketingMessages` aggregate just
 * for `<meta name="description">` strings. Pages reuse the same keys through
 * the surface catalogue (FaqPage renders `faq_intro` as its visible intro,
 * etc.), so the copy stays single-sourced.
 */
export const seoMetaMessages = defineMessages({
  faq_intro: {
    en: 'Answers to common questions about Dutiva — what it does, how it handles Canadian compliance, and how your data is protected.',
    fr: 'Réponses aux questions courantes sur Dutiva — ce qu’il fait, comment il gère la conformité canadienne et comment vos données sont protégées.',
  },
  blog_meta_description: {
    en: 'Employment regimes, required policies, and record-keeping obligations for Canadian employers — practical HR compliance orientation from Dutiva.',
    fr: 'Régimes d’emploi, politiques exigées et conservation des dossiers pour employeurs canadiens — orientation conformité RH par Dutiva.',
  },
  pricing_meta_description: {
    en: 'Public CAD plans for Canadian employers — Free waitlist, Starter, Growth, and Professional. Monthly billing, no setup fees, cancel anytime.',
    fr: 'Forfaits publics en CAD pour employeurs canadiens — liste d’attente, Starter, Growth et Professional. Facturation mensuelle, annulation en tout temps.',
  },
  changelog_meta_description: {
    en: 'Dated product updates from Dutiva — what changed, when, and how it affects Canadian HR compliance workflows on the platform.',
    fr: 'Mises à jour datées du produit Dutiva — ce qui a changé, quand, et l’effet sur les processus de conformité RH au Canada.',
  },
  jur_tool_meta_description: {
    en: 'Free tool: determine whether Ontario, Quebec, or federal employment standards apply. Three questions, links to official statutes, no statutory figures.',
    fr: 'Outil gratuit : déterminez si les normes d’emploi ON, QC ou fédéral s’appliquent. Trois questions, liens vers les lois officielles, sans chiffres.',
  },
  limits_meta_description: {
    en: 'What Dutiva cannot do — current limitations of the AI Advisor and generated HR documents, stated plainly for Canadian employers using the product.',
    fr: 'Ce que Dutiva ne peut pas faire — limites actuelles du Conseiller IA et des documents RH générés, énoncées clairement pour les employeurs canadiens.',
  },
  tplPreview_meta_description: {
    en: 'Browse jurisdiction-aware HR templates for Ontario, Quebec, and federal workplaces — hiring, policies, discipline, and termination from Dutiva.',
    fr: 'Parcourez les modèles RH adaptés à l’Ontario, au Québec et au fédéral — embauche, politiques, discipline et cessation d’emploi avec Dutiva.',
  },
  guidesIdx_meta_description: {
    en: 'Practical HR guides for Canadian employers — contracts, probation, accommodation, and termination, written to complement Dutiva templates and AI guidance.',
    fr: 'Guides RH pratiques pour employeurs canadiens — contrats, probation, accommodement et cessation, pour compléter les modèles et le Conseiller IA de Dutiva.',
  },
  tmplGuide_meta_description: {
    en: 'How Dutiva HR templates work — guided questions, compliance context, and review-ready documents for Ontario, Quebec, and federal workplaces.',
    fr: 'Comment fonctionnent les modèles RH Dutiva — questions guidées, contexte de conformité et documents prêts à réviser pour l’ON, le QC et le fédéral.',
  },
  landing_demo_seo_title: {
    en: 'Try Dutiva — read-only demo workspace | Dutiva',
    fr: 'Essayer Dutiva — espace démo en lecture seule | Dutiva',
  },
  landing_demo_seo_description: {
    en: 'Explore Advisor, Document Studio, analytics, communications, workflows, and HR cases — Northgate sample data, read-only, no sign-in.',
    fr: 'Parcourez le Conseiller, le Studio, l’analytique, les communications, les processus et dossiers — données Northgate, lecture seule.',
  },
})
