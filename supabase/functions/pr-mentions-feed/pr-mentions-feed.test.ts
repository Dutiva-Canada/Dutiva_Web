import { describe, expect, it } from 'vitest'
import { decodeEntities, dedupeFeedItems, negativeAutoItems, parseFeedItems, toneCounts, unwrapGoogleRedirect } from './handlers'

describe('decodeEntities', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeEntities('Caf&eacute; &amp; Co &#8212; fine')).toBe('Café & Co — fine')
    expect(decodeEntities('&#x27;quoted&#x27;')).toBe("'quoted'")
  })

  it('leaves unknown entities alone', () => {
    expect(decodeEntities('a &bogus; b')).toBe('a &bogus; b')
  })
})

describe('unwrapGoogleRedirect', () => {
  it('extracts the real target from a Google redirect link', () => {
    expect(
      unwrapGoogleRedirect(
        'https://www.google.com/url?rct=j&sa=t&url=https%3A%2F%2Fexample.com%2Fstory&ct=ga',
      ),
    ).toBe('https://example.com/story')
  })

  it('returns ordinary links unchanged', () => {
    expect(unwrapGoogleRedirect('https://cbc.ca/news/x')).toBe('https://cbc.ca/news/x')
    expect(unwrapGoogleRedirect('not a url')).toBe('not a url')
  })
})

describe('parseFeedItems', () => {
  it('parses an RSS 2.0 feed with CDATA and entities', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel>
        <title>Dutiva alerts</title>
        <item>
          <title><![CDATA[HR firm <b>Dutiva</b> expands &amp; grows]]></title>
          <link>https://www.google.com/url?rct=j&url=https%3A%2F%2Foutlet.ca%2Fstory-1</link>
          <pubDate>Mon, 10 Nov 2025 09:00:00 GMT</pubDate>
          <source url="https://outlet.ca">Outlet News</source>
        </item>
        <item>
          <title>Second story</title>
          <link>https://other.example/page</link>
        </item>
      </channel></rss>`
    const items = parseFeedItems(xml)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('HR firm Dutiva expands & grows')
    expect(items[0].link).toBe('https://outlet.ca/story-1')
    expect(items[0].source).toBe('Outlet News')
    expect(items[0].publishedAt).toBe(new Date('2025-11-10T09:00:00Z').toISOString())
    // No <source> — falls back to the link's host, not the feed title.
    expect(items[1].source).toBe('other.example')
    expect(items[1].publishedAt).toBeNull()
  })

  it('parses an Atom feed (link href, published)', () => {
    const xml = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Sector watch</title>
        <entry>
          <title>Atom story</title>
          <link rel="alternate" href="https://site.example/a1"/>
          <published>2025-11-08T14:30:00Z</published>
        </entry>
      </feed>`
    const items = parseFeedItems(xml)
    expect(items).toHaveLength(1)
    expect(items[0].link).toBe('https://site.example/a1')
    expect(items[0].publishedAt).toBe('2025-11-08T14:30:00.000Z')
    expect(items[0].source).toBe('site.example')
  })

  it('drops items with neither title nor link', () => {
    const xml = `<rss><channel><title>T</title><item><description>only a description</description></item></channel></rss>`
    expect(parseFeedItems(xml)).toHaveLength(0)
  })

  it('uses a permalink <guid> when an RSS item has no <link>', () => {
    const xml = `<rss><channel><title>T</title>
      <item>
        <title>Guid story</title>
        <guid isPermaLink="true">https://outlet.example/story-9</guid>
      </item>
      <item>
        <title>Non-url guid stays linkless</title>
        <guid isPermaLink="false">tag:example.com,2025:x1</guid>
      </item>
    </channel></rss>`
    const items = parseFeedItems(xml)
    expect(items[0].link).toBe('https://outlet.example/story-9')
    expect(items[1].link).toBe('')
    expect(items[1].title).toBe('Non-url guid stays linkless')
  })

  it('uses a URL-shaped <id> when an Atom entry has no alternate link', () => {
    const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><title>T</title>
      <entry>
        <title>Id story</title>
        <id>https://site.example/entry-1</id>
      </entry>
      <entry>
        <title>Uuid id stays linkless</title>
        <id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
      </entry>
    </feed>`
    const items = parseFeedItems(xml)
    expect(items[0].link).toBe('https://site.example/entry-1')
    expect(items[1].link).toBe('')
  })

  it('returns nothing for non-feed input', () => {
    expect(parseFeedItems('<html><body>not a feed</body></html>')).toHaveLength(0)
    expect(parseFeedItems('')).toHaveLength(0)
  })
})

describe('toneCounts', () => {
  it('counts only machine-tagged items', () => {
    const c = toneCounts([
      { sentiment: 'positive', sentimentAuto: true },
      { sentiment: 'positive', sentimentAuto: true },
      { sentiment: 'negative', sentimentAuto: true },
      /* no tag → no count: keeps an unclassified batch from reading as
         "all neutral" in the digest */
      { sentiment: 'neutral' },
      { sentiment: 'positive' },
    ])
    expect(c).toEqual({ positive: 2, neutral: 0, negative: 1 })
  })

  it('maps unexpected values to neutral and zeroes an untagged batch', () => {
    const c = toneCounts([
      { sentiment: 'mixed', sentimentAuto: true },
      { sentiment: undefined, sentimentAuto: true },
    ])
    expect(c).toEqual({ positive: 0, neutral: 2, negative: 0 })
    expect(toneCounts([{ sentiment: 'positive' }, {}]))
      .toEqual({ positive: 0, neutral: 0, negative: 0 })
  })
})

describe('negativeAutoItems', () => {
  it('selects only auto-tagged negatives — the interrupt never fires on a guess', () => {
    const items = [
      { title: 'a', sentiment: 'negative', sentimentAuto: true },
      /* machine said negative but flag missing → not an auto read */
      { title: 'b', sentiment: 'negative' },
      /* human-set or fallback values never qualify */
      { title: 'c', sentiment: 'negative', sentimentAuto: false },
      { title: 'd', sentiment: 'neutral', sentimentAuto: true },
      { title: 'e', sentiment: 'positive', sentimentAuto: true },
    ]
    expect(negativeAutoItems(items).map((i) => i.title)).toEqual(['a'])
  })

  it('returns empty when the classifier never ran', () => {
    expect(
      negativeAutoItems([{ sentiment: 'negative' }, { sentiment: 'neutral' }]),
    ).toEqual([])
  })
})

describe('dedupeFeedItems', () => {
  const item = (link: string, title = 'Story'): { link: string; title: string; publishedAt: null; source: string } =>
    ({ link, title, publishedAt: null, source: 'Outlet' })
  const known = (urls: string[] = [], titles: string[] = []) => ({
    urls: new Set(urls),
    linklessTitles: new Set(titles.map((t) => t.trim().toLowerCase())),
  })

  it('keeps fresh urls, drops desk-known and in-batch repeat links', () => {
    const out = dedupeFeedItems(
      [item('https://a.ca/1'), item('https://b.ca/2'), item('https://a.ca/1'), item('https://c.ca/3')],
      known(['https://c.ca/3']),
    )
    expect(out.map((i) => i.link)).toEqual(['https://a.ca/1', 'https://b.ca/2'])
  })

  it('linkless items log once — deduped on their normalized title', () => {
    const out = dedupeFeedItems(
      [item('', 'Trade deal signed'), item('', 'trade deal SIGNED'), item('', 'Other piece')],
      known(),
    )
    expect(out.map((i) => i.title)).toEqual(['Trade deal signed', 'Other piece'])
  })

  it('drops a linkless item whose title the desk already logged', () => {
    const out = dedupeFeedItems([item('', 'Known headline')], known([], ['known headline']))
    expect(out).toEqual([])
  })

  it('an item with no link and no title has no dedupe key — dropped', () => {
    const out = dedupeFeedItems([item('', '  ')], known())
    expect(out).toEqual([])
  })
})
