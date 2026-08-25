/**
 * Reduce a resolved pathname to a privacy-safe **route pattern** before it ever
 * leaves the browser.
 *
 * The binding constraint: the `/app` surface carries employee, case, document,
 * person, and conversation identifiers directly in the URL
 * (`/app/employees/:employeeId`, `/app/cases/:caseId`, …). Sending the resolved
 * path would leak those identifiers into telemetry.
 *
 * Approach: **deny-by-default matching against a known route registry.** A
 * pathname is matched, segment by segment, against the real route patterns
 * below; a matching pattern is returned verbatim (`/app/cases/:id`) and the
 * query string and hash are dropped. Anything that does **not** match a known
 * route degrades to `/unknown` (or `/app/:unknown` on the private surface) —
 * never to the resolved path. This is position-aware, so `/app/employees/studio`
 * binds `studio` to `:employeeId` (there is no static `employees/studio` route)
 * and scrubs to `/app/employees/:id`, and a 404 or a newly added dynamic route
 * that isn't in the registry yet can never transmit an identifier — the worst
 * case is a lost grouping, never a leak.
 *
 * The registry mirrors src/seo/routes.ts, src/app/routes.tsx, and
 * src/app/appViews.tsx. If a route is added or renamed there, add it here too;
 * forgetting only over-scrubs it to `/unknown`, which is privacy-safe.
 */

/** Every real route pattern, absolute. `:name` segments match any single value. */
const ROUTE_PATTERNS: readonly string[] = [
  // Public marketing — English
  '/',
  '/about',
  '/faq',
  '/blog',
  '/pricing',
  '/templates',
  '/guides',
  '/guides/template-usage',
  '/known-limitations',
  '/legal',
  '/legal/:slug',
  '/help',
  '/help/:slug',
  '/contact',
  '/status',
  '/changelog',
  '/tools/jurisdiction-check',
  '/blog/:slug',
  '/guides/:slug',
  // Public marketing — French (localized slugs)
  '/fr',
  '/fr/a-propos',
  '/fr/faq',
  '/fr/blogue',
  '/fr/tarifs',
  '/fr/modeles',
  '/fr/guides',
  '/fr/guides/utilisation-des-modeles',
  '/fr/limites-connues',
  '/fr/juridique',
  '/fr/juridique/:slug',
  '/fr/aide',
  '/fr/aide/:slug',
  '/fr/contact',
  '/fr/etat',
  '/fr/journal-des-modifications',
  '/fr/outils/verification-juridiction',
  '/fr/blogue/:slug',
  '/fr/guides/:slug',
  // Public external signing (token in path — scrub to pattern)
  '/sign/:token',
  '/fr/sign/:token',
  // App surface — entry + shell
  '/app/welcome',
  '/app/auth/confirm',
  '/app',
  '/app/home',
  '/app/advisor',
  '/app/workflows',
  '/app/cases',
  '/app/cases/:id',
  '/app/employees',
  '/app/employees/:id',
  '/app/compliance',
  '/app/policies',
  '/app/templates',
  '/app/analytics',
  '/app/reports',
  '/app/knowledge',
  '/app/support',
  '/app/support/requests',
  '/app/support/requests/:id',
  '/app/support/admin',
  '/app/support/admin/:id',
  '/app/communications',
  '/app/compensation',
  '/app/wellbeing',
  '/app/tasks',
  '/app/calendar',
  '/app/memory',
  '/app/planning',
  '/app/planning/tasks',
  '/app/planning/calendar',
  '/app/settings',
  '/app/settings/memory',
  '/app/settings/memory/people/:id',
  '/app/settings/memory/cases/:id',
  '/app/settings/memory/conversations/:id',
  '/app/documents',
  '/app/documents/hr-library',
  '/app/documents/studio',
  '/app/documents/templates/:id',
  '/app/documents/generate/:id',
  '/app/documents/:id',
]

/** Split a pathname/pattern into segments (root → []). */
function toSegments(value: string): string[] {
  const trimmed = value.replace(/\/+$/, '')
  return trimmed === '' ? [] : trimmed.slice(1).split('/')
}

/** Precompute once: each pattern's segments, longest-first isn't needed since
    we score by static-segment count to prefer the most specific match. */
const PATTERN_SEGMENTS: ReadonlyArray<{ pattern: string; segments: string[] }> = ROUTE_PATTERNS.map(
  (pattern) => ({ pattern, segments: toSegments(pattern) }),
)

/**
 * Turn a resolved pathname (optionally with query/hash) into a route pattern
 * safe to send in telemetry. Pure and total — never throws.
 */
export function scrubRoutePattern(rawPath: string): string {
  try {
    const path = (rawPath.split(/[?#]/)[0] || '/').trim()
    const normalized = path.startsWith('/') ? path : `/${path}`
    const segments = toSegments(normalized)

    let best: string | null = null
    let bestStatic = -1
    for (const { pattern, segments: patternSegments } of PATTERN_SEGMENTS) {
      if (patternSegments.length !== segments.length) continue
      let matched = true
      let staticCount = 0
      for (let i = 0; i < patternSegments.length; i++) {
        const patternSegment = patternSegments[i]!
        if (patternSegment.startsWith(':')) continue // wildcard — matches any value
        if (patternSegment !== segments[i]) {
          matched = false
          break
        }
        staticCount += 1
      }
      // Prefer the match with the most static segments (most specific).
      if (matched && staticCount > bestStatic) {
        best = pattern
        bestStatic = staticCount
      }
    }

    if (best) return best.slice(0, 128)
    // Unknown route: never echo the path. Keep only the surface it was on.
    return segments[0] === 'app' ? '/app/:unknown' : '/unknown'
  } catch {
    /* A scrubbing failure must never block a report — degrade to a safe label. */
    return '/unknown'
  }
}
