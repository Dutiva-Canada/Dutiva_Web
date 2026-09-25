import { describe, expect, it } from 'vitest'
import {
  boardJobsUrl,
  decideAction,
  greenhouseSubmitUrl,
  mapSettingsRow,
  matchesPreferences,
  normalizeGreenhouse,
  normalizeLever,
  parseBoardsConfig,
  resolveSubmitChannel,
  stripHtml,
  validateAction,
  validateApplicationId,
  type AgentSettings,
  type DiscoveredPosting,
} from './handlers'

const baseSettings: AgentSettings = {
  enabled: true,
  autonomy: 'review',
  keywords: [],
  locations: [],
  remote_ok: true,
  min_match_score: 70,
  boards: [],
  daily_apply_cap: 5,
}

const posting: DiscoveredPosting = {
  source: 'greenhouse',
  external_id: '42',
  company: 'Acme',
  title: 'Payroll Specialist',
  location: 'Toronto, ON',
  url: 'https://boards.greenhouse.io/acme/jobs/42',
  apply_url: 'https://boards.greenhouse.io/acme/jobs/42',
  description: 'Run payroll for 500 employees.',
}

describe('parseBoardsConfig', () => {
  it('keeps valid boards and drops malformed entries', () => {
    const boards = parseBoardsConfig([
      { ats: 'greenhouse', slug: 'acme-co' },
      { ats: 'lever', slug: 'northstar' },
      { ats: 'indeed', slug: 'scraped' },
      { ats: 'greenhouse', slug: 'bad slug!' },
      'not-an-object',
      null,
    ])
    expect(boards).toEqual([
      { ats: 'greenhouse', slug: 'acme-co' },
      { ats: 'lever', slug: 'northstar' },
    ])
  })

  it('caps the board list', () => {
    const boards = parseBoardsConfig(
      Array.from({ length: 40 }, (_, i) => ({ ats: 'greenhouse', slug: `co-${i}` })),
    )
    expect(boards).toHaveLength(25)
  })

  it('returns [] for non-array input', () => {
    expect(parseBoardsConfig(null)).toEqual([])
    expect(parseBoardsConfig('greenhouse:acme')).toEqual([])
  })
})

describe('mapSettingsRow', () => {
  it('maps a full row', () => {
    const settings = mapSettingsRow({
      enabled: true,
      autonomy: 'auto_submit',
      keywords: ['payroll'],
      locations: ['Toronto'],
      remote_ok: false,
      min_match_score: 55,
      boards: [{ ats: 'lever', slug: 'acme' }],
      daily_apply_cap: 3,
    })
    expect(settings.autonomy).toBe('auto_submit')
    expect(settings.keywords).toEqual(['payroll'])
    expect(settings.min_match_score).toBe(55)
    expect(settings.boards).toEqual([{ ats: 'lever', slug: 'acme' }])
    expect(settings.daily_apply_cap).toBe(3)
  })

  it('falls back to safe defaults', () => {
    const settings = mapSettingsRow({})
    expect(settings.enabled).toBe(false)
    expect(settings.autonomy).toBe('review')
    expect(settings.min_match_score).toBe(70)
    expect(settings.daily_apply_cap).toBe(5)
  })
})

describe('boardJobsUrl', () => {
  it('builds the Greenhouse jobs endpoint', () => {
    expect(boardJobsUrl({ ats: 'greenhouse', slug: 'acme' })).toBe(
      'https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true',
    )
  })

  it('builds the Lever postings endpoint', () => {
    expect(boardJobsUrl({ ats: 'lever', slug: 'acme' })).toBe(
      'https://api.lever.co/v0/postings/acme?mode=json',
    )
  })
})

describe('stripHtml', () => {
  it('removes tags and decodes entities', () => {
    expect(stripHtml('<p>Payroll &amp; benefits</p><ul><li>Item</li></ul>')).toBe(
      'Payroll & benefits Item',
    )
  })
})

describe('normalizeGreenhouse', () => {
  it('maps the jobs payload', () => {
    const postings = normalizeGreenhouse(
      {
        jobs: [
          {
            id: 1234,
            title: ' HR Coordinator ',
            absolute_url: 'https://boards.greenhouse.io/acme/jobs/1234',
            location: { name: 'Montreal, QC' },
            content: '<p>Coordinate hiring.</p>',
          },
          { title: 'no id — dropped' },
        ],
      },
      'acme-co',
    )
    expect(postings).toHaveLength(1)
    expect(postings[0]).toMatchObject({
      source: 'greenhouse',
      external_id: '1234',
      company: 'Acme Co',
      title: 'HR Coordinator',
      location: 'Montreal, QC',
      description: 'Coordinate hiring.',
    })
  })

  it('handles an empty payload', () => {
    expect(normalizeGreenhouse({}, 'acme')).toEqual([])
  })
})

describe('normalizeLever', () => {
  it('maps the postings array', () => {
    const postings = normalizeLever(
      [
        {
          id: 'abc-123',
          text: 'People Partner',
          hostedUrl: 'https://jobs.lever.co/acme/abc-123',
          categories: { location: 'Remote — Canada' },
          descriptionPlain: 'Partner with leaders.',
        },
      ],
      'acme',
    )
    expect(postings).toHaveLength(1)
    expect(postings[0]).toMatchObject({
      source: 'lever',
      external_id: 'abc-123',
      title: 'People Partner',
      location: 'Remote — Canada',
    })
  })

  it('returns [] for non-array payloads', () => {
    expect(normalizeLever({}, 'acme')).toEqual([])
  })
})

describe('matchesPreferences', () => {
  it('passes everything when no filters are set', () => {
    expect(matchesPreferences(posting, baseSettings)).toBe(true)
  })

  it('requires a keyword hit against title or description', () => {
    const settings = { ...baseSettings, keywords: ['payroll'] }
    expect(matchesPreferences(posting, settings)).toBe(true)
    expect(matchesPreferences(posting, { ...settings, keywords: ['welding'] })).toBe(false)
  })

  it('matches location or remote when remote_ok', () => {
    const settings = { ...baseSettings, locations: ['montreal'] }
    expect(matchesPreferences(posting, settings)).toBe(false)
    expect(
      matchesPreferences({ ...posting, location: 'Remote — Canada' }, settings),
    ).toBe(true)
    expect(matchesPreferences({ ...posting, location: 'Montreal, QC' }, settings)).toBe(true)
  })

  it('excludes remote jobs when remote_ok is off and no location filter', () => {
    const settings = { ...baseSettings, remote_ok: false }
    expect(matchesPreferences({ ...posting, location: 'Remote — US' }, settings)).toBe(false)
    expect(matchesPreferences(posting, settings)).toBe(true)
  })
})

describe('decideAction', () => {
  it('skips below the threshold', () => {
    expect(decideAction(baseSettings, 40)).toBe('skip')
    expect(decideAction(baseSettings, null)).toBe('skip')
  })

  it('queues for review or submit by autonomy', () => {
    expect(decideAction(baseSettings, 80)).toBe('prepare_review')
    expect(decideAction({ ...baseSettings, autonomy: 'auto_submit' }, 80)).toBe(
      'prepare_submit',
    )
  })

  it('honours a lowered threshold', () => {
    expect(decideAction({ ...baseSettings, min_match_score: 30 }, 40)).toBe('prepare_review')
  })
})

describe('resolveSubmitChannel', () => {
  it('uses the Greenhouse API and marks other sources manual', () => {
    expect(resolveSubmitChannel('greenhouse')).toBe('greenhouse_api')
    expect(resolveSubmitChannel('lever')).toBe('manual')
    expect(resolveSubmitChannel('search')).toBe('manual')
  })

  it('builds the Greenhouse submit URL', () => {
    expect(greenhouseSubmitUrl('acme', '42')).toBe(
      'https://boards-api.greenhouse.io/v1/boards/acme/jobs/42',
    )
  })
})

describe('validateAction / validateApplicationId', () => {
  it('accepts the three actions', () => {
    expect(validateAction('scan')).toEqual({ ok: true, value: 'scan' })
    expect(validateAction('scan-all')).toEqual({ ok: true, value: 'scan-all' })
    expect(validateAction('submit')).toEqual({ ok: true, value: 'submit' })
    expect(validateAction('delete')).toMatchObject({ ok: false })
  })

  it('requires a uuid application id', () => {
    expect(validateApplicationId('8b2f1f60-7f1d-4b3b-9b1f-7c1d0f2a3b4c').ok).toBe(true)
    expect(validateApplicationId('nope').ok).toBe(false)
  })
})
