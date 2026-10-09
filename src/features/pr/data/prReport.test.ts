import { describe, expect, it } from 'vitest'
import { buildPrReport, reportMonths } from './prReport'
import type { PrState } from './types'

const state = (over: Partial<PrState> = {}): PrState => ({
  campaigns: [],
  contentItems: [],
  contacts: [],
  keywords: [],
  mentions: [],
  geoPrompts: [],
  feeds: [],
  connections: [],
  lastLoadedAt: '2026-10-03T00:00:00Z',
  ...over,
})

const mention = (over: Partial<PrState['mentions'][number]> = {}) => ({
  id: Math.random().toString(36).slice(2),
  source: 'Outlet',
  title: 'Story',
  url: 'https://example.com/a',
  sentiment: 'neutral' as const,
  sentimentAuto: false,
  publishedAt: '2026-10-05T12:00:00Z',
  createdAt: '2026-10-05T12:00:00Z',
  ...over,
})

describe('reportMonths', () => {
  it('always includes the current month', () => {
    expect(reportMonths(state(), '2026-10-03T00:00:00Z')).toEqual(['2026-10'])
  })

  it('adds months that carry data, newest first', () => {
    const months = reportMonths(
      state({ mentions: [mention({ publishedAt: '2026-08-12T00:00:00Z' })] }),
      '2026-10-03T00:00:00Z',
    )
    expect(months).toEqual(['2026-10', '2026-08'])
  })
})

describe('buildPrReport', () => {
  it('counts coverage by tone and ranks top outlets', () => {
    const r = buildPrReport(
      state({
        mentions: [
          mention({ source: 'La Presse', sentiment: 'positive' }),
          mention({ source: 'La Presse', sentiment: 'neutral' }),
          mention({ source: 'Techvibes', sentiment: 'negative' }),
          mention({ publishedAt: '2026-09-20T00:00:00Z' }),
        ],
      }),
      '2026-10',
    )
    expect(r.coverage.total).toBe(3)
    expect(r.coverage.positive).toBe(1)
    expect(r.coverage.neutral).toBe(1)
    expect(r.coverage.negative).toBe(1)
    expect(r.coverage.topOutlets[0]).toEqual({ source: 'La Presse', count: 2 })
    expect(r.coverage.items).toHaveLength(3)
  })

  it('counts keyword movement only for keywords checked that month', () => {
    const kw = (position: number | null, previousPosition: number | null, checkedAt = '2026-10-10T00:00:00Z') => ({
      id: Math.random().toString(36).slice(2),
      keyword: 'k',
      targetUrl: '',
      position,
      previousPosition,
      checkedAt,
      createdAt: '2026-10-01T00:00:00Z',
    })
    const r = buildPrReport(
      state({
        keywords: [
          kw(4, 9),      // up — smaller number is better
          kw(12, 7),     // down
          kw(5, 5),      // flat
          kw(null, 8),   // flat — no current read
          kw(3, 6, '2026-09-10T00:00:00Z'), // different month — excluded
        ],
      }),
      '2026-10',
    )
    expect(r.search.checked).toBe(4)
    expect(r.search.up).toBe(1)
    expect(r.search.down).toBe(1)
    expect(r.search.flat).toBe(2)
  })

  it('counts GEO checks by result and via, within the month', () => {
    const geo = (result: string, checkedVia: string, checkedAt = '2026-10-15T00:00:00Z') => ({
      id: Math.random().toString(36).slice(2),
      prompt: 'p',
      engine: 'chatgpt' as const,
      result: result as 'cited',
      note: '',
      checkedAt,
      checkedVia: checkedVia as 'auto',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    })
    const r = buildPrReport(
      state({
        geoPrompts: [
          geo('cited', 'auto'),
          geo('mentioned', 'manual'),
          geo('absent', 'auto'),
          geo('cited', 'auto', '2026-09-15T00:00:00Z'),
        ],
      }),
      '2026-10',
    )
    expect(r.answers.checked).toBe(3)
    expect(r.answers.cited).toBe(1)
    expect(r.answers.mentioned).toBe(1)
    expect(r.answers.absent).toBe(1)
    expect(r.answers.viaAuto).toBe(2)
    expect(r.answers.viaManual).toBe(1)
  })

  it('counts content published in the month only', () => {
    const item = (publishedAt: string) => ({
      id: Math.random().toString(36).slice(2),
      campaignId: null,
      kind: 'post' as const,
      title: 'Piece',
      body: '',
      channel: 'linkedin',
      status: 'published' as const,
      scheduledFor: null,
      publishedUrl: 'https://linkedin.com/p/x',
      publishedAt,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    })
    const r = buildPrReport(
      state({ contentItems: [item('2026-10-11T00:00:00Z'), item('2026-09-30T00:00:00Z')] }),
      '2026-10',
    )
    expect(r.content.publishedCount).toBe(1)
    expect(r.content.items[0]!.url).toBe('https://linkedin.com/p/x')
  })

  it('campaigns snapshot counts statuses regardless of month', () => {
    const camp = (status: string) => ({
      id: Math.random().toString(36).slice(2),
      name: 'c',
      channel: 'social' as const,
      status: status as 'active',
      objective: '',
      budgetCad: null,
      startsOn: null,
      endsOn: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })
    const r = buildPrReport(
      state({ campaigns: [camp('active'), camp('active'), camp('done'), camp('draft')] }),
      '2026-10',
    )
    expect(r.campaigns).toEqual({ total: 4, draft: 1, active: 2, paused: 0, done: 1 })
  })
})
