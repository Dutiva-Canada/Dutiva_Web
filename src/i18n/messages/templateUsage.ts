import { defineMessages } from '../core'

/**
 * Template Usage guide — page-specific EN + FR strings, extracted from the Dutiva marketing
 * prototype (template-usage-guide.dc.html). Shared header/footer chrome already lives in landing.ts —
 * reuse those keys; do not duplicate them here. Register the spread below in
 * src/i18n/messages/index.ts. Keys are feature-prefixed per CONVENTIONS.md.
 */
export const tmplGuideMessages = defineMessages({
  tmplGuide_eyebrow: { en: 'Guide', fr: 'Guide' },
  tmplGuide_h1: { en: 'How to use Dutiva templates.', fr: 'Comment utiliser les modèles Dutiva.' },
  tmplGuide_intro: {
    en: 'Dutiva’s 16 core templates are generated through guided questions and reviewed beside the compliance guidance that shaped them. Here’s how to get the most out of them.',
    fr: 'Les 16 modèles essentiels de Dutiva sont générés par des questions guidées et révisés à côté des conseils de conformité qui les ont façonnés. Voici comment en tirer le meilleur parti.',
  },
  /* SEO meta only — page hero keeps the longer tmplGuide_intro. */
  tmplGuide_meta_description: {
    en: 'How Dutiva HR templates work — guided questions, compliance context, and review-ready documents for Ontario, Quebec, and federal workplaces.',
    fr: 'Comment fonctionnent les modèles RH Dutiva — questions guidées, contexte de conformité et documents prêts à réviser pour l’ON, le QC et le fédéral.',
  },
  tmplGuide_s1: { en: 'How generation works', fr: 'Comment fonctionne la génération' },
  tmplGuide_st1t: { en: 'Pick a template', fr: 'Choisissez un modèle' },
  tmplGuide_st1p: {
    en: 'Choose from 16 core templates across hiring, policies, discipline, and termination.',
    fr: 'Choisissez parmi 16 modèles essentiels couvrant l’embauche, les politiques, la discipline et la cessation d’emploi.',
  },
  tmplGuide_st2t: { en: 'Answer guided questions', fr: 'Répondez aux questions guidées' },
  tmplGuide_st2p: {
    en: 'Dutiva asks about the situation and jurisdiction, then structures the draft and fills key fields.',
    fr: 'Dutiva pose des questions sur la situation et la compétence applicable, puis structure l’ébauche et remplit les champs clés.',
  },
  tmplGuide_st3t: { en: 'Review, then export', fr: 'Révisez, puis exportez' },
  tmplGuide_st3p: {
    en: 'Preview the document beside the guidance that shaped it, make edits, and export or send for e-signature.',
    fr: 'Prévisualisez le document à côté des conseils qui l’ont façonné, apportez des modifications, puis exportez-le ou envoyez-le pour signature électronique.',
  },
  tmplGuide_s2: { en: 'Template categories', fr: 'Catégories de modèles' },
  tmplGuide_c1t: { en: 'Hiring', fr: 'Embauche' },
  tmplGuide_c1p: {
    en: 'Offer letters, employment agreements, and onboarding documents.',
    fr: 'Lettres d’offre, contrats de travail et documents d’intégration.',
  },
  tmplGuide_c2t: { en: 'Policies', fr: 'Politiques' },
  tmplGuide_c2p: {
    en: 'Workplace policies — remote work, code of conduct, accommodation, and more.',
    fr: 'Politiques en milieu de travail — télétravail, code de conduite, accommodement et plus.',
  },
  tmplGuide_c3t: { en: 'Discipline', fr: 'Discipline' },
  tmplGuide_c3p: {
    en: 'Performance improvement plans, warning letters, and investigation records.',
    fr: 'Plans d’amélioration du rendement, lettres d’avertissement et dossiers d’enquête.',
  },
  tmplGuide_c4t: { en: 'Termination', fr: 'Cessation d’emploi' },
  tmplGuide_c4p: {
    en: 'Termination letters, final-pay checklists, and offboarding documentation.',
    fr: 'Lettres de cessation d’emploi, listes de vérification de paie finale et documentation de départ.',
  },
  tmplGuide_s3: { en: 'Best practices', fr: 'Pratiques exemplaires' },
  tmplGuide_bp1: {
    en: 'Review every draft before use — it’s a starting point, not a final document.',
    fr: 'Révisez chaque ébauche avant utilisation — c’est un point de départ, pas un document final.',
  },
  tmplGuide_bp2: {
    en: 'Verify statutory citations and thresholds against the primary source.',
    fr: 'Vérifiez les citations législatives et les seuils auprès de la source primaire.',
  },
  tmplGuide_bp3: {
    en: 'Escalate high-risk matters to qualified counsel — Advisor flags when to.',
    fr: 'Confiez les enjeux à risque élevé à un conseiller juridique qualifié — le Conseiller indique quand.',
  },
  tmplGuide_bp4: {
    en: 'Confirm the correct jurisdiction (Ontario, Quebec, or federal) before generating.',
    fr: 'Confirmez la bonne compétence (Ontario, Québec ou fédéral) avant de générer.',
  },
  tmplGuide_cta_t: { en: 'Generate your first document.', fr: 'Générez votre premier document.' },
  tmplGuide_cta_p: {
    en: 'Pick a plan to open Document Studio and put a template to work.',
    fr: 'Choisissez un forfait pour ouvrir le Studio de documents et mettre un modèle à profit.',
  },
  tmplGuide_cta_btn: { en: 'See plans', fr: 'Voir les forfaits' },
})
