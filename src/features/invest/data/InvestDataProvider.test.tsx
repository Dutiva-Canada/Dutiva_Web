import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { InvestDataContext, EMPTY_INVEST_STATE } from './InvestDataContext'
import { InvestDataProvider } from './InvestDataProvider'
import { loadInvestState, type InvestState } from './api'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  loadInvestState: vi.fn(),
  createAccount: vi.fn(async () => undefined),
}))

/* Reads state straight off the context — what every tab sees. */
function Probe() {
  const { state, loading, error } = useContext(InvestDataContext)
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{String(error)}</span>
      <span data-testid="accounts">{state.accounts.map((a) => a.name).join(',')}</span>
    </div>
  )
}

const stateWith = (name: string): InvestState =>
  ({
    ...EMPTY_INVEST_STATE,
    accounts: [
      {
        id: `acc-${name}`,
        name,
        kind: 'paper',
        baseCurrency: 'CAD',
        cashBalance: 0,
        status: 'active',
      },
    ],
  }) as InvestState

describe('InvestDataProvider', () => {
  it('lets the newer refresh win — a slow stale load must not overwrite it', async () => {
    /* Overlapping refreshes resolve in fetch order — before the generation
       guard, the slower first fetch landed last and rolled state back. */
    let call = 0
    let resolveStale!: (v: InvestState) => void
    vi.mocked(loadInvestState).mockImplementation(() => {
      call++
      if (call === 1) return new Promise<InvestState>((r) => (resolveStale = r))
      return Promise.resolve(stateWith('newer'))
    })
    const api = { current: null as null | (() => Promise<void>) }
    function Trigger() {
      const { refresh } = useContext(InvestDataContext)
      api.current = refresh
      return null
    }
    render(
      <InvestDataProvider>
        <Probe />
        <Trigger />
      </InvestDataProvider>,
    )
    /* Mount refresh is in flight (deferred). Fire a second refresh — it
       resolves first with the newer book. */
    await api.current!()
    await waitFor(() => expect(screen.getByTestId('accounts').textContent).toBe('newer'))
    /* The stale fetch resolves late — it must be dropped, not applied. */
    resolveStale(stateWith('stale'))
    await waitFor(() => expect(screen.getByTestId('accounts').textContent).toBe('newer'))
  })
})
