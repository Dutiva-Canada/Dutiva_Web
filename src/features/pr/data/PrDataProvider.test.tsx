import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { PrDataContext } from './PrDataContext'
import { PrDataProvider } from './PrDataProvider'
import { loadPrState } from './api'
import type { PrState } from './types'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  loadPrState: vi.fn(),
}))

/* Reads state straight off the context — what every page sees. */
function Probe() {
  const ctx = useContext(PrDataContext)
  return <span data-testid="campaigns">{(ctx?.state?.campaigns ?? []).map((c) => c.name).join(',')}</span>
}

const stateWith = (name: string): PrState =>
  ({
    campaigns: [
      {
        id: `c-${name}`,
        name,
        channel: 'social',
        status: 'active',
        objective: '',
        budgetCad: null,
        startsOn: null,
        endsOn: null,
        createdAt: '2026-10-01T14:00:00Z',
        updatedAt: '2026-10-01T14:00:00Z',
      },
    ],
    contentItems: [],
    contacts: [],
    keywords: [],
    mentions: [],
    geoPrompts: [],
    feeds: [],
    connections: [],
    lastLoadedAt: '2026-10-13T10:00:00Z',
  }) as PrState

describe('PrDataProvider', () => {
  it('lets the newer refresh win — a slow stale load must not overwrite it', async () => {
    /* Overlapping refreshes resolved in fetch order — before the generation
       guard, the slower first fetch landed last and rolled state back. */
    let call = 0
    let resolveStale!: (v: PrState) => void
    vi.mocked(loadPrState).mockImplementation(() => {
      call++
      if (call === 1) return new Promise<PrState>((r) => (resolveStale = r))
      return Promise.resolve(stateWith('newer'))
    })
    const api = { current: null as null | (() => Promise<void>) }
    function Trigger() {
      const ctx = useContext(PrDataContext)
      api.current = ctx?.refresh ?? null
      return null
    }
    render(
      <PrDataProvider>
        <Probe />
        <Trigger />
      </PrDataProvider>,
    )
    /* Mount refresh is in flight (deferred). Fire a second refresh — it
       resolves first with the newer book. */
    await api.current!()
    await waitFor(() => expect(screen.getByTestId('campaigns').textContent).toBe('newer'))
    /* The stale fetch resolves late — it must be dropped, not applied. */
    resolveStale(stateWith('stale'))
    await waitFor(() => expect(screen.getByTestId('campaigns').textContent).toBe('newer'))
  })
})
