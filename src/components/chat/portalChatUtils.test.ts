import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatTurnDay, parseChatSources, sameTurnDay } from './portalChatUtils'

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

describe('formatTurnDay', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses the relative labels for today and yesterday when provided', () => {
    vi.setSystemTime(new Date('2026-10-15T15:00:00'))
    const labels = { today: 'Today', yesterday: 'Yesterday' }
    expect(formatTurnDay('2026-10-15T09:00:00', 'en', labels)).toBe('Today')
    expect(formatTurnDay('2026-10-14T23:30:00', 'en', labels)).toBe('Yesterday')
    expect(formatTurnDay('2026-10-15T09:00:00', 'fr', { today: 'Aujourd’hui', yesterday: 'Hier' })).toBe(
      'Aujourd’hui',
    )
  })

  it('drops the year inside the current one and keeps it across the boundary', () => {
    vi.setSystemTime(new Date('2026-10-15T15:00:00'))
    const older = formatTurnDay('2026-03-04T09:00:00', 'en')
    expect(older).toMatch(/Mar|March/)
    expect(older).not.toMatch(/2026/)
    expect(formatTurnDay('2025-12-30T09:00:00', 'en')).toMatch(/2025/)
  })

  it('still prints a full dated chip when no labels are passed', () => {
    vi.setSystemTime(new Date('2026-10-15T15:00:00'))
    const chip = formatTurnDay('2026-10-15T09:00:00', 'en')
    expect(chip).not.toBe('Today')
    expect(chip).toMatch(/Oct|October/)
  })

  it('returns empty on an unparseable stamp', () => {
    expect(formatTurnDay('not-a-date', 'en')).toBe('')
    expect(sameTurnDay('not-a-date', '2026-10-15T00:00:00')).toBe(false)
  })
})
