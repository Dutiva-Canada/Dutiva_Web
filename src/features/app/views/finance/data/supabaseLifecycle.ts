import { supabase as supabaseTyped } from '@/lib/supabaseClient'
import type {
  FinanceBankItem,
  FinanceBill,
  FinanceClosePeriod,
  FinanceInvoice,
  FinanceJournal,
  FinanceReconciliation,
  FinanceWorkspaceState,
} from './types'
import {
  mapBankItem,
  mapBill,
  mapClosePeriod,
  mapExpense,
  mapInvoice,
  mapJournal,
  mapReconciliation,
} from './supabaseMappers'

/* eslint-disable @typescript-eslint/no-explicit-any */
const supabase: any = supabaseTyped

const TABLES = {
  invoices: 'finance_invoices',
  bills: 'finance_bills',
  journals: 'finance_journals',
  bankItems: 'finance_bank_items',
  reconciliations: 'finance_reconciliations',
  closePeriods: 'finance_close_periods',
  expenses: 'finance_expenses',
} as const

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
