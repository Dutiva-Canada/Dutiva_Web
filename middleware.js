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
 *    Matcher entries for those paths are exact — /assets/AboutPage-….js must
 *    not hit this.
 */

const APEX_HOST = 'dutiva.ca'
const WWW_HOST = 'www.dutiva.ca'
/** Keep in sync with vercel.json Strict-Transport-Security. */
const HSTS = 'max-age=63072000; includeSubDomains'

const DIRECTORY_INDEXES = new Set(['/assets', '/brand', '/.well-known'])

export const config = {
  matcher: [
    {
      source: '/:path*',
      has: [{ type: 'host', value: WWW_HOST }],
    },
    '/assets',
    '/brand',
    '/.well-known',
  ],
}

export default function middleware(request) {
  const url = new URL(request.url)

  if (url.hostname === WWW_HOST) {
    url.hostname = APEX_HOST
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
