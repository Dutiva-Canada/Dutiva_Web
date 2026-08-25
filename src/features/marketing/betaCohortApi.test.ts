import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BETA_COHORT_LIMIT } from '@/config/beta'

const invoke = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabaseClient', () => ({ supabase: { functions: { invoke } } }))

import { getBetaCohortStatus } from './betaCohortApi'

describe('getBetaCohortStatus', () => {
  beforeEach(() => invoke.mockReset())

  it('invokes beta-cohort-status with GET', async () => {
    invoke.mockResolvedValue({ data: { taken: 4, limit: 15 }, error: null })
    await expect(getBetaCohortStatus()).resolves.toEqual({ taken: 4, limit: 15 })
    expect(invoke).toHaveBeenCalledWith('beta-cohort-status', { method: 'GET' })
  })

  it('falls back to zero taken when the function errors', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await expect(getBetaCohortStatus()).resolves.toEqual({
      taken: 0,
      limit: BETA_COHORT_LIMIT,
    })
  })

  it('falls back when the body is missing taken', async () => {
    invoke.mockResolvedValue({ data: { limit: 15 }, error: null })
    await expect(getBetaCohortStatus()).resolves.toEqual({
      taken: 0,
      limit: BETA_COHORT_LIMIT,
    })
  })

  it('defaults limit to BETA_COHORT_LIMIT when omitted', async () => {
    invoke.mockResolvedValue({ data: { taken: 2 }, error: null })
    await expect(getBetaCohortStatus()).resolves.toEqual({
      taken: 2,
      limit: BETA_COHORT_LIMIT,
    })
  })
})
