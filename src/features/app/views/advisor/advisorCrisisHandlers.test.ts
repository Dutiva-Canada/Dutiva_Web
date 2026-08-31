/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi } from 'vitest'
import { createAdvisorCrisisHandlers } from './advisorCrisisHandlers'

vi.mock('@/features/app/advisor/safety', () => ({
  detectCrisisSignal: (text: string) => text.includes('kill myself'),
}))

vi.mock('@/features/app/advisor/safetyTelemetry', () => ({
  reportSafetyEvent: vi.fn(),
}))

describe('createAdvisorCrisisHandlers', () => {
  it('fires interceptCrisis for crisis phrases', () => {
    const pushAdvisor = vi.fn(() => 'turn-1')
    const patchResponseState = vi.fn()
    const { interceptCrisis } = createAdvisorCrisisHandlers({
      pushUser: vi.fn(() => 'user-1'),
      pushAdvisor,
      patchResponseState,
      updateSessionChats: vi.fn(),
      updateActiveChatId: vi.fn(),
      setResponseState: vi.fn(),
      engineReset: vi.fn(),
      stashActive: vi.fn(),
      conversationIdRef: { current: null },
    })

    expect(interceptCrisis('I want to kill myself', 'chat-1')).toBe(true)
    expect(patchResponseState).toHaveBeenCalledWith(
      'chat-1',
      expect.objectContaining({ response: expect.any(Object) }),
    )
    expect(pushAdvisor).toHaveBeenCalled()
  })

  it('ignores normal HR questions', () => {
    const { interceptCrisis } = createAdvisorCrisisHandlers({
      pushUser: vi.fn(() => 'user-1'),
      pushAdvisor: vi.fn(() => 'turn-1'),
      patchResponseState: vi.fn(),
      updateSessionChats: vi.fn(),
      updateActiveChatId: vi.fn(),
      setResponseState: vi.fn(),
      engineReset: vi.fn(),
      stashActive: vi.fn(),
      conversationIdRef: { current: null },
    })

    expect(interceptCrisis('What is reasonable notice in Ontario?', 'chat-1')).toBe(false)
  })
})
