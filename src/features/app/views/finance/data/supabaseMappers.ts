import type { Bi } from '@/i18n/core'
import type {
  FinanceApproval,
  FinanceAuditEvent,
  FinanceBankAccount,
  FinanceBankItem,
  FinanceBill,
  FinanceBook,
  FinanceBudget,
  FinanceCategoryRule,
  FinanceClosePeriod,
  FinanceCredit,
  FinanceDebt,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceFiscalPeriod,
  FinanceForecast,
  FinanceHolding,
  FinanceImportSession,
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

/* ---------- Shared helpers ---------- */

export function bi(value: unknown): Bi {
  if (typeof value === 'object' && value !== null && 'en' in value && 'fr' in value) {
    return value as Bi
  }
  return { en: String(value ?? ''), fr: String(value ?? '') }
}

export function num(value: unknown): string {
  if (value === null || value === undefined) return '0.00'
  return String(value)
}

/* ---------- Row mappers (snake_case → camelCase + JSONB → Bi) ---------- */

export function mapEntity(r: Record<string, unknown>): FinanceLegalEntity {
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

export function mapBook(r: Record<string, unknown>): FinanceBook {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: bi(r.label),
    basis: r.basis as FinanceBook['basis'],
    authoritativeSource: bi(r.authoritative_source),
    lastSyncedAt: r.last_synced_at as string | undefined,
  }
}

export function mapFiscalPeriod(r: Record<string, unknown>): FinanceFiscalPeriod {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    label: r.label as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    status: r.status as FinanceFiscalPeriod['status'],
  }
}

export function mapParty(r: Record<string, unknown>): FinanceParty {
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

export function mapBankAccount(r: Record<string, unknown>): FinanceBankAccount {
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

export function mapLedgerAccount(r: Record<string, unknown>): FinanceLedgerAccount {
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

export function mapInvoice(r: Record<string, unknown>): FinanceInvoice {
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

export function mapBill(r: Record<string, unknown>): FinanceBill {
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

export function mapCredit(r: Record<string, unknown>): FinanceCredit {
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

export function mapSpendRequest(r: Record<string, unknown>): FinanceSpendRequest {
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

export function mapPurchaseOrder(r: Record<string, unknown>): FinancePurchaseOrder {
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

export function mapExpense(r: Record<string, unknown>): FinanceWorkspaceState['expenses'][number] {
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

export function mapSubscription(r: Record<string, unknown>): FinanceSubscription {
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

export function mapJournal(r: Record<string, unknown>): FinanceJournal {
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

export function mapBankItem(r: Record<string, unknown>): FinanceBankItem {
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
    importSessionId: r.import_session_id as string | undefined,
  }
}

export function mapReconciliation(r: Record<string, unknown>): FinanceReconciliation {
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

export function mapClosePeriod(r: Record<string, unknown>): FinanceClosePeriod {
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

export function mapPayPeriod(r: Record<string, unknown>): FinancePayPeriod {
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

export function mapPayRun(r: Record<string, unknown>): FinancePayRun {
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

export function mapPayrollLiability(r: Record<string, unknown>): FinancePayrollLiability {
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

export function mapBudget(r: Record<string, unknown>): FinanceBudget {
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

export function mapScenario(r: Record<string, unknown>): FinanceScenario {
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

export function mapForecast(r: Record<string, unknown>): FinanceForecast {
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

export function mapReserveGoal(r: Record<string, unknown>): FinanceReserveGoal {
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

export function mapHolding(r: Record<string, unknown>): FinanceHolding {
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

export function mapDebt(r: Record<string, unknown>): FinanceDebt {
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

export function mapTaxObligation(r: Record<string, unknown>): FinanceTaxObligation {
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

export function mapTaxScenario(r: Record<string, unknown>): FinanceTaxScenario {
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

export function mapApproval(r: Record<string, unknown>): FinanceApproval {
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

export function mapAuditEvent(r: Record<string, unknown>): FinanceAuditEvent {
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

export function mapCategoryRule(r: Record<string, unknown>): FinanceCategoryRule {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    pattern: r.pattern as string,
    matchType: r.match_type as FinanceCategoryRule['matchType'],
    ledgerAccountId: r.ledger_account_id as string,
    direction: r.direction as FinanceCategoryRule['direction'],
    priority: r.priority as number,
    active: r.active as boolean,
  }
}

export function mapImportSession(r: Record<string, unknown>): FinanceImportSession {
  return {
    id: r.id as string,
    entityId: r.entity_id as string,
    bankAccountId: r.bank_account_id as string,
    fileName: r.file_name as string,
    importedAt: r.imported_at as string,
    totalRows: r.total_rows as number,
    newItems: r.new_items as number,
    duplicates: r.duplicates as number,
    errors: r.errors as number,
    errorDetails: (r.error_details as import('./types').FinanceImportRowError[] | undefined) ?? undefined,
    status: r.status as FinanceImportSession['status'],
  }
}

export function mapExternalAction(r: Record<string, unknown>): FinanceExternalAction {
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

export function mapReceipt(r: Record<string, unknown>): FinanceReceipt {
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
