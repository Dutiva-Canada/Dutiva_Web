/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi } from 'vitest'
import { createAdvisorScenarioHandlers } from './advisorScenarioHandlers'

describe('createAdvisorScenarioHandlers', () => {
  const baseOptions = () => ({
    pushUser: vi.fn(() => 'user-1'),
    pushAdvisor: vi.fn(() => 'turn-1'),
    updateExtras: vi.fn(),
    patchResponseState: vi.fn(),
    updateSessionChats: vi.fn(),
    updateActiveChatId: vi.fn(),
    setResponseState: vi.fn((updater) => updater({})),
    engineReset: vi.fn(),
    stashActive: vi.fn(),
    conversationIdRef: { current: null },
    getActiveChatId: () => 'chat-1' as string | null,
    getResponseState: () => ({}),
  })

  it('startScenario seeds a session thread and streams the first turn', () => {
    const pushUser = vi.fn(() => 'user-1')
    const pushAdvisor = vi.fn(() => 'turn-1')
    const updateSessionChats = vi.fn()
    const { startScenario } = createAdvisorScenarioHandlers({
      ...baseOptions(),
      pushUser,
      pushAdvisor,
      updateSessionChats,
    })

    startScenario('s1')

    expect(updateSessionChats).toHaveBeenCalled()
    expect(pushUser).toHaveBeenCalled()
    expect(pushAdvisor).toHaveBeenCalled()
  })

  it('pickProvince is a no-op without a resolvable scenario state', () => {
    const pushUser = vi.fn()
    const { pickProvince } = createAdvisorScenarioHandlers({
      ...baseOptions(),
      pushUser,
      getResponseState: () => ({}),
    })

    pickProvince('Ontario')
    expect(pushUser).not.toHaveBeenCalled()
  })
})
