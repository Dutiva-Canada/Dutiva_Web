import { useCallback, useEffect, useState } from 'react'

export type ModuleState<T> =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; rows: T[] }

/** One loaded module's state plus its retry — what a card gates on. */
export interface ModuleRows<T> {
  readonly state: ModuleState<T>
  readonly retry: () => void
}

/** CardData dependency: any module's rows handle. */
export type ModuleDep = ModuleRows<unknown>

/** Per-module loader with its own retry, so cards stay independently alive. */
export function useModuleRows<T>(
  organizationId: string | null,
  list: (organizationId: string) => Promise<T[]>,
): ModuleRows<T> {
  const [state, setState] = useState<ModuleState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!organizationId) return
    let cancelled = false
    setState({ status: 'loading' })
    list(organizationId)
      .then((rows) => {
        if (!cancelled) setState({ status: 'ready', rows })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [organizationId, list, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}

export function rowsOf<T>(state: ModuleState<T>): T[] {
  return state.status === 'ready' ? state.rows : []
}
