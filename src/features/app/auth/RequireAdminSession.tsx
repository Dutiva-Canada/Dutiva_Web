import type { ReactNode } from 'react'
import { useContext, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { isVercelPreview } from '@/lib/deployEnv'
import { useI18n } from '@/i18n/context'
import { workspaceModeMessages as M } from '@/i18n/messages/workspaceMode'
import { useAuth } from './authContext'
import { WorkspaceModeContext } from '@/features/app/workspaceMode/workspaceModeContext'
import { AppBootSkeleton } from '@/features/app/shell/AppBootSkeleton'

/**
 * Gates the whole /app workspace behind a signed-in, invited session — any
 * `@dutiva.ca` staff account, the first BETA_COHORT_LIMIT beta signups, an
 * admin-managed invite, or a paid subscriber (AuthProvider's `authorized`,
 * backed by `current_user_is_workspace_member`; see
 * supabase/migrations/0026_open_workspace_to_beta_list.sql, capacity-capped
 * by 0067_beta_cohort_capacity.sql, domain staff in 0114). The workspace
 * used to double as a public demo reachable by anyone; it's invite-only
 * now. Unauthorized visitors are sent to /app/welcome (the sign-in gate),
 * carrying the location they wanted so EntryStage can return them there
 * after sign-in.
 *
 * Without Supabase configured (local dev, tests) there is no session to
 * check at all — this stays a no-op rather than locking the workspace out
 * of every environment that doesn't have real credentials, matching how
 * every other Supabase-backed feature here degrades to its signed-out
 * state instead of failing hard.
 *
 * Vercel *preview* deployments also skip the gate: those builds are private,
 * noindex, and used for internal review, so requiring a magic-link sign-in
 * just gets in the way. This is scoped to VERCEL_ENV === 'preview' — the
 * production deployment (VERCEL_ENV === 'production') always enforces the
 * gate below. Note this only opens the workspace UI; the real backend
 * (guidance/law tables, advisor-chat) stays protected server-side by RLS and
 * an explicit edge-function check, which no client flag can bypass.
 */
export function RequireAdminSession({ children }: { readonly children: ReactNode }) {
  const location = useLocation()
  const { status, authorized } = useAuth()
  const { x } = useI18n()
  /* Raw context, not the throwing hook — this gate also mounts standalone
     (tests, preview shells) where no WorkspaceModeProvider exists; absent
     the provider there is no mode window to hold for. */
  const workspace = useContext(WorkspaceModeContext)
  const resolving = workspace?.resolving ?? false

  /* The moment a session exists, start fetching the shell — it resolves in
     parallel with the membership/mode checks below instead of after them.
     Signed-out visitors skip this entirely (same specifier as the lazy()
     in appSurface, so no duplicate fetch). */
  useEffect(() => {
    if (status === 'signed-in')
      void import('@/features/app/shell/AppShell').catch(() => {})
  }, [status])

  if (!supabase) return children

  if (isVercelPreview()) return children

  /* `authorized` is null both while signed out and while the membership
     check is still in flight right after signing in — only the latter
     should stay on the skeleton rather than bouncing to /app/welcome. */
  /* `resolving` keeps the skeleton up until WorkspaceModeProvider commits
     a mode + identity — without it, a signed-in production user renders the
     demo persona/fixtures for the whole async resolution window (and can
     navigate fixture ids into production routes before the flip). The
     skeleton keeps the wait legible instead of painting an empty page. */
  if (
    status === 'loading' ||
    (status === 'signed-in' && (authorized === null || resolving))
  ) {
    return (
      <div role="status" aria-label={x(M.wsmode_loading_a11y)}>
        <AppBootSkeleton />
      </div>
    )
  }

  /* The resolution pass exhausted its retries — paint an honest retry
     surface rather than the demo persona the degraded reads would imply.
     A signed-in user in this state never sees Northgate fixtures as if
     they were their own workspace. */
  if (status === 'signed-in' && workspace?.resolutionFailed) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-[10px] bg-bg px-[24px] text-center">
        <p role="alert" className="m-0 text-[15px] font-semibold text-text">
          {x(M.wsmode_load_error_title)}
        </p>
        <p className="m-0 max-w-[380px] text-[13px] leading-[1.6] text-text-muted">
          {x(M.wsmode_load_error_body)}
        </p>
        <button
          type="button"
          onClick={() => workspace.retryResolution?.()}
          className="mt-[10px] cursor-pointer rounded-[10px] border-none bg-navy px-[18px] py-[10px] font-sans text-[13.5px] font-semibold text-white hover:opacity-[.92]"
        >
          {x(M.wsmode_load_retry)}
        </button>
      </div>
    )
  }

  if (status === 'signed-in' && authorized) {
    return children
  }

  return <Navigate to="/app/welcome" replace state={{ from: location }} />
}
