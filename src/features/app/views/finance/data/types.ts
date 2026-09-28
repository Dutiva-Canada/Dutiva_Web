/**
 * Workspace-scoped types for the Finance platform foundation.
 *
 * This is the integration-led Phase 1 model: the customer's accounting system
 * remains authoritative for posted books; its payroll provider remains
 * authoritative for completed pay runs. Dutiva owns budgets, forecasts, review
 * work, approvals, and links to source records. Money is represented with
 * string-based fixed-precision decimals to avoid binary floating point.
 *
 * Domains: financial management, payroll, bookkeeping, accounting, billing &
 * collections, spend & procurement, budgeting, treasury, investments, financial
 * planning, and tax management.
 *
 * This file is the aggregate entry point: domain types live in sibling
 * modules (entityTypes, documentTypes, ledgerTypes, planningTypes, opsTypes,
 * portfolioTypes, dealTypes) and are re-exported here so `from './types'`
 * keeps working for every existing import site (800-line source budget).
 */
import type {
  FinanceBill,
  FinanceCredit,
  FinanceExpense,
  FinanceInvoice,
  FinancePurchaseOrder,
  FinanceReceipt,
  FinanceSpendRequest,
  FinanceSubscription,
} from './documentTypes'
import type {
  FinanceBankAccount,
  FinanceBook,
  FinanceFiscalPeriod,
  FinanceLedgerAccount,
  FinanceLegalEntity,
  FinanceParty,
} from './entityTypes'
import type {
  FinanceAiImportSettings,
  FinanceBankItem,
  FinanceCategorizationFeedback,
  FinanceClosePeriod,
  FinanceJournal,
  FinancePayPeriod,
  FinancePayRun,
  FinancePayrollLiability,
  FinanceReconciliation,
} from './ledgerTypes'
import type {
  FinanceApproval,
  FinanceAuditEvent,
  FinanceCategoryRule,
  FinanceExternalAction,
  FinanceImportSession,
} from './opsTypes'
import type {
  FinanceBudget,
  FinanceCashSweep,
  FinanceDebt,
  FinanceForecast,
  FinanceHolding,
  FinanceReserveGoal,
  FinanceScenario,
  FinanceTaxObligation,
  FinanceTaxScenario,
} from './planningTypes'

/* Entity, party, and account domain types live in ./entityTypes. */
export type {
  FinanceBankAccount,
  FinanceBook,
  FinanceCurrency,
  FinanceFiscalPeriod,
  FinanceLedgerAccount,
  FinanceLegalEntity,
  FinanceLegalForm,
  FinanceParty,
  FinancePartyType,
} from './entityTypes'

/* Commercial document and spend/procurement domain types live in
   ./documentTypes. */
export type {
  FinanceBill,
  FinanceBillStatus,
  FinanceCredit,
  FinanceExpense,
  FinanceExpenseStatus,
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinancePurchaseOrder,
  FinanceReceipt,
  FinanceRequestStatus,
  FinanceSpendRequest,
  FinanceSubscription,
} from './documentTypes'

/* Ledger, bank-item, reconciliation, and payroll domain types live in
   ./ledgerTypes. */
export type {
  FinanceAiBankItemSuggestion,
  FinanceAiImportMode,
  FinanceAiImportSettings,
  FinanceBankItem,
  FinanceBankMatchStatus,
  FinanceCategorizationFeedback,
  FinanceClosePeriod,
  FinanceJournal,
  FinanceJournalLine,
  FinanceJournalStatus,
  FinancePayPeriod,
  FinancePayRun,
  FinancePayRunStatus,
  FinancePayrollLiability,
  FinanceReconciliation,
} from './ledgerTypes'

/* Budget, planning, treasury, and tax domain types live in ./planningTypes. */
export type {
  FinanceBudget,
  FinanceBudgetLine,
  FinanceBudgetStatus,
  FinanceCashSweep,
  FinanceCashSweepStatus,
  FinanceDebt,
  FinanceForecast,
  FinanceForecastPeriod,
  FinanceHolding,
  FinanceObligationStatus,
  FinanceReserveGoal,
  FinanceReserveType,
  FinanceScenario,
  FinanceScenarioType,
  FinanceTaxObligation,
  FinanceTaxScenario,
  FinanceTaxType,
} from './planningTypes'

/* Approval, audit, external-action, and import domain types live in
   ./opsTypes. */
export type {
  FinanceApproval,
  FinanceApprovalDecision,
  FinanceAuditEvent,
  FinanceBankStatementImportResult,
  FinanceCategoryMatchType,
  FinanceCategoryRule,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceImportRowError,
  FinanceImportSession,
  FinanceImportStatus,
} from './opsTypes'

/* ---------- Portfolio (watchlist + decision journal) ---------- */

/* Portfolio domain types live in ./portfolioTypes (types.ts is at the
   800-line source budget). Re-exported here so `from './types'` keeps
   working for every existing import site. */
export type {
  FinanceAssetClass,
  FinanceWatchlistStatus,
  FinanceWatchlistItem,
  FinanceDecisionKind,
  FinanceDecisionEntry,
} from './portfolioTypes'
import type { FinanceDecisionEntry, FinanceWatchlistItem } from './portfolioTypes'

/* Deals domain types live in ./dealTypes (same 800-line budget split).
   Re-exported here so `from './types'` keeps working. */
export type {
  FinanceDealKind,
  FinanceDealStage,
  FinanceDeal,
  FinanceCommitmentStatus,
  FinanceCommitment,
  FinanceCapitalCallStatus,
  FinanceCapitalCall,
  FinanceDocumentLink,
} from './dealTypes'
import type {
  FinanceCapitalCall,
  FinanceCommitment,
  FinanceDeal,
  FinanceDocumentLink,
} from './dealTypes'

/* ---------- Workspace state ---------- */

export interface FinanceWorkspaceState {
  entities: FinanceLegalEntity[]
  books: FinanceBook[]
  fiscalPeriods: FinanceFiscalPeriod[]
  parties: FinanceParty[]
  bankAccounts: FinanceBankAccount[]
  ledgerAccounts: FinanceLedgerAccount[]
  invoices: FinanceInvoice[]
  bills: FinanceBill[]
  credits: FinanceCredit[]
  receipts: FinanceReceipt[]
  spendRequests: FinanceSpendRequest[]
  purchaseOrders: FinancePurchaseOrder[]
  expenses: FinanceExpense[]
  subscriptions: FinanceSubscription[]
  journals: FinanceJournal[]
  bankItems: FinanceBankItem[]
  reconciliations: FinanceReconciliation[]
  closePeriods: FinanceClosePeriod[]
  payPeriods: FinancePayPeriod[]
  payRuns: FinancePayRun[]
  payrollLiabilities: FinancePayrollLiability[]
  budgets: FinanceBudget[]
  scenarios: FinanceScenario[]
  forecasts: FinanceForecast[]
  reserveGoals: FinanceReserveGoal[]
  holdings: FinanceHolding[]
  watchlistItems: FinanceWatchlistItem[]
  decisionEntries: FinanceDecisionEntry[]
  deals: FinanceDeal[]
  /** Capital-partner commitments (investor/lender ledger), migration 0172. */
  commitments: FinanceCommitment[]
  /** Discrete call events against commitments, migration 0173. */
  capitalCalls: FinanceCapitalCall[]
  cashSweeps: FinanceCashSweep[]
  documentLinks: FinanceDocumentLink[]
  debts: FinanceDebt[]
  taxObligations: FinanceTaxObligation[]
  taxScenarios: FinanceTaxScenario[]
  approvals: FinanceApproval[]
  auditEvents: FinanceAuditEvent[]
  externalActions: FinanceExternalAction[]
  categoryRules: FinanceCategoryRule[]
  importSessions: FinanceImportSession[]
  /** Per-workspace AI import controls and user correction history. */
  aiImportSettings: FinanceAiImportSettings
  categorizationFeedback: FinanceCategorizationFeedback[]
}
