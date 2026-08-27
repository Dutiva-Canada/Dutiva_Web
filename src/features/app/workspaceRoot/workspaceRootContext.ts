import { createContext, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NavigateOptions, To } from 'react-router-dom'

export type WorkspaceRoot = '/app' | '/demo' | '/fr/demo'

export interface WorkspaceRootContextValue {
  root: WorkspaceRoot
  /** True on the indexable /demo surface — Northgate fixtures, no sign-in. */
  isPublicDemo: boolean
  /** Blocks persistence and create menus; sample data only. */
  readOnly: boolean
}

const DEFAULT_ROOT: WorkspaceRootContextValue = {
  root: '/app',
  isPublicDemo: false,
  readOnly: false,
}

export const WorkspaceRootContext = createContext<WorkspaceRootContextValue>(DEFAULT_ROOT)

export function useWorkspaceRoot(): WorkspaceRootContextValue {
  return useContext(WorkspaceRootContext)
}

/** `/app/home` or `/demo/workflows/statutory-notice-ontario` from a suffix. */
export function workspacePath(root: WorkspaceRoot, suffix: string): string {
  const clean = suffix.replace(/^\//, '')
  return `${root}/${clean}`
}

/** Strip `/app`, `/demo`, or `/fr/demo` prefix for segment parsing. */
export function workspaceSegments(pathname: string): string[] {
  return pathname.replace(/^\/(?:app|demo|fr\/demo)\/?/, '').split('/').filter(Boolean)
}

/** Rewrite hardcoded /app paths when rendering inside /demo. */
export function rewriteAppPath(path: string, root: WorkspaceRoot): string {
  if (root === '/app' || !path.startsWith('/app/')) return path
  return path.replace(/^\/app/, root)
}

/** Navigate helper — rewrites `/app/...` targets to the active workspace root. */
export function useWorkspaceNavigate() {
  const navigate = useNavigate()
  const { root } = useWorkspaceRoot()

  return useCallback(
    (to: To, options?: NavigateOptions) => {
      if (typeof to === 'string') {
        navigate(rewriteAppPath(to, root), options)
        return
      }
      if (typeof to === 'object' && to.pathname) {
        navigate({ ...to, pathname: rewriteAppPath(to.pathname, root) }, options)
        return
      }
      navigate(to, options)
    },
    [navigate, root],
  )
}
