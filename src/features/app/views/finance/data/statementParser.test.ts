import { describe, expect, it } from 'vitest'
import { parseStatementCSV, rowsToBankItems } from './statementParser'
import type { FinanceBankItem } from './types'

describe('parseStatementCSV', () => {
  it('parses a standard CSV with headers', () => {
    const csv = 'Date,Amount,Description\n2026-08-15,100.00,STRIPE PAYOUT\n2026-08-16,-50.00,RENT PAYMENT'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.totalRows).toBe(2)
    expect(result.errorRows).toBe(0)
    expect(result.rows[0]?.date).toBe('2026-08-15')
    expect(result.rows[0]?.amount).toBe('100.00')
    expect(result.rows[0]?.description).toBe('STRIPE PAYOUT')
    expect(result.rows[1]?.amount).toBe('-50.00')
  })

  it('auto-detects semicolon delimiter', () => {
    const csv = 'Date;Amount;Description\n2026-08-15;200.00;PAYROLL'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.delimiter).toBe(';')
    expect(result.rows[0]?.description).toBe('PAYROLL')
  })

  it('handles tab delimiter', () => {
    const csv = 'Date\tAmount\tDescription\n2026-08-15\t300.00\tDEPOSIT'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.delimiter).toBe('\t')
    expect(result.rows[0]?.amount).toBe('300.00')
  })

  it('handles split debit/credit columns', () => {
    const csv = 'Date,Debit,Credit,Description\n2026-08-15,100.00,,RENT\n2026-08-16,,500.00,STRIPE'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.rows[0]?.amount).toBe('-100.00')
    expect(result.rows[1]?.amount).toBe('500.00')
  })

  it('normalizes DD/MM/YYYY dates', () => {
    const csv = 'Date,Amount,Description\n15/08/2026,100.00,TEST'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.rows[0]?.date).toBe('2026-08-15')
  })

  it('normalizes MM/DD/YYYY when day > 12', () => {
    const csv = 'Date,Amount,Description\n08/25/2026,100.00,TEST'
    const result = parseStatementCSV(csv, 'CAD')
    // 25 > 12 so it's the day; 08 is the month → 2026-08-25
    expect(result.rows[0]?.date).toBe('2026-08-25')
  })

  it('handles quoted fields with commas', () => {
    const csv = 'Date,Amount,Description\n2026-08-15,100.00,"PAYMENT TO, VENDOR INC"'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.rows[0]?.description).toBe('PAYMENT TO, VENDOR INC')
  })

  it('handles currency symbols in amounts', () => {
    const csv = 'Date,Amount,Description\n2026-08-15,"$1,234.56",TEST'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.rows[0]?.amount).toBe('1234.56')
  })

  it('reports errors for invalid dates', () => {
    const csv = 'Date,Amount,Description\nINVALID,100.00,TEST\n2026-08-15,50.00,OK'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.errorRows).toBe(1)
    expect(result.rows[0]?.error).toBe('invalid_date')
    expect(result.rows[1]?.error).toBeUndefined()
  })

  it('handles empty input', () => {
    const result = parseStatementCSV('', 'CAD')
    expect(result.totalRows).toBe(0)
  })

  it('falls back to positional mapping without headers', () => {
    const csv = '2026-08-15,100.00,NO HEADER HERE'
    const result = parseStatementCSV(csv, 'CAD')
    expect(result.rows[0]?.date).toBe('2026-08-15')
    expect(result.rows[0]?.description).toBe('NO HEADER HERE')
  })
})

describe('rowsToBankItems', () => {
  it('creates bank items from parsed rows', () => {
    const csv = 'Date,Amount,Description\n2026-08-15,100.00,STRIPE\n2026-08-16,-50.00,RENT'
    const parsed = parseStatementCSV(csv, 'CAD')
    const result = rowsToBankItems(parsed.rows, 'bank-1', 'CAD', [])
    expect(result.newItems).toHaveLength(2)
    expect(result.duplicates).toBe(0)
    expect(result.newItems[0]?.bankAccountId).toBe('bank-1')
    expect(result.newItems[0]?.matchStatus).toBe('unmatched')
  })

  it('deduplicates against existing items', () => {
    const existing: FinanceBankItem[] = [
      {
        id: 'bi-1',
        bankAccountId: 'bank-1',
        date: '2026-08-15',
        amount: '100.00',
        currency: 'CAD',
        description: 'STRIPE',
        matchStatus: 'unmatched',
      },
    ]
    const csv = 'Date,Amount,Description\n2026-08-15,100.00,STRIPE\n2026-08-16,-50.00,RENT'
    const parsed = parseStatementCSV(csv, 'CAD')
    const result = rowsToBankItems(parsed.rows, 'bank-1', 'CAD', existing)
    expect(result.newItems).toHaveLength(1)
    expect(result.duplicates).toBe(1)
    expect(result.newItems[0]?.description).toBe('RENT')
  })

  it('counts errors', () => {
    const csv = 'Date,Amount,Description\nINVALID,100.00,TEST\n2026-08-15,50.00,OK'
    const parsed = parseStatementCSV(csv, 'CAD')
    const result = rowsToBankItems(parsed.rows, 'bank-1', 'CAD', [])
    expect(result.errors).toBe(1)
    expect(result.newItems).toHaveLength(1)
  })

  it('falls back to header inference for unrecognized bank headers', () => {
    const csv = 'effective_date,effective_time,settlement_date\n2026-08-15,100.00,PAYMENT\n2026-08-16,-50.00,RENT'
    const parsed = parseStatementCSV(csv, 'CAD')
    expect(parsed.errorRows).toBe(0)
    expect(parsed.totalRows).toBe(2)
    expect(parsed.rows[0]?.date).toBe('2026-08-15')
    expect(parsed.rows[0]?.amount).toBe('100.00')
    expect(parsed.rows[0]?.description).toBe('PAYMENT')
    expect(parsed.rows[1]?.amount).toBe('-50.00')
  })
})
