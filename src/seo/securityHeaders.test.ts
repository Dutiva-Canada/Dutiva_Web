/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it } from 'vitest'

function raw(glob: Record<string, string>, suffix: string): string {
  const hit = Object.entries(glob).find(([filePath]) => filePath.endsWith(suffix))
  if (!hit) throw new Error(`${suffix} not found`)
  return hit[1]
}

const vercel = raw(
  import.meta.glob('../../vercel.json', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  'vercel.json',
)

const serveDist = raw(
  import.meta.glob('../../e2e/serve-dist.mjs', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  'serve-dist.mjs',
)

const middleware = raw(
  import.meta.glob('../../middleware.js', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  'middleware.js',
)

const routeTable = raw(
  import.meta.glob('../../src/app/routes.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  'routes.tsx',
)

type HeaderBlock = {
  source: string
  headers: Array<{ key: string; value: string }>
}

function parsedHeaders(): HeaderBlock[] {
  return (JSON.parse(vercel) as { headers: HeaderBlock[] }).headers
}

function securityBlock(): HeaderBlock {
  const block = parsedHeaders().find((entry) =>
    entry.headers.some((header) => header.key === 'X-Frame-Options'),
  )
  if (!block) throw new Error('security header block not found')
  return block
}

function headerValue(block: HeaderBlock, key: string): string | undefined {
  return block.headers.find((header) => header.key === key)?.value
}

describe('HTTP security headers', () => {
  it('applies clickjacking and MIME-sniff headers on / as well as nested paths', () => {
    const block = securityBlock()
    expect(block.source).toBe('/(.*)')
    expect(headerValue(block, 'X-Frame-Options')).toBe('DENY')
    expect(headerValue(block, 'X-Content-Type-Options')).toBe('nosniff')
    expect(headerValue(block, 'Content-Security-Policy')).toMatch(/frame-ancestors 'none'/)
    expect(headerValue(block, 'Content-Security-Policy')).toMatch(/upgrade-insecure-requests/)
  })

  it('ships a broad Permissions-Policy deny list for unused powerful features', () => {
    const policy = headerValue(securityBlock(), 'Permissions-Policy')
    expect(policy).toBeDefined()
    for (const feature of [
      'camera',
      'microphone',
      'geolocation',
      'payment',
      'usb',
      'browsing-topics',
      'interest-cohort',
    ]) {
      expect(policy).toContain(`${feature}=()`)
    }
    expect(serveDist).toContain(policy)
  })

  it('ships cross-origin isolation headers that do not break third-party embeds', () => {
    const block = securityBlock()
    expect(headerValue(block, 'Cross-Origin-Opener-Policy')).toBe('same-origin-allow-popups')
    expect(headerValue(block, 'Cross-Origin-Resource-Policy')).toBe('same-origin')
    expect(headerValue(block, 'Origin-Agent-Cluster')).toBe('?1')
    expect(headerValue(block, 'X-Permitted-Cross-Domain-Policies')).toBe('none')
    expect(headerValue(block, 'X-DNS-Prefetch-Control')).toBe('off')
    expect(headerValue(block, 'Cross-Origin-Embedder-Policy')).toBeUndefined()
    expect(vercel).not.toMatch(/Clear-Site-Data/)
    expect(vercel).not.toMatch(/X-XSS-Protection/)
    expect(serveDist).toContain("'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'")
    expect(serveDist).toContain("'Cross-Origin-Resource-Policy': 'same-origin'")
  })

  it('does not send a wildcard CORS origin', () => {
    const allowOrigin = headerValue(securityBlock(), 'Access-Control-Allow-Origin')
    expect(allowOrigin).toBe('https://dutiva.ca')
    expect(allowOrigin).not.toBe('*')
    expect(vercel).not.toMatch(/Access-Control-Allow-Origin['":\s]+\*/)
  })

  it('keeps the e2e static server security headers in lockstep with vercel.json', () => {
    const block = securityBlock()
    expect(serveDist).toContain(headerValue(block, 'Content-Security-Policy'))
    expect(serveDist).toContain("'X-Frame-Options': 'DENY'")
    expect(serveDist).toContain("'X-Content-Type-Options': 'nosniff'")
    expect(serveDist).toContain("'Access-Control-Allow-Origin': 'https://dutiva.ca'")
    expect(serveDist).toContain(
      "DIRECTORY_INDEXES = new Set(['/assets', '/brand', '/.well-known'])",
    )
    expect(serveDist).toContain("['/support@dutiva.ca', '/contact']")
    expect(vercel).toMatch(/"source": "\/support@dutiva\.ca"[\s\S]*noindex, nofollow/)
  })

  it('404s folder indexes that would otherwise list hashed files', () => {
    expect(middleware).toContain("'/assets'")
    expect(middleware).toContain("'/brand'")
    expect(middleware).toContain("'/.well-known'")
    expect(middleware).toContain('status: 404')
    expect(middleware).toContain("'/:path*'")
    expect(middleware).not.toContain('/assets/:path*')
  })

  it('redirects www to apex with the full HSTS policy (not Vercel default)', () => {
    expect(middleware).toContain("hostname === 'www.dutiva.ca'")
    expect(middleware).toContain("hostname = 'dutiva.ca'")
    expect(middleware).toContain("HSTS = 'max-age=63072000; includeSubDomains'")
    expect(middleware).toContain('status: 308')
    expect(middleware).not.toMatch(/has:\s*\[\s*\{\s*type:\s*'host'/)
    expect(headerValue(securityBlock(), 'Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains',
    )
    const parsed = JSON.parse(vercel) as { redirects?: unknown[] }
    expect(parsed.redirects ?? []).toHaveLength(0)
  })

  it('points security.txt Policy at the current Dutiva_Web SECURITY.md', () => {
    const securityTxt = raw(
      import.meta.glob('../../public/.well-known/security.txt', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
      'security.txt',
    )
    expect(securityTxt).toContain(
      'Policy: https://github.com/Dutiva-Canada/Dutiva_Web/blob/main/SECURITY.md',
    )
    expect(securityTxt).not.toContain('Dutiva-Website-Final-Design')
  })

  it('serves the contact page at crawler-invented /support@dutiva.ca (200, not a redirect)', () => {
    const parsed = JSON.parse(vercel) as {
      redirects: Array<{ source: string; destination: string }>
      rewrites: Array<{ source: string; destination: string }>
    }
    expect(parsed.redirects).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '/support@dutiva.ca' }),
        expect.objectContaining({ source: '/fr/support@dutiva.ca' }),
      ]),
    )
    expect(parsed.rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '/support@dutiva.ca', destination: '/contact' }),
        expect.objectContaining({
          source: '/fr/support@dutiva.ca',
          destination: '/fr/contact',
        }),
      ]),
    )
    expect(routeTable).toContain("'/support@dutiva.ca'")
    expect(routeTable).toContain("'/fr/support@dutiva.ca'")
  })
})
