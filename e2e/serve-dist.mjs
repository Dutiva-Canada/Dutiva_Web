/**
 * A static file server for the production build, matching how Vercel serves it
 * (vercel.json) so the e2e suite exercises the real dist/ — prerendered HTML,
 * hashed assets, the SPA shell — rather than the dev server, which chunks and
 * routes differently from what actually ships.
 *
 * The routing contract it mirrors:
 *   - /app and /app/*  → app.html          (the client-rendered SPA shell)
 *   - trailingSlash:false clean URLs        (/about → dist/about/index.html)
 *   - real files served directly            (/assets/*, /robots.txt, /sw.js)
 *   - anything unmatched → 404.html with a 404 status
 *
 * Dependency-free (Node's http/fs only) so the e2e harness carries no server
 * framework. Reads dist/ that `npm run build` produced; it does not build.
 */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extname, join, normalize, sep } from 'node:path'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const PORT = Number(process.env.PORT) || 4173

/** Keep in sync with vercel.json `Content-Security-Policy`. */
const CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; worker-src 'self'; manifest-src 'self'; script-src 'self' 'sha256-gOx3nRh8znDQR7T1VkI+fFXDgsNzf5enQqdi7NP11Vk=' https://www.googletagmanager.com https://challenges.cloudflare.com https://js.hcaptcha.com https://newassets.hcaptcha.com; style-src 'self' https://fonts.googleapis.com https://newassets.hcaptcha.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://*.challenges.cloudflare.com; connect-src 'self' https://khtwpxnvziiyplaflwru.supabase.co wss://khtwpxnvziiyplaflwru.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://api.hcaptcha.com https://js.hcaptcha.com https://challenges.cloudflare.com https://*.challenges.cloudflare.com; frame-src https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://newassets.hcaptcha.com"

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

/** Resolve a request pathname to a file in dist and its HTTP status. */
async function resolve(pathname) {
  // /app and /app/* are rewritten to the SPA shell (vercel.json rewrites).
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    return { file: join(DIST, 'app.html'), status: 200 }
  }

  // Decode and strip any traversal before joining, then confirm the result is
  // still inside dist — a static server must never serve outside its root.
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    decoded = pathname
  }
  const rel = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '')
  const base = join(DIST, rel)
  if (base !== DIST && !base.startsWith(DIST + sep)) {
    return { file: join(DIST, '404.html'), status: 404 }
  }

  const candidates =
    pathname === '/'
      ? [join(DIST, 'index.html')]
      : [base, join(base, 'index.html'), `${base}.html`]
  for (const candidate of candidates) {
    if (await isFile(candidate)) return { file: candidate, status: 200 }
  }
  return { file: join(DIST, '404.html'), status: 404 }
}

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
    const { file, status } = await resolve(pathname)
    const body = await readFile(file)
    res.writeHead(status, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Content-Security-Policy': CSP,
    })
    res.end(body)
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`serve-dist error: ${error.message}`)
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`serve-dist: http://127.0.0.1:${PORT} → ${DIST}`)
})
