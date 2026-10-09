/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  portalNavKey,
  prefetchView,
  prefetchWorkspaceView,
  resetWorkspaceViewPrefetchForTests,
  warmViewsOnIdle,
} from './viewPrefetch'

vi.mock('@/app/viewPrefetchRegistry', () => ({
  workspaceViewPreloads: {
    cases: vi.fn(() => Promise.resolve({ default: {} })),
  },
  screenViewPreloads: {
    'comms.initiatives': vi.fn(() => Promise.resolve({ default: {} })),
    'cases.detail': vi.fn(() => Promise.resolve({ default: {} })),
  },
  portalViewPreloads: {
    'invest.chat': vi.fn(() => Promise.resolve({ default: {} })),
  },
  marketingViewPreloads: {},
}))

describe('prefetchWorkspaceView', () => {
  beforeEach(() => {
    resetWorkspaceViewPrefetchForTests()
    vi.clearAllMocks()
  })

  it('loads a nav key once', async () => {
    const { workspaceViewPreloads } = await import('@/app/viewPrefetchRegistry')
    prefetchWorkspaceView('cases')
    prefetchWorkspaceView('cases')
    expect(workspaceViewPreloads.cases).toHaveBeenCalledTimes(1)
  })

  it('ignores unknown keys', () => {
    expect(() => prefetchWorkspaceView('nope')).not.toThrow()
  })
})

describe('prefetchView namespaced keys', () => {
  beforeEach(() => {
    resetWorkspaceViewPrefetchForTests()
    vi.clearAllMocks()
  })

  it('resolves screen and portal keys from the shared registry', async () => {
    const { screenViewPreloads, portalViewPreloads } = await import('@/app/viewPrefetchRegistry')
    prefetchView('comms.initiatives')
    prefetchView('cases.detail')
    prefetchView('invest.chat')
    expect(screenViewPreloads['comms.initiatives']).toHaveBeenCalledTimes(1)
    expect(screenViewPreloads['cases.detail']).toHaveBeenCalledTimes(1)
    expect(portalViewPreloads['invest.chat']).toHaveBeenCalledTimes(1)
  })

  it('dedupes a key even across the two lookup paths', async () => {
    const { screenViewPreloads } = await import('@/app/viewPrefetchRegistry')
    prefetchView('comms.initiatives')
    prefetchWorkspaceView('comms.initiatives')
    expect(screenViewPreloads['comms.initiatives']).toHaveBeenCalledTimes(1)
  })
})

describe('warmViewsOnIdle', () => {
  beforeEach(() => {
    resetWorkspaceViewPrefetchForTests()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('warms each key once on the timeout fallback when rIC is absent', async () => {
    const { workspaceViewPreloads, screenViewPreloads } = await import('@/app/viewPrefetchRegistry')
    const cancel = warmViewsOnIdle(['cases', 'comms.initiatives'])
    vi.advanceTimersByTime(1300)
    expect(workspaceViewPreloads.cases).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1300)
    expect(screenViewPreloads['comms.initiatives']).toHaveBeenCalledTimes(1)
    cancel()
  })

  it('stops warming after cancel', async () => {
    const { workspaceViewPreloads, screenViewPreloads } = await import('@/app/viewPrefetchRegistry')
    const cancel = warmViewsOnIdle(['cases', 'comms.initiatives'])
    vi.advanceTimersByTime(1300)
    cancel()
    vi.advanceTimersByTime(5000)
    expect(workspaceViewPreloads.cases).toHaveBeenCalledTimes(1)
    expect(screenViewPreloads['comms.initiatives']).not.toHaveBeenCalled()
  })

  it('no-ops when Save-Data is on', () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } })
    warmViewsOnIdle(['cases'])
    vi.advanceTimersByTime(5000)
    return import('@/app/viewPrefetchRegistry').then(({ workspaceViewPreloads }) => {
      expect(workspaceViewPreloads.cases).not.toHaveBeenCalled()
    })
  })
})

describe('portalNavKey', () => {
  it('maps portal paths to preload keys', () => {
    expect(portalNavKey('/invest')).toBe('invest.home')
    expect(portalNavKey('/invest/chat')).toBe('invest.chat')
    expect(portalNavKey('/health/check-in')).toBe('health.check-in')
    expect(portalNavKey('/pr/answers')).toBe('pr.answers')
  })

  it('drops the candidate portal /portal infix', () => {
    expect(portalNavKey('/careers/portal/profile')).toBe('careers.profile')
    expect(portalNavKey('/careers/portal')).toBe('careers.home')
  })
})
