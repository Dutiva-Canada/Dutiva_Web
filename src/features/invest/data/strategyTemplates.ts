/**
 * Prebuilt strategy templates — the gallery on the Strategies page.
 *
 * Each template is a starting point, not a locked product: "Use this
 * template" pre-fills the create form and the saved row is an ordinary
 * user-owned strategy (provenance lands in `template` as `tpl:<slug>`).
 * Templates carry no scope — the user picks what to scan before saving.
 * Copy follows docs/NATURAL_LANGUAGE_COPY.md — concrete mechanics, no
 * outcome promises.
 */
import type { Bi } from '@/i18n/core'
import type { StrategyCadence, StrategyRule } from './types'

export interface StrategyTemplate {
  slug: string
  name: Bi
  blurb: Bi
  cadence: StrategyCadence
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
    rules: [
      {
        type: 'signal',
        metric: 'weight_pct',
        op: 'gt',
        value: 25,
        severity: 'alert',
        title: 'Over 25% of book',
      },
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
    rules: [
      {
        type: 'signal',
        metric: 'weight_pct',
        op: 'gt',
        value: 35,
        severity: 'alert',
        title: 'Over 35% of book',
      },
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
    rules: [
      {
        type: 'signal',
        metric: 'day_change_pct',
        op: 'lt',
        value: -8,
        severity: 'insight',
        title: 'Down 8% today',
      },
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
    rules: [
      {
        type: 'signal',
        metric: 'vs_ma50',
        op: 'lt',
        value: 0,
        severity: 'alert',
        title: 'Below 50-day average',
      },
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
    rules: [
      {
        type: 'signal',
        metric: 'unrealized_gain_pct',
        op: 'gt',
        value: 40,
        severity: 'insight',
        title: 'Up 40% vs cost',
      },
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
    rules: [
      {
        type: 'signal',
        metric: 'cash_above',
        op: 'gt',
        value: 5000,
        severity: 'insight',
        title: 'Cash above threshold',
      },
    ],
  },
  {
    slug: 'monthly-accumulate',
    name: { en: 'Monthly accumulation', fr: 'Accumulation mensuelle' },
    blurb: {
      en: 'Once a month, draft a small simulated buy on every symbol in scope.',
      fr: 'Une fois par mois, rédiger un petit achat simulé sur chaque symbole suivi.',
    },
    cadence: 'monthly',
    rules: [
      {
        type: 'order_proposal',
        /* vs_ma50 < 9999 fires on every evaluation — the cadence is the
           schedule. (day_change_pct would trip the cadence-mismatch warning.) */
        metric: 'vs_ma50',
        op: 'lt',
        value: 9999,
        side: 'buy',
        qty: 2,
        qtyUnit: 'shares',
        title: 'Monthly accumulation',
      },
    ],
  },
]
