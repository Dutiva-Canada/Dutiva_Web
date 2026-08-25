import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { SeoRouteId } from '@/seo/routes'

/**
 * Competitor comparison pages — Dutiva columns cite product facts; competitor
 * columns summarize public positioning with hedges where pricing or capabilities
 * are quote-only or unverified. FAQ JSON-LD must match visible copy on the page.
 *
 * HRdownloads rebranded to Citation Canada (2024); /vs/hrdownloads keeps the legacy
 * search term in the URL and H1.
 */
export type ComparisonCompetitorId = 'hrdownloads' | 'sixfifty'

export interface ComparisonDimension {
  id: string
  label: Bi
  dutiva: Bi
  competitor: Bi
}

export interface ComparisonFaqItem {
  question: Bi
  answer: Bi
}

export interface ComparisonPageConfig {
  id: ComparisonCompetitorId
  seoRouteId: SeoRouteId
  competitorDisplayName: Bi
  h1: Bi
  intro: Bi
  competitorNote: Bi
  dimensions: readonly ComparisonDimension[]
  faq: readonly ComparisonFaqItem[]
}

const DUTIVA_PRICING = bi(
  'Public CAD pricing on dutiva.ca/pricing — Free/Beta, Starter ($24/mo), Growth ($49/mo), and Professional ($99/mo).',
  'Tarifs publics en CAD sur dutiva.ca/tarifs — Gratuit/Bêta, Starter (24 $/mois), Growth (49 $/mois) et Professional (99 $/mois).',
)

const DUTIVA_RISK = bi(
  'Advisor returns Medium and High risk levels with reasoning you can expand, plus escalation cues on high-risk guidance.',
  'Le Conseiller indique les niveaux de risque moyen et élevé avec un raisonnement consultable, ainsi que des indications d’escalade sur les conseils à risque élevé.',
)

const DUTIVA_BILINGUAL = bi(
  'Every workflow ships in English and professional, Québec-appropriate French — switch any time with the EN/FR toggle.',
  'Chaque processus est offert en anglais et en français professionnel adapté au Québec — changez de langue à tout moment avec le sélecteur EN/FR.',
)

const DUTIVA_STATUTE = bi(
  'Names the applicable statute — Employment Standards Act, 2000; Canada Labour Code, Part III; Act respecting labour standards — not just the province.',
  'Nomme la loi applicable — Loi de 2000 sur les normes d’emploi; Code canadien du travail, Partie III; Loi sur les normes du travail — pas seulement la province.',
)

const DUTIVA_SELF_SERVE = bi(
  'Open the Advisor and generate documents from dutiva.ca/app/welcome without a sales call.',
  'Ouvrez le Conseiller et générez des documents depuis dutiva.ca/app/welcome sans appel commercial.',
)

const DIMENSION_LABELS = {
  pricing: bi('Pricing transparency', 'Transparence tarifaire'),
  risk: bi('AI risk flagging', 'Signalement des risques par l’IA'),
  bilingual: bi('Bilingual EN/FR', 'Bilingue EN/FR'),
  statute: bi('Statute-level specificity', 'Précision au niveau de la loi'),
  selfServe: bi('Self-serve access', 'Accès en libre-service'),
} as const

function dimension(
  id: keyof typeof DIMENSION_LABELS,
  competitor: Bi,
): ComparisonDimension {
  const dutivaById = {
    pricing: DUTIVA_PRICING,
    risk: DUTIVA_RISK,
    bilingual: DUTIVA_BILINGUAL,
    statute: DUTIVA_STATUTE,
    selfServe: DUTIVA_SELF_SERVE,
  } as const
  return { id, label: DIMENSION_LABELS[id], dutiva: dutivaById[id], competitor }
}

const CITATION_CANADA_DIMENSIONS: readonly ComparisonDimension[] = [
  dimension(
    'pricing',
    bi(
      'Custom quote required — citationcanada.com/pricing shows placeholder tiers, not public plan prices. Quotes are in CAD after a demo.',
      'Soumission personnalisée requise — citationcanada.com/tarifs affiche des paliers fictifs, pas de tarifs publics. Les soumissions sont en CAD après une démo.',
    ),
  ),
  dimension(
    'risk',
    bi(
      'Live HR and OHS advisors, compliance alerts, and workplace safety risk tools — not an AI Advisor that returns Medium/High risk levels before you act on an HR decision.',
      'Conseillers RH et SST en direct, alertes de conformité et outils de risque en milieu de travail — pas de Conseiller IA qui indique les niveaux de risque moyen/élevé avant que vous agissiez sur une décision RH.',
    ),
  ),
  dimension(
    'bilingual',
    bi(
      'English/French content options and a Français (CA) interface on public materials — confirm Québec-appropriate legal French for your templates.',
      'Options de contenu anglais/français et interface Français (CA) sur les documents publics — confirmez le français juridique adapté au Québec pour vos modèles.',
    ),
  ),
  dimension(
    'statute',
    bi(
      'Expert-drafted Canadian templates with legislative tracking across provinces and territories — verify how statutes are cited for your jurisdiction.',
      'Modèles canadiens rédigés par des experts avec suivi législatif dans les provinces et territoires — vérifiez comment les lois sont citées pour votre compétence.',
    ),
  ),
  dimension(
    'selfServe',
    bi(
      'No free trial — a free demo with an account executive, then a customized quote (per their request-a-quote FAQ).',
      'Aucun essai gratuit — démo gratuite avec un directeur de compte, puis soumission personnalisée (selon leur FAQ de demande de soumission).',
    ),
  ),
]

const SIXFIFTY_DIMENSIONS: readonly ComparisonDimension[] = [
  dimension(
    'pricing',
    bi(
      'Contact for a custom quote — sixfifty.com/pricing does not publish plan prices; third-party listings vary widely.',
      'Contactez pour une soumission — sixfifty.com/pricing ne publie pas de tarifs; les annuaires tiers varient beaucoup.',
    ),
  ),
  dimension(
    'risk',
    bi(
      'SixFifty AI answers US employment law questions and the platform sends legal-update alerts — not Medium/High risk flagging before you act on a specific HR decision.',
      'SixFifty AI répond à des questions sur le droit du travail américain et la plateforme envoie des alertes de mises à jour juridiques — pas de signalement moyen/élevé avant d’agir sur une décision RH précise.',
    ),
  ),
  dimension(
    'bilingual',
    bi(
      'US English product focused on US federal, state, and local law — no Canadian French employment-standards product found in public materials.',
      'Produit en anglais américain axé sur le droit fédéral, étatique et local des É.-U. — aucun produit de normes d’emploi canadiennes en français trouvé dans les documents publics.',
    ),
  ),
  dimension(
    'statute',
    bi(
      'US federal, state, and local employment law only — no Canadian employment-standards coverage in public product materials.',
      'Droit du travail fédéral, étatique et local des É.-U. seulement — aucune couverture des normes d’emploi canadiennes dans les documents publics du produit.',
    ),
  ),
  dimension(
    'selfServe',
    bi(
      'Full platform access typically follows a demo and quote; limited free US tools (for example Policy Navigator or a sample NDA) are available without a subscription.',
      'L’accès complet suit généralement une démo et une soumission; des outils américains gratuits limités (p. ex. Policy Navigator ou un NDA d’exemple) sont disponibles sans abonnement.',
    ),
  ),
]

export const COMPARISON_PAGES: Record<ComparisonCompetitorId, ComparisonPageConfig> = {
  hrdownloads: {
    id: 'hrdownloads',
    seoRouteId: 'vsHrdownloads',
    competitorDisplayName: bi('Citation Canada (HRdownloads)', 'Citation Canada (HRdownloads)'),
    h1: bi(
      'Dutiva vs HRdownloads: Canadian HR compliance comparison',
      'Dutiva vs HRdownloads : comparaison de conformité RH au Canada',
    ),
    intro: bi(
      'A side-by-side look at Dutiva and Citation Canada (formerly HRdownloads) for Canadian employers who need jurisdiction-aware HR guidance and review-ready documents. Competitor details summarize public positioning on citationcanada.com — confirm specifics with them before you decide.',
      'Un comparatif de Dutiva et Citation Canada (anciennement HRdownloads) pour les employeurs canadiens qui ont besoin de conseils RH adaptés à la compétence et de documents prêts à réviser. Les détails sur le concurrent résument le positionnement public sur citationcanada.com — confirmez les points précis avec eux avant de décider.',
    ),
    competitorNote: bi(
      'Citation Canada (rebranded from HRdownloads in 2024) offers the Atlas platform — HRIS, templates, training, and live HR/OHS advisors for Canadian employers. Dutiva has not independently verified their current plan features or quoted pricing.',
      'Citation Canada (rebrandé depuis HRdownloads en 2024) offre la plateforme Atlas — SIRH, modèles, formation et conseillers RH/SST en direct pour les employeurs canadiens. Dutiva n’a pas vérifié de façon indépendante leurs fonctionnalités de forfait actuelles ni leurs tarifs soumis.',
    ),
    dimensions: CITATION_CANADA_DIMENSIONS,
    faq: [
      {
        question: bi(
          'How does Dutiva compare to Citation Canada on bilingual support?',
          'Comment Dutiva se compare-t-il à Citation Canada pour le soutien bilingue ?',
        ),
        answer: bi(
          'Dutiva ships every workflow in English and Québec-appropriate French by default. Citation Canada advertises English/French content options — confirm scope and legal French quality for your province before assuming parity.',
          'Dutiva offre chaque processus en anglais et en français adapté au Québec par défaut. Citation Canada annonce des options de contenu anglais/français — confirmez la portée et la qualité du français juridique pour votre province avant d’assumer une parité.',
        ),
      },
      {
        question: bi(
          'Does Dutiva name the statute like Citation Canada templates for Ontario or Quebec?',
          'Dutiva nomme-t-il la loi comme les modèles de Citation Canada pour l’Ontario ou le Québec ?',
        ),
        answer: bi(
          'Dutiva names the applicable statute — for example Employment Standards Act, 2000 or Act respecting labour standards — in Advisor guidance and document workflows. Citation Canada tracks legislation across Canadian jurisdictions through expert-drafted templates; verify citation style for your use case.',
          'Dutiva nomme la loi applicable — par exemple la Loi de 2000 sur les normes d’emploi ou la Loi sur les normes du travail — dans les conseils du Conseiller et les processus documentaires. Citation Canada suit la législation dans les compétences canadiennes via des modèles d’experts; vérifiez le style de citation pour votre cas d’usage.',
        ),
      },
      {
        question: bi(
          'Can I try Dutiva without a sales call?',
          'Puis-je essayer Dutiva sans appel commercial ?',
        ),
        answer: bi(
          'Yes — start free at dutiva.ca/app/welcome, open the Advisor, and generate a document. Citation Canada does not offer a free trial; their site directs you to a demo and customized quote.',
          'Oui — commencez gratuitement sur dutiva.ca/app/welcome, ouvrez le Conseiller et générez un document. Citation Canada n’offre pas d’essai gratuit; leur site vous oriente vers une démo et une soumission personnalisée.',
        ),
      },
    ],
  },
  sixfifty: {
    id: 'sixfifty',
    seoRouteId: 'vsSixfifty',
    competitorDisplayName: bi('SixFifty', 'SixFifty'),
    h1: bi(
      'Dutiva vs SixFifty: employment law document platform comparison',
      'Dutiva vs SixFifty : comparaison de plateformes de documents en droit du travail',
    ),
    intro: bi(
      'How Dutiva and SixFifty compare for Canadian employers evaluating employment-law document platforms. SixFifty’s public materials cover US federal, state, and local employment law — not Canadian employment standards. Dutiva is built for Ontario, Quebec, and federal Canadian workplaces.',
      'Comment Dutiva et SixFifty se comparent pour les employeurs canadiens qui évaluent des plateformes de documents en droit du travail. Les documents publics de SixFifty couvrent le droit du travail fédéral, étatique et local des É.-U. — pas les normes d’emploi canadiennes. Dutiva est conçu pour les milieux de travail ontariens, québécois et fédéraux au Canada.',
    ),
    competitorNote: bi(
      'SixFifty is a US employment-law compliance platform (Research, AI Q&A, document generation, legal-update merge). Dutiva has not found Canadian employment-standards coverage in SixFifty’s public product materials.',
      'SixFifty est une plateforme de conformité en droit du travail américain (Recherche, Q&R IA, génération de documents, fusion de mises à jour juridiques). Dutiva n’a pas trouvé de couverture des normes d’emploi canadiennes dans les documents publics du produit SixFifty.',
    ),
    dimensions: SIXFIFTY_DIMENSIONS,
    faq: [
      {
        question: bi(
          'Is Dutiva built for Canadian employment standards like SixFifty is for US law?',
          'Dutiva est-il conçu pour les normes d’emploi canadiennes comme SixFifty l’est pour le droit américain ?',
        ),
        answer: bi(
          'Dutiva focuses on Ontario, Quebec, and federal Canadian employment standards — naming the statute, not just the province. SixFifty’s public product scope is US federal, state, and local employment law.',
          'Dutiva se concentre sur les normes d’emploi ontariennes, québécoises et fédérales au Canada — en nommant la loi, pas seulement la province. La portée publique du produit SixFifty est le droit du travail fédéral, étatique et local des É.-U.',
        ),
      },
      {
        question: bi(
          'Does Dutiva flag compliance risk before I act?',
          'Dutiva signale-t-il les risques de conformité avant que j’agisse ?',
        ),
        answer: bi(
          'Advisor returns Medium and High risk levels with reasoning and escalation cues. SixFifty AI answers US law questions and sends legal-update alerts — a different model from pre-action risk levels on a specific HR decision.',
          'Le Conseiller indique les niveaux de risque moyen et élevé avec raisonnement et indications d’escalade. SixFifty AI répond à des questions de droit américain et envoie des alertes de mises à jour — un modèle différent des niveaux de risque avant action sur une décision RH précise.',
        ),
      },
      {
        question: bi(
          'How transparent is Dutiva pricing compared with SixFifty?',
          'Quelle est la transparence tarifaire de Dutiva comparée à SixFifty ?',
        ),
        answer: bi(
          'Dutiva publishes CAD plan prices on dutiva.ca/pricing. SixFifty requires a custom quote — their pricing page does not list public plan prices.',
          'Dutiva publie les tarifs en CAD sur dutiva.ca/tarifs. SixFifty exige une soumission personnalisée — leur page tarifs ne liste pas de prix publics.',
        ),
      },
    ],
  },
}

export function comparisonPage(id: ComparisonCompetitorId): ComparisonPageConfig {
  return COMPARISON_PAGES[id]
}
