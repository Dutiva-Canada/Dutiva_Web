import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { loadHealthState } from './api'
import { HealthDataContext, type HealthDataContextValue } from './HealthDataContext'
import type { HealthState } from './types'

/**
 * Loads the health surface state once the access gate has passed — the portal
 * layout only mounts this provider for users with a health_access row, so
 * every query here is already scoped to the owner by RLS.
 */
export function HealthDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HealthState | undefined>()
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
      const next = await loadHealthState()
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

  const value: HealthDataContextValue = { state, loading, error, refresh }
  return <HealthDataContext.Provider value={value}>{children}</HealthDataContext.Provider>
}
