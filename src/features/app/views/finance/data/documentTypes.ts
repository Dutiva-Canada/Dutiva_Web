import type { Bi } from '@/i18n/core'
import type { FinanceCurrency } from './entityTypes'

/* ---------- Commercial documents ---------- */

export type FinanceInvoiceStatus =
  'draft' | 'issued' | 'partial' | 'paid' | 'overdue' | 'disputed' | 'written_off' | 'cancelled'

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
  'draft' | 'posted' | 'partial' | 'paid' | 'overdue' | 'disputed' | 'cancelled'

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
  'draft' | 'submitted' | 'approved' | 'rejected' | 'committed' | 'cancelled'

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
