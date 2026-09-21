import { Link, Navigate } from 'react-router-dom'

import type { ComponentProps } from 'react'
import type { To } from 'react-router-dom'
import { rewriteAppPath, useWorkspaceRoot } from './workspaceRootContext'
import type { WorkspaceRoot } from './workspaceRootContext'

/** Resolve `to` (string or `{ pathname }`) against the workspace root. */
function resolveTo(to: To, root: WorkspaceRoot): To {
  if (typeof to === 'string') return rewriteAppPath(to, root)
  if (typeof to === 'object' && to.pathname)
    return { ...to, pathname: rewriteAppPath(to.pathname, root) }
  return to
}

/**
 * `Link` that rewrites `to="/app/…"` to the active workspace root
 * (`/demo`, `/fr/demo`). Use it anywhere a view can render on the public
 * demo surface — a plain `/app` href bounces those visitors to sign-in.
 * `useWorkspaceNavigate()` is the imperative equivalent.
 */
export function WorkspaceLink({ to, ...rest }: ComponentProps<typeof Link>) {
  const { root } = useWorkspaceRoot()
  return <Link to={resolveTo(to, root)} {...rest} />
}

/** `<Navigate>` equivalent of `WorkspaceLink`, for declarative redirects. */
export function WorkspaceNavigate({ to, ...rest }: ComponentProps<typeof Navigate>) {
  const { root } = useWorkspaceRoot()
  return <Navigate to={resolveTo(to, root)} {...rest} />
}
