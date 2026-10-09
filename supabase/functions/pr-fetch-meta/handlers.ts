/**
 * Pure helpers for the pr-fetch-meta edge function — kept DOM-free so the
 * same file is testable under vitest (mirrors invest-bot/handlers.ts).
 *
 * The function's job: given a URL the user pasted into the coverage log,
 * fetch the page and pull out the bits worth prefilling — headline, site
 * name, publish date. Best-effort: anything not found comes back ''.
 */

export interface PageMeta {
  title: string
  source: string
  publishedAt: string | null
}

const PRIVATE_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
])

/** http(s) only, and never a literal private/loopback IP or internal
    hostname — the function fetches user-supplied URLs, so this is the
    SSRF boundary. DNS-level rebinding is out of scope for a gated,
    low-throughput admin tool; literal/private hosts are refused outright. */
export function assertPublicHttpUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new Error('invalid_url')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('invalid_url')
  }
  const host = url.hostname.toLowerCase()
  if (PRIVATE_HOSTNAMES.has(host) || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('private_url')
  }
  if (isPrivateIpv4(host) || host === '::1' || host.startsWith('[')) {
    throw new Error('private_url')
  }
  return url
}

function isPrivateIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 0 && b === 0) ||
    a >= 224
  )
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function metaContent(html: string, ...keys: string[]): string {
  for (const key of keys) {
    // <meta property="og:title" content="…"> with attributes in any order.
    const re = new RegExp(
      `<meta\\s+[^>]*?(?:property|name)=["']${key}["'][^>]*?content=["']([^"']+)["']` +
        `|<meta\\s+[^>]*?content=["']([^"']+)["'][^>]*?(?:property|name)=["']${key}["']`,
      'i',
    )
    const m = html.match(re)
    const v = m?.[1] ?? m?.[2]
    if (v) return decodeEntities(v)
  }
  return ''
}

/** Pull headline, site name, and publish date out of an HTML document. */
export function extractPageMeta(html: string, pageUrl: string): PageMeta {
  const title =
    metaContent(html, 'og:title', 'twitter:title') ||
    decodeEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '')
  const source = metaContent(html, 'og:site_name', 'application-name') ||
    (() => {
      try {
        return new URL(pageUrl).hostname.replace(/^www\./, '')
      } catch {
        return ''
      }
    })()
  const rawDate = metaContent(
    html,
    'article:published_time',
    'datepublished',
    'date',
    'dc.date',
    'parsely-pub-date',
  )
  const publishedAt = rawDate && !Number.isNaN(Date.parse(rawDate)) ? rawDate : null
  return { title, source, publishedAt }
}
