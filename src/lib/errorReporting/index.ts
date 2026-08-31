/**
 * Client error reporting — the public surface wired into the app.
 *
 * `installErrorReporting()` (called once from src/main.tsx) registers global
 * `error` / `unhandledrejection` handlers for crashes outside React's tree, and
 * `reportRouteError()` is called from the RouteErrorPage boundary for render
 * errors React catches. Both are **inert** unless every gate passes:
 *
 *   - running in a browser (never during SSR/prerender);
 *   - VERCEL_ENV is 'production' or 'preview' (collapses to '' in dev/tests);
 *   - VITE_SUPABASE_URL is configured (the beacon target lives there).
 *
 * When inert, install and report are no-ops — nothing is sent in dev, under
 * Vitest, or on a `development` deploy.
 */
import { VERCEL_ENV } from '@/lib/deployEnv'
import { RELEASE_SHA } from '@/lib/release'
import { createReporter } from './reporter'
import type { Reporter } from './reporter'

export type { ReportKind, ReportPayload } from './reporter'

let reporter: Reporter | null = null

/** Region the reporting function is pinned to — must match the intended data
    residency (the project's DB region). */
const REPORTING_REGION = 'ca-central-1'

/** Resolve the beacon endpoint, or null if reporting must stay off. */
export function reportingEndpoint(): string | null {
  if (typeof window === 'undefined') return null
  if (VERCEL_ENV !== 'production' && VERCEL_ENV !== 'preview') return null
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base || typeof base !== 'string') return null
  /* Pin Edge Function execution to the Canadian region. The Supabase project
     region pins the DATABASE, but functions otherwise run at the edge nearest
     the caller — so without this, payload processing and function logs can leave
     Canada even with the DB in ca-central-1. `forceFunctionRegion` routes the
     invocation to ca-central-1 (verify via the response's x-sb-edge-region
     header). If the project is hosted outside Canada, change REPORTING_REGION to
     match and disclose it (see docs/ERROR_REPORTING.md → residency). */
  return `${base.replace(/\/+$/, '')}/functions/v1/report-error?forceFunctionRegion=${REPORTING_REGION}`
}

function currentPath(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/'
}

/** Global handler pair, factored out so it can be unit-tested directly. */
export function makeGlobalErrorHandlers(target: Reporter): {
  onError: (event: { error?: unknown; message?: unknown }) => void
  onRejection: (event: { reason?: unknown }) => void
} {
  return {
    onError: (event) =>
      target.report({
        error: event.error ?? event.message,
        kind: 'window-error',
        pathname: currentPath(),
      }),
    onRejection: (event) =>
      target.report({ error: event.reason, kind: 'unhandled-rejection', pathname: currentPath() }),
  }
}

/**
 * Install global error reporting. Safe to call more than once (idempotent) and
 * a no-op when any gate fails. Registering the listeners is instant, so this
 * never competes with first paint.
 */
export function installErrorReporting(): void {
  if (reporter) return
  const endpoint = reportingEndpoint()
  if (!endpoint) return

  reporter = createReporter({ endpoint, env: VERCEL_ENV, release: RELEASE_SHA })
  const { onError, onRejection } = makeGlobalErrorHandlers(reporter)
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
}

/**
 * Report a render error caught by the RouteErrorPage boundary. No-op unless
 * reporting was installed (i.e. all gates passed).
 */
export function reportRouteError(error: unknown): void {
  reporter?.report({ error, kind: 'route-boundary', pathname: currentPath() })
}

/**
 * Report a React-recovered error — passed as `onRecoverableError` to
 * `hydrateRoot`/`createRoot` (src/main.tsx). React already recovers from these
 * on its own (most commonly a hydration mismatch: it discards the mismatched
 * subtree and re-renders client-side, so the user never sees a broken page),
 * but recovery is otherwise silent about *where* it happened — the minified
 * production error message alone gives no clue. `errorInfo.componentStack`
 * does, so it's threaded through here instead of relying on the generic
 * `window.onerror` path (React's default `onRecoverableError` reports via the
 * `reportError()` global, which is what `window-error` reports were already
 * catching, just without this context).
 */
export function reportRecoverableError(
  error: unknown,
  errorInfo?: { componentStack?: string },
): void {
  reporter?.report({
    error,
    kind: 'recoverable-error',
    pathname: currentPath(),
    componentStack: errorInfo?.componentStack,
  })
}

/** Test-only reset of the module singleton. */
export function __resetErrorReportingForTest(): void {
  reporter = null
}
