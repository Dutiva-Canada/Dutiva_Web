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
    slug: 'concentration-cap',
    name: { en: 'Concentration alert', fr: 'Alerte de concentration' },
    blurb: {
      en: 'Alert when a single position crosses 35% of the book.',
      fr: 'Alerter quand une position dépasse 35 % du portefeuille.',
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
    name: { en: 'Trend break', fr: 'Cassure de tendance' },
    blurb: {
      en: 'Alert when a tracked symbol slips below its 50-day average.',
      fr: 'Alerter quand un symbole suivi passe sous sa moyenne de 50 jours.',
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
      en: 'Note tracked positions up 40% or more against their average cost.',
      fr: 'Noter les positions suivies en hausse de 40 % ou plus par rapport au coût moyen.',
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
      en: 'Note when account cash sits above $5,000.',
      fr: 'Noter quand les liquidités dépassent 5 000 $.',
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
    name: { en: 'Monthly accumulation plan', fr: 'Plan d’accumulation mensuel' },
    blurb: {
      en: 'Propose a small simulated buy on every tracked symbol.',
      fr: 'Proposer un petit achat simulé sur chaque symbole suivi.',
    },
    cadence: 'monthly',
    rules: [
      {
        type: 'order_proposal',
        /* day_change_pct < 9999 is the near-universal gate: it fires on
           every symbol with a daily move recorded. vs_ma50 looked like the
           same trick but silently skipped symbols without a 50-day
           average — an unpriced symbol stays silent either way, which is
           correct (a stale symbol should not propose a buy). */
        metric: 'day_change_pct',
        op: 'lt',
        value: 9999,
        side: 'buy',
        qty: 2,
        qtyUnit: 'shares',
        title: 'Monthly accumulation plan',
      },
    ],
  },
]
