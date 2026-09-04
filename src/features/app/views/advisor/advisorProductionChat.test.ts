/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi } from 'vitest'
import { AdvisorUsageLimitError } from '@/features/app/advisor/chatApi'
import { applyRealChatResult, createRealChatFailureHandler } from './advisorProductionChat'

describe('applyRealChatResult', () => {
  it('binds backend id and patches thread state', () => {
    const pushAdvisor = vi.fn(() => 'turn-1')
    const patchResponseState = vi.fn()
    const setProdThreads = vi.fn()
    const updateExtras = vi.fn()
    const bindBackendConversationId = vi.fn()

    applyRealChatResult({
      result: {
        reply: 'Here is guidance.',
        conversationId: 'conv-backend',
        response: null,
        memoryCreated: [],
      },
      threadId: 'session-1',
      userText: 'What notice?',
      pushAdvisor,
      patchResponseState,
      setProdThreads,
      updateExtras,
      bindBackendConversationId,
    })

    expect(bindBackendConversationId).toHaveBeenCalledWith('session-1', 'conv-backend')
    expect(pushAdvisor).toHaveBeenCalled()
    expect(patchResponseState).toHaveBeenCalledWith('conv-backend', expect.any(Object))
    expect(updateExtras).toHaveBeenCalled()
  })
})

describe('createRealChatFailureHandler', () => {
  it('offers a pack on commercial usage limits', () => {
    const pushAdvisor = vi.fn(() => 'turn-1')
    const updateExtras = vi.fn()
    const handle = createRealChatFailureHandler({ pushAdvisor, updateExtras })

    handle(new AdvisorUsageLimitError('commercial', 60))

    expect(updateExtras).toHaveBeenCalled()
  })
})
