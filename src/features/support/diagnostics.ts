import type { Lang } from '@/i18n/core'

/**
 * Non-sensitive technical context that may be attached to a support request so
 * the founder can respond faster. This is an ALLOWLIST — it deliberately never
 * includes employee records, HR case details, document contents, chat
 * transcripts, passwords, tokens, or full DOM/page content. The edge function
 * re-strips to the same keys as defence-in-depth, and the user can review and
 * remove these before submitting.
 */
export interface SupportDiagnostics {
  plan?: string
  route?: string
  app_version?: string
  browser?: string
  os?: string
  locale?: string
  feature?: string
  correlation_id?: string
  error_code?: string
}

/** Coarse browser/OS labels from the UA — not the full string (no fingerprinting). */
function parseUserAgent(ua: string): { browser: string; os: string } {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Other'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad|iOS/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Other'
  return { browser, os }
}

export interface GatherDiagnosticsOptions {
  lang: Lang
  plan?: string | null
  feature?: string | null
  errorCode?: string | null
}

export function gatherDiagnostics({
  lang,
  plan,
  feature,
  errorCode,
}: GatherDiagnosticsOptions): SupportDiagnostics {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  const { browser, os } = parseUserAgent(nav?.userAgent ?? '')
  const correlationId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : undefined
  const version = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'web'

  const diagnostics: SupportDiagnostics = {
    route: typeof location !== 'undefined' ? location.pathname : undefined,
    app_version: version,
    browser,
    os,
    locale: lang === 'fr' ? 'fr-CA' : 'en-CA',
    correlation_id: correlationId,
  }
  if (plan) diagnostics.plan = plan
  if (feature) diagnostics.feature = feature
  if (errorCode) diagnostics.error_code = errorCode
  return diagnostics
}

/** Human-readable rows for the "what will be attached" review UI. */
export function diagnosticRows(d: SupportDiagnostics): { key: string; value: string }[] {
  return Object.entries(d)
    .filter(([, v]) => typeof v === 'string' && v.length > 0)
    .map(([key, value]) => ({ key, value: value as string }))
}
