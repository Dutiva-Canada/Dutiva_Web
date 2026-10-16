import { createContext, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NavigateOptions, To } from 'react-router-dom'

export type WorkspaceRoot = '/workspace' | '/demo' | '/fr/demo'

interface WorkspaceRootContextValue {
  root: WorkspaceRoot
  /** True on the indexable /demo surface — Northgate fixtures, no sign-in. */
  isPublicDemo: boolean
  /** Blocks persistence and create menus; sample data only. */
  readOnly: boolean
}

const DEFAULT_ROOT: WorkspaceRootContextValue = {
  root: '/workspace',
  isPublicDemo: false,
  readOnly: false,
}

export const WorkspaceRootContext = createContext<WorkspaceRootContextValue>(DEFAULT_ROOT)

export function useWorkspaceRoot(): WorkspaceRootContextValue {
  return useContext(WorkspaceRootContext)
}

/** `/workspace/home` or `/demo/workflows/statutory-notice-ontario` from a suffix. */
export function workspacePath(root: WorkspaceRoot, suffix: string): string {
  const clean = suffix.replace(/^\//, '')
  return `${root}/${clean}`
}

/** Strip `/workspace`, `/demo`, `/fr/demo` (or legacy `/app`) prefix for
    segment parsing. */
export function workspaceSegments(pathname: string): string[] {
  return pathname
    .replace(/^\/(?:app|workspace|demo|fr\/demo)\/?/, '')
    .split('/')
    .filter(Boolean)
}

/** Canonical internal link targets keep the `/app/…` spelling — a virtual
    prefix rewriteAppPath maps onto the active root: `/workspace` in the
    signed-in product, `/demo`/`/fr/demo` in the public preview. The sign-in
    gate and magic-link landing are the exception: they exist only on the
    production root, so `/app/welcome` and `/app/auth/*` always land on
    `/workspace` even from inside the demo. */
export function rewriteAppPath(path: string, root: WorkspaceRoot): string {
  if (!path.startsWith('/app/')) return path
  if (path.startsWith('/app/welcome') || path.startsWith('/app/auth/')) {
    return path.replace(/^\/app/, '/workspace')
  }
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
