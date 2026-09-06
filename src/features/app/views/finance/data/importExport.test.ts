import { describe, expect, it } from 'vitest'
import {
  exportBankItemsCSV,
  exportJournalsCSV,
  exportInvoicesCSV,
  exportBillsCSV,
  exportWorkspaceJSON,
  buildExportBundles,
} from './importExport'
import type { FinanceWorkspaceState } from './types'
import { initialFinanceState } from './fixtures'

describe('exportBankItemsCSV', () => {
  it('produces CSV with headers and rows', () => {
    const csv = exportBankItemsCSV(initialFinanceState.bankItems)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Date,Amount,Currency,Description,Match Status')
    expect(lines.length).toBe(initialFinanceState.bankItems.length + 1)
  })

  it('escapes commas in descriptions', () => {
    const csv = exportBankItemsCSV([
      { id: 'bi-1', bankAccountId: 'bank-1', date: '2026-08-15', amount: '100.00', currency: 'CAD', description: 'PAYMENT, VENDOR', matchStatus: 'unmatched' },
    ])
    expect(csv).toContain('"PAYMENT, VENDOR"')
  })
})

describe('exportJournalsCSV', () => {
  it('expands journal lines into separate rows', () => {
    const csv = exportJournalsCSV(initialFinanceState.journals)
    const lines = csv.split('\n')
    // One header + one row per journal line
    const journal = initialFinanceState.journals[0]
    expect(journal).toBeDefined()
    expect(lines.length).toBe(1 + journal!.lines.length)
  })
})

describe('exportInvoicesCSV', () => {
  it('produces CSV with invoice headers', () => {
    const csv = exportInvoicesCSV(initialFinanceState.invoices)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('Invoice #')
    expect(lines[0]).toContain('Status')
    expect(lines.length).toBe(initialFinanceState.invoices.length + 1)
  })
})

describe('exportBillsCSV', () => {
  it('produces CSV with bill headers', () => {
    const csv = exportBillsCSV(initialFinanceState.bills)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('Bill #')
    expect(lines.length).toBe(initialFinanceState.bills.length + 1)
  })
})

describe('exportWorkspaceJSON', () => {
  it('produces valid JSON with all workspace state keys', () => {
    const json = exportWorkspaceJSON(initialFinanceState)
    const parsed = JSON.parse(json) as FinanceWorkspaceState
    expect(parsed.entities).toBeDefined()
    expect(parsed.bankItems).toBeDefined()
    expect(parsed.categoryRules).toBeDefined()
    expect(parsed.importSessions).toBeDefined()
  })
})

describe('buildExportBundles', () => {
  it('returns five export bundles', () => {
    const bundles = buildExportBundles(initialFinanceState)
    expect(bundles).toHaveLength(5)
    expect(bundles[0]?.mimeType).toBe('text/csv')
    expect(bundles[4]?.mimeType).toBe('application/json')
  })

  it('includes date in file names', () => {
    const bundles = buildExportBundles(initialFinanceState)
    expect(bundles[0]?.fileName).toMatch(/bank_items_\d{4}-\d{2}-\d{2}\.csv/)
    expect(bundles[4]?.fileName).toMatch(/finance_workspace_\d{4}-\d{2}-\d{2}\.json/)
  })
})
