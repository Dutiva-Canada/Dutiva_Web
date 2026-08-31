/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */

/**
 * Vercel Directory Listing is on for this project, so a request for a folder
 * with no index file (notably /assets, /brand, /.well-known) returns an HTML
 * inventory of every hashed bundle. Hashed files stay public at their exact
 * URLs; only the directory index is closed.
 *
 * Matcher is exact paths only — /assets/AboutPage-….js must not hit this.
 */
export const config = {
  matcher: ['/assets', '/brand', '/.well-known'],
}

export default function middleware() {
  return new Response('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
