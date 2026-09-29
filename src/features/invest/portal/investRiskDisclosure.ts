import type { Lang } from '@/i18n/core'
import type { PolicyEdition } from '@/features/marketing/legal/policyContent'

/**
 * Invest risk disclosure — an invest-specific policy edition in the same
 * shape the marketing legal collection renders (PolicyEdition), so the
 * standalone /invest/legal/risk page reuses the same article renderer as
 * the shared Terms and Privacy documents.
 *
 * The substance is mandated, not editorial: informational/educational only,
 * not investment advice; signals and order proposals are suggestions;
 * execution decisions belong to the user; nothing executes automatically.
 *
 * [FR self-authored — parity with the EN text; hedge strength matched.]
 */
export const investRiskDisclosure: Record<Lang, PolicyEdition> = {
  en: {
    title: 'Risk disclosure',
    effectiveDate: 'September 29, 2026',
    callout: [
      'Dutiva Invest is informational and educational only. It does not provide investment advice, and nothing on this surface is a recommendation to buy, sell, or hold any security or asset.',
    ],
    sections: [
      {
        title: '1. Informational and educational only',
        blocks: [
          {
            type: 'p',
            text: 'Invest helps you track positions you enter yourself and scan them against rules you choose. Prices, allocations, signals, and order drafts are reference material — they are not investment advice, research, or a recommendation, and they are not tailored to your circumstances.',
          },
          {
            type: 'p',
            text: 'Dutiva is not a registered investment dealer, adviser, or portfolio manager. For advice about your situation, consult a registered investment professional.',
          },
        ],
      },
      {
        title: '2. Signals and order proposals are suggestions only',
        blocks: [
          {
            type: 'p',
            text: 'When a strategy scan runs, it may create signals (things worth a look) and order proposals (drafts describing a possible trade). Both are suggestions generated from the rules and prices available at scan time — nothing more.',
          },
          {
            type: 'li',
            text: 'A signal is a notice, not an instruction.',
          },
          {
            type: 'li',
            text: 'An order proposal is a draft. It sits in Orders until you explicitly approve it — and even then it is recorded for review, not sent to a broker.',
          },
          {
            type: 'li',
            text: 'Prices can be delayed or stale; a draft may describe a market that has already moved.',
          },
        ],
      },
      {
        title: '3. Execution decisions are yours',
        blocks: [
          {
            type: 'p',
            text: 'Nothing on Invest executes automatically — no scan, rule, or schedule ever places an order. If you keep a live account here, its orders are manual records of intents you carry out yourself elsewhere, and each fill is confirmed by you, by hand.',
          },
          {
            type: 'p',
            text: 'You alone decide whether to act on anything the app surfaces, and you alone are responsible for trades you place with your broker.',
          },
        ],
      },
      {
        title: '4. Markets carry risk',
        blocks: [
          {
            type: 'p',
            text: 'Investing involves risk, including possible loss of principal. Market headlines shown in the app come from third-party publishers — they are context, not Dutiva endorsements or recommendations.',
          },
        ],
      },
    ],
  },
  fr: {
    title: 'Avertissement sur les risques',
    effectiveDate: '29 septembre 2026',
    callout: [
      'Dutiva Invest est un outil informatif et éducatif seulement. Il ne fournit pas de conseils en placement, et rien sur cette surface ne constitue une recommandation d’achat, de vente ou de conservation d’un titre ou d’un actif.',
    ],
    sections: [
      {
        title: '1. Informatif et éducatif seulement',
        blocks: [
          {
            type: 'p',
            text: 'Invest vous aide à suivre des positions que vous saisissez vous-même et à les analyser selon des règles que vous choisissez. Les cours, répartitions, signaux et ébauches d’ordres sont des documents de référence — ce ne sont ni des conseils en placement, ni de la recherche, ni une recommandation, et ils ne sont pas adaptés à votre situation.',
          },
          {
            type: 'p',
            text: 'Dutiva n’est ni un courtier en valeurs mobilières, ni un conseiller, ni un gestionnaire de portefeuille inscrit. Pour des conseils adaptés à votre situation, consultez un professionnel en placement inscrit.',
          },
        ],
      },
      {
        title: '2. Signaux et propositions d’ordres sont des suggestions seulement',
        blocks: [
          {
            type: 'p',
            text: 'Lorsqu’une analyse de stratégie s’exécute, elle peut créer des signaux (des éléments à examiner) et des propositions d’ordres (des ébauches décrivant une opération possible). Les deux sont des suggestions générées à partir des règles et des cours disponibles au moment de l’analyse — rien de plus.',
          },
          {
            type: 'li',
            text: 'Un signal est un avis, pas une instruction.',
          },
          {
            type: 'li',
            text: 'Une proposition d’ordre est une ébauche. Elle reste dans Ordres jusqu’à ce que vous l’approuviez explicitement — et même alors, elle est consignée pour revue, pas envoyée à un courtier.',
          },
          {
            type: 'li',
            text: 'Les cours peuvent être retardés ou périmés; une ébauche peut décrire un marché qui a déjà bougé.',
          },
        ],
      },
      {
        title: '3. Les décisions d’exécution vous appartiennent',
        blocks: [
          {
            type: 'p',
            text: 'Rien dans Invest ne s’exécute automatiquement — aucune analyse, règle ou planification ne place un ordre. Si vous tenez un compte réel ici, ses ordres sont des relevés manuels d’intentions que vous réalisez vous-même ailleurs, et chaque exécution est confirmée par vous, à la main.',
          },
          {
            type: 'p',
            text: 'Vous seul décidez de donner suite ou non à ce que l’app présente, et vous seul êtes responsable des opérations que vous placez auprès de votre courtier.',
          },
        ],
      },
      {
        title: '4. Les marchés comportent des risques',
        blocks: [
          {
            type: 'p',
            text: 'Investir comporte des risques, dont la perte possible du capital. Les manchettes du marché affichées dans l’app proviennent de publications externes — elles offrent un contexte, pas des appuis ni des recommandations de Dutiva.',
          },
        ],
      },
    ],
  },
}
