import { describe, expect, it, vi, beforeEach } from 'vitest'

const from = vi.hoisted(() => vi.fn())
const invoke = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from, functions: { invoke } } }))

import { getServiceStatus, overallStatus, setServiceStatus } from './statusApi'
import type { ServiceStatusRow } from './statusApi'

const row = (
  component: ServiceStatusRow['component'],
  status: ServiceStatusRow['status'],
): ServiceStatusRow => ({ component, status, message: null, updatedAt: '' })

describe('overallStatus', () => {
  it('is operational only when every component is', () => {
    expect(overallStatus([row('platform', 'operational'), row('support', 'operational')])).toBe(
      'operational',
    )
  })

  it('rolls up to the worst component status', () => {
    expect(overallStatus([row('platform', 'operational'), row('advisor', 'degraded')])).toBe(
      'degraded',
    )
    expect(
      overallStatus([
        row('platform', 'maintenance'),
        row('advisor', 'outage'),
        row('support', 'degraded'),
      ]),
    ).toBe('outage')
    expect(overallStatus([row('platform', 'operational'), row('advisor', 'maintenance')])).toBe(
      'maintenance',
    )
  })
})

describe('getServiceStatus', () => {
  beforeEach(() => from.mockReset())

  it('maps live rows and fills missing components as operational, in canonical order', async () => {
    from.mockReturnValue({
      select: () =>
        Promise.resolve({
          data: [
            {
              component: 'advisor',
              status: 'degraded',
              message: 'Slower than usual',
              updated_at: '2026-07-16T00:00:00Z',
            },
          ],
          error: null,
        }),
    })
    const rows = await getServiceStatus()
    expect(rows.map((r) => r.component)).toEqual(['platform', 'advisor', 'documents', 'support'])
    expect(rows.find((r) => r.component === 'advisor')).toMatchObject({
      status: 'degraded',
      message: 'Slower than usual',
    })
    expect(rows.find((r) => r.component === 'platform')?.status).toBe('operational')
  })

  it('falls back to all-operational when the read fails', async () => {
    from.mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: 'nope' } }),
    })
    const rows = await getServiceStatus()
    expect(rows).toHaveLength(4)
    expect(rows.every((r) => r.status === 'operational')).toBe(true)
  })
})

describe('setServiceStatus', () => {
  beforeEach(() => invoke.mockReset())

  it('posts the change through the admin edge function', async () => {
    invoke.mockResolvedValue({ error: null })
    await setServiceStatus('platform', 'outage', 'Investigating')
    expect(invoke).toHaveBeenCalledWith('set-service-status', {
      body: { component: 'platform', status: 'outage', message: 'Investigating' },
    })
  })

  it('throws when the function rejects', async () => {
    invoke.mockResolvedValue({ error: { message: 'forbidden' } })
    await expect(setServiceStatus('platform', 'outage')).rejects.toBeTruthy()
  })
})
