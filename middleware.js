/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */

/**
 * Edge middleware for two host-level concerns:
 *
 * 1. www → apex redirect with the same HSTS policy as vercel.json. Host-based
 *    redirects in vercel.json return Vercel's default
 *    `Strict-Transport-Security: max-age=…` without `includeSubDomains`, which
 *    security scanners (and HSTS preload rules) reject.
 *
 * 2. Directory indexes — Vercel Directory Listing is on for this project, so a
 *    request for a folder with no index file (notably /assets, /brand,
 *    /.well-known) returns an HTML inventory of every hashed bundle. Hashed
 *    files stay public at their exact URLs; only the directory index is closed.
 *
 * Matcher note: this project's Vercel middleware bundler only accepts string
 * path matchers (not `{ source, has }` objects), so hostname checks run in the
 * handler. Exact directory paths are listed first so hashed asset URLs under
 * `/assets/…` still match `/:path*` but the directory-index 404 only fires on
 * the bare folder paths.
 */

/** Keep in sync with vercel.json Strict-Transport-Security. */
const HSTS = 'max-age=63072000; includeSubDomains'

const DIRECTORY_INDEXES = new Set(['/assets', '/brand', '/.well-known'])

export const config = {
  matcher: ['/assets', '/brand', '/.well-known', '/:path*'],
}

export default function middleware(request) {
  const url = new URL(request.url)

  if (url.hostname === 'www.dutiva.ca') {
    url.hostname = 'dutiva.ca'
    return new Response(null, {
      status: 308,
      headers: {
        Location: url.toString(),
        'Strict-Transport-Security': HSTS,
      },
    })
  }

  if (DIRECTORY_INDEXES.has(url.pathname)) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  return undefined
}
