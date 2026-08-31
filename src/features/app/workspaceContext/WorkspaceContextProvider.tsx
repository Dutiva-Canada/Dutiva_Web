import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { WorkspaceContext } from './workspaceContextStore'
import type { WorkspaceContextState } from './workspaceContextStore'

export function WorkspaceContextProvider({ children }: { readonly children: ReactNode }) {
  const [context, setContext] = useState<WorkspaceContextState | null>(null)

  const updateContext = useCallback((ctx: WorkspaceContextState | null) => {
    setContext(ctx)
  }, [])

  const clearContext = useCallback(() => setContext(null), [])

  const removeContextMeta = useCallback((index: number) => {
    setContext((prev) => (prev ? { ...prev, meta: prev.meta.filter((_, i) => i !== index) } : prev))
  }, [])

  const value = useMemo(
    () => ({ context, setContext: updateContext, clearContext, removeContextMeta }),
    [context, updateContext, clearContext, removeContextMeta],
  )

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>
}
