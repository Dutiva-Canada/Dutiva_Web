/**
 * Prebuilt strategy templates — the gallery on the Strategies page.
 *
 * Each template is a starting point, not a locked product: "Use this
 * template" pre-fills the create form and the saved row is an ordinary
 * user-owned strategy (provenance lands in `template` as `tpl:<slug>`).
 * Copy follows docs/NATURAL_LANGUAGE_COPY.md — concrete mechanics, no
 * outcome promises.
 */
import type { Bi } from '@/i18n/core'
import type { AssetClass, StrategyAutonomy, StrategyCadence, StrategyRule } from './types'

export interface StrategyTemplate {
  slug: string
  name: Bi
  blurb: Bi
  cadence: StrategyCadence
  autonomy: StrategyAutonomy
  assetClasses: AssetClass[]
  rules: StrategyRule[]
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    slug: 'rebalance-drift',
    name: { en: 'Drift rebalance', fr: 'Rééquilibrage d’écart' },
    blurb: {
      en: 'Flag any holding that grows past a quarter of the book.',
      fr: 'Signaler toute position qui dépasse le quart du portefeuille.',
    },
    cadence: 'weekly',
    autonomy: 'suggest',
    assetClasses: ['equity', 'etf', 'crypto'],
    rules: [
      { metric: 'weight_pct', op: 'gt', value: 25, kind: 'alert', title: 'Over 25% of book' },
    ],
  },
  {
    slug: 'concentration-cap',
    name: { en: 'Concentration cap', fr: 'Plafond de concentration' },
    blurb: {
      en: 'Alert when a single position crosses 35% of total value.',
      fr: 'Alerter quand une position dépasse 35 % de la valeur totale.',
    },
    cadence: 'daily',
    autonomy: 'suggest',
    assetClasses: ['equity', 'etf', 'crypto', 'other'],
    rules: [
      { metric: 'weight_pct', op: 'gt', value: 35, kind: 'alert', title: 'Over 35% of book' },
    ],
  },
  {
    slug: 'buy-the-dip',
    name: { en: 'Dip watch', fr: 'Guet des creux' },
    blurb: {
      en: 'Surface any tracked symbol down 8% or more on the day.',
      fr: 'Signaler tout symbole suivi en baisse de 8 % ou plus sur la séance.',
    },
    cadence: 'daily',
    autonomy: 'suggest',
    assetClasses: ['equity', 'etf', 'crypto'],
    rules: [
      { metric: 'day_change_pct', op: 'lt', value: -8, kind: 'screen', title: 'Down 8% today' },
    ],
  },
  {
    slug: 'momentum-guard',
    name: { en: 'Trend guard', fr: 'Garde de tendance' },
    blurb: {
      en: 'Alert when a symbol slips below its 50-day average.',
      fr: 'Alerter quand un symbole passe sous sa moyenne de 50 jours.',
    },
    cadence: 'daily',
    autonomy: 'suggest',
    assetClasses: ['equity', 'etf'],
    rules: [
      { metric: 'vs_ma50', op: 'lt', value: 0, kind: 'alert', title: 'Below 50-day average' },
    ],
  },
  {
    slug: 'trim-winners',
    name: { en: 'Winner review', fr: 'Revue des gains' },
    blurb: {
      en: 'Note positions up 40% or more against their average cost.',
      fr: 'Noter les positions en hausse de 40 % ou plus par rapport au coût moyen.',
    },
    cadence: 'weekly',
    autonomy: 'suggest',
    assetClasses: ['equity', 'etf', 'crypto'],
    rules: [
      { metric: 'unrealized_gain_pct', op: 'gt', value: 40, kind: 'insight', title: 'Up 40% vs cost' },
    ],
  },
  {
    slug: 'cash-sweep',
    name: { en: 'Idle-cash check', fr: 'Contrôle des liquidités' },
    blurb: {
      en: 'Weekly note when account cash sits above a set amount.',
      fr: 'Note hebdomadaire quand les liquidités dépassent un seuil fixé.',
    },
    cadence: 'weekly',
    autonomy: 'suggest',
    assetClasses: ['cash'],
    rules: [
      { metric: 'cash_above', op: 'gt', value: 5000, kind: 'insight', title: 'Cash above threshold' },
    ],
  },
  {
    slug: 'monthly-accumulate',
    name: { en: 'Monthly accumulation', fr: 'Accumulation mensuelle' },
    blurb: {
      en: 'Once a month, queue a small simulated buy on every watched symbol.',
      fr: 'Une fois par mois, mettre en file un petit achat simulé sur chaque symbole suivi.',
    },
    cadence: 'monthly',
    autonomy: 'paper_execute',
    assetClasses: ['etf'],
    rules: [
      {
        metric: 'day_change_pct',
        op: 'lt',
        value: 99,
        kind: 'insight',
        title: 'Monthly accumulation',
        side: 'buy',
        qty: 2,
      },
    ],
  },
]

export function templateBySlug(slug: string): StrategyTemplate | undefined {
  return STRATEGY_TEMPLATES.find((t) => t.slug === slug)
}
