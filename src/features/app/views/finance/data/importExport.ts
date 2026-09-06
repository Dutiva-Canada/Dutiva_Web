import type {
  FinanceBankItem,
  FinanceBill,
  FinanceInvoice,
  FinanceJournal,
  FinanceWorkspaceState,
} from './types'

/**
 * Export utilities for the Finance workspace. Produces CSV files for
 * accounting-system import and JSON for full workspace backup.
 *
 * CSV follows the convention of quoted fields with comma delimiters.
 * Amounts are string-based fixed-precision decimals (no currency symbols).
 */

/* ---------- CSV helpers ---------- */

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(csvEscape).join(',')
  const dataLines = rows.map((r) => r.map(csvEscape).join(','))
  return [headerLine, ...dataLines].join('\n')
}

/* ---------- Bank items export ---------- */

export function exportBankItemsCSV(bankItems: FinanceBankItem[]): string {
  const headers = ['Date', 'Amount', 'Currency', 'Description', 'Match Status']
  const rows = bankItems.map((bi) => [
    bi.date,
    bi.amount,
    bi.currency,
    bi.description,
    bi.matchStatus,
  ])
  return toCSV(headers, rows)
}

/* ---------- Journals export ---------- */

export function exportJournalsCSV(journals: FinanceJournal[]): string {
  const headers = ['Journal #', 'Date', 'Description (EN)', 'Description (FR)', 'Status', 'Source', 'Account ID', 'Debit', 'Credit']
  const rows: string[][] = []
  for (const j of journals) {
    for (const line of j.lines) {
      rows.push([
        j.number,
        j.date,
        j.description.en,
        j.description.fr,
        j.status,
        j.source,
        line.accountId,
        line.debit,
        line.credit,
      ])
    }
  }
  return toCSV(headers, rows)
}

/* ---------- Invoices export ---------- */

export function exportInvoicesCSV(invoices: FinanceInvoice[]): string {
  const headers = ['Invoice #', 'Issue Date', 'Due Date', 'Currency', 'Subtotal', 'Tax', 'Total', 'Paid', 'Status']
  const rows = invoices.map((inv) => [
    inv.number,
    inv.issueDate,
    inv.dueDate,
    inv.currency,
    inv.subtotal,
    inv.taxTotal,
    inv.total,
    inv.paidAmount,
    inv.status,
  ])
  return toCSV(headers, rows)
}

/* ---------- Bills export ---------- */

export function exportBillsCSV(bills: FinanceBill[]): string {
  const headers = ['Bill #', 'Issue Date', 'Due Date', 'Currency', 'Subtotal', 'Tax', 'Total', 'Paid', 'Status']
  const rows = bills.map((b) => [
    b.number,
    b.issueDate,
    b.dueDate,
    b.currency,
    b.subtotal,
    b.taxTotal,
    b.total,
    b.paidAmount,
    b.status,
  ])
  return toCSV(headers, rows)
}

/* ---------- Full workspace JSON export ---------- */

export function exportWorkspaceJSON(state: FinanceWorkspaceState): string {
  return JSON.stringify(state, null, 2)
}

/* ---------- Download trigger ---------- */

export function downloadFile(content: string, fileName: string, mimeType: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/* ---------- Export bundle ---------- */

export interface ExportBundle {
  fileName: string
  content: string
  mimeType: string
}

export function buildExportBundles(state: FinanceWorkspaceState): ExportBundle[] {
  const date = new Date().toISOString().slice(0, 10)
  return [
    {
      fileName: `bank_items_${date}.csv`,
      content: exportBankItemsCSV(state.bankItems),
      mimeType: 'text/csv',
    },
    {
      fileName: `journals_${date}.csv`,
      content: exportJournalsCSV(state.journals),
      mimeType: 'text/csv',
    },
    {
      fileName: `invoices_${date}.csv`,
      content: exportInvoicesCSV(state.invoices),
      mimeType: 'text/csv',
    },
    {
      fileName: `bills_${date}.csv`,
      content: exportBillsCSV(state.bills),
      mimeType: 'text/csv',
    },
    {
      fileName: `finance_workspace_${date}.json`,
      content: exportWorkspaceJSON(state),
      mimeType: 'application/json',
    },
  ]
}
