import { bi } from '@/i18n/core'
import type { FinanceWorkspaceState } from './types'

/**
 * Demo finance fixtures — journal, bank items, reconciliation, payroll.
 *
 * Split from fixtures.ts under the 800-line source budget; assembled into
 * initialFinanceState there.
 */

export const journal: FinanceWorkspaceState['journals'][number] = {
  id: 'jrnl-1',
  bookId: 'book-1',
  number: 'JE-2026-0150',
  date: '2026-08-15',
  description: bi('Invoice INV-2026-0042 issued', 'Facture INV-2026-0042 émise'),
  lines: [
    { accountId: 'acct-1200', debit: '11300.00', credit: '0.00' },
    { accountId: 'acct-5000', debit: '0.00', credit: '10000.00' },
    { accountId: 'acct-2200', debit: '0.00', credit: '1300.00' },
  ],
  currency: 'CAD',
  status: 'posted',
  source: 'import',
  balanced: true,
}

export const bankItem: FinanceWorkspaceState['bankItems'][number] = {
  id: 'bi-1',
  bankAccountId: 'bank-1',
  date: '2026-09-01',
  amount: '4000.00',
  currency: 'CAD',
  description: 'Payment from Maple Freight Co.',
  matchStatus: 'matched',
  matchedInvoiceId: 'inv-2',
}

export const unmatchedBankItem: FinanceWorkspaceState['bankItems'][number] = {
  id: 'bi-2',
  bankAccountId: 'bank-1',
  date: '2026-09-03',
  amount: '-42.50',
  currency: 'CAD',
  description: 'Bank fee — wire transfer',
  matchStatus: 'unmatched',
}

export const reconciliation: FinanceWorkspaceState['reconciliations'][number] = {
  id: 'rec-1',
  bankAccountId: 'bank-1',
  periodId: 'period-2026-q3',
  openingBalance: '45000.00',
  closingBalance: '52000.00',
  statementTotal: '52000.00',
  bookTotal: '51957.50',
  difference: '42.50',
  status: 'exception',
}

export const payPeriod: FinanceWorkspaceState['payPeriods'][number] = {
  id: 'pp-2026-18',
  entityId: 'ent-1',
  label: 'Pay period 18 — Aug 24 to Sep 6',
  startDate: '2026-08-24',
  endDate: '2026-09-06',
  payDate: '2026-09-11',
  frequency: 'biweekly',
}

export const payRun: FinanceWorkspaceState['payRuns'][number] = {
  id: 'pr-1',
  entityId: 'ent-1',
  periodId: 'pp-2026-18',
  status: 'results_imported',
  grossPay: '24000.00',
  employeeDeductions: '5200.00',
  employerContributions: '2100.00',
  netPay: '18800.00',
  providerFees: '125.00',
  currency: 'CAD',
  jurisdictions: ['ON', 'QC'],
  calculationSource: bi('ADP Workforce Now', 'ADP Workforce Now'),
  ruleVersion: '2026-Q3',
  approvedBy: 'Martin Constantineau',
  approvedAt: '2026-09-04T12:00:00Z',
  submittedAt: '2026-09-04T13:00:00Z',
  exceptions: [
    bi(
      'QC employee YTD total differs from prior period by $320.',
      'Le total cumulatif de l’employé QC diffère de la période précédente de 320 $.',
    ),
  ],
}

export const payrollLiability: FinanceWorkspaceState['payrollLiabilities'][number] = {
  id: 'pl-1',
  entityId: 'ent-1',
  payRunId: 'pr-1',
  type: 'source_deductions',
  amount: '5200.00',
  currency: 'CAD',
  dueDate: '2026-09-15',
  settled: false,
}
