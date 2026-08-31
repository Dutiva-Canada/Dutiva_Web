import { afterEach, describe, expect, it, vi } from 'vitest'
import { relativeAgo, timelineFromNotes } from './caseNarrativeApi'

describe('caseNarrativeApi helpers', () => {
  it('timelineFromNotes seeds an opened event plus note bodies', () => {
    const events = timelineFromNotes(
      'case-1',
      [{ id: 'n1', body: 'Called counsel.', createdAt: '2026-08-20T12:00:00Z' }],
      '2026-08-10T09:00:00Z',
    )
    expect(events).toHaveLength(2)
    expect(events[0]?.source).toBe('system')
    expect(events[1]?.body.en).toBe('Called counsel.')
  })

  it('relativeAgo returns bilingual day counts', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(relativeAgo(threeDaysAgo, 'en')).toBe('3 days ago')
    expect(relativeAgo(threeDaysAgo, 'fr')).toBe('il y a 3 jours')
  })
})

describe('caseNarrativeApi persistence', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('getCaseNarrative returns null when missing', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eqCase = vi.fn().mockReturnValue({ maybeSingle })
    const eqOrg = vi.fn().mockReturnValue({ eq: eqCase })
    const select = vi.fn().mockReturnValue({ eq: eqOrg })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./caseNarrativeApi')
    expect(await api.getCaseNarrative('org-1', 'case-1')).toBeNull()
  })

  it('addCaseTimelineEvent inserts and returns the event', async () => {
    const ROW = {
      id: 'ev-1',
      case_id: 'case-1',
      occurred_at: '2026-08-23T12:00:00Z',
      session_label_en: 'Note',
      session_label_fr: 'Note',
      body_en: 'Called counsel',
      body_fr: 'Called counsel',
      source: 'note',
    }
    const single = vi.fn().mockResolvedValue({ data: ROW, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const eqCase = vi.fn().mockResolvedValue({ error: null })
    const eqOrg = vi.fn().mockReturnValue({ eq: eqCase })
    const update = vi.fn().mockReturnValue({ eq: eqOrg })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        from: vi.fn((table: string) =>
          table === 'hr_advisor_case_timeline_events' ? { insert } : { update },
        ),
      },
    }))
    vi.resetModules()
    const api = await import('./caseNarrativeApi')
    const event = await api.addCaseTimelineEvent('org-1', 'case-1', {
      bodyEn: 'Called counsel',
      source: 'note',
      sessionLabelEn: 'Note',
    })
    expect(event.body.en).toBe('Called counsel')
    expect(insert).toHaveBeenCalled()
  })
})
