import type { Bi } from '@/i18n/core'
import type { FinanceCurrency } from './entityTypes'

/* ---------- Accounting and matching ---------- */

export type FinanceJournalStatus = 'draft' | 'posted' | 'reversed'

export interface FinanceJournalLine {
  accountId: string
  debit: string
  credit: string
  description?: Bi
  projectId?: string
}

export interface FinanceJournal {
  id: string
  bookId: string
  number: string
  date: string
  description: Bi
  lines: FinanceJournalLine[]
  currency: FinanceCurrency
  status: FinanceJournalStatus
  source: 'import' | 'manual' | 'adjustment' | 'payroll' | 'close'
  /** Linked reversal journal ID if this entry was reversed. */
  reversedById?: string
  /** Whether debits and credits balance in functional currency. */
  balanced: boolean
}

export type FinanceBankMatchStatus = 'unmatched' | 'suggested' | 'matched' | 'exception'

export interface FinanceAiBankItemSuggestion {
  ledgerAccountId: string
  direction: 'debit' | 'credit'
  confidence: 'high' | 'medium' | 'low' | 'none'
  reasonKey: 'feedback_match' | 'semantic_match' | 'rule_match' | 'fallback' | 'manual'
  note: Bi
}

export interface FinanceBankItem {
  id: string
  bankAccountId: string
  date: string
  amount: string
  currency: FinanceCurrency
  description: string
  matchStatus: FinanceBankMatchStatus
  matchedJournalId?: string
  matchedInvoiceId?: string
  matchedBillId?: string
  /** Tracks which import session created this bank item, for undo. */
  importSessionId?: string
  /** AI-generated categorization proposal. Kept for comparison with user edits. */
  aiSuggestion?: FinanceAiBankItemSuggestion
  /** User-visible note: set by AI, editable by the user. */
  note?: Bi
}

export type FinanceAiImportMode = 'suggest' | 'auto_high' | 'auto_all'

export interface FinanceAiImportSettings {
  aiImportEnabled: boolean
  aiImportMode: FinanceAiImportMode
}

export interface FinanceCategorizationFeedback {
  id: string
  entityId: string
  description: string
  originalLedgerAccountId?: string
  correctedLedgerAccountId: string
  correctedDirection: 'debit' | 'credit'
  correctedNote?: Bi
  correctedAt: string
}

export interface FinanceReconciliation {
  id: string
  bankAccountId: string
  periodId: string
  openingBalance: string
  closingBalance: string
  statementTotal: string
  bookTotal: string
  /** Difference between statement and book; non-zero is an exception. */
  difference: string
  status: 'in_progress' | 'reconciled' | 'exception'
  reviewer?: string
  reviewedAt?: string
}

export interface FinanceClosePeriod {
  id: string
  bookId: string
  periodId: string
  status: 'open' | 'in_review' | 'approved' | 'locked'
  approver?: string
  approvedAt?: string
  /** Reopening requires a recorded reason. */
  reopenReason?: Bi
}

/* ---------- Payroll ---------- */

export type FinancePayRunStatus =
  'inputs_open' | 'inputs_approved' | 'submitted' | 'results_imported' | 'reconciled' | 'exception'

export interface FinancePayPeriod {
  id: string
  entityId: string
  label: string
  startDate: string
  endDate: string
  payDate: string
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
}

export interface FinancePayRun {
  id: string
  entityId: string
  periodId: string
  status: FinancePayRunStatus
  grossPay: string
  employeeDeductions: string
  employerContributions: string
  netPay: string
  providerFees: string
  currency: FinanceCurrency
  /** Province of employment determinations stored separately from residence. */
  jurisdictions: string[]
  calculationSource: Bi
  ruleVersion?: string
  approvedBy?: string
  approvedAt?: string
  submittedAt?: string
  reconciledAt?: string
  /** Exceptions: missing approvals, unusual net, duplicates, etc. */
  exceptions?: Bi[]
}

export interface FinancePayrollLiability {
  id: string
  entityId: string
  payRunId?: string
  type: 'source_deductions' | 'employer_contributions' | 'remittance' | 'other'
  amount: string
  currency: FinanceCurrency
  dueDate: string
  /** Whether this liability has been settled by a confirmed remittance. */
  settled: boolean
  settledAt?: string
}
