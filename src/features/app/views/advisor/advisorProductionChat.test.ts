/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi } from 'vitest'
import { AdvisorUsageLimitError } from '@/features/app/advisor/chatApi'
import type { AdvisorTurnSpec } from '@/features/app/advisor/types'
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

  it('attaches engine-emitted tool proposals to the turn when the gate allows', () => {
    const pushAdvisor = vi.fn((_spec: AdvisorTurnSpec) => 'turn-1')
    applyRealChatResult({
      result: {
        reply: 'Done.',
        conversationId: 'conv-backend',
        response: {
          route: {
            responseMode: 'hr',
            workspaceAllowed: true,
            retrievalAllowed: true,
            legalBasisAllowed: true,
            documentsAllowed: true,
            webSearchAllowed: false,
            actionsAllowed: true,
          },
          jurisdiction: { status: 'known', value: 'Ontario' },
          risk: { compliance: 'low', safety: 'none' },
          professionalReview: null,
          supportNotice: false,
          legalBasis: { items: [] },
          retrieval: { items: [] },
          webSearch: null,
          confidence: null,
          proposedActions: [
            {
              toolId: 'tasks.create',
              summary: 'Create a task',
              params: { title: 'Renew WSIB' },
            },
          ],
          warnings: [],
          isCrisis: false,
        },
        memoryCreated: [],
      },
      threadId: 'session-1',
      userText: 'log it',
      pushAdvisor,
      patchResponseState: vi.fn(),
      setProdThreads: vi.fn(),
      updateExtras: vi.fn(),
      bindBackendConversationId: vi.fn(),
    })
    const spec = pushAdvisor.mock.calls[0]?.[0]
    expect(spec?.proposedActions).toHaveLength(1)
    expect(spec?.proposedActions?.[0]?.toolId).toBe('tasks.create')
  })

  it('suppresses engine-emitted proposals when the gate is off', () => {
    const pushAdvisor = vi.fn((_spec: AdvisorTurnSpec) => 'turn-1')
    const gated = {
      route: {
        responseMode: 'hr' as const,
        workspaceAllowed: true,
        retrievalAllowed: true,
        legalBasisAllowed: true,
        documentsAllowed: true,
        webSearchAllowed: false,
        actionsAllowed: false,
      },
      jurisdiction: { status: 'known' as const, value: 'Ontario' },
      risk: { compliance: 'low' as const, safety: 'none' as const },
      professionalReview: null,
      supportNotice: false,
      legalBasis: { items: [] },
      retrieval: { items: [] },
      webSearch: null,
      confidence: null,
      proposedActions: [
        { toolId: 'tasks.create', summary: 'Create a task', params: { title: 'X' } },
      ],
      warnings: [],
      isCrisis: false,
    }
    applyRealChatResult({
      result: {
        reply: 'Done.',
        conversationId: 'conv-backend',
        response: gated,
        memoryCreated: [],
      },
      threadId: 'session-1',
      userText: 'log it',
      pushAdvisor,
      patchResponseState: vi.fn(),
      setProdThreads: vi.fn(),
      updateExtras: vi.fn(),
      bindBackendConversationId: vi.fn(),
    })
    const spec = pushAdvisor.mock.calls[0]?.[0]
    expect(spec?.proposedActions).toBeUndefined()
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
