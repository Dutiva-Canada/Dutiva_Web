import { describe, expect, it } from 'vitest'
import { detectFeedFormat, parseFeedXml } from './feedParser'

const RSS_XML = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example News</title>
    <item>
      <title>Headline one</title>
      <link>https://example.com/one</link>
      <pubDate>Mon, 06 Sep 2026 12:00:00 GMT</pubDate>
      <description>Summary one</description>
    </item>
    <item>
      <title>Headline two</title>
      <link>https://example.com/two</link>
    </item>
  </channel>
</rss>`

const ATOM_XML = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Atom</title>
  <entry>
    <title>Atom one</title>
    <link href="https://example.com/atom-one"/>
    <updated>2026-09-06T12:00:00Z</updated>
    <summary>Atom summary</summary>
  </entry>
</feed>`

describe('feedParser', () => {
  it('detects RSS and Atom formats', () => {
    expect(detectFeedFormat(RSS_XML)).toBe('rss')
    expect(detectFeedFormat(ATOM_XML)).toBe('atom')
    expect(detectFeedFormat('<html></html>')).toBe('unknown')
  })

  it('parses RSS items', () => {
    const items = parseFeedXml(RSS_XML, 'Fallback')
    expect(items).toHaveLength(2)
    expect(items[0]!).toMatchObject({
      title: 'Headline one',
      url: 'https://example.com/one',
      publisher: 'Example News',
      summary: 'Summary one',
    })
    expect(items[1]!.title).toBe('Headline two')
    expect(items[1]!.url).toBe('https://example.com/two')
  })

  it('parses Atom entries', () => {
    const items = parseFeedXml(ATOM_XML, 'Fallback')
    expect(items).toHaveLength(1)
    expect(items[0]!).toMatchObject({
      title: 'Atom one',
      url: 'https://example.com/atom-one',
      publisher: 'Example Atom',
      summary: 'Atom summary',
    })
  })

  it('returns an empty array for invalid XML', () => {
    expect(parseFeedXml('<not-a-feed></not-a-feed>')).toEqual([])
  })
})
