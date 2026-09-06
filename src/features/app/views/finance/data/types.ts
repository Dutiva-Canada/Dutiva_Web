import type { Bi } from '@/i18n/core'

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
 */

/* ---------- Entity and structural records ---------- */

export type FinanceCurrency = 'CAD' | 'USD' | 'EUR' | 'GBP'

export type FinanceLegalForm = 'corporation' | 'partnership' | 'sole_proprietor' | 'nonprofit'

export interface FinanceLegalEntity {
  id: string
  legalName: string
  legalForm: FinanceLegalForm
  fiscalYearStart: string
  /** Functional currency for accounting. */
  functionalCurrency: FinanceCurrency
  jurisdictions: string[]
  /** External accounting system identifier (e.g. QuickBooks company ID). */
  accountingSourceId?: string
  /** External payroll provider identifier. */
  payrollSourceId?: string
  active: boolean
}

export interface FinanceBook {
  id: string
  entityId: string
  label: Bi
  basis: 'accrual' | 'cash'
  /** Source system that is authoritative for posted entries in this book. */
  authoritativeSource: Bi
  lastSyncedAt?: string
}

export interface FinanceFiscalPeriod {
  id: string
  entityId: string
  label: string
  startDate: string
  endDate: string
  status: 'open' | 'closing' | 'closed' | 'locked'
}

/* ---------- Parties and accounts ---------- */

export type FinancePartyType = 'customer' | 'supplier' | 'employee' | 'bank' | 'advisor'

export interface FinanceParty {
  id: string
  entityId: string
  name: string
  type: FinancePartyType
  externalId?: string
  /** Restricted payee details are masked in general views. */
  bankingDetailsOnFile: boolean
  active: boolean
}

export interface FinanceBankAccount {
  id: string
  entityId: string
  label: Bi
  currency: FinanceCurrency
  /** Last 4 digits only; full number is restricted. */
  last4?: string
  restricted: boolean
  earmarkedAmount?: string
  /** ISO 8601 date for deposit or financing maturity, if applicable. */
  maturityDate?: string
}

export interface FinanceLedgerAccount {
  id: string
  bookId: string
  code: string
  name: Bi
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'contra'
  /** Whether this account is restricted from general ledger users. */
  sensitive: boolean
  active: boolean
}

/* ---------- Commercial documents ---------- */

export type FinanceInvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'disputed'
  | 'written_off'
  | 'cancelled'

export interface FinanceInvoice {
  id: string
  entityId: string
  customerId: string
  number: string
  issueDate: string
  dueDate: string
  currency: FinanceCurrency
  /** Fixed-precision decimal string, e.g. "1250.00". */
  subtotal: string
  taxTotal: string
  total: string
  /** Amount already settled by matched payments. */
  paidAmount: string
  status: FinanceInvoiceStatus
  projectId?: string
  sourceSystem?: Bi
  notes?: Bi
}

export type FinanceBillStatus =
  | 'draft'
  | 'posted'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'disputed'
  | 'cancelled'

export interface FinanceBill {
  id: string
  entityId: string
  supplierId: string
  number: string
  issueDate: string
  dueDate: string
  currency: FinanceCurrency
  subtotal: string
  taxTotal: string
  total: string
  paidAmount: string
  status: FinanceBillStatus
  purchaseOrderId?: string
  projectId?: string
  sourceSystem?: Bi
}

export interface FinanceCredit {
  id: string
  entityId: string
  partyId: string
  /** Whether this credit applies to a customer (receivable) or supplier (payable). */
  direction: 'receivable' | 'payable'
  number: string
  date: string
  currency: FinanceCurrency
  amount: string
  /** Invoice or bill this credit is applied to, if matched. */
  appliedToId?: string
  reason: Bi
  status: 'open' | 'applied' | 'cancelled'
}

export interface FinanceReceipt {
  id: string
  entityId: string
  /** Bill or expense this receipt supports. */
  billId?: string
  expenseId?: string
  fileName: Bi
  uploadedAt: string
  /** Whether the receipt has been reviewed by a human. */
  reviewed: boolean
}

/* ---------- Spend and procurement ---------- */

export type FinanceRequestStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'committed'
  | 'cancelled'

export interface FinanceSpendRequest {
  id: string
  entityId: string
  requester: string
  purpose: Bi
  supplierId?: string
  projectId?: string
  amount: string
  currency: FinanceCurrency
  evidenceRef?: string
  status: FinanceRequestStatus
  approver?: string
  approvedAt?: string
  /** Approval is invalidated when payee or amount changes. */
  approvalVersion?: string
  submittedAt: string
}

export interface FinancePurchaseOrder {
  id: string
  entityId: string
  supplierId: string
  number: string
  date: string
  currency: FinanceCurrency
  total: string
  /** Amount consumed by matched bills. */
  matchedAmount: string
  status: 'open' | 'partial' | 'received' | 'closed' | 'cancelled'
  projectId?: string
}

export type FinanceExpenseStatus = 'draft' | 'submitted' | 'approved' | 'reimbursed' | 'rejected'

export interface FinanceExpense {
  id: string
  entityId: string
  employeeId?: string
  requester: string
  purpose: Bi
  amount: string
  currency: FinanceCurrency
  projectId?: string
  receiptId?: string
  status: FinanceExpenseStatus
  /** Whether this expense is taxable remuneration or reimbursement. */
  taxable: boolean
  submittedAt: string
}

export interface FinanceSubscription {
  id: string
  entityId: string
  label: Bi
  supplierId: string
  cost: string
  currency: FinanceCurrency
  renewalTerm: Bi
  nextRenewalDate: string
  noticeDate?: string
  owner: string
  cancellationEvidence?: string
  active: boolean
}

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
  | 'inputs_open'
  | 'inputs_approved'
  | 'submitted'
  | 'results_imported'
  | 'reconciled'
  | 'exception'

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

/* ---------- Budgets and planning ---------- */

export type FinanceBudgetStatus = 'draft' | 'approved' | 'revised' | 'archived'

export interface FinanceBudgetLine {
  id: string
  department?: string
  projectId?: string
  period: string
  amount: string
  currency: FinanceCurrency
  /** Recognized actual cost for this line's period and scope. */
  actualAmount: string
  /** Remaining committed amount (POs not yet billed). */
  committedAmount: string
}

export interface FinanceBudget {
  id: string
  entityId: string
  label: Bi
  status: FinanceBudgetStatus
  currency: FinanceCurrency
  lines: FinanceBudgetLine[]
  owner: string
  approvedAt?: string
  /** Version increments on material change; invalidates downstream plans. */
  version: number
}

export type FinanceScenarioType = 'baseline' | 'hiring' | 'capital_purchase' | 'financing' | 'operating_change' | 'tax'

export interface FinanceScenario {
  id: string
  entityId: string
  label: Bi
  type: FinanceScenarioType
  assumptions: Bi
  /** Actuals cutoff date this forecast is based on. */
  cutoffDate: string
  currency: FinanceCurrency
  projectedRevenue: string
  projectedExpense: string
  projectedCashFlow: string
  status: 'draft' | 'reviewed' | 'accepted' | 'stale'
  reviewer?: string
  reviewedAt?: string
  /** A later change to facts or rules marks the scenario for review. */
  staleReason?: Bi
}

export interface FinanceForecast {
  id: string
  entityId: string
  label: Bi
  type: '13_week_cash' | 'monthly_operating' | 'custom'
  baselineScenarioId?: string
  currency: FinanceCurrency
  periods: FinanceForecastPeriod[]
  owner: string
  frozenAt?: string
}

export interface FinanceForecastPeriod {
  label: string
  startDate: string
  endDate: string
  inflow: string
  outflow: string
  net: string
  closingBalance: string
}

/* ---------- Treasury ---------- */

export type FinanceReserveType =
  | 'payroll'
  | 'tax'
  | 'emergency_operating'
  | 'capital_purchase'
  | 'other'

export interface FinanceReserveGoal {
  id: string
  entityId: string
  type: FinanceReserveType
  label: Bi
  targetAmount: string
  currentAmount: string
  currency: FinanceCurrency
  linkedBankAccountId?: string
  dueDate?: string
  owner: string
}

export interface FinanceHolding {
  id: string
  entityId: string
  label: Bi
  institution: Bi
  units?: string
  costBasis?: string
  carryingValue?: string
  marketValue?: string
  currency: FinanceCurrency
  asOfDate: string
  realizedResult?: string
  unrealizedChange?: string
  incomeYtd?: string
  feesYtd?: string
  valuationSource: Bi
  /** Whether the valuation is stale (no recent price). */
  stale: boolean
}

export interface FinanceDebt {
  id: string
  entityId: string
  label: Bi
  lender: Bi
  principal: string
  balance: string
  interestRate: string
  currency: FinanceCurrency
  maturityDate: string
  noticePeriod?: string
  collateralRef?: string
  covenantRef?: string
  status: 'active' | 'paid_off' | 'defaulted'
}

/* ---------- Tax ---------- */

export type FinanceTaxType =
  | 'income_tax'
  | 'gst_hst'
  | 'qst'
  | 'payroll_source_deductions'
  | 'employer_contributions'
  | 'other'

export type FinanceObligationStatus =
  | 'planned'
  | 'in_preparation'
  | 'reviewed'
  | 'filed'
  | 'paid'
  | 'confirmed'
  | 'overdue'
  | 'withdrawn'

export interface FinanceTaxObligation {
  id: string
  entityId: string
  type: FinanceTaxType
  jurisdiction: Bi
  period: string
  dueDate: string
  /** Filing deadline and payment deadline are separate. */
  paymentDueDate?: string
  estimatedAmount: string
  confirmedAmount?: string
  currency: FinanceCurrency
  preparer?: string
  reviewer?: string
  status: FinanceObligationStatus
  evidenceRefs?: string[]
  filingRef?: string
  notes?: Bi
}

export interface FinanceTaxScenario {
  id: string
  entityId: string
  label: Bi
  baseline: string
  proposedDecision: Bi
  projectedProfit: string
  projectedTaxableIncome: string
  projectedTax: string
  projectedCashFlow: string
  currency: FinanceCurrency
  assumptions: Bi
  lawVersion: Bi
  /** Enacted rules vs proposed changes are distinguished. */
  enacted: boolean
  reviewer?: string
  reviewedAt?: string
  status: 'draft' | 'reviewed' | 'accepted' | 'stale'
  /** A later change to facts or rules marks the scenario for review. */
  staleReason?: Bi
  /** A tax scenario is a planning record, not a filed return. */
  disclaimer: Bi
}

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
  debts: FinanceDebt[]
  taxObligations: FinanceTaxObligation[]
  taxScenarios: FinanceTaxScenario[]
  approvals: FinanceApproval[]
  auditEvents: FinanceAuditEvent[]
  externalActions: FinanceExternalAction[]
  categoryRules: FinanceCategoryRule[]
  importSessions: FinanceImportSession[]
}
