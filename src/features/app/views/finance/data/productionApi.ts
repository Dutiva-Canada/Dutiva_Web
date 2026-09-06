import { initialFinanceState } from './fixtures'
import { DEFAULT_CATEGORY_RULES, DEFAULT_ENTITY, DEFAULT_LEDGER_ACCOUNTS, DEFAULT_BOOK } from './defaultCategoryRules'
import type {
  FinanceBankAccount,
  FinanceBook,
  FinanceBudget,
  FinanceCategoryRule,
  FinanceCurrency,
  FinanceDebt,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceForecast,
  FinanceHolding,
  FinanceImportRowError,
  FinanceImportSession,
  FinanceInvoice,
  FinanceJournal,
  FinanceJournalLine,
  FinanceLedgerAccount,
  FinanceLegalEntity,
  FinanceObligationStatus,
  FinanceParty,
  FinancePayRun,
  FinancePayRunStatus,
  FinancePayrollLiability,
  FinanceReserveGoal,
  FinanceScenario,
  FinanceSpendRequest,
  FinanceSubscription,
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
        categoryRules: parsed.categoryRules ?? initialFinanceState.categoryRules,
        importSessions: parsed.importSessions ?? initialFinanceState.importSessions,
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

export function updateState(
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

export function addScenario(orgId: string, scn: Omit<FinanceScenario, 'id'>): FinanceScenario {
  const created: FinanceScenario = { ...scn, id: `scn-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, scenarios: [created, ...state.scenarios] }))
  return created
}

export function addForecast(orgId: string, fc: Omit<FinanceForecast, 'id'>): FinanceForecast {
  const created: FinanceForecast = { ...fc, id: `fc-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, forecasts: [created, ...state.forecasts] }))
  return created
}

export function addReserveGoal(orgId: string, rg: Omit<FinanceReserveGoal, 'id'>): FinanceReserveGoal {
  const created: FinanceReserveGoal = { ...rg, id: `rg-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, reserveGoals: [created, ...state.reserveGoals] }))
  return created
}

/* ---------- Budget status transitions ---------- */

const BUDGET_TRANSITIONS: Record<FinanceBudget['status'], FinanceBudget['status'][]> = {
  draft: ['approved', 'archived'],
  approved: ['revised', 'archived'],
  revised: ['approved', 'archived'],
  archived: [],
}

export function transitionBudgetStatus(
  orgId: string,
  id: string,
  status: FinanceBudget['status'],
): FinanceBudget | null {
  let result: FinanceBudget | null = null
  updateState(orgId, (state) => ({
    ...state,
    budgets: state.budgets.map((bud): FinanceBudget => {
      if (bud.id !== id) return bud
      if (!BUDGET_TRANSITIONS[bud.status]?.includes(status)) return bud
      result = {
        ...bud,
        status,
        version: status === 'revised' ? bud.version + 1 : bud.version,
        approvedAt: status === 'approved' ? new Date().toISOString() : bud.approvedAt,
      }
      return result
    }),
  }))
  return result
}

/* ---------- Scenario status transitions ---------- */

const SCENARIO_TRANSITIONS: Record<FinanceScenario['status'], FinanceScenario['status'][]> = {
  draft: ['reviewed'],
  reviewed: ['accepted', 'draft'],
  accepted: [],
  stale: [],
}

export function transitionScenarioStatus(
  orgId: string,
  id: string,
  status: FinanceScenario['status'],
  reviewer?: string,
): FinanceScenario | null {
  let result: FinanceScenario | null = null
  updateState(orgId, (state) => ({
    ...state,
    scenarios: state.scenarios.map((scn): FinanceScenario => {
      if (scn.id !== id) return scn
      if (!SCENARIO_TRANSITIONS[scn.status]?.includes(status)) return scn
      result = {
        ...scn,
        status,
        reviewer: reviewer ?? scn.reviewer,
        reviewedAt: status === 'reviewed' || status === 'accepted' ? new Date().toISOString() : scn.reviewedAt,
      }
      return result
    }),
  }))
  return result
}

/* ---------- Reserve goal progress update ---------- */

export function updateReserveGoalProgress(orgId: string, id: string, currentAmount: string): FinanceReserveGoal | null {
  let result: FinanceReserveGoal | null = null
  updateState(orgId, (state) => ({
    ...state,
    reserveGoals: state.reserveGoals.map((rg): FinanceReserveGoal => {
      if (rg.id !== id) return rg
      result = { ...rg, currentAmount }
      return result
    }),
  }))
  return result
}

/* ---------- Holding staleness toggle ---------- */

export function setHoldingStale(orgId: string, id: string, stale: boolean): FinanceHolding | null {
  let result: FinanceHolding | null = null
  updateState(orgId, (state) => ({
    ...state,
    holdings: state.holdings.map((h): FinanceHolding => {
      if (h.id !== id) return h
      result = { ...h, stale }
      return result
    }),
  }))
  return result
}

/* ---------- Debt status transitions ---------- */

const DEBT_TRANSITIONS: Record<FinanceDebt['status'], FinanceDebt['status'][]> = {
  active: ['paid_off', 'defaulted'],
  paid_off: [],
  defaulted: [],
}

export function transitionDebtStatus(orgId: string, id: string, status: FinanceDebt['status']): FinanceDebt | null {
  let result: FinanceDebt | null = null
  updateState(orgId, (state) => ({
    ...state,
    debts: state.debts.map((d): FinanceDebt => {
      if (d.id !== id) return d
      if (!DEBT_TRANSITIONS[d.status]?.includes(status)) return d
      result = { ...d, status }
      return result
    }),
  }))
  return result
}

/* ---------- Forecast freeze ---------- */

export function freezeForecast(orgId: string, id: string): FinanceForecast | null {
  let result: FinanceForecast | null = null
  updateState(orgId, (state) => ({
    ...state,
    forecasts: state.forecasts.map((fc): FinanceForecast => {
      if (fc.id !== id) return fc
      if (fc.frozenAt) return fc
      result = { ...fc, frozenAt: new Date().toISOString() }
      return result
    }),
  }))
  return result
}

export function addTaxScenario(orgId: string, ts: Omit<FinanceTaxScenario, 'id'>): FinanceTaxScenario {
  const created: FinanceTaxScenario = { ...ts, id: `taxscn-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, taxScenarios: [created, ...state.taxScenarios] }))
  return created
}

export function addExternalAction(orgId: string, ea: Omit<FinanceExternalAction, 'id'>): FinanceExternalAction {
  const created: FinanceExternalAction = { ...ea, id: `ea-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, externalActions: [created, ...state.externalActions] }))
  return created
}

export function addEntity(orgId: string, item: Omit<FinanceLegalEntity, 'id'>): FinanceLegalEntity {
  const created: FinanceLegalEntity = { ...item, id: `ent-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, entities: [...state.entities, created] }))
  return created
}

export function updateEntity(orgId: string, id: string, patch: Partial<Omit<FinanceLegalEntity, 'id'>>): FinanceLegalEntity | null {
  let result: FinanceLegalEntity | null = null
  updateState(orgId, (state) => ({
    ...state,
    entities: state.entities.map((ent): FinanceLegalEntity => {
      if (ent.id !== id) return ent
      result = { ...ent, ...patch }
      return result
    }),
  }))
  return result
}

export function removeEntity(orgId: string, id: string): boolean {
  let removed = false
  updateState(orgId, (state) => {
    const next = state.entities.filter((ent) => ent.id !== id)
    removed = next.length !== state.entities.length
    return { ...state, entities: next }
  })
  return removed
}

export function addBankAccount(orgId: string, acc: Omit<FinanceBankAccount, 'id'>): FinanceBankAccount {
  const created: FinanceBankAccount = { ...acc, id: `ba-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, bankAccounts: [...state.bankAccounts, created] }))
  return created
}

export function addLedgerAccount(orgId: string, acc: Omit<FinanceLedgerAccount, 'id'>): FinanceLedgerAccount {
  const created: FinanceLedgerAccount = { ...acc, id: `la-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, ledgerAccounts: [...state.ledgerAccounts, created] }))
  return created
}

export function addParty(orgId: string, party: Omit<FinanceParty, 'id'>): FinanceParty {
  const created: FinanceParty = { ...party, id: `pty-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, parties: [...state.parties, created] }))
  return created
}

export function addSubscription(orgId: string, sub: Omit<FinanceSubscription, 'id'>): FinanceSubscription {
  const created: FinanceSubscription = { ...sub, id: `sub-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, subscriptions: [...state.subscriptions, created] }))
  return created
}

export function updateForecastPeriods(orgId: string, id: string, periods: FinanceForecast['periods']): FinanceForecast | null {
  let result: FinanceForecast | null = null
  updateState(orgId, (state) => ({
    ...state,
    forecasts: state.forecasts.map((fc): FinanceForecast => {
      if (fc.id !== id) return fc
      if (fc.frozenAt) return fc
      result = { ...fc, periods }
      return result
    }),
  }))
  return result
}

/* ---------- Lifecycle transitions (re-exported from productionLifecycle) ---------- */
export {
  transitionInvoiceStatus,
  transitionBillStatus,
  transitionJournalStatus,
  transitionBankItemMatchStatus,
  transitionReconciliationStatus,
  transitionClosePeriodStatus,
  transitionExpenseStatus,
} from './productionLifecycle'

/* ---------- Statement import and category rules ---------- */

import { parseStatementCSV, rowsToBankItems } from './statementParser'
import { autoCategorize, applySuggestions } from './autoCategorize'

export function importBankStatement(
  orgId: string,
  bankAccountId: string,
  fileName: string,
  fileContent: string,
): { newItems: number; duplicates: number; errors: number; errorDetails: FinanceImportRowError[] } | null {
  const state = loadFinanceState(orgId)
  const bankAccount = state.bankAccounts.find((ba) => ba.id === bankAccountId)
  if (!bankAccount) return null
  const currency: FinanceCurrency = bankAccount.currency

  const sessionId = `imp-${Date.now()}`

  const parsed = parseStatementCSV(fileContent, currency)
  const { newItems, duplicates, errors } = rowsToBankItems(
    parsed.rows,
    bankAccountId,
    currency,
    state.bankItems,
    sessionId,
  )

  const errorDetails = parsed.errorDetails

  if (newItems.length === 0) {
    const session: FinanceImportSession = {
      id: sessionId,
      entityId: state.entities[0]?.id ?? orgId,
      bankAccountId,
      fileName,
      importedAt: new Date().toISOString(),
      totalRows: parsed.totalRows,
      newItems: 0,
      duplicates,
      errors,
      status: 'imported',
      errorDetails,
    }

    const nextState: FinanceWorkspaceState = {
      ...state,
      importSessions: [session, ...state.importSessions],
    }
    saveFinanceState(orgId, nextState)
    return { newItems: 0, duplicates, errors, errorDetails }
  }

  const session: FinanceImportSession = {
    id: sessionId,
    entityId: state.entities[0]?.id ?? orgId,
    bankAccountId,
    fileName,
    importedAt: new Date().toISOString(),
    totalRows: parsed.totalRows,
    newItems: newItems.length,
    duplicates,
    errors,
    status: 'imported',
    errorDetails,
  }

  const nextState: FinanceWorkspaceState = {
    ...state,
    bankItems: [...state.bankItems, ...newItems],
    importSessions: [session, ...state.importSessions],
  }
  saveFinanceState(orgId, nextState)
  return { newItems: newItems.length, duplicates, errors, errorDetails }
}

export function addCategoryRule(
  orgId: string,
  rule: Omit<FinanceCategoryRule, 'id'>,
): FinanceCategoryRule {
  const newRule: FinanceCategoryRule = { ...rule, id: `cat-rule-${Date.now()}` }
  updateState(orgId, (state) => ({
    ...state,
    categoryRules: [...state.categoryRules, newRule],
  }))
  return newRule
}

export function updateCategoryRule(
  orgId: string,
  id: string,
  patch: Partial<FinanceCategoryRule>,
): FinanceCategoryRule | null {
  let result: FinanceCategoryRule | null = null
  updateState(orgId, (state) => ({
    ...state,
    categoryRules: state.categoryRules.map((r) => {
      if (r.id !== id) return r
      result = { ...r, ...patch, id: r.id }
      return result
    }),
  }))
  return result
}

export function removeCategoryRule(orgId: string, id: string): boolean {
  let removed = false
  updateState(orgId, (state) => {
    const next = state.categoryRules.filter((r) => r.id !== id)
    removed = next.length !== state.categoryRules.length
    return { ...state, categoryRules: next }
  })
  return removed
}

export function seedDefaultCategoryRules(orgId: string): number {
  let state = loadFinanceState(orgId)

  if (state.entities.length === 0) {
    addEntity(orgId, DEFAULT_ENTITY)
    state = loadFinanceState(orgId)
  }
  if (state.books.length === 0) {
    const entity = state.entities[0]!
    const newBook: FinanceBook = {
      ...DEFAULT_BOOK,
      id: `book-${Date.now()}`,
      entityId: entity.id,
    }
    updateState(orgId, (s) => ({ ...s, books: [...s.books, newBook] }))
    state = loadFinanceState(orgId)
  }

  const entity = state.entities[0]
  const book = state.books[0]
  if (!entity || !book) return 0

  const nextState = { ...state }
  let addedRules = 0

  for (const defaultAccount of DEFAULT_LEDGER_ACCOUNTS) {
    if (!nextState.ledgerAccounts.some((la) => la.code === defaultAccount.code)) {
      const newAccount: FinanceLedgerAccount = {
        id: `la-${Date.now()}-${defaultAccount.code}`,
        bookId: book.id,
        code: defaultAccount.code,
        name: defaultAccount.name,
        type: defaultAccount.type,
        sensitive: defaultAccount.sensitive ?? false,
        active: true,
      }
      nextState.ledgerAccounts = [...nextState.ledgerAccounts, newAccount]
    }
  }

  const accountByCode = new Map(nextState.ledgerAccounts.map((la) => [la.code, la]))

  for (const defaultRule of DEFAULT_CATEGORY_RULES) {
    const existing = nextState.categoryRules.some(
      (r) => r.pattern.toUpperCase() === defaultRule.pattern.toUpperCase() && r.entityId === entity.id,
    )
    if (existing) continue
    const account = accountByCode.get(defaultRule.ledgerAccountCode)
    if (!account) continue
    const newRule: FinanceCategoryRule = {
      id: `cat-rule-${Date.now()}-${addedRules}`,
      entityId: entity.id,
      pattern: defaultRule.pattern,
      matchType: defaultRule.matchType,
      ledgerAccountId: account.id,
      direction: defaultRule.direction,
      priority: defaultRule.priority,
      active: true,
    }
    nextState.categoryRules = [...nextState.categoryRules, newRule]
    addedRules++
  }

  saveFinanceState(orgId, { ...nextState, categoryRules: nextState.categoryRules })
  return addedRules
}

export function deleteImportSession(orgId: string, id: string): boolean {
  let removed = false
  updateState(orgId, (state) => {
    const session = state.importSessions.find((s) => s.id === id)
    if (!session) return state
    removed = true
    return {
      ...state,
      bankItems: state.bankItems.filter(
        (bi) => bi.importSessionId !== id,
      ),
      importSessions: state.importSessions.filter((s) => s.id !== id),
    }
  })
  return removed
}

export function runAutoCategorize(orgId: string): number {
  let matchedCount = 0
  updateState(orgId, (state) => {
    const unmatched = state.bankItems.filter((bi) => bi.matchStatus === 'unmatched')
    if (unmatched.length === 0) return state
    const suggestions = autoCategorize(unmatched, state.categoryRules, state.ledgerAccounts)
    const updated = applySuggestions(unmatched, suggestions)
    const updatedIds = new Set(updated.map((bi) => bi.id))
    const suggestionMap = new Map(suggestions.map((s) => [s.bankItemId, s]))
    matchedCount = suggestions.filter((s) => s.confidence !== 'none').length
    return {
      ...state,
      bankItems: state.bankItems.map((bi) => {
        if (!updatedIds.has(bi.id)) return bi
        const sug = suggestionMap.get(bi.id)
        if (!sug || sug.confidence === 'none') return bi
        return { ...bi, matchStatus: 'suggested' }
      }),
    }
  })
  return matchedCount
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
