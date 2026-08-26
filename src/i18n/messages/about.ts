import { defineMessages } from '../core'

/**
 * About page — page-specific EN + FR strings, extracted from the Dutiva marketing
 * prototype (about.dc.html). Shared header/footer chrome already lives in landing.ts —
 * reuse those keys; do not duplicate them here. Register the spread below in
 * src/i18n/messages/index.ts. Keys are feature-prefixed per CONVENTIONS.md.
 */
export const aboutMessages = defineMessages({
  about_eyebrow: { en: 'About us', fr: 'À propos' },
  about_h1: {
    en: 'HR compliance software, built in Canada.',
    fr: 'Un logiciel de conformité RH, conçu au Canada.',
  },
  about_intro: {
    en: 'Dutiva is AI-assisted, compliance-oriented, and bilingual HR software for Canadian employers — jurisdiction-aware guidance and review-ready documents for small and mid-sized businesses.',
    fr: 'Dutiva est un logiciel RH assisté par l’IA, axé sur la conformité et bilingue pour les employeurs canadiens — des conseils adaptés à la compétence et des documents prêts à réviser pour les PME.',
  },
  about_s1: { en: 'Our mission', fr: 'Notre mission' },
  about_mission: {
    en: 'Give every Canadian employer access to jurisdiction-aware HR guidance and review-ready documents — grounded in the actual employment standards, in English or French.',
    fr: 'Donner à chaque employeur canadien accès à des conseils RH adaptés à la compétence applicable et à des documents prêts à réviser — ancrés dans les normes du travail réelles, en français ou en anglais.',
  },
  about_s2: { en: 'Why we built Dutiva', fr: 'Pourquoi nous avons créé Dutiva' },
  about_why_p1: {
    en: 'Dutiva started with a simple observation: managing HR responsibly in Canada can become complicated very quickly. Employers are expected to navigate employment standards, workplace policies, documentation, and jurisdiction-specific obligations — often without an in-house HR or legal team.',
    fr: 'Dutiva est née d’un constat simple : gérer les RH de façon responsable au Canada peut se compliquer très vite. Les employeurs doivent composer avec les normes du travail, les politiques internes, la documentation et des obligations propres à chaque compétence — souvent sans équipe RH ni service juridique interne.',
  }, // [FR self-authored]
  about_why_p2: {
    en: 'I founded Dutiva to make that process more practical.',
    fr: 'J’ai fondé Dutiva pour rendre ce processus plus pratique.',
  }, // [FR self-authored]
  about_why_p3: {
    en: 'I’m Martin Constantineau, Founder and CEO of Dutiva Canada Inc. My background is in Canadian HR operations — staffing and resourcing at the Canada Revenue Agency, and HR and payroll coordination for a national internship program at Mitacs. I trained in Human Resources Management at Algonquin College, and I work in English and French.',
    fr: 'Je suis Martin Constantineau, fondateur et chef de la direction de Dutiva Canada Inc. Mon parcours se situe dans les opérations RH canadiennes — le recrutement et la dotation à l’Agence du revenu du Canada, et la coordination RH et de la paie pour un programme national de stages chez Mitacs. J’ai suivi une formation en gestion des ressources humaines au Collège Algonquin, et je travaille en français et en anglais.',
  }, // [FR self-authored]
  about_why_p4: {
    en: 'Dutiva is HR compliance and documentation software — not a payroll provider, and not a replacement for human judgment. It names the statute, not just the province; it is bilingual; and it is meant to help employers know when professional or legal advice may be appropriate.',
    fr: 'Dutiva est un logiciel de conformité et de documentation RH — et non un fournisseur de paie, ni un substitut au jugement humain. Il nomme la loi, pas seulement la province; il est bilingue; et il vise à aider les employeurs à reconnaître le moment où un avis professionnel ou juridique peut s’imposer.',
  }, // [FR self-authored]
  about_founder_alt: {
    en: 'Martin Constantineau, Founder and CEO of Dutiva',
    fr: 'Martin Constantineau, fondateur et chef de la direction de Dutiva',
  }, // [FR self-authored]
  about_founder_linkedin: {
    en: 'View Martin on LinkedIn',
    fr: 'Voir le profil LinkedIn de Martin',
  }, // [FR self-authored]
  about_why_foot: {
    en: 'Built in Ottawa, Canada · Grounded in real HR operations, not generic research.',
    fr: 'Conçu à Ottawa, au Canada · Ancré dans de véritables opérations RH, pas dans des recherches génériques.',
  },
  about_s3: { en: 'What we believe', fr: 'Nos valeurs' },
  about_v1t: { en: 'Compliance', fr: 'Conformité' },
  about_v1p: {
    en: 'Name the statute, not just the province. That precision is the product.',
    fr: 'Nommer la loi, pas seulement la province. Cette précision, c’est le produit.',
  },
  about_v2t: { en: 'People first', fr: 'Les personnes d’abord' },
  about_v2p: {
    en: 'HR decisions affect real people. Dutiva keeps a human in the loop on anything high-risk.',
    fr: 'Les décisions RH touchent de vraies personnes. Dutiva garde un humain dans la boucle pour tout enjeu à risque élevé.',
  },
  about_v3t: { en: 'Trust & security', fr: 'Confiance et sécurité' },
  about_v3p: {
    en: 'PIPEDA-conscious and Quebec Law 25-aware, with data minimization built in.',
    fr: 'Conscient de la LPRPDE et tient compte de la Loi 25 du Québec, avec une minimisation des données intégrée.',
  },
  about_v4t: { en: 'Proudly Canadian', fr: 'Fièrement canadien' },
  about_v4p: {
    en: 'Bilingual EN/FR, with named statutes for Ontario, Quebec, and federal workplaces.',
    fr: 'Bilingue EN/FR, avec des lois nommées pour l’Ontario, le Québec et les milieux de travail fédéraux.',
  },
  about_s4: { en: 'Built in Canada', fr: 'Conçu au Canada' },
  about_built: {
    en: 'Dutiva is built in Ottawa for Canadian employers — bilingual EN/FR, PIPEDA-conscious, and Quebec Law 25-aware.',
    fr: 'Dutiva est conçu à Ottawa pour les employeurs canadiens — bilingue EN/FR, conscient de la LPRPDE et attentif à la Loi 25 du Québec.',
  },
  about_pill_bilingual: { en: 'Bilingual EN/FR', fr: 'Bilingue EN/FR' },
  about_changelog_t: {
    en: 'See what shipped recently',
    fr: 'Voir les livraisons récentes',
  },
  about_changelog_p: {
    en: 'The changelog lists dated product updates — what changed and when.',
    fr: 'Le journal des modifications répertorie les mises à jour datées — ce qui a changé et quand.',
  },
  about_changelog_link: {
    en: 'Read the changelog',
    fr: 'Lire le journal des modifications',
  },
  about_cta_t: {
    en: 'Join the beta free — no credit card.',
    fr: 'Rejoignez la bêta gratuitement — sans carte de crédit.',
  },
  about_cta_p: {
    en: 'Open Advisor, generate a document, and try the workflow.',
    fr: 'Ouvrez le Conseiller, générez un document et essayez le processus.',
  },
  about_cta_btn: { en: 'Start free', fr: 'Commencer' },
})
