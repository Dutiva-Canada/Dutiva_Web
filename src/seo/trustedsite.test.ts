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

const html = raw(
  import.meta.glob('../../index.html', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  'index.html',
)

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

describe('TrustedSite main code', () => {
  it('ships the vendor snippet on the marketing HTML template', () => {
    expect(html).toContain('https://cdn.ywxi.net/js/1.js')
  })

  it('allows the origins TrustedSite documents, without style-src unsafe-inline', () => {
    const parsed = JSON.parse(vercel) as {
      headers: Array<{ headers: Array<{ key: string; value: string }> }>
    }
    const csp = parsed.headers
      .flatMap((block) => block.headers)
      .find((header) => header.key === 'Content-Security-Policy')?.value
    expect(csp).toBeDefined()
    expect(csp).toContain('https://cdn.ywxi.net')
    expect(csp).toContain('https://www.trustedsite.com')
    expect(csp).toContain('https://s3-us-west-2.amazonaws.com')
    expect(csp).not.toMatch(/style-src[^;]*'unsafe-inline'/)
  })

  it('keeps the e2e static server CSP in lockstep with vercel.json', () => {
    const parsed = JSON.parse(vercel) as {
      headers: Array<{ headers: Array<{ key: string; value: string }> }>
    }
    const csp = parsed.headers
      .flatMap((block) => block.headers)
      .find((header) => header.key === 'Content-Security-Policy')?.value
    expect(serveDist).toContain(csp)
  })
})
