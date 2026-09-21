import { Link, Navigate } from 'react-router-dom'

import type { ComponentProps } from 'react'
import { rewriteAppPath, useWorkspaceRoot } from './workspaceRootContext'

/**
 * `Link` that rewrites `to="/app/…"` to the active workspace root
 * (`/demo`, `/fr/demo`). Use it anywhere a view can render on the public
 * demo surface — a plain `/app` href bounces those visitors to sign-in.
 * `useWorkspaceNavigate()` is the imperative equivalent.
 */
export function WorkspaceLink({ to, ...rest }: ComponentProps<typeof Link>) {
  const { root } = useWorkspaceRoot()
  const resolved = typeof to === 'string' ? rewriteAppPath(to, root) : to
  return <Link to={resolved} {...rest} />
}

/** `<Navigate>` equivalent of `WorkspaceLink`, for declarative redirects. */
export function WorkspaceNavigate({ to, ...rest }: ComponentProps<typeof Navigate>) {
  const { root } = useWorkspaceRoot()
  const resolved = typeof to === 'string' ? rewriteAppPath(to, root) : to
  return <Navigate to={resolved} {...rest} />
}
