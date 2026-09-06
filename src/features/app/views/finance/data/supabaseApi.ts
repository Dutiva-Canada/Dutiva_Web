import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type { Bi } from '@/i18n/core'
import type {
  FinanceApproval,
  FinanceAuditEvent,
  FinanceBankAccount,
  FinanceBankItem,
  FinanceBill,
  FinanceBook,
  FinanceBudget,
  FinanceClosePeriod,
  FinanceCredit,
  FinanceDebt,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceFiscalPeriod,
  FinanceForecast,
  FinanceHolding,
  FinanceInvoice,
  FinanceJournal,
  FinanceJournalLine,
  FinanceLedgerAccount,
  FinanceLegalEntity,
  FinanceObligationStatus,
  FinanceParty,
  FinancePayPeriod,
  FinancePayRun,
  FinancePayRunStatus,
  FinancePayrollLiability,
  FinancePurchaseOrder,
  FinanceReceipt,
  FinanceReconciliation,
  FinanceReserveGoal,
  FinanceScenario,
  FinanceSpendRequest,
  FinanceSubscription,
  FinanceTaxObligation,
  FinanceTaxScenario,
  FinanceWorkspaceState,
} from './types'

/**
 * Supabase-backed persistence for the Finance workspace.
 *
 * Reads and writes the `finance_*` tables created by migration 0119, org-scoped
 * by RLS. Sensitive payroll tables are admin-only at the RLS level; the client
 * also gates visibility via `useWorkspaceMode().memberRole`.
 *
 * When Supabase is not configured (local dev without env vars), callers fall
 * back to the localStorage stub in `productionApi.ts`.
 */

const TABLES = {
  entities: 'finance_entities',
  books: 'finance_books',
  fiscalPeriods: 'finance_fiscal_periods',
  parties: 'finance_parties',
  bankAccounts: 'finance_bank_accounts',
  ledgerAccounts: 'finance_ledger_accounts',
  invoices: 'finance_invoices',
  bills: 'finance_bills',
  credits: 'finance_credits',
  receipts: 'finance_receipts',
  spendRequests: 'finance_spend_requests',
  purchaseOrders: 'finance_purchase_orders',
  expenses: 'finance_expenses',
  subscriptions: 'finance_subscriptions',
  journals: 'finance_journals',
  bankItems: 'finance_bank_items',
  reconciliations: 'finance_reconciliations',
  closePeriods: 'finance_close_periods',
  payPeriods: 'finance_pay_periods',
  payRuns: 'finance_pay_runs',
  payrollLiabilities: 'finance_payroll_liabilities',
  budgets: 'finance_budgets',
  scenarios: 'finance_scenarios',
  forecasts: 'finance_forecasts',
  reserveGoals: 'finance_reserve_goals',
  holdings: 'finance_holdings',
  debts: 'finance_debts',
  taxObligations: 'finance_tax_obligations',
  taxScenarios: 'finance_tax_scenarios',
  approvals: 'finance_approvals',
  auditEvents: 'finance_audit_events',
  externalActions: 'finance_external_actions',
} as const

/**
 * The finance tables are created by migration 0119 but are not yet in the
 * generated `database.types.ts` (types are regenerated after the migration
 * is applied to the project). Until then, we cast the client to a generic
 * shape so we can query the tables without fighting the generated union.
 * After `npm run db:types` picks up the finance tables, this cast can be
 * removed and the table names will be type-checked normally.
 */
/**
 * Generic client — the finance tables exist in the database (migration 0119)
 * but not yet in `database.types.ts` (types are regenerated after the migration
 * is applied to the project). We use an untyped client to avoid fighting the
 * generated union. After `npm run db:types` picks up the finance tables,
 * replace this with the typed `supabaseTyped` import.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = supabaseTyped

/* ---------- Row mappers (snake_case → camelCase + JSONB → Bi) ---------- */

function bi(value: unknown): Bi {
  if (typeof value === 'object' && value !== null && 'en' in value && 'fr' in value) {
    return value as Bi
  }
  return { en: String(value ?? ''), fr: String(value ?? '') }
}

function num(value: unknown): string {
  if (value === null || value === undefined) return '0.00'
  return String(value)
}

function mapEntity(r: Record<string, unknown>): FinanceLegalEntity {
  return {
    id: r.id as string,
    legalName: r.legal_name as string,
    legalForm: r.legal_form as FinanceLegalEntity['legalForm'],
    fiscalYearStart: r.fiscal_year_start as string,
    functionalCurrency: r.functional_currency as FinanceLegalEntity['functionalCurrency'],
    jurisdictions: (r.jurisdictions ?? []) as string[],
    accountingSourceId: r.accounting_source_id as string | undefined,
    payrollSourceId: r.payroll_source_id as string | undefined,
    active: r.active as boolean,
  }
}

function mapBook(r: Record<string, unknown>): FinanceBook {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    basis: r.basis as FinanceBook['basis'],
    authoritativeSource: bi(r.authoritative_source),
    lastSyncedAt: r.last_synced_at as string | undefined,
  }
}

function mapFiscalPeriod(r: Record<string, unknown>): FinanceFiscalPeriod {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: r.label as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    status: r.status as FinanceFiscalPeriod['status'],
  }
}

function mapParty(r: Record<string, unknown>): FinanceParty {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    name: r.name as string,
    type: r.type as FinanceParty['type'],
    externalId: r.external_id as string | undefined,
    bankingDetailsOnFile: r.banking_details_on_file as boolean,
    active: r.active as boolean,
  }
}

function mapBankAccount(r: Record<string, unknown>): FinanceBankAccount {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    currency: r.currency as FinanceBankAccount['currency'],
    last4: r.last4 as string | undefined,
    restricted: r.restricted as boolean,
    earmarkedAmount: r.earmarked_amount ? num(r.earmarked_amount) : undefined,
    maturityDate: r.maturity_date as string | undefined,
  }
}

function mapLedgerAccount(r: Record<string, unknown>): FinanceLedgerAccount {
  return {
    id: r.id as string,
    bookId: r.book_id as string,
    code: r.code as string,
    name: bi(r.name),
    type: r.type as FinanceLedgerAccount['type'],
    sensitive: r.sensitive as boolean,
    active: r.active as boolean,
  }
}

function mapInvoice(r: Record<string, unknown>): FinanceInvoice {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    customerId: r.customer_id as string,
    number: r.number as string,
    issueDate: r.issue_date as string,
    dueDate: r.due_date as string,
    currency: r.currency as FinanceInvoice['currency'],
    subtotal: num(r.subtotal),
    taxTotal: num(r.tax_total),
    total: num(r.total),
    paidAmount: num(r.paid_amount),
    status: r.status as FinanceInvoice['status'],
    projectId: r.project_id as string | undefined,
    sourceSystem: r.source_system ? bi(r.source_system) : undefined,
    notes: r.notes ? bi(r.notes) : undefined,
  }
}

function mapBill(r: Record<string, unknown>): FinanceBill {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    supplierId: r.supplier_id as string,
    number: r.number as string,
    issueDate: r.issue_date as string,
    dueDate: r.due_date as string,
    currency: r.currency as FinanceBill['currency'],
    subtotal: num(r.subtotal),
    taxTotal: num(r.tax_total),
    total: num(r.total),
    paidAmount: num(r.paid_amount),
    status: r.status as FinanceBill['status'],
    purchaseOrderId: r.purchase_order_id as string | undefined,
    projectId: r.project_id as string | undefined,
    sourceSystem: r.source_system ? bi(r.source_system) : undefined,
  }
}

function mapCredit(r: Record<string, unknown>): FinanceCredit {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    partyId: r.party_id as string,
    direction: r.direction as FinanceCredit['direction'],
    number: r.number as string,
    date: r.date as string,
    currency: r.currency as FinanceCredit['currency'],
    amount: num(r.amount),
    appliedToId: r.applied_to_id as string | undefined,
    reason: bi(r.reason),
    status: r.status as FinanceCredit['status'],
  }
}

function mapSpendRequest(r: Record<string, unknown>): FinanceSpendRequest {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    requester: r.requester as string,
    purpose: bi(r.purpose),
    supplierId: r.supplier_id as string | undefined,
    projectId: r.project_id as string | undefined,
    amount: num(r.amount),
    currency: r.currency as FinanceSpendRequest['currency'],
    evidenceRef: r.evidence_ref as string | undefined,
    status: r.status as FinanceSpendRequest['status'],
    approver: r.approver as string | undefined,
    approvedAt: r.approved_at as string | undefined,
    approvalVersion: r.approval_version as string | undefined,
    submittedAt: r.submitted_at as string,
  }
}

function mapPurchaseOrder(r: Record<string, unknown>): FinancePurchaseOrder {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    supplierId: r.supplier_id as string,
    number: r.number as string,
    date: r.date as string,
    currency: r.currency as FinancePurchaseOrder['currency'],
    total: num(r.total),
    matchedAmount: num(r.matched_amount),
    status: r.status as FinancePurchaseOrder['status'],
    projectId: r.project_id as string | undefined,
  }
}

function mapExpense(r: Record<string, unknown>): FinanceWorkspaceState['expenses'][number] {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    employeeId: r.employee_id as string | undefined,
    requester: r.requester as string,
    purpose: bi(r.purpose),
    amount: num(r.amount),
    currency: r.currency as FinanceWorkspaceState['expenses'][number]['currency'],
    projectId: r.project_id as string | undefined,
    receiptId: r.receipt_id as string | undefined,
    status: r.status as FinanceWorkspaceState['expenses'][number]['status'],
    taxable: r.taxable as boolean,
    submittedAt: r.submitted_at as string,
  }
}

function mapSubscription(r: Record<string, unknown>): FinanceSubscription {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    supplierId: r.supplier_id as string,
    cost: num(r.cost),
    currency: r.currency as FinanceSubscription['currency'],
    renewalTerm: bi(r.renewal_term),
    nextRenewalDate: r.next_renewal_date as string,
    noticeDate: r.notice_date as string | undefined,
    owner: r.owner as string,
    cancellationEvidence: r.cancellation_evidence as string | undefined,
    active: r.active as boolean,
  }
}

function mapJournal(r: Record<string, unknown>): FinanceJournal {
  return {
    id: r.id as string,
    bookId: r.book_id as string,
    number: r.number as string,
    date: r.date as string,
    description: bi(r.description),
    lines: (r.lines ?? []) as FinanceJournalLine[],
    currency: r.currency as FinanceJournal['currency'],
    status: r.status as FinanceJournal['status'],
    source: r.source as FinanceJournal['source'],
    reversedById: r.reversed_by_id as string | undefined,
    balanced: r.balanced as boolean,
  }
}

function mapBankItem(r: Record<string, unknown>): FinanceBankItem {
  return {
    id: r.id as string,
    bankAccountId: r.bank_account_id as string,
    date: r.date as string,
    amount: num(r.amount),
    currency: r.currency as FinanceBankItem['currency'],
    description: r.description as string,
    matchStatus: r.match_status as FinanceBankItem['matchStatus'],
    matchedJournalId: r.matched_journal_id as string | undefined,
    matchedInvoiceId: r.matched_invoice_id as string | undefined,
    matchedBillId: r.matched_bill_id as string | undefined,
  }
}

function mapReconciliation(r: Record<string, unknown>): FinanceReconciliation {
  return {
    id: r.id as string,
    bankAccountId: r.bank_account_id as string,
    periodId: r.period_id as string,
    openingBalance: num(r.opening_balance),
    closingBalance: num(r.closing_balance),
    statementTotal: num(r.statement_total),
    bookTotal: num(r.book_total),
    difference: num(r.difference),
    status: r.status as FinanceReconciliation['status'],
    reviewer: r.reviewer as string | undefined,
    reviewedAt: r.reviewed_at as string | undefined,
  }
}

function mapClosePeriod(r: Record<string, unknown>): FinanceClosePeriod {
  return {
    id: r.id as string,
    bookId: r.book_id as string,
    periodId: r.period_id as string,
    status: r.status as FinanceClosePeriod['status'],
    approver: r.approver as string | undefined,
    approvedAt: r.approved_at as string | undefined,
    reopenReason: r.reopen_reason ? bi(r.reopen_reason) : undefined,
  }
}

function mapPayPeriod(r: Record<string, unknown>): FinancePayPeriod {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: r.label as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    payDate: r.pay_date as string,
    frequency: r.frequency as FinancePayPeriod['frequency'],
  }
}

function mapPayRun(r: Record<string, unknown>): FinancePayRun {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    periodId: r.period_id as string,
    status: r.status as FinancePayRunStatus,
    grossPay: num(r.gross_pay),
    employeeDeductions: num(r.employee_deductions),
    employerContributions: num(r.employer_contributions),
    netPay: num(r.net_pay),
    providerFees: num(r.provider_fees),
    currency: r.currency as FinancePayRun['currency'],
    jurisdictions: (r.jurisdictions ?? []) as string[],
    calculationSource: bi(r.calculation_source),
    ruleVersion: r.rule_version as string | undefined,
    approvedBy: r.approved_by as string | undefined,
    approvedAt: r.approved_at as string | undefined,
    submittedAt: r.submitted_at as string | undefined,
    reconciledAt: r.reconciled_at as string | undefined,
    exceptions: r.exceptions ? (r.exceptions as Bi[]) : undefined,
  }
}

function mapPayrollLiability(r: Record<string, unknown>): FinancePayrollLiability {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    payRunId: r.pay_run_id as string | undefined,
    type: r.type as FinancePayrollLiability['type'],
    amount: num(r.amount),
    currency: r.currency as FinancePayrollLiability['currency'],
    dueDate: r.due_date as string,
    settled: r.settled as boolean,
    settledAt: r.settled_at as string | undefined,
  }
}

function mapBudget(r: Record<string, unknown>): FinanceBudget {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    status: r.status as FinanceBudget['status'],
    currency: r.currency as FinanceBudget['currency'],
    lines: (r.lines ?? []) as FinanceBudget['lines'],
    owner: r.owner as string,
    approvedAt: r.approved_at as string | undefined,
    version: r.version as number,
  }
}

function mapScenario(r: Record<string, unknown>): FinanceScenario {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    type: r.type as FinanceScenario['type'],
    assumptions: bi(r.assumptions),
    cutoffDate: r.cutoff_date as string,
    currency: r.currency as FinanceScenario['currency'],
    projectedRevenue: num(r.projected_revenue),
    projectedExpense: num(r.projected_expense),
    projectedCashFlow: num(r.projected_cash_flow),
    status: r.status as FinanceScenario['status'],
    reviewer: r.reviewer as string | undefined,
    reviewedAt: r.reviewed_at as string | undefined,
    staleReason: r.stale_reason ? bi(r.stale_reason) : undefined,
  }
}

function mapForecast(r: Record<string, unknown>): FinanceForecast {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    type: r.type as FinanceForecast['type'],
    baselineScenarioId: r.baseline_scenario_id as string | undefined,
    currency: r.currency as FinanceForecast['currency'],
    periods: (r.periods ?? []) as FinanceForecast['periods'],
    owner: r.owner as string,
    frozenAt: r.frozen_at as string | undefined,
  }
}

function mapReserveGoal(r: Record<string, unknown>): FinanceReserveGoal {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    type: r.type as FinanceReserveGoal['type'],
    label: bi(r.label),
    targetAmount: num(r.target_amount),
    currentAmount: num(r.current_amount),
    currency: r.currency as FinanceReserveGoal['currency'],
    linkedBankAccountId: r.linked_bank_account_id as string | undefined,
    dueDate: r.due_date as string | undefined,
    owner: r.owner as string,
  }
}

function mapHolding(r: Record<string, unknown>): FinanceHolding {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    institution: bi(r.institution),
    units: r.units as string | undefined,
    costBasis: r.cost_basis ? num(r.cost_basis) : undefined,
    carryingValue: r.carrying_value ? num(r.carrying_value) : undefined,
    marketValue: r.market_value ? num(r.market_value) : undefined,
    currency: r.currency as FinanceHolding['currency'],
    asOfDate: r.as_of_date as string,
    realizedResult: r.realized_result ? num(r.realized_result) : undefined,
    unrealizedChange: r.unrealized_change ? num(r.unrealized_change) : undefined,
    incomeYtd: r.income_ytd ? num(r.income_ytd) : undefined,
    feesYtd: r.fees_ytd ? num(r.fees_ytd) : undefined,
    valuationSource: bi(r.valuation_source),
    stale: r.stale as boolean,
  }
}

function mapDebt(r: Record<string, unknown>): FinanceDebt {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    lender: bi(r.lender),
    principal: num(r.principal),
    balance: num(r.balance),
    interestRate: r.interest_rate as string,
    currency: r.currency as FinanceDebt['currency'],
    maturityDate: r.maturity_date as string,
    noticePeriod: r.notice_period as string | undefined,
    collateralRef: r.collateral_ref as string | undefined,
    covenantRef: r.covenant_ref as string | undefined,
    status: r.status as FinanceDebt['status'],
  }
}

function mapTaxObligation(r: Record<string, unknown>): FinanceTaxObligation {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    type: r.type as FinanceTaxObligation['type'],
    jurisdiction: bi(r.jurisdiction),
    period: r.period as string,
    dueDate: r.due_date as string,
    paymentDueDate: r.payment_due_date as string | undefined,
    estimatedAmount: num(r.estimated_amount),
    confirmedAmount: r.confirmed_amount ? num(r.confirmed_amount) : undefined,
    currency: r.currency as FinanceTaxObligation['currency'],
    preparer: r.preparer as string | undefined,
    reviewer: r.reviewer as string | undefined,
    status: r.status as FinanceObligationStatus,
    evidenceRefs: (r.evidence_refs ?? []) as string[],
    filingRef: r.filing_ref as string | undefined,
    notes: r.notes ? bi(r.notes) : undefined,
  }
}

function mapTaxScenario(r: Record<string, unknown>): FinanceTaxScenario {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    baseline: r.baseline as string,
    proposedDecision: bi(r.proposed_decision),
    projectedProfit: num(r.projected_profit),
    projectedTaxableIncome: num(r.projected_taxable_income),
    projectedTax: num(r.projected_tax),
    projectedCashFlow: num(r.projected_cash_flow),
    currency: r.currency as FinanceTaxScenario['currency'],
    assumptions: bi(r.assumptions),
    lawVersion: bi(r.law_version),
    enacted: r.enacted as boolean,
    reviewer: r.reviewer as string | undefined,
    reviewedAt: r.reviewed_at as string | undefined,
    status: r.status as FinanceTaxScenario['status'],
    staleReason: r.stale_reason ? bi(r.stale_reason) : undefined,
    disclaimer: bi(r.disclaimer),
  }
}

function mapApproval(r: Record<string, unknown>): FinanceApproval {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    recordType: r.record_type as FinanceApproval['recordType'],
    recordId: r.record_id as string,
    approver: r.approver as string,
    decision: r.decision as FinanceApproval['decision'],
    approvedAmount: num(r.approved_amount),
    approvedCurrency: r.approved_currency as FinanceApproval['approvedCurrency'],
    payeeVersion: r.payee_version as string | undefined,
    rationale: r.rationale ? bi(r.rationale) : undefined,
    decidedAt: r.decided_at as string,
  }
}

function mapAuditEvent(r: Record<string, unknown>): FinanceAuditEvent {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    actor: r.actor as string,
    action: bi(r.action),
    recordType: r.record_type as string,
    recordId: r.record_id as string,
    timestamp: r.timestamp as string,
    outcome: bi(r.outcome),
  }
}

function mapExternalAction(r: Record<string, unknown>): FinanceExternalAction {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    recordType: r.record_type as FinanceExternalAction['recordType'],
    recordId: r.record_id as string,
    status: r.status as FinanceExternalActionStatus,
    payloadVersion: r.payload_version as string,
    idempotencyKey: r.idempotency_key as string,
    providerRef: r.provider_ref as string | undefined,
    confirmedAt: r.confirmed_at as string | undefined,
    notes: r.notes ? bi(r.notes) : undefined,
  }
}

function mapReceipt(r: Record<string, unknown>): FinanceReceipt {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    billId: r.bill_id as string | undefined,
    expenseId: r.expense_id as string | undefined,
    fileName: bi(r.file_name),
    uploadedAt: r.uploaded_at as string,
    reviewed: r.reviewed as boolean,
  }
}

/* ---------- Full state load ---------- */

export async function loadFinanceStateFromSupabase(orgId: string): Promise<FinanceWorkspaceState> {
  if (!supabase) throw new Error('Supabase is not configured')
  const selectAll = async <T>(table: string, mapper: (r: Record<string, unknown>) => T): Promise<T[]> => {
    return fetchAllPages((from, to) =>
      supabase!.from(table).select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).range(from, to),
    ).then((rows) => rows.map((r) => mapper(r as Record<string, unknown>)))
  }

  // Payroll tables are admin-only; non-admins get empty arrays (RLS handles this)
  const [
    entities, books, fiscalPeriods, parties, bankAccounts, ledgerAccounts,
    invoices, bills, credits, receipts, spendRequests, purchaseOrders, expenses,
    subscriptions, journals, bankItems, reconciliations, closePeriods,
    payPeriods, payRuns, payrollLiabilities, budgets, scenarios, forecasts,
    reserveGoals, holdings, debts, taxObligations, taxScenarios,
    approvals, auditEvents, externalActions,
  ] = await Promise.all([
    selectAll(TABLES.entities, mapEntity),
    selectAll(TABLES.books, mapBook),
    selectAll(TABLES.fiscalPeriods, mapFiscalPeriod),
    selectAll(TABLES.parties, mapParty),
    selectAll(TABLES.bankAccounts, mapBankAccount),
    selectAll(TABLES.ledgerAccounts, mapLedgerAccount),
    selectAll(TABLES.invoices, mapInvoice),
    selectAll(TABLES.bills, mapBill),
    selectAll(TABLES.credits, mapCredit),
    selectAll(TABLES.receipts, mapReceipt),
    selectAll(TABLES.spendRequests, mapSpendRequest),
    selectAll(TABLES.purchaseOrders, mapPurchaseOrder),
    selectAll(TABLES.expenses, mapExpense),
    selectAll(TABLES.subscriptions, mapSubscription),
    selectAll(TABLES.journals, mapJournal),
    selectAll(TABLES.bankItems, mapBankItem),
    selectAll(TABLES.reconciliations, mapReconciliation),
    selectAll(TABLES.closePeriods, mapClosePeriod),
    selectAll(TABLES.payPeriods, mapPayPeriod),
    selectAll(TABLES.payRuns, mapPayRun),
    selectAll(TABLES.payrollLiabilities, mapPayrollLiability),
    selectAll(TABLES.budgets, mapBudget),
    selectAll(TABLES.scenarios, mapScenario),
    selectAll(TABLES.forecasts, mapForecast),
    selectAll(TABLES.reserveGoals, mapReserveGoal),
    selectAll(TABLES.holdings, mapHolding),
    selectAll(TABLES.debts, mapDebt),
    selectAll(TABLES.taxObligations, mapTaxObligation),
    selectAll(TABLES.taxScenarios, mapTaxScenario),
    selectAll(TABLES.approvals, mapApproval),
    selectAll(TABLES.auditEvents, mapAuditEvent),
    selectAll(TABLES.externalActions, mapExternalAction),
  ])

  return {
    entities, books, fiscalPeriods, parties, bankAccounts, ledgerAccounts,
    invoices, bills, credits, receipts, spendRequests, purchaseOrders, expenses,
    subscriptions, journals, bankItems, reconciliations, closePeriods,
    payPeriods, payRuns, payrollLiabilities, budgets, scenarios, forecasts,
    reserveGoals, holdings, debts, taxObligations, taxScenarios,
    approvals, auditEvents, externalActions,
  }
}

/* ---------- Closed-period enforcement ---------- */

/**
 * Check whether a book's period is locked. Returns true if the close period
 * status is 'locked' or 'approved' — ordinary edits must be rejected.
 */
export async function isPeriodLocked(orgId: string, bookId: string, periodId: string): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase
    .from(TABLES.closePeriods)
    .select('status')
    .eq('organization_id', orgId)
    .eq('book_id', bookId)
    .eq('period_id', periodId)
    .maybeSingle()
  return data?.status === 'locked' || data?.status === 'approved'
}

/* ---------- Insert helpers ---------- */

export async function insertInvoice(orgId: string, item: Omit<FinanceInvoice, 'id'>): Promise<FinanceInvoice | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.invoices)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      customer_id: item.customerId,
      number: item.number,
      issue_date: item.issueDate,
      due_date: item.dueDate,
      currency: item.currency,
      subtotal: Number(item.subtotal),
      tax_total: Number(item.taxTotal),
      total: Number(item.total),
      paid_amount: Number(item.paidAmount),
      status: item.status,
      project_id: item.projectId,
      source_system: item.sourceSystem,
      notes: item.notes,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapInvoice(data as Record<string, unknown>)
}

export async function insertSpendRequest(orgId: string, item: Omit<FinanceSpendRequest, 'id'>): Promise<FinanceSpendRequest | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.spendRequests)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      requester: item.requester,
      purpose: item.purpose,
      supplier_id: item.supplierId,
      project_id: item.projectId,
      amount: Number(item.amount),
      currency: item.currency,
      evidence_ref: item.evidenceRef,
      status: item.status,
      approver: item.approver,
      approved_at: item.approvedAt,
      approval_version: item.approvalVersion,
      submitted_at: item.submittedAt,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapSpendRequest(data as Record<string, unknown>)
}

export async function updateSpendRequestStatus(
  orgId: string,
  id: string,
  status: FinanceSpendRequest['status'],
  approver?: string,
): Promise<FinanceSpendRequest | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'approved' && approver) {
    patch.approver = approver
    patch.approved_at = new Date().toISOString()
    patch.approval_version = `v${Date.now()}`
  }
  const { data, error } = await supabase
    .from(TABLES.spendRequests)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapSpendRequest(data as Record<string, unknown>)
}

export async function insertJournal(orgId: string, journal: Omit<FinanceJournal, 'id' | 'balanced'>): Promise<FinanceJournal | null> {
  if (!supabase) return null
  const balanced = isJournalBalanced(journal.lines)
  // Unbalanced journals cannot become posted actuals.
  if (journal.status === 'posted' && !balanced) return null
  const { data, error } = await supabase
    .from(TABLES.journals)
    .insert({
      organization_id: orgId,
      book_id: journal.bookId,
      number: journal.number,
      date: journal.date,
      description: journal.description,
      lines: journal.lines,
      currency: journal.currency,
      status: journal.status,
      source: journal.source,
      reversed_by_id: journal.reversedById,
      balanced,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapJournal(data as Record<string, unknown>)
}

export async function updatePayRunStatus(
  orgId: string,
  id: string,
  status: FinancePayRunStatus,
  actor?: string,
): Promise<FinancePayRun | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'inputs_approved' && actor) {
    patch.approved_by = actor
    patch.approved_at = new Date().toISOString()
  }
  if (status === 'submitted') patch.submitted_at = new Date().toISOString()
  if (status === 'reconciled') patch.reconciled_at = new Date().toISOString()
  const { data, error } = await supabase
    .from(TABLES.payRuns)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapPayRun(data as Record<string, unknown>)
}

export async function insertTaxObligation(orgId: string, item: Omit<FinanceTaxObligation, 'id'>): Promise<FinanceTaxObligation | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.taxObligations)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      type: item.type,
      jurisdiction: item.jurisdiction,
      period: item.period,
      due_date: item.dueDate,
      payment_due_date: item.paymentDueDate,
      estimated_amount: Number(item.estimatedAmount),
      confirmed_amount: item.confirmedAmount ? Number(item.confirmedAmount) : null,
      currency: item.currency,
      preparer: item.preparer,
      reviewer: item.reviewer,
      status: item.status,
      evidence_refs: item.evidenceRefs,
      filing_ref: item.filingRef,
      notes: item.notes,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapTaxObligation(data as Record<string, unknown>)
}

export async function updateTaxObligationStatus(
  orgId: string,
  id: string,
  status: FinanceObligationStatus,
  reviewer?: string,
): Promise<FinanceTaxObligation | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'reviewed' && reviewer) patch.reviewer = reviewer
  const { data, error } = await supabase
    .from(TABLES.taxObligations)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapTaxObligation(data as Record<string, unknown>)
}

export async function insertBudget(orgId: string, item: Omit<FinanceBudget, 'id'>): Promise<FinanceBudget | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.budgets)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      label: item.label,
      status: item.status,
      currency: item.currency,
      lines: item.lines,
      owner: item.owner,
      approved_at: item.approvedAt,
      version: item.version,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapBudget(data as Record<string, unknown>)
}

export async function reviseBudgetInSupabase(orgId: string, id: string, lines: FinanceBudget['lines']): Promise<FinanceBudget | null> {
  if (!supabase) return null
  // Fetch current version
  const { data: current } = await supabase
    .from(TABLES.budgets)
    .select('version')
    .eq('organization_id', orgId)
    .eq('id', id)
    .maybeSingle()
  if (!current) return null
  const { data, error } = await supabase
    .from(TABLES.budgets)
    .update({
      lines,
      version: (current.version as number) + 1,
      status: 'revised',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  // Mark scenarios stale
  await supabase
    .from(TABLES.scenarios)
    .update({ status: 'stale', updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .in('status', ['accepted', 'reviewed'])
  return mapBudget(data as Record<string, unknown>)
}

export async function insertTaxScenario(orgId: string, item: Omit<FinanceTaxScenario, 'id'>): Promise<FinanceTaxScenario | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.taxScenarios)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      label: item.label,
      baseline: item.baseline,
      proposed_decision: item.proposedDecision,
      projected_profit: Number(item.projectedProfit),
      projected_taxable_income: Number(item.projectedTaxableIncome),
      projected_tax: Number(item.projectedTax),
      projected_cash_flow: Number(item.projectedCashFlow),
      currency: item.currency,
      assumptions: item.assumptions,
      law_version: item.lawVersion,
      enacted: item.enacted,
      reviewer: item.reviewer,
      reviewed_at: item.reviewedAt,
      status: item.status,
      disclaimer: item.disclaimer,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapTaxScenario(data as Record<string, unknown>)
}

export async function markTaxScenarioStaleInSupabase(orgId: string, id: string, reason: string): Promise<FinanceTaxScenario | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.taxScenarios)
    .update({
      status: 'stale',
      stale_reason: { en: reason, fr: reason },
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapTaxScenario(data as Record<string, unknown>)
}

export async function updateExternalActionStatus(
  orgId: string,
  id: string,
  status: FinanceExternalActionStatus,
): Promise<FinanceExternalAction | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'settled' || status === 'filing_accepted') {
    patch.confirmed_at = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from(TABLES.externalActions)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapExternalAction(data as Record<string, unknown>)
}

/* ---------- Evidence / receipt storage ---------- */

const EVIDENCE_BUCKET = 'finance-evidence'

export function financeEvidencePath(
  organizationId: string,
  entityId: string,
  receiptId: string,
  ext: string,
): string {
  return `${organizationId}/${entityId}/${receiptId}.${ext}`
}

export async function uploadReceiptFile(
  organizationId: string,
  entityId: string,
  receiptId: string,
  file: File,
): Promise<{ storagePath: string; sha256: string; sizeBytes: number }> {
  if (!supabase) throw new Error('Supabase is not configured')
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const storagePath = financeEvidencePath(organizationId, entityId, receiptId, ext)
  const { error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (error) throw error
  // SHA-256 is computed server-side by the edge function in a future phase;
  // for now we record size only.
  return { storagePath, sha256: '', sizeBytes: file.size }
}

export async function createReceiptDownloadUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrl(storagePath, expiresInSeconds)
  if (error) throw error
  if (!data?.signedUrl) throw new Error('Could not create download URL')
  return data.signedUrl
}

export async function insertReceipt(
  orgId: string,
  item: Omit<FinanceReceipt, 'id'> & { storagePath: string; sha256?: string; sizeBytes?: number; contentType?: string },
): Promise<FinanceReceipt | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.receipts)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      bill_id: item.billId,
      expense_id: item.expenseId,
      file_name: item.fileName,
      storage_path: item.storagePath,
      file_sha256: item.sha256 ?? null,
      size_bytes: item.sizeBytes ?? null,
      content_type: item.contentType ?? 'application/octet-stream',
      uploaded_at: item.uploadedAt,
      reviewed: item.reviewed,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapReceipt(data as Record<string, unknown>)
}

export async function markReceiptReviewed(
  orgId: string,
  id: string,
  reviewer: string,
): Promise<FinanceReceipt | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.receipts)
    .update({
      reviewed: true,
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapReceipt(data as Record<string, unknown>)
}

/* ---------- Journal balance check (shared) ---------- */

function isJournalBalanced(lines: FinanceJournalLine[]): boolean {
  const debit = lines.reduce((sum, l) => sum + parseDecimal(l.debit), 0)
  const credit = lines.reduce((sum, l) => sum + parseDecimal(l.credit), 0)
  return Math.abs(debit - credit) < 0.005
}

function parseDecimal(s: string): number {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

export { isJournalBalanced }
