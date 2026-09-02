import { defineMessages } from '../core'

/**
 * Known Limitations page — page-specific EN + FR strings, extracted from the Dutiva marketing
 * prototype (known-limitations.dc.html). Shared header/footer chrome already lives in landing.ts —
 * reuse those keys; do not duplicate them here. Register the spread below in
 * src/i18n/messages/index.ts. Keys are feature-prefixed per CONVENTIONS.md.
 */
export const limitsMessages = defineMessages({
  limits_eyebrow: { en: 'Transparency', fr: 'Transparence' },
  limits_h1: { en: 'Known limitations.', fr: 'Limites connues.' },
  limits_intro: {
    en: 'Dutiva is built to be useful and honest about what it can’t do. These are the current limitations to keep in mind when using Advisor and generated documents.',
    fr: 'Dutiva est conçu pour être utile et honnête sur ce qu’il ne peut pas faire. Voici les limites actuelles à garder à l’esprit lorsque vous utilisez le Conseiller et les documents générés.',
  },
  /* SEO meta only — page hero keeps the longer limits_intro. */
  limits_meta_description: {
    en: 'What Dutiva cannot do — current limitations of the AI Advisor and generated HR documents, stated plainly for Canadian employers using the product.',
    fr: 'Ce que Dutiva ne peut pas faire — limites actuelles du Conseiller IA et des documents RH générés, énoncées clairement pour les employeurs canadiens.',
  },
  limits_s1: { en: 'What Dutiva is not', fr: 'Ce que Dutiva n’est pas' },
  limits_n1: {
    en: 'Not legal advice — Dutiva provides HR workflow support and compliance-oriented guidance, not legal, tax, medical, or financial advice.',
    fr: 'Pas un avis juridique — Dutiva offre un soutien aux processus RH et des conseils axés sur la conformité, pas de conseils juridiques, fiscaux, médicaux ou financiers.',
  },
  limits_n2: {
    en: 'Not a substitute for counsel — complex or high-risk matters should be reviewed with a qualified lawyer or advisor.',
    fr: 'Pas un substitut à un conseiller — les situations complexes ou à risque élevé devraient être révisées avec un avocat ou un conseiller qualifié.',
  },
  limits_n3: {
    en: 'Not a system of record — Dutiva structures and drafts; you remain responsible for final decisions and filings.',
    fr: 'Pas un système officiel de dossiers — Dutiva structure et rédige ; vous demeurez responsable des décisions finales et des dépôts.',
  },
  limits_s2: { en: 'AI limitations', fr: 'Limites de l’IA' },
  limits_a1: {
    en: 'AI can be wrong — language models can generate plausible but incorrect information, including citations to laws or cases that do not exist.',
    fr: 'L’IA peut se tromper — les modèles de langage peuvent produire des renseignements plausibles mais erronés, y compris des citations de lois ou de causes inexistantes.',
  },
  limits_a2: {
    en: 'Always verify — check statutory citations, thresholds, and numbers against the primary source before relying on them.',
    fr: 'Vérifiez toujours — vérifiez les citations législatives, les seuils et les chiffres auprès de la source primaire avant de vous y fier.',
  },
  limits_a3: {
    en: 'Human review for high-risk — Advisor flags when a matter should be escalated for qualified review.',
    fr: 'Révision humaine pour les cas à risque élevé — le Conseiller indique quand un dossier devrait être acheminé pour une révision qualifiée.',
  },
  limits_s3: { en: 'Coverage limits', fr: 'Limites de couverture' },
  limits_c1: {
    en: 'Jurisdictions — Dutiva currently covers Ontario, Quebec, and federal workplaces. Alberta and British Columbia are coming soon.',
    fr: 'Compétences — Dutiva couvre actuellement l’Ontario, le Québec et les milieux fédéraux. L’Alberta et la Colombie-Britannique suivront bientôt.',
  },
  limits_c2: {
    en: 'Not exhaustive — coverage focuses on core employment-standards workflows, not every statute or edge case.',
    fr: 'Pas exhaustif — la couverture porte sur les processus essentiels liés aux normes du travail, pas sur chaque loi ou cas particulier.',
  },
  limits_c3: {
    en: 'Review French output — French is professional and Québec-appropriate, but still review generated French for your specific context.',
    fr: 'Révisez le contenu en français — le français est professionnel et adapté au Québec, mais révisez tout de même le français généré pour votre contexte précis.',
  },
  limits_cta_t: { en: 'Questions about a limitation?', fr: 'Des questions sur une limite ?' },
  limits_cta_p: {
    en: 'Reach our team — we’re transparent about what Dutiva can and can’t do.',
    fr: 'Contactez notre équipe — nous sommes transparents sur ce que Dutiva peut et ne peut pas faire.',
  },
  limits_cta_btn: { en: 'Contact support', fr: 'Contacter le soutien' },
})
