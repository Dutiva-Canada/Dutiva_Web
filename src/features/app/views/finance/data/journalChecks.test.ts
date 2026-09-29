import { describe, expect, it } from 'vitest'
import { isJournalBalanced } from './journalChecks'
import type { FinanceJournalLine } from './types'

describe('isJournalBalanced', () => {
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
