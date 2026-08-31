/**
 * The client error reporter: builds a privacy-scrubbed payload, dedupes and
 * rate-limits it, and posts it to the reporting endpoint. It never throws,
 * never blocks paint, and sends nothing beyond the fields below.
 *
 * Transport is a keepalive `fetch` with **`credentials: 'omit'`**, so no cookies
 * for the endpoint origin are ever attached — honoring the no-cookie guarantee.
 * `navigator.sendBeacon` is deliberately NOT used: it always sends with
 * credentials 'include' and gives no way to omit them. `keepalive` lets the
 * request outlive the page unload that often follows a crash; the plain-string
 * body is sent as `text/plain;charset=UTF-8` (CORS-safelisted → no preflight).
 *
 * See ./scrubRoute (route patterns), ./coarseUserAgent (UA reduction), and
 * docs/ERROR_REPORTING.md for the full privacy rationale.
 */
import { coarseUserAgent } from './coarseUserAgent'
import { scrubRoutePattern } from './scrubRoute'

export type ReportKind =
  'route-boundary' | 'window-error' | 'unhandled-rejection' | 'recoverable-error'

export interface ReportInput {
  /** The thrown value (Error, string, rejection reason, …). */
  error: unknown
  kind: ReportKind
  /** Defaults to `window.location.pathname`. */
  pathname?: string
  /**
   * React's `errorInfo.componentStack` for a `recoverable-error` report (e.g.
   * a hydration mismatch React silently patched by re-rendering from
   * scratch). Appended to `stack` — this is the only way to tell *which*
   * component tree disagreed between server and client, since the minified
   * production error message itself never carries that detail.
   */
  componentStack?: string
}

/** The exact wire payload. Nothing is added to this without justification. */
export interface ReportPayload {
  env: string
  release: string
  route: string
  locale: string
  kind: ReportKind
  message: string
  stack: string
  ua: string
}

export interface ReporterConfig {
  endpoint: string
  /** 'production' | 'preview'. */
  env: string
  /** Commit SHA, or '' when unknown. */
  release: string
  /** Transport. Defaults to a credentials-omitting keepalive fetch (postReport).
      Injectable for tests. */
  send?: (endpoint: string, body: string) => boolean
  /** Clock. Injectable for tests. */
  now?: () => number
}

export interface Reporter {
  report: (input: ReportInput) => void
}

const MAX_MESSAGE = 1000
const MAX_STACK = 4000

/* One broken render loop can throw thousands of times a second. These bound
   both a single repeated error (per-fingerprint dedupe) and the endpoint as a
   whole (rolling window + hard session cap), so nothing can flood it. */
const DEDUPE_WINDOW_MS = 60_000
const RATE_WINDOW_MS = 10_000
const MAX_PER_WINDOW = 5
const MAX_TOTAL = 25

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}

/**
 * Redact high-confidence identifiers/PII from free-form message/stack before
 * sending. `message`/`stack` bypass the route scrubber, and app code does throw
 * errors carrying ids (e.g. doclib's "document <id> references template <id>"),
 * so this is the safety net for the residual free-text risk. Deliberately
 * conservative — emails, UUIDs, and long hex strings — so it never mangles the
 * content-hashed asset filenames in a stack (short mixed-case, not hex/UUID)
 * that symbolication relies on.
 */
const REDACTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]'],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]'],
  [/\b[0-9a-f]{16,}\b/gi, '[id]'],
]

function redact(text: string): string {
  let out = text
  for (const [re, replacement] of REDACTIONS) out = out.replace(re, replacement)
  return out
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message || error.name || 'Error'
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const maybe = (error as { message?: unknown }).message
    if (typeof maybe === 'string') return maybe
  }
  try {
    return String(error)
  } catch {
    return 'Unknown error'
  }
}

function stackOf(error: unknown): string {
  return error instanceof Error && typeof error.stack === 'string' ? error.stack : ''
}

/**
 * First meaningful stack frame, for the dedupe fingerprint. Handles both V8
 * (`at fn (url:line:col)`) and SpiderMonkey/JavaScriptCore
 * (`fn@url:line:col`) formats — otherwise Firefox/Safari would yield an empty
 * frame and distinct crashes with the same route+message would collapse.
 */
function firstFrame(stack: string): string {
  for (const line of stack.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('at ')) return trimmed // V8
    if (/@.+:\d+(?::\d+)?$/.test(trimmed)) return trimmed // SpiderMonkey / JSC
  }
  return ''
}

/** Locale from the live `<html lang>` (kept as en-CA / fr-CA by the app). */
function localeOf(): string {
  if (typeof document === 'undefined') return 'en-CA'
  return document.documentElement.getAttribute('lang') === 'fr-CA' ? 'fr-CA' : 'en-CA'
}

/**
 * Post a report body as a keepalive `fetch` with credentials omitted (no
 * cookies attached). Returns whether the request was dispatched; swallows every
 * error so a transport failure never surfaces.
 */
export function postReport(endpoint: string, body: string): boolean {
  try {
    if (typeof fetch !== 'function') return false
    void fetch(endpoint, {
      method: 'POST',
      body,
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    }).catch(() => {
      /* Best effort — a failed report is never retried or surfaced. */
    })
    return true
  } catch {
    /* Nothing to try — never surface a transport failure. */
    return false
  }
}

export function createReporter(config: ReporterConfig): Reporter {
  const send = config.send ?? postReport
  const clock = config.now ?? (() => Date.now())

  const seen = new Map<string, number>()
  const windowHits: number[] = []
  let totalSent = 0

  function report(input: ReportInput): void {
    try {
      const pathname =
        input.pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
      const route = scrubRoutePattern(pathname)
      const message = truncate(redact(messageOf(input.error)), MAX_MESSAGE)
      const rawStack = input.componentStack
        ? `${stackOf(input.error)}\ncomponent stack:${input.componentStack}`
        : stackOf(input.error)
      const stack = truncate(redact(rawStack), MAX_STACK)
      const fingerprint = `${input.kind}|${route}|${message}|${firstFrame(stack)}`
      const now = clock()

      const last = seen.get(fingerprint)
      if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return

      while (windowHits.length > 0 && now - windowHits[0]! > RATE_WINDOW_MS) windowHits.shift()
      if (windowHits.length >= MAX_PER_WINDOW) return
      if (totalSent >= MAX_TOTAL) return

      const payload: ReportPayload = {
        env: config.env,
        release: config.release,
        route,
        locale: localeOf(),
        kind: input.kind,
        message,
        stack,
        ua: coarseUserAgent(),
      }

      if (send(config.endpoint, JSON.stringify(payload))) {
        seen.set(fingerprint, now)
        windowHits.push(now)
        totalSent += 1
      }
    } catch {
      /* Reporting must never surface its own failure to the user. */
    }
  }

  return { report }
}
