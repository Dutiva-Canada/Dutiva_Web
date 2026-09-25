import type { Bi } from '@/i18n/core'
import type { FinanceCurrency } from './types'

/**
 * Deals slice of the finance workspace model — the transaction pipeline
 * behind `/app/finance/deals` (docs/FINANCE_DEALS.md). Split from types.ts
 * to keep that file under the 800-line source budget; types.ts re-exports
 * these so existing `from './types'` imports keep working.
 */

/** What kind of transaction the row tracks. */
export type FinanceDealKind =
  | 'acquisition'
  | 'investment'
  | 'divestiture'
  | 'financing'
  | 'other'

/** Pipeline lifecycle — progress record, not a settlement state. */
export type FinanceDealStage =
  | 'sourcing'
  | 'diligence'
  | 'negotiation'
  | 'agreement'
  | 'closed'
  | 'passed'

export interface FinanceDeal {
  id: string
  /** The legal entity booking the deal. */
  entityId: string
  name: Bi
  kind: FinanceDealKind
  stage: FinanceDealStage
  /** Who's on the other side — free text; capital partners live in parties. */
  counterparty?: string
  /** Deal size, decimal string like other money fields. */
  value?: string
  currency: FinanceCurrency
  targetDate?: string
  /** Internal owner name (rows store plain-text actors elsewhere too). */
  owner?: string
  notes?: Bi
  /** When the deal graduated from the watchlist. */
  watchlistItemId?: string
  /** When a closed deal produced a tracked holding. */
  holdingId?: string
}
