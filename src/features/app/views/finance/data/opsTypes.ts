import type { Bi } from '@/i18n/core'
import type { FinanceCurrency } from './entityTypes'

/* ---------- Approvals and audit ---------- */

export type FinanceApprovalDecision = 'approved' | 'rejected' | 'changes_requested'

export interface FinanceApproval {
  id: string
  entityId: string
  /** What this approval binds: amount, currency, entity, payee version, evidence. */
  recordType: 'spend_request' | 'expense' | 'journal' | 'pay_run' | 'close_period' | 'tax_scenario'
  recordId: string
  approver: string
  decision: FinanceApprovalDecision
  /** Snapshot of the approved amount, currency, and payee version. */
  approvedAmount: string
  approvedCurrency: FinanceCurrency
  payeeVersion?: string
  rationale?: Bi
  decidedAt: string
}

export interface FinanceAuditEvent {
  id: string
  entityId: string
  actor: string
  action: Bi
  recordType: string
  recordId: string
  timestamp: string
  /** Outcome of the action for audit traceability. */
  outcome: Bi
}

/* ---------- External action lifecycle ---------- */

export type FinanceExternalActionStatus =
  | 'internal_approval'
  | 'export_prepared'
  | 'provider_accepted'
  | 'settled'
  | 'filing_accepted'
  | 'failed'
  | 'returned'
  | 'unknown'

export interface FinanceExternalAction {
  id: string
  entityId: string
  recordType: 'payment' | 'filing' | 'remittance' | 'payroll_submission'
  recordId: string
  status: FinanceExternalActionStatus
  /** Immutable payload version for idempotency. */
  payloadVersion: string
  idempotencyKey: string
  providerRef?: string
  /** "Approved" never means "paid"; "submitted" never means "accepted". */
  confirmedAt?: string
  notes?: Bi
}

/* ---------- Categorization rules and imports ---------- */

export type FinanceCategoryMatchType = 'contains' | 'exact' | 'starts_with' | 'ends_with'

export interface FinanceCategoryRule {
  id: string
  entityId: string
  /** Keyword or pattern to match against bank item description. */
  pattern: string
  matchType: FinanceCategoryMatchType
  /** Ledger account to categorize matched transactions to. */
  ledgerAccountId: string
  /** Whether a positive amount debits or credits this account. */
  direction: 'debit' | 'credit'
  /** Higher priority rules are evaluated first. */
  priority: number
  active: boolean
}

export type FinanceImportStatus = 'pending' | 'imported' | 'reviewed' | 'archived'

export interface FinanceImportRowError {
  rowIndex: number
  rawDate: string
  rawAmount: string
  rawDescription: string
  reason: string
}

export interface FinanceBankStatementImportResult {
  newItems: number
  duplicates: number
  errors: number
  errorDetails: FinanceImportRowError[]
  /** The import session ID, so the caller can run follow-up AI analysis. */
  sessionId: string
  /** Summary from AI post-import analysis, if it ran. */
  aiSummary?: {
    itemsAnalysed: number
    itemsMatched: number
    itemsSuggested: number
    rulesAdded: number
  }
}

export interface FinanceImportSession {
  id: string
  entityId: string
  bankAccountId: string
  fileName: string
  importedAt: string
  /** Total rows parsed from the source file. */
  totalRows: number
  /** Rows that became new bank items. */
  newItems: number
  /** Rows skipped as duplicates of existing bank items. */
  duplicates: number
  /** Rows that could not be parsed. */
  errors: number
  status: FinanceImportStatus
  /** Per-row error details when rows could not be parsed. */
  errorDetails?: FinanceImportRowError[]
}
