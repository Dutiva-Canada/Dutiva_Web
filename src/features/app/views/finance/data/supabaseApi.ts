import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type {
  FinanceBudget,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceInvoice,
  FinanceJournal,
  FinanceJournalLine,
  FinanceObligationStatus,
  FinancePayRun,
  FinancePayRunStatus,
  FinanceSpendRequest,
  FinanceTaxObligation,
  FinanceTaxScenario,
  FinanceWorkspaceState,
} from './types'
import {
  mapAiImportSettings,
  mapApproval,
  mapAuditEvent,
  mapBankAccount,
  mapBankItem,
  mapBill,
  mapBook,
  mapBudget,
  mapCategorizationFeedback,
  mapCategoryRule,
  mapClosePeriod,
  mapCredit,
  mapDebt,
  mapEntity,
  mapExternalAction,
  mapFiscalPeriod,
  mapForecast,
  mapHolding,
  mapImportSession,
  mapInvoice,
  mapJournal,
  mapLedgerAccount,
  mapParty,
  mapPayPeriod,
  mapPayRun,
  mapPayrollLiability,
  mapPurchaseOrder,
  mapReceipt,
  mapReconciliation,
  mapReserveGoal,
  mapScenario,
  mapSpendRequest,
  mapSubscription,
  mapTaxObligation,
  mapTaxScenario,
  mapExpense,
} from './supabaseMappers'

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
  categoryRules: 'finance_category_rules',
  importSessions: 'finance_import_sessions',
  workspaceSettings: 'finance_workspace_settings',
  categorizationFeedback: 'finance_categorization_feedback',
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

/* ---------- Full state load ---------- */

export async function loadFinanceStateFromSupabase(orgId: string): Promise<FinanceWorkspaceState> {
  if (!supabase) throw new Error('Supabase is not configured')
  const selectAll = async <T>(
    table: string,
    mapper: (r: Record<string, unknown>) => T,
    orderBy = 'created_at',
  ): Promise<T[]> => {
    try {
      return await fetchAllPages((from, to) =>
        supabase!.from(table).select('*').eq('organization_id', orgId).order(orderBy, { ascending: false }).range(from, to),
      ).then((rows) => rows.map((r) => mapper(r as Record<string, unknown>)))
    } catch (err) {
      // Keep the workspace usable even if one finance table is unavailable or
      // has a schema drift — log and surface an empty array for that slice.
      console.error(`[finance] load ${table} failed:`, err)
      return []
    }
  }

  // Payroll tables are admin-only; non-admins get empty arrays (RLS handles this)
  const [
    entities, books, fiscalPeriods, parties, bankAccounts, ledgerAccounts,
    invoices, bills, credits, receipts, spendRequests, purchaseOrders, expenses,
    subscriptions, journals, bankItems, reconciliations, closePeriods,
    payPeriods, payRuns, payrollLiabilities, budgets, scenarios, forecasts,
    reserveGoals, holdings, debts, taxObligations, taxScenarios,
    approvals, auditEvents, externalActions,
    categoryRules, importSessions,
    categorizationFeedback,
  ] = await Promise.all([
    selectAll(TABLES.entities, mapEntity),
    selectAll(TABLES.books, mapBook),
    selectAll(TABLES.fiscalPeriods, mapFiscalPeriod, 'start_date'),
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
    selectAll(TABLES.categoryRules, mapCategoryRule),
    selectAll(TABLES.importSessions, mapImportSession),
    selectAll(TABLES.categorizationFeedback, mapCategorizationFeedback),
  ])

  const aiImportSettings = await loadAiImportSettingsSupabase(orgId)

  return {
    entities, books, fiscalPeriods, parties, bankAccounts, ledgerAccounts,
    invoices, bills, credits, receipts, spendRequests, purchaseOrders, expenses,
    subscriptions, journals, bankItems, reconciliations, closePeriods,
    payPeriods, payRuns, payrollLiabilities, budgets, scenarios, forecasts,
    reserveGoals, holdings, debts, taxObligations, taxScenarios,
    approvals, auditEvents, externalActions,
    categoryRules, importSessions,
    aiImportSettings,
    categorizationFeedback,
  }
}

async function loadAiImportSettingsSupabase(orgId: string): Promise<import('./types').FinanceAiImportSettings> {
  if (!supabase) return { aiImportEnabled: false, aiImportMode: 'auto_high' }
  try {
    const { data, error } = await supabase
      .from(TABLES.workspaceSettings)
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle()
    if (error || !data) {
      if (error) console.error('[finance] load workspace settings failed:', error)
      return { aiImportEnabled: false, aiImportMode: 'auto_high' }
    }
    return mapAiImportSettings(data as Record<string, unknown>)
  } catch (err) {
    console.error('[finance] load workspace settings failed:', err)
    return { aiImportEnabled: false, aiImportMode: 'auto_high' }
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

export async function settlePayrollLiabilityInSupabase(
  orgId: string,
  id: string,
): Promise<import('./types').FinancePayrollLiability | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.payrollLiabilities)
    .update({
      settled: true,
      settled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .eq('settled', false)
    .select('*')
    .single()
  if (error) throw error
  return mapPayrollLiability(data as Record<string, unknown>)
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

export async function transitionTaxScenarioStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceTaxScenario['status'],
  reviewer?: string,
): Promise<FinanceTaxScenario | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (reviewer && (status === 'reviewed' || status === 'accepted')) {
    patch.reviewer = reviewer
    patch.reviewed_at = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from(TABLES.taxScenarios)
    .update(patch)
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

/* ---------- Import, categorization (re-exported from supabaseImports) ---------- */
export {
  insertCategoryRule,
  updateCategoryRuleInSupabase,
  deleteCategoryRuleFromSupabase,
  insertImportSession,
  importBankStatementInSupabase,
  deleteImportSessionFromSupabase,
  runAutoCategorizeInSupabase,
} from './supabaseImports'

/* ---------- Creates / lifecycle (re-exported from supabaseCreates) ---------- */
export {
  addScenarioInSupabase,
  addForecastInSupabase,
  addReserveGoalInSupabase,
  updateReserveGoalProgressInSupabase,
  setHoldingStaleInSupabase,
  transitionDebtStatusInSupabase,
  transitionBudgetStatusInSupabase,
  transitionScenarioStatusInSupabase,
  freezeForecastInSupabase,
  updateForecastPeriodsInSupabase,
  addExternalActionInSupabase,
  addEntityInSupabase,
  updateEntityInSupabase,
  deleteEntityInSupabase,
  addBankAccountInSupabase,
  addLedgerAccountInSupabase,
  addPartyInSupabase,
  addSubscriptionInSupabase,
  seedDefaultCategoryRulesInSupabase,
} from './supabaseCreates'

/* ---------- Evidence / receipt storage (re-exported from supabaseEvidence) ---------- */
export {
  financeEvidencePath,
  uploadReceiptFile,
  createReceiptDownloadUrl,
  insertReceipt,
  markReceiptReviewed,
} from './supabaseEvidence'

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

export {
  updateInvoiceStatus,
  updateBillStatus,
  updateJournalStatus,
  updateBankItemMatchStatus,
  updateReconciliationStatus,
  updateClosePeriodStatus,
  updateExpenseStatus,
} from './supabaseLifecycle'
