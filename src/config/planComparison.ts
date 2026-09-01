import type { MarketingMessageKey } from '@/i18n/messages'
import type { PlanId } from './plans'

/**
 * A comparison cell:
 *   - `true`  → included (rendered as a check),
 *   - `false` → not included (rendered as a dash),
 *   - a `MarketingMessageKey` → a short qualifier ("1 business day", …).
 */
export type ComparisonCell = boolean | MarketingMessageKey

export interface ComparisonRow {
  labelKey: MarketingMessageKey
  cells: Record<PlanId, ComparisonCell>
}

export interface ComparisonGroup {
  headingKey: MarketingMessageKey
  rows: ComparisonRow[]
}

/**
 * Feature-by-feature plan comparison for the quiet-beta period: every admitted
 * account gets the full product. Paid plans skip the **free** waitlist — active
 * Starter/Growth/Pro subscriptions admit immediately (migration 0089); the
 * {@link BETA_COHORT_LIMIT} cap applies to the free cohort only. Paying also
 * buys support. Restore per-plan product limits here only when
 * PLAN_FEATURE_GATES_ENABLED is on and those limits are actually enforced.
 */
export const PLAN_COMPARISON: ComparisonGroup[] = [
  {
    headingKey: 'pricing_grp_workspace',
    rows: [
      {
        labelKey: 'pricing_row_full_product',
        cells: { free: 'pricing_v_when_admitted', starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_skip_waitlist',
        cells: { free: false, starter: true, growth: true, pro: true },
      },
    ],
  },
  {
    headingKey: 'pricing_grp_support',
    rows: [
      {
        labelKey: 'pricing_row_help_centre',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_support',
        cells: {
          free: 'pricing_v_email',
          starter: 'pricing_v_email',
          growth: 'pricing_v_email',
          pro: 'pricing_v_email',
        },
      },
      {
        labelKey: 'pricing_row_initial_reply',
        cells: {
          free: 'pricing_v_2_days',
          starter: 'pricing_v_2_days',
          growth: 'pricing_v_1_day',
          pro: 'pricing_v_1_day',
        },
      },
      {
        labelKey: 'pricing_row_walkthrough',
        cells: { free: false, starter: false, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_onboarding_call',
        cells: { free: false, starter: false, growth: false, pro: true },
      },
    ],
  },
  {
    headingKey: 'pricing_grp_billing',
    rows: [
      {
        labelKey: 'pricing_row_contract',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
    ],
  },
]
