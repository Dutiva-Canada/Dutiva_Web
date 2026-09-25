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

/* ---------- Capital-partner commitments (migration 0172) ---------- */

export type FinanceCommitmentStatus = 'active' | 'closed'

/**
 * A capital commitment recorded against a finance party — how much an
 * investor or lender has committed to the entity, how much has been
 * called so far, and when the next call falls due. Dutiva keeps the
 * commitment ledger; it does not process capital calls or move money.
 */
export interface FinanceCommitment {
  id: string
  entityId: string
  /** The investor/lender party (finance_parties row) the commitment is with. */
  partyId: string
  /** What the commitment covers — e.g. "Series A commitment". */
  label?: Bi
  /** Total amount committed, decimal string like other money fields. */
  committed: string
  /** Amount actually drawn so far. */
  called: string
  currency: FinanceCurrency
  /** When the next capital call is expected. */
  nextCallDate?: string
  status: FinanceCommitmentStatus
  notes?: Bi
}

/* ---------- Capital calls (migration 0173) ---------- */

export type FinanceCapitalCallStatus = 'scheduled' | 'notified' | 'received' | 'cancelled'

/**
 * A discrete capital call against a commitment — the event log that feeds
 * the commitment's `called` ledger figure. Entity and currency come from
 * the parent commitment rather than duplicating columns.
 */
export interface FinanceCapitalCall {
  id: string
  commitmentId: string
  /** Call amount, decimal string like other money fields. */
  amount: string
  dueDate: string
  status: FinanceCapitalCallStatus
  /** Call-notice or wire reference. */
  reference?: string
  /** When the money actually landed, if received. */
  receivedDate?: string
  notes?: Bi
}

/* ---------- Deal/holding document links (migration 0175) ---------- */

/**
 * A finance-side pointer to a document in the HR Documents module
 * (hr_generated_documents). Snapshots the ref + bilingual title so
 * finance screens render the link without joining across modules;
 * deep links resolve to /app/documents/<documentId>.
 */
export interface FinanceDocumentLink {
  id: string
  /** Exactly one of dealId / holdingId is set. */
  dealId?: string
  holdingId?: string
  documentId: string
  documentRef?: string
  title?: Bi
}
