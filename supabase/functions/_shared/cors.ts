/** Browser-facing CORS for edge functions — the shared replacement for the
 *  per-function `'Access-Control-Allow-Origin': '*'` constants.
 *
 *  The allowlist is the production origin, its www twin, Vercel preview
 *  deployments of the marketing site, and localhost for local development
 *  against the deployed project. A request with no `Origin` header — crons,
 *  webhooks, server-to-server — isn't a CORS request; it gets the fallback
 *  origin in the header and works exactly as before, since nothing browser-
 *  side reads it. A browser request from an unlisted origin gets the
 *  fallback too, so the preflight no longer matches and the request is
 *  never sent — strictly tighter than the old wildcard.
 *
 *  Two entry points, matching how the functions were shaped:
 *   - `makeCorsHeaders(opts)` — a `req → headers` factory for files that
 *     spread a `corsHeaders` value into each Response.
 *   - `withCors(req, res, opts)` — stamps the same headers onto an already-
 *     built Response, for handlers that wrap a shared runtime's response.
 */

export const CORS_DEFAULT_ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type'

export const CORS_FALLBACK_ORIGIN = 'https://dutiva.ca'

const EXACT_ORIGINS = new Set([CORS_FALLBACK_ORIGIN, 'https://www.dutiva.ca'])

const ORIGIN_PATTERNS = [
  /^https:\/\/dutiva-website(?:-[a-z0-9-]+)?\.vercel\.app$/,
  /^http:\/\/localhost(?::\d+)?$/,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
]

/** The request's origin when it's allowlisted, else the production origin.
 *  A missing request (module helpers that never see one) resolves to the
 *  fallback too — the serve boundary stamps the real value on the way out. */
export function corsOrigin(req?: Request): string {
  const origin = req?.headers.get('Origin') ?? ''
  return EXACT_ORIGINS.has(origin) || ORIGIN_PATTERNS.some((p) => p.test(origin))
    ? origin
    : CORS_FALLBACK_ORIGIN
}

export interface CorsOptions {
  methods?: string
  allowHeaders?: string
}

export function makeCorsHeaders(opts: CorsOptions = {}) {
  const methods = opts.methods ?? 'POST, OPTIONS'
  const allowHeaders = opts.allowHeaders ?? CORS_DEFAULT_ALLOW_HEADERS
  return (req?: Request): Record<string, string> => ({
    'Access-Control-Allow-Origin': corsOrigin(req),
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': allowHeaders,
    Vary: 'Origin',
  })
}

/** Sets the CORS headers on a Response in place and returns it — for the
 *  handler boundary where the request (and its origin) is in scope but the
 *  runtime that built the response is not. */
export function withCors(req: Request, res: Response, opts: CorsOptions = {}): Response {
  const headers = makeCorsHeaders(opts)(req)
  for (const [name, value] of Object.entries(headers)) res.headers.set(name, value)
  return res
}
