import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { trackEvent, flush, __resetAnalyticsForTest, __testQueue } from './supportAnalytics'
import { getVisitorId } from './visitorId'
import { setAnalyticsConsent } from '@/lib/analyticsConsent'

// Mock the env gates — without VERCEL_ENV='production' and a Supabase URL,
// trackEvent is a no-op, which is the inert-in-tests behavior we want to
// verify. But for the "active" tests we need to bypass the gates.
vi.mock('@/lib/deployEnv', () => ({
  VERCEL_ENV: 'production',
  isVercelPreview: () => false,
}))

vi.mock('@/lib/release', () => ({
  RELEASE_SHA: 'test-sha',
}))

const originalFetch = globalThis.fetch

function mockFetchOk() {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(new Response('{"data":{"inserted":1}}', { status: 200 }))
}

function mockFetchFail() {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'))
}

describe('supportAnalytics', () => {
  beforeEach(() => {
    __resetAnalyticsForTest()
    mockFetchOk()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    // Every event is consent-gated now; grant it so the "active" cases run.
    localStorage.clear()
    setAnalyticsConsent(true)
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    localStorage.clear()
  })

  it('records nothing until the visitor consents', () => {
    setAnalyticsConsent(false)
    trackEvent({ event_type: 'help_article_view', article_slug: 'test-slug' })
    expect(__testQueue()).toHaveLength(0)

    // And nothing at all when the banner has not been answered yet.
    localStorage.clear()
    trackEvent({ event_type: 'help_article_view', article_slug: 'test-slug' })
    expect(__testQueue()).toHaveLength(0)
  })

  it('trackEvent queues an event with a visitor id', () => {
    trackEvent({ event_type: 'help_article_view', article_slug: 'test-slug', locale: 'en' })
    const q = __testQueue()
    expect(q).toHaveLength(1)
    expect(q[0]?.event_type).toBe('help_article_view')
    expect(q[0]?.article_slug).toBe('test-slug')
    expect('anonymous_visitor_id' in (q[0] ?? {})).toBe(true)
  })

  it('flush sends queued events as a batch and clears the queue', async () => {
    trackEvent({ event_type: 'help_article_view', article_slug: 'a' })
    trackEvent({ event_type: 'help_article_view', article_slug: 'b' })
    expect(__testQueue()).toHaveLength(2)

    await flush()

    expect(__testQueue()).toHaveLength(0)
    expect(globalThis.fetch).toHaveBeenCalledOnce()
    const mockFn = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    const call = mockFn.mock.calls[0]
    expect(call).toBeDefined()
    const body = JSON.parse(call![1].body as string)
    expect(body.events).toHaveLength(2)
    expect(body.events[0].event_type).toBe('help_article_view')
  })

  it('flush with empty queue does not call fetch', async () => {
    await flush()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('flush swallows network errors silently', async () => {
    mockFetchFail()
    trackEvent({ event_type: 'help_search', search_query: 'test' })
    await flush()
    expect(__testQueue()).toHaveLength(0)
  })

  it('flush endpoint is pinned to ca-central-1', async () => {
    trackEvent({ event_type: 'help_article_view', article_slug: 'x' })
    await flush()
    const mockFn = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    const call = mockFn.mock.calls[0]
    expect(call).toBeDefined()
    expect(String(call![0])).toContain('forceFunctionRegion=ca-central-1')
  })

  it('flush uses keepalive for page-unload survival', async () => {
    trackEvent({ event_type: 'help_article_view', article_slug: 'x' })
    await flush()
    const mockFn = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    const call = mockFn.mock.calls[0]
    expect(call).toBeDefined()
    expect(call![1].keepalive).toBe(true)
  })
})

describe('visitorId', () => {
  it('returns null when localStorage is unavailable', () => {
    expect(getVisitorId(null)).toBeNull()
  })

  it('generates and persists an id', () => {
    const store = new Map<string, string>()
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size
      },
    } as unknown as Storage

    const id1 = getVisitorId(mockStorage)
    expect(id1).toBeTruthy()
    const id2 = getVisitorId(mockStorage)
    expect(id2).toBe(id1)
  })
})
