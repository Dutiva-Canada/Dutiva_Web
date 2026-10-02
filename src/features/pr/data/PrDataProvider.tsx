import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { loadPrState } from './api'
import { PrDataContext, type PrDataContextValue } from './PrDataContext'
import type { PrState } from './types'

/**
 * Loads the PR surface state once the access gate has passed — the portal
 * layout only mounts this provider for users with a pr_access row, so every
 * query here is already scoped to the owner by RLS.
 */
export function PrDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PrState | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const next = await loadPrState()
      if (mounted.current) {
        setState(next)
        setError(undefined)
      }
    } catch (e) {
      if (mounted.current) setError(e as Error)
    }
  }, [])

  useEffect(() => {
    void refresh().finally(() => {
      if (mounted.current) setLoading(false)
    })
  }, [refresh])

  const value: PrDataContextValue = { state, loading, error, refresh }
  return <PrDataContext.Provider value={value}>{children}</PrDataContext.Provider>
}
