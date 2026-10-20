import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { initialCrmState } from './fixtures'
import { useCrmData } from './useCrmData'
import type { CrmState } from './types'

const STORED_A: CrmState = {
  companies: [{ id: 'co-a', name: 'Acme A' }],
  contacts: [],
  deals: [],
  activities: [],
}
const STORED_B: CrmState = {
  companies: [{ id: 'co-b', name: 'Beta B' }],
  contacts: [],
  deals: [],
  activities: [],
}

describe('useCrmData', () => {
  it('loads the new org on switch and never writes the old org under the new key', () => {
    localStorage.setItem('dutiva-crm-org-a', JSON.stringify(STORED_A))
    localStorage.setItem('dutiva-crm-org-b', JSON.stringify(STORED_B))

    const { result, rerender } = renderHook(
      ({ orgId }: { orgId: string }) => useCrmData('production', orgId),
      { initialProps: { orgId: 'org-a' } },
    )
    expect(result.current.state.companies[0]?.name).toBe('Acme A')

    act(() => {
      result.current.addCompany({ name: 'Contaminant' })
    })
    expect(result.current.state.companies[0]?.name).toBe('Contaminant')

    /* Org switch without a remount (the outlet keys on pathname). */
    rerender({ orgId: 'org-b' })

    expect(result.current.state.companies.map((c) => c.name)).toEqual(['Beta B'])
    const storedB = JSON.parse(localStorage.getItem('dutiva-crm-org-b') ?? '{}') as CrmState
    expect(storedB.companies.map((c) => c.name)).toEqual(['Beta B'])
  })

  it('returns fixture state in demo mode and on leaving production', () => {
    localStorage.setItem('dutiva-crm-org-a', JSON.stringify(STORED_A))

    const { result, rerender } = renderHook(
      ({ mode, orgId }: { mode: 'demo' | 'production'; orgId: string | undefined }) =>
        useCrmData(mode, orgId),
      { initialProps: { mode: 'production', orgId: 'org-a' } },
    )
    expect(result.current.state.companies[0]?.name).toBe('Acme A')

    /* production → demo shows the Northgate fixtures, not the stored rows. */
    rerender({ mode: 'demo', orgId: 'org-a' })
    expect(result.current.state).toBe(initialCrmState)

    /* demo → production reloads the stored org state. */
    rerender({ mode: 'production', orgId: 'org-a' })
    expect(result.current.state.companies[0]?.name).toBe('Acme A')
  })

  it('starts empty for a production org with nothing stored', () => {
    const { result } = renderHook(() => useCrmData('production', 'org-empty'))
    expect(result.current.state).toEqual({
      companies: [],
      contacts: [],
      deals: [],
      activities: [],
    })
  })
})
