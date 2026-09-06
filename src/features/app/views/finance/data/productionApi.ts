import { initialFinanceState } from './fixtures'
import type {
  FinanceBankItem,
  FinanceBankMatchStatus,
  FinanceBill,
  FinanceBudget,
  FinanceClosePeriod,
  FinanceExpenseStatus,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinanceJournal,
  FinanceJournalLine,
  FinanceJournalStatus,
  FinanceObligationStatus,
  FinancePayRun,
  FinancePayRunStatus,
  FinancePayrollLiability,
  FinanceReconciliation,
  FinanceSpendRequest,
  FinanceTaxObligation,
  FinanceTaxScenario,
  FinanceWorkspaceState,
} from './types'

/**
 * In-browser persistence stub for the finance workspace in production mode.
 * This keeps the Phase 1 implementation self-contained (no migration needed)
 * while preserving the demo/production split. A later phase swaps this for a
 * Supabase-backed API.
 */

const storageKey = (orgId: string) => `dutiva_finance_state_${orgId}`

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function loadFinanceState(orgId: string): FinanceWorkspaceState {
  try {
    if (!hasStorage()) return clone(initialFinanceState)
    const raw = localStorage.getItem(storageKey(orgId))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FinanceWorkspaceState>
      return {
        entities: parsed.entities ?? initialFinanceState.entities,
        books: parsed.books ?? initialFinanceState.books,
        fiscalPeriods: parsed.fiscalPeriods ?? initialFinanceState.fiscalPeriods,
        parties: parsed.parties ?? initialFinanceState.parties,
        bankAccounts: parsed.bankAccounts ?? initialFinanceState.bankAccounts,
        ledgerAccounts: parsed.ledgerAccounts ?? initialFinanceState.ledgerAccounts,
        invoices: parsed.invoices ?? initialFinanceState.invoices,
        bills: parsed.bills ?? initialFinanceState.bills,
        credits: parsed.credits ?? initialFinanceState.credits,
        receipts: parsed.receipts ?? initialFinanceState.receipts,
        spendRequests: parsed.spendRequests ?? initialFinanceState.spendRequests,
        purchaseOrders: parsed.purchaseOrders ?? initialFinanceState.purchaseOrders,
        expenses: parsed.expenses ?? initialFinanceState.expenses,
        subscriptions: parsed.subscriptions ?? initialFinanceState.subscriptions,
        journals: parsed.journals ?? initialFinanceState.journals,
        bankItems: parsed.bankItems ?? initialFinanceState.bankItems,
        reconciliations: parsed.reconciliations ?? initialFinanceState.reconciliations,
        closePeriods: parsed.closePeriods ?? initialFinanceState.closePeriods,
        payPeriods: parsed.payPeriods ?? initialFinanceState.payPeriods,
        payRuns: parsed.payRuns ?? initialFinanceState.payRuns,
        payrollLiabilities: parsed.payrollLiabilities ?? initialFinanceState.payrollLiabilities,
        budgets: parsed.budgets ?? initialFinanceState.budgets,
        scenarios: parsed.scenarios ?? initialFinanceState.scenarios,
        forecasts: parsed.forecasts ?? initialFinanceState.forecasts,
        reserveGoals: parsed.reserveGoals ?? initialFinanceState.reserveGoals,
        holdings: parsed.holdings ?? initialFinanceState.holdings,
        debts: parsed.debts ?? initialFinanceState.debts,
        taxObligations: parsed.taxObligations ?? initialFinanceState.taxObligations,
        taxScenarios: parsed.taxScenarios ?? initialFinanceState.taxScenarios,
        approvals: parsed.approvals ?? initialFinanceState.approvals,
        auditEvents: parsed.auditEvents ?? initialFinanceState.auditEvents,
        externalActions: parsed.externalActions ?? initialFinanceState.externalActions,
      }
    }
  } catch {
    // fall through to fixture seed
  }
  return clone(initialFinanceState)
}

function saveFinanceState(orgId: string, state: FinanceWorkspaceState): void {
  if (!hasStorage()) return
  localStorage.setItem(storageKey(orgId), JSON.stringify(state))
}

function updateState(
  orgId: string,
  patch: (state: FinanceWorkspaceState) => FinanceWorkspaceState,
): FinanceWorkspaceState {
  const next = patch(clone(loadFinanceState(orgId)))
  saveFinanceState(orgId, next)
  return next
}

export function loadFullState(orgId: string): FinanceWorkspaceState {
  return loadFinanceState(orgId)
}

/* ---------- Spend request lifecycle ---------- */

const SPEND_TRANSITIONS: Record<FinanceSpendRequest['status'], FinanceSpendRequest['status'][]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'rejected', 'cancelled'],
  approved: ['committed', 'cancelled'],
  rejected: [],
  committed: [],
  cancelled: [],
}

export function transitionSpendRequestStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceSpendRequest['status'],
  approver?: string,
): FinanceSpendRequest | null {
  let result: FinanceSpendRequest | null = null
  updateState(orgId, (state) => ({
    ...state,
    spendRequests: state.spendRequests.map((sr) => {
      if (sr.id !== id) return sr
      const allowed = SPEND_TRANSITIONS[sr.status]
      if (!allowed.includes(nextStatus)) return sr
      result = {
        ...sr,
        status: nextStatus,
        ...(nextStatus === 'approved' && approver
          ? { approver, approvedAt: new Date().toISOString(), approvalVersion: `v${Date.now()}` }
          : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- Journal balance check ---------- */

export function isJournalBalanced(lines: FinanceJournalLine[]): boolean {
  const debit = lines.reduce((sum, l) => sum + parseDecimal(l.debit), 0)
  const credit = lines.reduce((sum, l) => sum + parseDecimal(l.credit), 0)
  return Math.abs(debit - credit) < 0.005
}

function parseDecimal(s: string): number {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

export function addJournal(
  orgId: string,
  journal: Omit<FinanceJournal, 'id' | 'balanced'>,
): FinanceJournal | null {
  const created: FinanceJournal = {
    ...journal,
    id: `jrnl-${Date.now()}`,
    balanced: isJournalBalanced(journal.lines),
  }
  // Unbalanced journals cannot become posted actuals.
  if (created.status === 'posted' && !created.balanced) return null
  updateState(orgId, (state) => ({ ...state, journals: [created, ...state.journals] }))
  return created
}

/* ---------- Pay run lifecycle ---------- */

const PAY_RUN_TRANSITIONS: Record<FinancePayRunStatus, FinancePayRunStatus[]> = {
  inputs_open: ['inputs_approved', 'cancelled' as FinancePayRunStatus],
  inputs_approved: ['submitted', 'inputs_open'],
  submitted: ['results_imported', 'inputs_approved'],
  results_imported: ['reconciled', 'exception', 'results_imported'],
  reconciled: [],
  exception: ['results_imported', 'reconciled'],
}

export function transitionPayRunStatus(
  orgId: string,
  id: string,
  nextStatus: FinancePayRunStatus,
  actor?: string,
): FinancePayRun | null {
  let result: FinancePayRun | null = null
  updateState(orgId, (state) => ({
    ...state,
    payRuns: state.payRuns.map((pr) => {
      if (pr.id !== id) return pr
      const allowed = PAY_RUN_TRANSITIONS[pr.status]
      if (!allowed.includes(nextStatus)) return pr
      result = {
        ...pr,
        status: nextStatus,
        ...(nextStatus === 'inputs_approved' && actor ? { approvedBy: actor, approvedAt: new Date().toISOString() } : {}),
        ...(nextStatus === 'submitted' ? { submittedAt: new Date().toISOString() } : {}),
        ...(nextStatus === 'reconciled' ? { reconciledAt: new Date().toISOString() } : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- Payroll liability settlement ---------- */

export function settlePayrollLiability(orgId: string, id: string): FinancePayrollLiability | null {
  let result: FinancePayrollLiability | null = null
  updateState(orgId, (state) => ({
    ...state,
    payrollLiabilities: state.payrollLiabilities.map((liab): FinancePayrollLiability => {
      if (liab.id !== id) return liab
      if (liab.settled) return liab
      result = { ...liab, settled: true, settledAt: new Date().toISOString() }
      return result
    }),
  }))
  return result
}

/* ---------- Tax obligation lifecycle ---------- */

const OBLIGATION_TRANSITIONS: Record<FinanceObligationStatus, FinanceObligationStatus[]> = {
  planned: ['in_preparation', 'withdrawn'],
  in_preparation: ['reviewed', 'planned'],
  reviewed: ['filed', 'in_preparation'],
  filed: ['paid', 'reviewed'],
  paid: ['confirmed', 'filed'],
  confirmed: [],
  overdue: ['in_preparation', 'filed'],
  withdrawn: ['planned'],
}

export function transitionObligationStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceObligationStatus,
  actor?: string,
): FinanceTaxObligation | null {
  let result: FinanceTaxObligation | null = null
  updateState(orgId, (state) => ({
    ...state,
    taxObligations: state.taxObligations.map((ob) => {
      if (ob.id !== id) return ob
      const allowed = OBLIGATION_TRANSITIONS[ob.status]
      if (!allowed.includes(nextStatus)) return ob
      result = {
        ...ob,
        status: nextStatus,
        ...(nextStatus === 'reviewed' && actor ? { reviewer: actor } : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- External action lifecycle ---------- */

const EXTERNAL_TRANSITIONS: Record<FinanceExternalActionStatus, FinanceExternalActionStatus[]> = {
  internal_approval: ['export_prepared'],
  export_prepared: ['provider_accepted', 'failed', 'returned'],
  provider_accepted: ['settled', 'filing_accepted', 'failed', 'returned', 'unknown'],
  settled: [],
  filing_accepted: [],
  failed: ['export_prepared', 'unknown'],
  returned: ['export_prepared'],
  unknown: ['settled', 'filing_accepted', 'failed', 'returned'],
}

export function transitionExternalActionStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceExternalActionStatus,
): FinanceExternalAction | null {
  let result: FinanceExternalAction | null = null
  updateState(orgId, (state) => ({
    ...state,
    externalActions: state.externalActions.map((ea) => {
      if (ea.id !== id) return ea
      const allowed = EXTERNAL_TRANSITIONS[ea.status]
      if (!allowed.includes(nextStatus)) return ea
      result = {
        ...ea,
        status: nextStatus,
        ...(nextStatus === 'settled' || nextStatus === 'filing_accepted'
          ? { confirmedAt: new Date().toISOString() }
          : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- Budget versioning ---------- */

export function reviseBudget(orgId: string, id: string, lines: FinanceBudget['lines']): FinanceBudget | null {
  let result: FinanceBudget | null = null
  updateState(orgId, (state) => ({
    ...state,
    budgets: state.budgets.map((b) => {
      if (b.id !== id) return b
      // Material change invalidates affected approvals and makes downstream plans visibly stale.
      result = { ...b, lines, version: b.version + 1, status: 'revised' }
      return result
    }),
    // Mark scenarios as stale when the budget they reference is revised.
    scenarios: state.scenarios.map((s) =>
      s.status === 'accepted' || s.status === 'reviewed' ? { ...s, status: 'stale' as const } : s,
    ),
  }))
  return result
}

/* ---------- Tax scenario staleness ---------- */

export function markTaxScenarioStale(orgId: string, id: string, reason: string): FinanceTaxScenario | null {
  let result: FinanceTaxScenario | null = null
  updateState(orgId, (state) => ({
    ...state,
    taxScenarios: state.taxScenarios.map((ts): FinanceTaxScenario => {
      if (ts.id !== id) return ts
      result = { ...ts, status: 'stale', staleReason: { en: reason, fr: reason } }
      return result
    }),
  }))
  return result
}

/* ---------- Tax scenario status transitions ---------- */

const TAX_SCENARIO_TRANSITIONS: Record<FinanceTaxScenario['status'], FinanceTaxScenario['status'][]> = {
  draft: ['reviewed'],
  reviewed: ['accepted', 'draft'],
  accepted: [],
  stale: [],
}

export function transitionTaxScenarioStatus(
  orgId: string,
  id: string,
  status: FinanceTaxScenario['status'],
  reviewer?: string,
): FinanceTaxScenario | null {
  let result: FinanceTaxScenario | null = null
  updateState(orgId, (state) => ({
    ...state,
    taxScenarios: state.taxScenarios.map((ts): FinanceTaxScenario => {
      if (ts.id !== id) return ts
      if (!TAX_SCENARIO_TRANSITIONS[ts.status]?.includes(status)) return ts
      result = {
        ...ts,
        status,
        reviewer: reviewer ?? ts.reviewer,
        reviewedAt: status === 'reviewed' || status === 'accepted' ? new Date().toISOString() : ts.reviewedAt,
      }
      return result
    }),
  }))
  return result
}

/* ---------- Generic CRUD helpers ---------- */

export function addInvoice(orgId: string, invoice: Omit<FinanceInvoice, 'id'>): FinanceInvoice {
  const created: FinanceInvoice = { ...invoice, id: `inv-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, invoices: [created, ...state.invoices] }))
  return created
}

export function addSpendRequest(orgId: string, req: Omit<FinanceSpendRequest, 'id'>): FinanceSpendRequest {
  const created: FinanceSpendRequest = { ...req, id: `sr-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, spendRequests: [created, ...state.spendRequests] }))
  return created
}

export function addTaxObligation(orgId: string, ob: Omit<FinanceTaxObligation, 'id'>): FinanceTaxObligation {
  const created: FinanceTaxObligation = { ...ob, id: `tax-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, taxObligations: [created, ...state.taxObligations] }))
  return created
}

export function addBudget(orgId: string, budget: Omit<FinanceBudget, 'id'>): FinanceBudget {
  const created: FinanceBudget = { ...budget, id: `bud-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, budgets: [created, ...state.budgets] }))
  return created
}

export function addTaxScenario(orgId: string, ts: Omit<FinanceTaxScenario, 'id'>): FinanceTaxScenario {
  const created: FinanceTaxScenario = { ...ts, id: `taxscn-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, taxScenarios: [created, ...state.taxScenarios] }))
  return created
}

/* ---------- Invoice lifecycle ---------- */

const INVOICE_TRANSITIONS: Record<FinanceInvoiceStatus, FinanceInvoiceStatus[]> = {
  draft: ['issued', 'cancelled'],
  issued: ['partial', 'paid', 'disputed', 'overdue', 'cancelled'],
  partial: ['paid', 'disputed', 'cancelled'],
  paid: [],
  overdue: ['paid', 'disputed', 'cancelled'],
  disputed: ['issued', 'written_off', 'cancelled'],
  written_off: [],
  cancelled: [],
}

export function transitionInvoiceStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceInvoiceStatus,
  paidAmount?: string,
): FinanceInvoice | null {
  let result: FinanceInvoice | null = null
  updateState(orgId, (state) => ({
    ...state,
    invoices: state.invoices.map((inv) => {
      if (inv.id !== id) return inv
      const allowed = INVOICE_TRANSITIONS[inv.status]
      if (!allowed.includes(nextStatus)) return inv
      result = {
        ...inv,
        status: nextStatus,
        ...(paidAmount !== undefined ? { paidAmount } : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- Bill lifecycle ---------- */

const BILL_TRANSITIONS: Record<FinanceBill['status'], FinanceBill['status'][]> = {
  draft: ['posted', 'cancelled'],
  posted: ['partial', 'paid', 'overdue', 'disputed', 'cancelled'],
  partial: ['paid', 'disputed', 'cancelled'],
  paid: [],
  overdue: ['paid', 'disputed', 'cancelled'],
  disputed: ['posted', 'cancelled'],
  cancelled: [],
}

export function transitionBillStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceBill['status'],
  paidAmount?: string,
): FinanceBill | null {
  let result: FinanceBill | null = null
  updateState(orgId, (state) => ({
    ...state,
    bills: state.bills.map((bill) => {
      if (bill.id !== id) return bill
      const allowed = BILL_TRANSITIONS[bill.status]
      if (!allowed.includes(nextStatus)) return bill
      result = {
        ...bill,
        status: nextStatus,
        ...(paidAmount !== undefined ? { paidAmount } : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- Journal lifecycle ---------- */

const JOURNAL_TRANSITIONS: Record<FinanceJournalStatus, FinanceJournalStatus[]> = {
  draft: ['posted'],
  posted: ['reversed'],
  reversed: [],
}

export function transitionJournalStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceJournalStatus,
): FinanceJournal | null {
  let result: FinanceJournal | null = null
  updateState(orgId, (state) => ({
    ...state,
    journals: state.journals.map((j) => {
      if (j.id !== id) return j
      const allowed = JOURNAL_TRANSITIONS[j.status]
      if (!allowed.includes(nextStatus)) return j
      // Unbalanced journals cannot become posted actuals.
      if (nextStatus === 'posted' && !j.balanced) return j
      result = { ...j, status: nextStatus }
      return result
    }),
  }))
  return result
}

/* ---------- Bank item matching ---------- */

export function transitionBankItemMatchStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceBankMatchStatus,
  matchRef?: { journalId?: string; invoiceId?: string; billId?: string },
): FinanceBankItem | null {
  let result: FinanceBankItem | null = null
  updateState(orgId, (state) => ({
    ...state,
    bankItems: state.bankItems.map((bi) => {
      if (bi.id !== id) return bi
      result = {
        ...bi,
        matchStatus: nextStatus,
        ...(matchRef?.journalId ? { matchedJournalId: matchRef.journalId } : {}),
        ...(matchRef?.invoiceId ? { matchedInvoiceId: matchRef.invoiceId } : {}),
        ...(matchRef?.billId ? { matchedBillId: matchRef.billId } : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- Reconciliation lifecycle ---------- */

export function transitionReconciliationStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceReconciliation['status'],
  reviewer?: string,
): FinanceReconciliation | null {
  let result: FinanceReconciliation | null = null
  updateState(orgId, (state) => ({
    ...state,
    reconciliations: state.reconciliations.map((rec) => {
      if (rec.id !== id) return rec
      result = {
        ...rec,
        status: nextStatus,
        ...(nextStatus === 'reconciled' && reviewer
          ? { reviewer, reviewedAt: new Date().toISOString() }
          : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- Close period lifecycle ---------- */

const CLOSE_PERIOD_TRANSITIONS: Record<FinanceClosePeriod['status'], FinanceClosePeriod['status'][]> = {
  open: ['in_review'],
  in_review: ['approved', 'open'],
  approved: ['locked', 'open'],
  locked: ['open'],
}

export function transitionClosePeriodStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceClosePeriod['status'],
  approver?: string,
  reopenReason?: string,
): FinanceClosePeriod | null {
  let result: FinanceClosePeriod | null = null
  updateState(orgId, (state) => ({
    ...state,
    closePeriods: state.closePeriods.map((cp) => {
      if (cp.id !== id) return cp
      const allowed = CLOSE_PERIOD_TRANSITIONS[cp.status]
      if (!allowed.includes(nextStatus)) return cp
      result = {
        ...cp,
        status: nextStatus,
        ...(nextStatus === 'approved' && approver
          ? { approver, approvedAt: new Date().toISOString() }
          : {}),
        ...(nextStatus === 'open' && reopenReason
          ? { reopenReason: { en: reopenReason, fr: reopenReason } }
          : {}),
      }
      return result
    }),
  }))
  return result
}

/* ---------- Expense lifecycle ---------- */

const EXPENSE_TRANSITIONS: Record<FinanceExpenseStatus, FinanceExpenseStatus[]> = {
  draft: ['submitted', 'cancelled' as FinanceExpenseStatus],
  submitted: ['approved', 'rejected'],
  approved: ['reimbursed'],
  reimbursed: [],
  rejected: [],
}

export function transitionExpenseStatus(
  orgId: string,
  id: string,
  nextStatus: FinanceExpenseStatus,
): FinanceWorkspaceState['expenses'][number] | null {
  let result: FinanceWorkspaceState['expenses'][number] | null = null
  updateState(orgId, (state) => ({
    ...state,
    expenses: state.expenses.map((ex) => {
      if (ex.id !== id) return ex
      const allowed = EXPENSE_TRANSITIONS[ex.status]
      if (!allowed.includes(nextStatus)) return ex
      result = { ...ex, status: nextStatus }
      return result
    }),
  }))
  return result
}

/* ---------- Deadline helpers ---------- */

export type DeadlineState = 'none' | 'ok' | 'due_soon' | 'overdue'

export function deadlineState(dueDate: string | undefined, soonDays = 7): DeadlineState {
  if (!dueDate) return 'none'
  const now = new Date()
  const due = new Date(dueDate + 'T23:59:59Z')
  const soonCutoff = new Date(now.getTime() + soonDays * 24 * 60 * 60 * 1000)
  if (due < now) return 'overdue'
  if (due <= soonCutoff) return 'due_soon'
  return 'ok'
}
