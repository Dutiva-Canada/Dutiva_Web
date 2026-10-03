/**
 * pr-mentions-feed/handlers.ts — pure, Deno-free helpers so vitest can cover
 * the RSS/Atom parsing directly (edge index.ts imports these).
 */

export interface FeedItem {
  title: string
  link: string
  /** ISO timestamp, or null when the feed didn't carry a parseable date. */
  publishedAt: string | null
  /** Outlet/site name when the feed declares one (RSS <source>, Atom source). */
  source: string
}

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  /* Latin-1 + punctuation entities that news feeds actually carry — French
     coverage especially (é, è, à, ç, œ) and typographic quotes/dashes. */
  eacute: 'é', Eacute: 'É', egrave: 'è', ecirc: 'ê', euml: 'ë',
  agrave: 'à', acirc: 'â', auml: 'ä',
  icirc: 'î', iuml: 'ï', ocirc: 'ô', ouml: 'ö',
  ugrave: 'ù', ucirc: 'û', uuml: 'ü', ccedil: 'ç', oelig: 'œ',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  hellip: '…', mdash: '—', ndash: '–', bull: '•', trade: '™', reg: '®', copy: '©',
}

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, key: string) => {
    const k = key.toLowerCase()
    if (k.startsWith('#x')) return String.fromCodePoint(parseInt(k.slice(2), 16))
    if (k.startsWith('#')) return String.fromCodePoint(parseInt(k.slice(1), 10))
    return ENTITY_MAP[key] ?? ENTITY_MAP[k] ?? m
  })
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

/** Pull a tag's text, tolerating CDATA wrappers and missing tags. */
function tagText(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,
    'i',
  )
  const m = block.match(re)
  if (!m) return ''
  const inner = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  return decodeEntities(stripTags(inner)).trim()
}

/** Atom <link> carries the target in an href attribute. */
function atomLink(block: string): string {
  const alternates = [...block.matchAll(/<link\s[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => !/rel=["']?(?!alternate)/i.test(t) || /rel=["']alternate["']?/i.test(t))
  const tag = alternates[0] ?? block.match(/<link\s[^>]*>/i)?.[0] ?? ''
  const href = tag.match(/href=["']([^"']+)["']/i)?.[1] ?? ''
  return decodeEntities(href).trim()
}

/**
 * Google Alerts wraps every link in a /url?rct=j&url=… redirect — store the
 * real destination so dedupe keys and "View" clicks point at the article.
 */
export function unwrapGoogleRedirect(link: string): string {
  try {
    const u = new URL(link)
    if (
      (u.hostname === 'www.google.com' || u.hostname === 'google.com') &&
      u.pathname === '/url'
    ) {
      const target = u.searchParams.get('url') ?? u.searchParams.get('q')
      if (target && /^https?:\/\//i.test(target)) return target
    }
  } catch {
    /* not a parseable URL — return as-is */
  }
  return link
}

function toIso(raw: string): string | null {
  if (!raw) return null
  const t = Date.parse(raw)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/** Channel/feed title — used as the mention's source fallback. */
function feedTitle(xml: string): string {
  return tagText(xml.slice(0, xml.search(/<(item|entry)[\s>]/i) + 1 || xml.length), 'title')
}

/** Tolerant RSS 2.0 + Atom parser. Returns newest-first order as published. */
export function parseFeedItems(xml: string): FeedItem[] {
  const channelTitle = feedTitle(xml)
  const items: FeedItem[] = []

  /* RSS 2.0 */
  for (const m of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)) {
    const block = m[1]
    const link = tagText(block, 'link')
    items.push({
      title: tagText(block, 'title'),
      link: unwrapGoogleRedirect(link),
      publishedAt: toIso(
        tagText(block, 'pubDate') || tagText(block, 'date') || tagText(block, 'dc:date'),
      ),
      source:
        tagText(block, 'source') ||
        hostnameOf(unwrapGoogleRedirect(link)) ||
        channelTitle,
    })
  }

  /* Atom */
  for (const m of xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi)) {
    const block = m[1]
    const link = atomLink(block)
    items.push({
      title: tagText(block, 'title'),
      link: unwrapGoogleRedirect(link),
      publishedAt: toIso(tagText(block, 'published') || tagText(block, 'updated')),
      source:
        tagText(block, 'source') ||
        hostnameOf(unwrapGoogleRedirect(link)) ||
        channelTitle,
    })
  }

  return items.filter((i) => i.title !== '' || i.link !== '')
}

function hostnameOf(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
