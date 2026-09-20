import type { Bi } from '@/i18n/core'
import type { FinanceCurrency } from './types'

/**
 * Portfolio slice of the finance workspace model — watchlist and decision
 * journal records behind `/app/finance/portfolio` (docs/FINANCE_PORTFOLIO.md).
 * Split from types.ts to keep that file under the 800-line source budget;
 * types.ts re-exports these so existing `from './types'` imports keep working.
 */

export type FinanceAssetClass = 'equity' | 'crypto' | 'fund' | 'fixed_income' | 'other'

/** Lifecycle of a watched instrument — Dutiva tracks decisions, not trades. */
export type FinanceWatchlistStatus = 'watching' | 'under_review' | 'decided' | 'dropped'

export interface FinanceWatchlistItem {
  id: string
  entityId: string
  /** Ticker or short reference, when the instrument has one. */
  symbol?: string
  label: Bi
  assetClass: FinanceAssetClass
  /** Why the org is watching it — the thesis in the org's own words. */
  thesis?: Bi
  targetLow?: string
  targetHigh?: string
  currency: FinanceCurrency
  status: FinanceWatchlistStatus
}

export type FinanceDecisionKind = 'buy' | 'sell' | 'hold' | 'add' | 'exit' | 'review'

export interface FinanceDecisionEntry {
  id: string
  entityId: string
  /** What the decision concerns, when it maps to a tracked record. */
  holdingId?: string
  watchlistItemId?: string
  decision: FinanceDecisionKind
  decidedAt: string
  summary: Bi
  rationale?: Bi
  /** When the org intends to revisit the decision. */
  reviewDate?: string
  outcome?: Bi
}
