/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { prefetchWorkspaceView, resetWorkspaceViewPrefetchForTests } from './viewPrefetch'

vi.mock('@/app/viewPreloads', () => ({
  workspaceViewPreloads: {
    cases: vi.fn(() => Promise.resolve({ default: {} })),
  },
}))

describe('prefetchWorkspaceView', () => {
  beforeEach(() => {
    resetWorkspaceViewPrefetchForTests()
    vi.clearAllMocks()
  })

  it('loads a nav key once', async () => {
    const { workspaceViewPreloads } = await import('@/app/viewPreloads')
    prefetchWorkspaceView('cases')
    prefetchWorkspaceView('cases')
    expect(workspaceViewPreloads.cases).toHaveBeenCalledTimes(1)
  })

  it('ignores unknown keys', () => {
    expect(() => prefetchWorkspaceView('nope')).not.toThrow()
  })
})
