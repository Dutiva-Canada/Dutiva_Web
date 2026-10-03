import { describe, expect, it } from 'vitest'
import { assertPublicHttpUrl, extractPageMeta } from './handlers'

describe('assertPublicHttpUrl', () => {
  it('accepts ordinary https URLs', () => {
    expect(assertPublicHttpUrl('https://example.com/a?b=1').hostname).toBe('example.com')
  })

  it('rejects non-http schemes and unparseable input', () => {
    for (const bad of ['', 'not a url', 'file:///etc/passwd', 'ftp://x.test/', 'javascript:alert(1)']) {
      expect(() => assertPublicHttpUrl(bad)).toThrow('invalid_url')
    }
  })

  it('rejects loopback, private ranges, and internal hostnames', () => {
    for (const host of [
      'http://127.0.0.1/',
      'http://10.0.0.4/',
      'http://192.168.1.1/',
      'http://172.16.0.1/',
      'http://169.254.169.254/latest/meta-data',
      'http://localhost:8080/',
      'https://metadata.google.internal/',
      'http://router.local/',
      'http://[::1]/',
    ]) {
      expect(() => assertPublicHttpUrl(host), host).toThrow('private_url')
    }
  })

  it('bounds the 172.16-31 private range exactly', () => {
    expect(assertPublicHttpUrl('http://172.15.0.1/').hostname).toBe('172.15.0.1')
    expect(() => assertPublicHttpUrl('http://172.31.255.1/')).toThrow('private_url')
    expect(() => assertPublicHttpUrl('http://172.32.0.1/')).not.toThrow()
  })
})

describe('extractPageMeta', () => {
  const html = `
    <html><head>
      <title>Fallback title — Site</title>
      <meta property="og:title" content="The real headline &amp; more" />
      <meta property="og:site_name" content="Trade Weekly" />
      <meta property="article:published_time" content="2026-09-14T13:00:00Z" />
    </head><body></body></html>`

  it('prefers og:title and og:site_name over the title tag and hostname', () => {
    const meta = extractPageMeta(html, 'https://www.example.com/story')
    expect(meta.title).toBe('The real headline & more')
    expect(meta.source).toBe('Trade Weekly')
    expect(meta.publishedAt).toBe('2026-09-14T13:00:00Z')
  })

  it('falls back to <title> and the URL hostname when og tags are absent', () => {
    const meta = extractPageMeta(
      '<html><head><title>Plain page</title></head></html>',
      'https://www.cbc.ca/news/x',
    )
    expect(meta.title).toBe('Plain page')
    expect(meta.source).toBe('cbc.ca')
    expect(meta.publishedAt).toBeNull()
  })

  it('handles meta attributes in either order and decodes entities', () => {
    const meta = extractPageMeta(
      '<meta content="Fish &amp; Chips &quot;takeout&quot; &#8212; now" property="og:title">',
      'https://x.test/',
    )
    expect(meta.title).toBe('Fish & Chips "takeout" — now')
  })

  it('returns empty fields rather than throwing on junk', () => {
    const meta = extractPageMeta('not html at all', 'https://x.test/')
    expect(meta.title).toBe('')
    expect(meta.source).toBe('x.test')
  })
})
