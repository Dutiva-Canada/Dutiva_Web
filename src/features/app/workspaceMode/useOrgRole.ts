import { useWorkspaceMode } from './workspaceModeContext'
import type { OrgMemberRole } from './roles'

/**
 * Thin hook for the signed-in user's organization role. Returns the role in
 * production mode, or `null` in demo / signed-out contexts. Use this for nav,
 * Home layout, and per-module gating — RLS remains the enforcement layer.
 */
export function useOrgRole(): OrgMemberRole | null {
  const { memberRole } = useWorkspaceMode()
  return memberRole
}
