/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it, vi } from 'vitest'
import { bi } from '@/i18n/core'
import { createAdvisorThreadNavigation } from './advisorThreadNavigation'

describe('createAdvisorThreadNavigation', () => {
  it('allows deleting session threads in demo mode', () => {
    const { canDeleteThread } = createAdvisorThreadNavigation({
      workspaceMode: 'demo',
      prodThreads: [],
      setProdThreads: vi.fn(),
      sessionChats: [],
      updateSessionChats: vi.fn(),
      updateActiveChatId: vi.fn(),
      activeChatId: null,
      activeChatIdRef: { current: null },
      conversationIdRef: { current: null },
      transcripts: { current: new Map() },
      responseState: {},
      setResponseState: vi.fn(),
      patchResponseState: vi.fn(),
      engineReset: vi.fn(),
      pushUser: vi.fn(() => 'user-1'),
      pushScenarioTurn: vi.fn(),
      seedFor: () => [],
      stashActive: vi.fn(),
      updateExtras: vi.fn(),
      showToast: vi.fn(),
      confirmDelete: () => true,
      deleteOkToast: bi('Deleted', 'Supprimé'),
      deleteFailedToast: bi('Failed', 'Échec'),
    })

    expect(canDeleteThread('session-42')).toBe(true)
    expect(canDeleteThread('00000000-0000-4000-8000-000000000001')).toBe(false)
  })

  it('allows deleting backend conversations in production mode', () => {
    const { canDeleteThread } = createAdvisorThreadNavigation({
      workspaceMode: 'production',
      prodThreads: [],
      setProdThreads: vi.fn(),
      sessionChats: [],
      updateSessionChats: vi.fn(),
      updateActiveChatId: vi.fn(),
      activeChatId: null,
      activeChatIdRef: { current: null },
      conversationIdRef: { current: null },
      transcripts: { current: new Map() },
      responseState: {},
      setResponseState: vi.fn(),
      patchResponseState: vi.fn(),
      engineReset: vi.fn(),
      pushUser: vi.fn(() => 'user-1'),
      pushScenarioTurn: vi.fn(),
      seedFor: () => [],
      stashActive: vi.fn(),
      updateExtras: vi.fn(),
      showToast: vi.fn(),
      confirmDelete: () => true,
      deleteOkToast: bi('Deleted', 'Supprimé'),
      deleteFailedToast: bi('Failed', 'Échec'),
    })

    expect(canDeleteThread('00000000-0000-4000-8000-000000000001')).toBe(true)
  })
})
