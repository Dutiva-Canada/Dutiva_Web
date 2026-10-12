import { describe, expect, it } from 'vitest'
import { parseChatSources } from './portalChatUtils'

describe('parseChatSources', () => {
  it('returns clean rows for the wire payload', () => {
    expect(
      parseChatSources([
        { label: 'AMD — delayed market data on file' },
        { label: '"AMD unveils new AI chips" — Reuters', url: 'https://reuters.com/amd' },
        { label: '"Apply" — your application', url: '/careers/portal/jobs/p-1/apply' },
      ]),
    ).toEqual([
      { label: 'AMD — delayed market data on file' },
      { label: '"AMD unveils new AI chips" — Reuters', url: 'https://reuters.com/amd' },
      { label: '"Apply" — your application', url: '/careers/portal/jobs/p-1/apply' },
    ])
  })

  it('non-array payloads and label-less entries drop out', () => {
    expect(parseChatSources(null)).toEqual([])
    expect(parseChatSources('x')).toEqual([])
    expect(parseChatSources([{ url: 'https://x.ca' }, 'junk', { label: '  ' }])).toEqual([])
  })

  it('malformed urls fall back to a plain label — never a link', () => {
    expect(
      parseChatSources([
        { label: 'no scheme', url: 'example.com/page' },
        { label: 'js scheme', url: 'javascript:alert(1)' },
        { label: 'fine', url: 'https://ok.ca' },
      ]),
    ).toEqual([{ label: 'no scheme' }, { label: 'js scheme' }, { label: 'fine', url: 'https://ok.ca' }])
  })

  it('dedupes identical rows and caps the list', () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ label: `s${i}` }))
    const out = parseChatSources([...rows, rows[0], { label: 's0' }])
    expect(out.length).toBe(10)
    expect(new Set(out.map((s) => s.label)).size).toBe(10)
  })
})
