import { describe, expect, it } from 'vitest'
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
