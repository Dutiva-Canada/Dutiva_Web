import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { SeoRouteId } from '@/seo/routes'

/**
 * Competitor comparison pages — Dutiva columns cite product facts; competitor
 * columns stay hedged ("confirm on the vendor site") so we never invent rival
 * pricing or capabilities. Populate FAQ items from visible page copy only.
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

const COMPARISON_DIMENSIONS: readonly ComparisonDimension[] = [
  {
    id: 'pricing',
    label: bi('Pricing transparency', 'Transparence tarifaire'),
    dutiva: bi(
      'Public CAD pricing on dutiva.ca/pricing — Free/Beta, Starter ($24/mo), Growth ($49/mo), and Professional ($99/mo).',
      'Tarifs publics en CAD sur dutiva.ca/tarifs — Gratuit/Bêta, Starter (24 $/mois), Growth (49 $/mois) et Professional (99 $/mois).',
    ),
    competitor: bi(
      'Confirm current plan pricing and packaging on the vendor website before you buy.',
      'Confirmez les tarifs et l’emballage des forfaits sur le site du fournisseur avant d’acheter.',
    ),
  },
  {
    id: 'risk',
    label: bi('AI risk flagging', 'Signalement des risques par l’IA'),
    dutiva: bi(
      'Advisor returns Medium and High risk levels with reasoning you can expand, plus escalation cues on high-risk guidance.',
      'Le Conseiller indique les niveaux de risque moyen et élevé avec un raisonnement consultable, ainsi que des indications d’escalade sur les conseils à risque élevé.',
    ),
    competitor: bi(
      'Confirm whether the vendor flags compliance risk before you act, or only after a document is generated.',
      'Vérifiez si le fournisseur signale les risques de conformité avant que vous agissiez, ou seulement après la génération d’un document.',
    ),
  },
  {
    id: 'bilingual',
    label: bi('Bilingual EN/FR', 'Bilingue EN/FR'),
    dutiva: bi(
      'Every workflow ships in English and professional, Québec-appropriate French — switch any time with the EN/FR toggle.',
      'Chaque processus est offert en anglais et en français professionnel adapté au Québec — changez de langue à tout moment avec le sélecteur EN/FR.',
    ),
    competitor: bi(
      'Confirm French coverage and Québec-appropriate wording for your province on the vendor site.',
      'Confirmez la couverture en français et le libellé adapté au Québec pour votre province sur le site du fournisseur.',
    ),
  },
  {
    id: 'statute',
    label: bi('Statute-level specificity', 'Précision au niveau de la loi'),
    dutiva: bi(
      'Names the applicable statute — Employment Standards Act, 2000; Canada Labour Code, Part III; Act respecting labour standards — not just the province.',
      'Nomme la loi applicable — Loi de 2000 sur les normes d’emploi; Code canadien du travail, Partie III; Loi sur les normes du travail — pas seulement la province.',
    ),
    competitor: bi(
      'Confirm whether guidance cites the Canadian statute that applies, not only a province or state label.',
      'Vérifiez si les conseils citent la loi canadienne applicable, et non seulement une étiquette de province ou d’État.',
    ),
  },
  {
    id: 'selfServe',
    label: bi('Self-serve access', 'Accès en libre-service'),
    dutiva: bi(
      'Open the Advisor and generate documents from dutiva.ca/app/welcome without a sales call.',
      'Ouvrez le Conseiller et générez des documents depuis dutiva.ca/app/welcome sans appel commercial.',
    ),
    competitor: bi(
      'Confirm whether you can start without a demo, quote request, or sales conversation.',
      'Vérifiez si vous pouvez démarrer sans démo, demande de soumission ou conversation commerciale.',
    ),
  },
]

function withCompetitorNote(name: Bi, note: Bi): Bi {
  return bi(`${note.en} (${name.en})`, `${note.fr} (${name.fr})`)
}

export const COMPARISON_PAGES: Record<ComparisonCompetitorId, ComparisonPageConfig> = {
  hrdownloads: {
    id: 'hrdownloads',
    seoRouteId: 'vsHrdownloads',
    competitorDisplayName: bi('HRdownloads', 'HRdownloads'),
    h1: bi(
      'Dutiva vs HRdownloads: Canadian HR compliance comparison',
      'Dutiva vs HRdownloads : comparaison de conformité RH au Canada',
    ),
    intro: bi(
      'A side-by-side look at how Dutiva and HRdownloads compare for Canadian employers who need jurisdiction-aware HR guidance and review-ready documents. Competitor details below are summarized from public positioning — confirm specifics on HRdownloads before you decide.',
      'Un comparatif de Dutiva et HRdownloads pour les employeurs canadiens qui ont besoin de conseils RH adaptés à la compétence et de documents prêts à réviser. Les détails sur le concurrent ci-dessous résument le positionnement public — confirmez les points précis sur HRdownloads avant de décider.',
    ),
    competitorNote: bi(
      'HRdownloads is a Canadian HR document and compliance resource provider. Dutiva has not independently verified HRdownloads plan features or pricing.',
      'HRdownloads est un fournisseur canadien de documents et de ressources en conformité RH. Dutiva n’a pas vérifié de façon indépendante les fonctionnalités ou les tarifs des forfaits HRdownloads.',
    ),
    dimensions: COMPARISON_DIMENSIONS.map((row) => ({
      ...row,
      competitor: withCompetitorNote(bi('HRdownloads', 'HRdownloads'), row.competitor),
    })),
    faq: [
      {
        question: bi(
          'How does Dutiva compare to HRdownloads on bilingual support?',
          'Comment Dutiva se compare-t-il à HRdownloads pour le soutien bilingue ?',
        ),
        answer: bi(
          'Dutiva ships every workflow in English and Québec-appropriate French. Confirm HRdownloads French coverage for your province on their site before assuming parity.',
          'Dutiva offre chaque processus en anglais et en français adapté au Québec. Confirmez la couverture en français de HRdownloads pour votre province sur leur site avant d’assumer une parité.',
        ),
      },
      {
        question: bi(
          'Does Dutiva name the statute like HRdownloads might for Ontario or Quebec?',
          'Dutiva nomme-t-il la loi comme HRdownloads pourrait le faire pour l’Ontario ou le Québec ?',
        ),
        answer: bi(
          'Dutiva names the applicable statute — for example Employment Standards Act, 2000 or Act respecting labour standards — in Advisor guidance and document workflows. Verify how HRdownloads cites statutes for your jurisdiction.',
          'Dutiva nomme la loi applicable — par exemple la Loi de 2000 sur les normes d’emploi ou la Loi sur les normes du travail — dans les conseils du Conseiller et les processus documentaires. Vérifiez comment HRdownloads cite les lois pour votre compétence.',
        ),
      },
      {
        question: bi(
          'Can I try Dutiva without a sales call?',
          'Puis-je essayer Dutiva sans appel commercial ?',
        ),
        answer: bi(
          'Yes — start free at dutiva.ca/app/welcome, open the Advisor, and generate a document. Confirm HRdownloads trial or purchase path on their site.',
          'Oui — commencez gratuitement sur dutiva.ca/app/welcome, ouvrez le Conseiller et générez un document. Confirmez le parcours d’essai ou d’achat de HRdownloads sur leur site.',
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
      'How Dutiva and SixFifty compare for Canadian employers evaluating employment-law document platforms. SixFifty is widely known for US employment law documents — confirm Canadian statute coverage on their site. Dutiva is built for Ontario, Quebec, and federal Canadian workplaces.',
      'Comment Dutiva et SixFifty se comparent pour les employeurs canadiens qui évaluent des plateformes de documents en droit du travail. SixFifty est surtout connu pour les documents en droit du travail aux États-Unis — confirmez la couverture des lois canadiennes sur leur site. Dutiva est conçu pour les milieux de travail ontariens, québécois et fédéraux au Canada.',
    ),
    competitorNote: bi(
      'SixFifty is an employment-law document platform with strong US positioning. Dutiva has not independently verified SixFifty Canadian coverage, pricing, or feature set.',
      'SixFifty est une plateforme de documents en droit du travail fortement orientée vers les États-Unis. Dutiva n’a pas vérifié de façon indépendante la couverture canadienne, les tarifs ou l’ensemble des fonctionnalités de SixFifty.',
    ),
    dimensions: COMPARISON_DIMENSIONS.map((row) => ({
      ...row,
      competitor: withCompetitorNote(bi('SixFifty', 'SixFifty'), row.competitor),
    })),
    faq: [
      {
        question: bi(
          'Is Dutiva built for Canadian employment standards like SixFifty is for US law?',
          'Dutiva est-il conçu pour les normes d’emploi canadiennes comme SixFifty l’est pour le droit américain ?',
        ),
        answer: bi(
          'Dutiva focuses on Ontario, Quebec, and federal Canadian employment standards — naming the statute, not just the province. Confirm whether SixFifty covers your Canadian jurisdiction on their site.',
          'Dutiva se concentre sur les normes d’emploi ontariennes, québécoises et fédérales au Canada — en nommant la loi, pas seulement la province. Confirmez si SixFifty couvre votre compétence canadienne sur leur site.',
        ),
      },
      {
        question: bi(
          'Does Dutiva flag compliance risk before I act?',
          'Dutiva signale-t-il les risques de conformité avant que j’agisse ?',
        ),
        answer: bi(
          'Advisor returns Medium and High risk levels with reasoning and escalation cues. Confirm whether SixFifty offers comparable risk-level flagging for your use case.',
          'Le Conseiller indique les niveaux de risque moyen et élevé avec raisonnement et indications d’escalade. Confirmez si SixFifty offre un signalement comparable des niveaux de risque pour votre cas d’usage.',
        ),
      },
      {
        question: bi(
          'How transparent is Dutiva pricing compared with SixFifty?',
          'Quelle est la transparence tarifaire de Dutiva comparée à SixFifty ?',
        ),
        answer: bi(
          'Dutiva publishes CAD plan prices on dutiva.ca/pricing. Confirm SixFifty plan pricing and Canadian packaging on their site before you buy.',
          'Dutiva publie les tarifs en CAD sur dutiva.ca/tarifs. Confirmez les tarifs et l’emballage canadien de SixFifty sur leur site avant d’acheter.',
        ),
      },
    ],
  },
}

export function comparisonPage(id: ComparisonCompetitorId): ComparisonPageConfig {
  return COMPARISON_PAGES[id]
}
