import type { Bi } from '@/i18n/core'

export interface ParsedFeedItem {
  title: string
  url?: string
  publishedDate?: string
  publisher?: string
  summary?: string
}

function selectText(element: Element | null, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const match = element?.querySelector(selector)
    if (match?.textContent) return match.textContent.trim()
  }
  return undefined
}

function linkHref(item: Element): string | undefined {
  const link = item.querySelector('link')
  if (link?.getAttribute('href')) return link.getAttribute('href') ?? undefined
  if (link?.textContent) return link.textContent.trim()
  return undefined
}

function parseRss(doc: Document, fallbackPublisher?: string): ParsedFeedItem[] {
  const channel = doc.querySelector('channel')
  const channelTitle = channel?.querySelector('title')?.textContent?.trim() ?? fallbackPublisher
  const items = Array.from(doc.querySelectorAll('item'))
  return items.map((item) => ({
    title: selectText(item, ['title']) ?? '(untitled)',
    url: linkHref(item),
    publishedDate: selectText(item, ['pubDate', 'date']),
    publisher: channelTitle,
    summary: selectText(item, ['description', 'summary'])
  }))
}

function parseAtom(doc: Document, fallbackPublisher?: string): ParsedFeedItem[] {
  const feedTitle = doc.querySelector('feed > title')?.textContent?.trim() ?? fallbackPublisher
  const entries = Array.from(doc.querySelectorAll('entry'))
  return entries.map((entry) => {
    const linkEl = entry.querySelector('link')
    const idText = entry.querySelector('id')?.textContent?.trim()
    const url = linkEl?.getAttribute('href') ?? (idText?.startsWith('http') ? idText : undefined)
    return {
      title: selectText(entry, ['title']) ?? '(untitled)',
      url,
      publishedDate:
        selectText(entry, ['updated', 'published', 'issued']) ??
        selectText(entry, ['modified']),
      publisher: feedTitle,
      summary: selectText(entry, ['summary', 'content', 'subtitle']),
    }
  })
}

export function detectFeedFormat(xml: string): 'rss' | 'atom' | 'unknown' {
  if (/<feed[^>]*\bxmlns=['"]?http:\/\/www\.w3\.org\/2005\/Atom['"]?/i.test(xml)) return 'atom'
  if (/<rss[^>]*\bversion=/i.test(xml)) return 'rss'
  if (/<channel>/.test(xml) && /<item>/.test(xml)) return 'rss'
  return 'unknown'
}

export function parseFeedXml(xml: string, fallbackPublisher?: string): ParsedFeedItem[] {
  if (typeof DOMParser === 'undefined') return []
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) return []
  const format = detectFeedFormat(xml)
  if (format === 'atom') return parseAtom(doc, fallbackPublisher)
  if (format === 'rss') return parseRss(doc, fallbackPublisher)
  return []
}

export function feedItemToSource(
  item: ParsedFeedItem,
  publisherLabel: Bi,
  classificationLabel: Bi,
  initiativeId?: string,
) {
  return {
    sourceType: 'news' as const,
    publisher: publisherLabel,
    publishedDate: item.publishedDate ? item.publishedDate.slice(0, 10) : undefined,
    retrievedAt: new Date().toISOString(),
    url: item.url,
    classification: classificationLabel,
    supports: { en: item.title, fr: item.title } as Bi,
    initiativeId,
  }
}
