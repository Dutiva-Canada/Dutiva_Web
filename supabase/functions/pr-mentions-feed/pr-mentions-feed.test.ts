import { describe, expect, it } from 'vitest'
import { decodeEntities, parseFeedItems, unwrapGoogleRedirect } from './handlers'

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

  it('returns nothing for non-feed input', () => {
    expect(parseFeedItems('<html><body>not a feed</body></html>')).toHaveLength(0)
    expect(parseFeedItems('')).toHaveLength(0)
  })
})
