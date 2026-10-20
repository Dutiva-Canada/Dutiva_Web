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
  /* Overlapping refreshes must not resolve last-writer-wins — a slower
     earlier load would overwrite a newer refresh's state. A monotonically
     increasing generation drops the stale resolution. */
  const refreshGen = useRef(0)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    const gen = ++refreshGen.current
    try {
      const next = await loadPrState()
      if (mounted.current && gen === refreshGen.current) {
        setState(next)
        setError(undefined)
      }
    } catch (e) {
      if (mounted.current && gen === refreshGen.current) setError(e as Error)
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
