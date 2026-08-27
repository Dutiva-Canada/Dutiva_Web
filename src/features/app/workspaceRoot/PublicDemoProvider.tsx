import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { WorkspaceRootContext } from './workspaceRootContext'
import type { WorkspaceRoot } from './workspaceRootContext'

/** Wraps the public /demo workspace — forced Northgate demo, read-only. */
export function PublicDemoProvider({
  root,
  children,
}: {
  readonly root: WorkspaceRoot
  readonly children: ReactNode
}) {
  const value = useMemo(
    () => ({
      root,
      isPublicDemo: true,
      readOnly: true,
    }),
    [root],
  )
  return <WorkspaceRootContext.Provider value={value}>{children}</WorkspaceRootContext.Provider>
}
