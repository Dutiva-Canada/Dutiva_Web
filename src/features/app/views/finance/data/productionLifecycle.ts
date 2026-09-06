import type {
  FinanceBankItem,
  FinanceBankMatchStatus,
  FinanceBill,
  FinanceClosePeriod,
  FinanceExpenseStatus,
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinanceJournal,
  FinanceJournalStatus,
  FinanceReconciliation,
  FinanceWorkspaceState,
} from './types'
import { updateState } from './productionApi'

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
