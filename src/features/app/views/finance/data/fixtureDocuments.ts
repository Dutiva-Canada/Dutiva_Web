import { bi } from '@/i18n/core'
import type { FinanceWorkspaceState } from './types'

/**
 * Demo finance fixtures — invoices, bills, spend requests, purchase orders, expenses, subscriptions.
 *
 * Split from fixtures.ts under the 800-line source budget; assembled into
 * initialFinanceState there.
 */

export const invoice: FinanceWorkspaceState['invoices'][number] = {
  id: 'inv-1',
  entityId: 'ent-1',
  customerId: 'party-cust-1',
  number: 'INV-2026-0042',
  issueDate: '2026-08-15',
  dueDate: '2026-09-15',
  currency: 'CAD',
  subtotal: '10000.00',
  taxTotal: '1300.00',
  total: '11300.00',
  paidAmount: '0.00',
  status: 'issued',
  sourceSystem: bi('QuickBooks Online', 'QuickBooks Online'),
  notes: bi('Quarterly logistics consulting', 'Conseil logistique trimestriel'),
}

export const overdueInvoice: FinanceWorkspaceState['invoices'][number] = {
  id: 'inv-2',
  entityId: 'ent-1',
  customerId: 'party-cust-1',
  number: 'INV-2026-0038',
  issueDate: '2026-07-01',
  dueDate: '2026-08-01',
  currency: 'CAD',
  subtotal: '7500.00',
  taxTotal: '975.00',
  total: '8475.00',
  paidAmount: '4000.00',
  status: 'overdue',
  sourceSystem: bi('QuickBooks Online', 'QuickBooks Online'),
}

export const bill: FinanceWorkspaceState['bills'][number] = {
  id: 'bill-1',
  entityId: 'ent-1',
  supplierId: 'party-sup-1',
  number: 'BILL-TS-9912',
  issueDate: '2026-08-20',
  dueDate: '2026-09-20',
  currency: 'CAD',
  subtotal: '2500.00',
  taxTotal: '325.00',
  total: '2825.00',
  paidAmount: '0.00',
  status: 'posted',
  purchaseOrderId: 'po-1',
  sourceSystem: bi('QuickBooks Online', 'QuickBooks Online'),
}

export const spendRequest: FinanceWorkspaceState['spendRequests'][number] = {
  id: 'sr-1',
  entityId: 'ent-1',
  requester: 'Jordan Lee',
  purpose: bi('New warehouse laptops (3 units)', 'Ordinateurs portables d’entrepôt (3 unités)'),
  supplierId: 'party-sup-1',
  projectId: 'proj-warehouse',
  amount: '3600.00',
  currency: 'CAD',
  evidenceRef: 'receipt-1',
  status: 'approved',
  approver: 'Martin Constantineau',
  approvedAt: '2026-09-03T14:00:00Z',
  approvalVersion: 'v1',
  submittedAt: '2026-09-01T10:00:00Z',
}

export const purchaseOrder: FinanceWorkspaceState['purchaseOrders'][number] = {
  id: 'po-1',
  entityId: 'ent-1',
  supplierId: 'party-sup-1',
  number: 'PO-2026-0017',
  date: '2026-08-18',
  currency: 'CAD',
  total: '3600.00',
  matchedAmount: '0.00',
  status: 'open',
  projectId: 'proj-warehouse',
}

export const expense: FinanceWorkspaceState['expenses'][number] = {
  id: 'exp-1',
  entityId: 'ent-1',
  requester: 'Jordan Lee',
  purpose: bi('Client lunch — Maple Freight', 'Dîner client — Maple Freight'),
  amount: '85.00',
  currency: 'CAD',
  projectId: 'proj-warehouse',
  status: 'submitted',
  taxable: false,
  submittedAt: '2026-09-04T16:00:00Z',
}

export const subscription: FinanceWorkspaceState['subscriptions'][number] = {
  id: 'sub-1',
  entityId: 'ent-1',
  label: bi('QuickBooks Online Plus', 'QuickBooks Online Plus'),
  supplierId: 'party-sup-1',
  cost: '70.00',
  currency: 'CAD',
  renewalTerm: bi('Monthly', 'Mensuel'),
  nextRenewalDate: '2026-10-01',
  noticeDate: '2026-09-15',
  owner: 'Martin Constantineau',
  active: true,
}
