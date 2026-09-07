import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialCommsState } from './fixtures'
import {
  addCoverageItem,
  addFeed,
  addInitiative,
  addSource,
  addSubmission,
  getSubmissionDueStatus,
  loadFullState,
  recordManualReceipt,
  removeContentItem,
  removeCoverageItem,
  removeFeed,
  removeInitiative,
  removeSource,
  removeSubmission,
  saveCommsState,
  syncAllFeeds,
  syncFeed,
  toggleInitiativePause,
  transitionDeliveryStatus,
  transitionSubmissionStatus,
} from './productionApi'

const ORG_ID = 'test-org'

beforeEach(() => {
  localStorage.clear()
  saveCommsState(ORG_ID, initialCommsState)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('comms production API', () => {
  it('starts empty when no local state exists', () => {
    localStorage.clear()
    const state = loadFullState(ORG_ID)
    expect(state.initiatives).toEqual([])
    expect(state.executionEvents).toEqual([])
  })

  it('records a schedule transition and execution event', () => {
    transitionDeliveryStatus(ORG_ID, 'content-1', 'schedule', 'Riley Summers')
    const state = loadFullState(ORG_ID)
    const item = state.contentItems.find((c) => c.id === 'content-1')!
    expect(item.deliveryStatus).toBe('scheduled')
    expect(state.executionEvents[0]).toMatchObject({
      contentItemId: 'content-1',
      action: 'schedule',
      previousStatus: 'scheduled',
      newStatus: 'scheduled',
      actor: 'Riley Summers',
    })
  })

  it('rejects mark_sent until the content is approved', () => {
    const item = loadFullState(ORG_ID).contentItems.find((c) => c.id === 'content-4')!
    expect(item.status).toBe('draft')
    const updated = recordManualReceipt(ORG_ID, 'content-4', 'Riley Summers')
    expect(updated).toBeNull()
    expect(loadFullState(ORG_ID).contentItems.find((c) => c.id === 'content-4')!.deliveryStatus).toBe('not_queued')
  })

  it('records manual confirmation as a confirmed delivery', () => {
    transitionDeliveryStatus(ORG_ID, 'content-6', 'schedule', 'Alex Dubois')
    const confirmed = recordManualReceipt(ORG_ID, 'content-6', 'Alex Dubois', 'Emailed to coalition leads')
    expect(confirmed!.deliveryStatus).toBe('confirmed')
    const event = loadFullState(ORG_ID).executionEvents.find((e) => e.action === 'mark_sent')!
    expect(event.newStatus).toBe('confirmed')
  })

  it('supports failure, retry, and cancel transitions', () => {
    transitionDeliveryStatus(ORG_ID, 'content-6', 'schedule', 'Alex Dubois')
    transitionDeliveryStatus(ORG_ID, 'content-6', 'mark_failed', 'Alex Dubois', 'Bounce from provider')
    const failed = loadFullState(ORG_ID).contentItems.find((c) => c.id === 'content-6')!
    expect(failed.deliveryStatus).toBe('failed')

    transitionDeliveryStatus(ORG_ID, 'content-6', 'retry', 'Alex Dubois')
    expect(loadFullState(ORG_ID).contentItems.find((c) => c.id === 'content-6')!.deliveryStatus).toBe('ready')

    transitionDeliveryStatus(ORG_ID, 'content-6', 'schedule', 'Alex Dubois')
    transitionDeliveryStatus(ORG_ID, 'content-6', 'cancel', 'Alex Dubois')
    expect(loadFullState(ORG_ID).contentItems.find((c) => c.id === 'content-6')!.deliveryStatus).toBe('cancelled')
  })

  it('can reconcile an unknown delivery status', () => {
    const stateBefore = loadFullState(ORG_ID)
    const base = stateBefore.contentItems[0]!
    const unknownItem: import('./types').CommsContentItem = {
      ...base,
      id: 'unknown-content',
      deliveryStatus: 'unknown',
    }
    stateBefore.contentItems.push(unknownItem)
    saveCommsState(ORG_ID, stateBefore)

    transitionDeliveryStatus(ORG_ID, 'unknown-content', 'reconcile', 'Riley Summers', 'Verified in analytics')
    const state = loadFullState(ORG_ID)
    expect(state.contentItems.find((c) => c.id === 'unknown-content')!.deliveryStatus).toBe('confirmed')
  })

  it('pauses and resumes affected content when an initiative is paused', () => {
    transitionDeliveryStatus(ORG_ID, 'content-1', 'schedule', 'Riley Summers')
    toggleInitiativePause(ORG_ID, 'init-1', true, 'Riley Summers')
    const paused = loadFullState(ORG_ID)
    expect(paused.initiatives.find((i) => i.id === 'init-1')!.status).toBe('paused')
    const scheduledItem = paused.contentItems.find((c) => c.id === 'content-1')!
    expect(scheduledItem.deliveryStatus).toBe('paused')
    expect(paused.executionEvents.some((e) => e.action === 'pause')).toBe(true)

    toggleInitiativePause(ORG_ID, 'init-1', false, 'Riley Summers')
    const resumed = loadFullState(ORG_ID)
    expect(resumed.initiatives.find((i) => i.id === 'init-1')!.status).toBe('active')
    expect(resumed.contentItems.find((c) => c.id === 'content-1')!.deliveryStatus).toBe('ready')
    expect(resumed.executionEvents.some((e) => e.action === 'resume')).toBe(true)
  })

  it('removes related approvals and execution events when a content item is removed', () => {
    recordManualReceipt(ORG_ID, 'content-6', 'Alex Dubois')
    loadFullState(ORG_ID)
    removeContentItem(ORG_ID, 'content-6')
    const state = loadFullState(ORG_ID)
    expect(state.contentItems.some((c) => c.id === 'content-6')).toBe(false)
    expect(state.approvals.some((a) => a.contentItemId === 'content-6')).toBe(false)
    expect(state.executionEvents.some((e) => e.contentItemId === 'content-6')).toBe(false)
  })

  it('adds and removes intelligence sources', () => {
    const created = addSource(ORG_ID, {
      sourceType: 'news',
      publisher: { en: 'National Post', fr: 'National Post' },
      classification: { en: 'Earned media', fr: 'Média acquis' },
    })
    const state = loadFullState(ORG_ID)
    expect(state.sources.find((s) => s.id === created!.id)?.sourceType).toBe('news')
    removeSource(ORG_ID, created!.id)
    expect(loadFullState(ORG_ID).sources.some((s) => s.id === created!.id)).toBe(false)
  })

  it('adds coverage items with manual provenance', () => {
    const created = addCoverageItem(ORG_ID, {
      initiativeId: 'init-1',
      outlet: { en: 'Trade weekly', fr: 'Hebdomadaire du secteur' },
      headline: { en: 'Launch spotlight', fr: 'Lancement en vedette' },
      language: 'en',
      reach: 1200,
      sentiment: 'positive',
      provenance: 'manual',
      owner: 'Riley Summers',
    })
    const state = loadFullState(ORG_ID)
    const item = state.coverageItems.find((c) => c.id === created!.id)!
    expect(item.reach).toBe(1200)
    expect(item.sentiment).toBe('positive')
    removeCoverageItem(ORG_ID, created!.id)
    expect(loadFullState(ORG_ID).coverageItems.some((c) => c.id === created!.id)).toBe(false)
  })

  it('tracks public-affairs submissions', () => {
    const created = addSubmission(ORG_ID, {
      initiativeId: 'init-2',
      authority: { en: 'ISED', fr: 'ISDE' },
      method: { en: 'Portal', fr: 'Portail' },
      deadline: '2026-09-30',
      status: 'planned',
      owner: 'Alex Dubois',
    })
    const state = loadFullState(ORG_ID)
    expect(state.submissions.find((s) => s.id === created!.id)?.status).toBe('planned')
    removeSubmission(ORG_ID, created!.id)
    expect(loadFullState(ORG_ID).submissions.some((s) => s.id === created!.id)).toBe(false)
  })

  it('syncs a feed and records new sources', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title><item><title>T1</title><link>https://test.example/1</link><pubDate>Mon, 06 Sep 2026 12:00:00 GMT</pubDate></item></channel></rss>`,
            ),
        }),
      ),
    )
    const feed = addFeed(ORG_ID, {
      url: 'https://test.example/feed.xml',
      label: { en: 'Test feed', fr: 'Fil test' },
      sourceType: 'news',
      enabled: true,
      format: 'auto',
    })
    const result = await syncFeed(ORG_ID, feed!.id)
    expect(result.added).toBe(1)
    const state = loadFullState(ORG_ID)
    expect(state.sources.some((s) => s.url === 'https://test.example/1')).toBe(true)
    expect(state.feeds.find((f) => f.id === feed!.id)?.lastFetchStatus).toBe('ok')
    removeFeed(ORG_ID, feed!.id)
  })

  it('creates coverage drafts from feed items when createCoverageDrafts is enabled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title><item><title>Headline</title><link>https://test.example/1</link><pubDate>Mon, 06 Sep 2026 12:00:00 GMT</pubDate></item></channel></rss>`,
            ),
        }),
      ),
    )
    const feed = addFeed(ORG_ID, {
      url: 'https://test.example/feed.xml',
      label: { en: 'Test feed', fr: 'Fil test' },
      sourceType: 'news',
      enabled: true,
      format: 'auto',
      createCoverageDrafts: true,
    })
    const result = await syncFeed(ORG_ID, feed!.id)
    expect(result.added).toBe(1)
    expect(result.coverageDrafts).toBe(1)
    const state = loadFullState(ORG_ID)
    expect(state.coverageItems.some((c) => c.url === 'https://test.example/1' && c.provenance === 'provider')).toBe(true)
    removeFeed(ORG_ID, feed!.id)
  })

  it('records feed sync errors without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 403 })),
    )
    const feed = addFeed(ORG_ID, {
      url: 'https://test.example/feed.xml',
      label: { en: 'Test feed', fr: 'Fil test' },
      sourceType: 'official_notice',
      enabled: true,
      format: 'auto',
    })
    const result = await syncFeed(ORG_ID, feed!.id)
    expect(result.added).toBe(0)
    expect(result.error).toContain('403')
    expect(loadFullState(ORG_ID).feeds.find((f) => f.id === feed!.id)?.lastFetchStatus).toBe('error')
    removeFeed(ORG_ID, feed!.id)
  })

  it('syncs only enabled feeds via syncAllFeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              `<?xml version="1.0"?><rss version="2.0"><channel><title>T</title><item><title>X</title><link>https://example.com/x</link></item></channel></rss>`,
            ),
        }),
      ),
    )
    const enabled = addFeed(ORG_ID, {
      url: 'https://enabled.example/feed.xml',
      label: { en: 'Enabled', fr: 'Activé' },
      sourceType: 'news',
      enabled: true,
      format: 'rss',
    })
    const disabled = addFeed(ORG_ID, {
      url: 'https://disabled.example/feed.xml',
      label: { en: 'Disabled', fr: 'Désactivé' },
      sourceType: 'news',
      enabled: false,
      format: 'rss',
    })
    const results = await syncAllFeeds(ORG_ID)
    expect(results).toHaveLength(1)
    expect(results[0]!.feedId).toBe(enabled!.id)
    expect(results[0]!.added).toBe(1)
    const state = loadFullState(ORG_ID)
    expect(state.feeds.find((f) => f.id === enabled!.id)?.lastFetchStatus).toBe('ok')
    expect(state.feeds.find((f) => f.id === disabled!.id)?.lastFetchStatus).toBeUndefined()
    removeFeed(ORG_ID, enabled!.id)
    removeFeed(ORG_ID, disabled!.id)
  })

  it('creates coverage drafts from feed items when createCoverageDrafts is enabled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title><item><title>Headline</title><link>https://test.example/1</link><pubDate>Mon, 06 Sep 2026 12:00:00 GMT</pubDate></item></channel></rss>`,
            ),
        }),
      ),
    )
    const feed = addFeed(ORG_ID, {
      url: 'https://test.example/feed.xml',
      label: { en: 'Test feed', fr: 'Fil test' },
      sourceType: 'news',
      enabled: true,
      format: 'auto',
      createCoverageDrafts: true,
    })
    const result = await syncFeed(ORG_ID, feed!.id)
    expect(result.added).toBe(1)
    expect(result.coverageDrafts).toBe(1)
    const state = loadFullState(ORG_ID)
    expect(state.coverageItems.some((c) => c.url === 'https://test.example/1' && c.provenance === 'provider')).toBe(true)
    removeFeed(ORG_ID, feed!.id)
  })

  it('transitions submission status and rejects invalid transitions', () => {
    const initiative = addInitiative(ORG_ID, {
      title: { en: 'PA tracker', fr: 'Suivi AP' },
      type: 'policy_consultation',
      domain: 'public_affairs',
      audience: { en: 'Authority', fr: 'Autorité' },
      intendedOutcome: { en: 'Track.', fr: 'Suivre.' },
      risk: 'medium',
      status: 'active',
      owner: 'User',
    })
    const submission = addSubmission(ORG_ID, {
      initiativeId: initiative!.id,
      authority: { en: 'Ontario regulator', fr: 'Régulateur Ontario' },
      method: { en: 'Online portal', fr: 'Portail en ligne' },
      status: 'planned',
      owner: 'User',
    })
    expect(transitionSubmissionStatus(ORG_ID, submission!.id, 'submitted')?.status).toBe('submitted')
    expect(transitionSubmissionStatus(ORG_ID, submission!.id, 'recorded')?.status).toBe('recorded')
    expect(transitionSubmissionStatus(ORG_ID, submission!.id, 'submitted')).toBeNull()
    removeSubmission(ORG_ID, submission!.id)
    removeInitiative(ORG_ID, initiative!.id)
  })

  it('flags deadlines as overdue or due soon', () => {
    const today = new Date().toISOString().slice(0, 10)
    const overdue = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const dueSoon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    expect(getSubmissionDueStatus()).toBe('ok')
    expect(getSubmissionDueStatus(today)).toBe('due-soon')
    expect(getSubmissionDueStatus(overdue)).toBe('overdue')
    expect(getSubmissionDueStatus(dueSoon)).toBe('due-soon')
    expect(getSubmissionDueStatus('2030-01-01')).toBe('ok')
  })
})
