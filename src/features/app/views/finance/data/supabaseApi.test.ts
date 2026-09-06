import { describe, expect, it } from 'vitest'
import { isJournalBalanced } from './supabaseApi'
import type { FinanceJournalLine } from './types'

describe('supabaseApi.isJournalBalanced', () => {
  it('returns true when debits equal credits', () => {
    const lines: FinanceJournalLine[] = [
      { accountId: 'cash', debit: '100.00', credit: '0.00' },
      { accountId: 'revenue', debit: '0.00', credit: '100.00' },
    ]
    expect(isJournalBalanced(lines)).toBe(true)
  })

  it('returns false when debits do not equal credits', () => {
    const lines: FinanceJournalLine[] = [
      { accountId: 'cash', debit: '100.00', credit: '0.00' },
      { accountId: 'revenue', debit: '0.00', credit: '90.00' },
    ]
    expect(isJournalBalanced(lines)).toBe(false)
  })

  it('returns true for an empty journal', () => {
    expect(isJournalBalanced([])).toBe(true)
  })

  it('handles decimal precision within tolerance', () => {
    const lines: FinanceJournalLine[] = [
      { accountId: 'cash', debit: '100.002', credit: '0.00' },
      { accountId: 'revenue', debit: '0.00', credit: '100.00' },
    ]
    expect(isJournalBalanced(lines)).toBe(true)
  })

  it('handles non-numeric strings as zero', () => {
    const lines: FinanceJournalLine[] = [
      { accountId: 'cash', debit: 'invalid', credit: '0.00' },
      { accountId: 'revenue', debit: '0.00', credit: '0.00' },
    ]
    expect(isJournalBalanced(lines)).toBe(true)
  })
})

describe('supabaseApi.loadFinanceStateFromSupabase', () => {
  it('throws when Supabase is not configured', async () => {
    const mod = await import('./supabaseApi')
    // In the test environment, supabase is null, so this should throw.
    await expect(mod.loadFinanceStateFromSupabase('test-org')).rejects.toThrow(
      'Supabase is not configured',
    )
  })
})

describe('supabaseApi closed-period enforcement', () => {
  it('isPeriodLocked is exported and callable', async () => {
    const mod = await import('./supabaseApi')
    // In test env without Supabase, isPeriodLocked returns false.
    const result = await mod.isPeriodLocked('org', 'book', 'period')
    expect(result).toBe(false)
  })
})

describe('supabaseApi evidence storage', () => {
  it('financeEvidencePath builds the correct object key', async () => {
    const mod = await import('./supabaseApi')
    const path = mod.financeEvidencePath('org-123', 'entity-456', 'receipt-789', 'pdf')
    expect(path).toBe('org-123/entity-456/receipt-789.pdf')
  })
})
