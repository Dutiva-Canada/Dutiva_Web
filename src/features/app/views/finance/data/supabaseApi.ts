import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type {
  FinanceBankItem,
  FinanceBill,
  FinanceBudget,
  FinanceClosePeriod,
  FinanceExternalAction,
  FinanceExternalActionStatus,
  FinanceInvoice,
  FinanceJournal,
  FinanceJournalLine,
  FinanceObligationStatus,
  FinancePayRun,
  FinancePayRunStatus,
  FinanceReceipt,
  FinanceReconciliation,
  FinanceSpendRequest,
  FinanceTaxObligation,
  FinanceTaxScenario,
  FinanceWorkspaceState,
} from './types'
import {
  mapApproval,
  mapAuditEvent,
  mapBankAccount,
  mapBankItem,
  mapBill,
  mapBook,
  mapBudget,
  mapClosePeriod,
  mapCredit,
  mapDebt,
  mapEntity,
  mapExternalAction,
  mapFiscalPeriod,
  mapForecast,
  mapHolding,
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

/* ---------- Invoice lifecycle ---------- */

export async function updateInvoiceStatus(
  orgId: string,
  id: string,
  status: FinanceInvoice['status'],
  paidAmount?: string,
): Promise<FinanceInvoice | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (paidAmount !== undefined) patch.paid_amount = Number(paidAmount)
  const { data, error } = await supabase
    .from(TABLES.invoices)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapInvoice(data as Record<string, unknown>)
}

/* ---------- Bill lifecycle ---------- */

export async function updateBillStatus(
  orgId: string,
  id: string,
  status: FinanceBill['status'],
  paidAmount?: string,
): Promise<FinanceBill | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (paidAmount !== undefined) patch.paid_amount = Number(paidAmount)
  const { data, error } = await supabase
    .from(TABLES.bills)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapBill(data as Record<string, unknown>)
}

/* ---------- Journal lifecycle ---------- */

export async function updateJournalStatus(
  orgId: string,
  id: string,
  status: FinanceJournal['status'],
): Promise<FinanceJournal | null> {
  if (!supabase) return null
  // Unbalanced journals cannot become posted actuals.
  if (status === 'posted') {
    const { data: existing } = await supabase
      .from(TABLES.journals)
      .select('balanced')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle()
    if (!existing?.balanced) return null
  }
  const { data, error } = await supabase
    .from(TABLES.journals)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapJournal(data as Record<string, unknown>)
}

/* ---------- Bank item matching ---------- */

export async function updateBankItemMatchStatus(
  orgId: string,
  id: string,
  matchStatus: FinanceBankItem['matchStatus'],
  matchRef?: { journalId?: string; invoiceId?: string; billId?: string },
): Promise<FinanceBankItem | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = {
    match_status: matchStatus,
    updated_at: new Date().toISOString(),
  }
  if (matchRef?.journalId) patch.matched_journal_id = matchRef.journalId
  if (matchRef?.invoiceId) patch.matched_invoice_id = matchRef.invoiceId
  if (matchRef?.billId) patch.matched_bill_id = matchRef.billId
  const { data, error } = await supabase
    .from(TABLES.bankItems)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapBankItem(data as Record<string, unknown>)
}

/* ---------- Reconciliation lifecycle ---------- */

export async function updateReconciliationStatus(
  orgId: string,
  id: string,
  status: FinanceReconciliation['status'],
  reviewer?: string,
): Promise<FinanceReconciliation | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'reconciled' && reviewer) {
    patch.reviewer = reviewer
    patch.reviewed_at = new Date().toISOString()
  }
  const { data, error } = await supabase
    .from(TABLES.reconciliations)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapReconciliation(data as Record<string, unknown>)
}

/* ---------- Close period lifecycle ---------- */

export async function updateClosePeriodStatus(
  orgId: string,
  id: string,
  status: FinanceClosePeriod['status'],
  approver?: string,
  reopenReason?: string,
): Promise<FinanceClosePeriod | null> {
  if (!supabase) return null
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'approved' && approver) {
    patch.approver = approver
    patch.approved_at = new Date().toISOString()
  }
  if (status === 'open' && reopenReason) {
    patch.reopen_reason = { en: reopenReason, fr: reopenReason }
  }
  const { data, error } = await supabase
    .from(TABLES.closePeriods)
    .update(patch)
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapClosePeriod(data as Record<string, unknown>)
}

/* ---------- Expense lifecycle ---------- */

export async function updateExpenseStatus(
  orgId: string,
  id: string,
  status: FinanceWorkspaceState['expenses'][number]['status'],
): Promise<FinanceWorkspaceState['expenses'][number] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.expenses)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapExpense(data as Record<string, unknown>)
}
