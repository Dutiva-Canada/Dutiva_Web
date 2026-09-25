import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EMPTY_INVEST_STATE, InvestDataContext } from './InvestDataContext'
import type { InvestState } from './api'
import { loadInvestState } from './api'

/** Loads the signed-in user's invest_* rows once; shared across all tabs. */
export function InvestDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InvestState>(EMPTY_INVEST_STATE)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setState(await loadInvestState())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ state, loading, refresh }), [state, loading, refresh])
  return <InvestDataContext.Provider value={value}>{children}</InvestDataContext.Provider>
}
