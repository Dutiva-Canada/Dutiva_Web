/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it } from 'vitest'
import { computeAdvisorViewPresentation } from './advisorViewPresentation'

const groupLabels = {
  pinned: { en: 'Pinned', fr: 'Épinglés' },
  today: { en: 'Today', fr: "Aujourd'hui" },
  week: { en: 'This week', fr: 'Cette semaine' },
  older: { en: 'Older', fr: 'Plus ancien' },
}

describe('computeAdvisorViewPresentation', () => {
  it('returns idle chrome when no thread is active', () => {
    const result = computeAdvisorViewPresentation({
      activeChatId: null,
      sessionChats: [],
      prodThreads: [],
      transcripts: new Map(),
      responseState: {},
      workspaceMode: 'demo',
      authStatus: 'signed-out',
      engineBusy: false,
      sendingReal: false,
      groupLabels,
    })

    expect(result.hasActiveChat).toBe(false)
    expect(result.groups.length).toBeGreaterThan(0)
    expect(result.activeScenario).toBeUndefined()
  })

  it('marks a fixture thread as active in demo mode', () => {
    const result = computeAdvisorViewPresentation({
      activeChatId: 'c1',
      sessionChats: [],
      prodThreads: [],
      transcripts: new Map(),
      responseState: {},
      workspaceMode: 'demo',
      authStatus: 'signed-out',
      engineBusy: false,
      sendingReal: false,
      groupLabels,
    })

    expect(result.hasActiveChat).toBe(true)
    expect(result.groups.length).toBeGreaterThan(0)
  })
})
