import { createContext, useContext } from 'react'
import type { InvestState } from './api'

/**
 * Shared invest state for the /invest portal tabs. Loaded once for the
 * signed-in user; `refresh` re-reads after mutations. There is no demo mode
 * — the portal is auth- and access-gated.
 */
export interface InvestDataContextValue {
  state: InvestState
  loading: boolean
  refresh: () => Promise<void>
}

export const EMPTY_INVEST_STATE: InvestState = {
  accounts: [],
  positions: [],
  snapshots: [],
  strategies: [],
  signals: [],
  orders: [],
  runs: [],
  watchlist: [],
  news: [],
}

export const InvestDataContext = createContext<InvestDataContextValue>({
  state: EMPTY_INVEST_STATE,
  loading: true,
  refresh: async () => {},
})

export function useInvestData(): InvestDataContextValue {
  return useContext(InvestDataContext)
}
