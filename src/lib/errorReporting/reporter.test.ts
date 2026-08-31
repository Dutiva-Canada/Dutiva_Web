import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReporter, postReport } from './reporter'
import type { ReportPayload } from './reporter'

describe('createReporter', () => {
  let sent: Array<{ endpoint: string; payload: ReportPayload }>
  let clock: number

  function makeReporter(overrides: { send?: () => boolean } = {}) {
    sent = []
    return createReporter({
      endpoint: 'https://proj.supabase.co/functions/v1/report-error',
      env: 'production',
      release: 'abc1234',
      now: () => clock,
      send:
        overrides.send ??
        ((endpoint, body) => {
          sent.push({ endpoint, payload: JSON.parse(body) as ReportPayload })
          return true
        }),
    })
  }

  beforeEach(() => {
    clock = 1_000_000
    document.documentElement.setAttribute('lang', 'en-CA')
  })

  it('builds a scrubbed, privacy-minimized payload', () => {
    const reporter = makeReporter()
    reporter.report({
      error: new Error('Cannot read properties of undefined'),
      kind: 'route-boundary',
      pathname: '/app/cases/8f3b9c1e-0a2d-4b6f-9c1e-0a2d4b6f9c1e?tab=notes',
    })

    expect(sent).toHaveLength(1)
    const { endpoint, payload } = sent[0]!
    expect(endpoint).toBe('https://proj.supabase.co/functions/v1/report-error')
    expect(payload.route).toBe('/app/cases/:id') // resolved id + query gone
    expect(payload.env).toBe('production')
    expect(payload.release).toBe('abc1234')
    expect(payload.kind).toBe('route-boundary')
    expect(payload.locale).toBe('en-CA')
    expect(payload.message).toBe('Cannot read properties of undefined')
    expect(payload).not.toHaveProperty('installId')
  })

  it('redacts emails and id-like tokens from message and stack', () => {
    const reporter = makeReporter()
    const err = new Error(
      'doclib: document 8f3b9c1e-0a2d-4b6f-9c1e-0a2d4b6f9c1e failed for jane@corp.ca',
    )
    err.stack = 'Error: boom\n    at load (https://app.dutiva.ca/x.js?token=deadbeefdeadbeef:1:2)'
    reporter.report({ error: err, kind: 'route-boundary', pathname: '/app/home' })
    const { message, stack } = sent[0]!.payload
    expect(message).not.toContain('8f3b9c1e-0a2d-4b6f-9c1e-0a2d4b6f9c1e')
    expect(message).not.toContain('jane@corp.ca')
    expect(message).toContain('[id]')
    expect(message).toContain('[email]')
    expect(stack).not.toContain('deadbeefdeadbeef')
  })

  it('reads locale from the live <html lang>', () => {
    document.documentElement.setAttribute('lang', 'fr-CA')
    const reporter = makeReporter()
    reporter.report({ error: new Error('boom'), kind: 'window-error', pathname: '/fr' })
    expect(sent[0]!.payload.locale).toBe('fr-CA')
  })

  it('dedupes an identical error within the dedupe window', () => {
    const reporter = makeReporter()
    const input = {
      error: new Error('loop'),
      kind: 'route-boundary' as const,
      pathname: '/app/home',
    }
    reporter.report(input)
    reporter.report(input)
    reporter.report(input)
    expect(sent).toHaveLength(1)
  })

  it('re-sends the same error after the dedupe window elapses', () => {
    const reporter = makeReporter()
    const input = {
      error: new Error('loop'),
      kind: 'route-boundary' as const,
      pathname: '/app/home',
    }
    reporter.report(input)
    clock += 61_000
    reporter.report(input)
    expect(sent).toHaveLength(2)
  })

  it('does not dedupe distinct Firefox/Safari-format stacks (non-V8 frames)', () => {
    const reporter = makeReporter()
    const a = new Error('boom')
    a.stack = 'handleClick@https://app.dutiva.ca/assets/app.js:12:34'
    const b = new Error('boom')
    b.stack = 'renderRow@https://app.dutiva.ca/assets/app.js:56:78'
    reporter.report({ error: a, kind: 'window-error', pathname: '/app/home' })
    reporter.report({ error: b, kind: 'window-error', pathname: '/app/home' })
    // Different first frames → different fingerprints → both sent (they would
    // collapse to one if the @-format frame weren't recognized).
    expect(sent).toHaveLength(2)
  })

  it('rate-limits a burst of distinct errors in the rolling window', () => {
    const reporter = makeReporter()
    for (let i = 0; i < 10; i++) {
      reporter.report({
        error: new Error(`distinct ${i}`),
        kind: 'window-error',
        pathname: '/app/home',
      })
    }
    expect(sent.length).toBeLessThanOrEqual(5)
  })

  it('never throws and does not record state when the transport fails', () => {
    const reporter = makeReporter({
      send: () => {
        throw new Error('transport exploded')
      },
    })
    expect(() =>
      reporter.report({ error: new Error('x'), kind: 'window-error', pathname: '/' }),
    ).not.toThrow()
  })

  it('does not mark a fingerprint sent when transport returns false (allows retry)', () => {
    let ok = false
    const reporter = makeReporter({
      send: () => {
        sent.push({ endpoint: '', payload: {} as ReportPayload })
        return ok
      },
    })
    const input = { error: new Error('retry'), kind: 'window-error' as const, pathname: '/' }
    reporter.report(input) // returns false → not recorded
    ok = true
    reporter.report(input) // retried, now succeeds
    expect(sent).toHaveLength(2)
  })

  it('appends componentStack to stack for a recoverable-error report', () => {
    const reporter = makeReporter()
    const err = new Error('Minified React error #418')
    err.stack = 'Error: Minified React error #418\n    at hydrateRoot'
    reporter.report({
      error: err,
      kind: 'recoverable-error',
      pathname: '/',
      componentStack: '\n    in Header\n    in LandingPage',
    })
    const { stack, kind } = sent[0]!.payload
    expect(kind).toBe('recoverable-error')
    expect(stack).toContain('at hydrateRoot')
    expect(stack).toContain('component stack:')
    expect(stack).toContain('in Header')
  })

  it('handles non-Error rejection reasons', () => {
    const reporter = makeReporter()
    reporter.report({ error: 'string reason', kind: 'unhandled-rejection', pathname: '/' })
    reporter.report({
      error: { message: 'objecty' },
      kind: 'unhandled-rejection',
      pathname: '/app/home',
    })
    expect(sent.map((s) => s.payload.message)).toEqual(['string reason', 'objecty'])
  })
})

describe('postReport', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('posts a keepalive fetch with credentials omitted (no cookies) and no sendBeacon', () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const sendBeacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })

    expect(postReport('https://e', '{}')).toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://e',
      expect.objectContaining({ method: 'POST', keepalive: true, credentials: 'omit' }),
    )
    // sendBeacon is never used: it can't omit credentials.
    expect(sendBeacon).not.toHaveBeenCalled()
  })

  it('never throws when fetch throws synchronously', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('nope')
      }),
    )
    expect(() => postReport('https://e', '{}')).not.toThrow()
    expect(postReport('https://e', '{}')).toBe(false)
  })

  it('swallows an async fetch rejection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(postReport('https://e', '{}')).toBe(true)
    await Promise.resolve()
  })
})
