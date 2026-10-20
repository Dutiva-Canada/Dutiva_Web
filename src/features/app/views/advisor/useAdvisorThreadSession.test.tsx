import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import { advisorSession, resetAdvisorSession } from './advisorSession'
import { useAdvisorThreadSession } from './useAdvisorThreadSession'

describe('useAdvisorThreadSession', () => {
  afterEach(() => {
    resetAdvisorSession()
  })

  it('drops captured session references when the store resets while mounted', () => {
    const { result, rerender } = renderHook(() => useAdvisorThreadSession(null, 'demo'))

    act(() => {
      result.current.updateSessionChats((prev) => [
        ...prev,
        {
          id: 'session-9',
          title: bi('Demo thread', 'Fil de démo'),
          pinned: false,
          bucket: 'today' as const,
          flowKey: 'fallback' as const,
        },
      ])
      result.current.updateActiveChatId('session-9')
    })
    const orphanedMap = result.current.transcripts.current
    expect(result.current.sessionChats).toHaveLength(1)
    expect(result.current.activeChatId).toBe('session-9')

    /* A mode/org switch calls resetAdvisorSession without remounting the
       route — the hook must resync instead of writing into the orphaned
       store. */
    act(() => {
      resetAdvisorSession()
      rerender()
    })

    expect(result.current.sessionChats).toHaveLength(0)
    expect(result.current.activeChatId).toBeNull()
    expect(result.current.activeChatIdRef.current).toBeNull()
    expect(result.current.transcripts.current).toBe(advisorSession.transcripts)
    expect(result.current.transcripts.current).not.toBe(orphanedMap)
    expect(result.current.resetSeq).toBe(advisorSession.resetSeq)
  })

  it('keeps session state when no reset happened (plain rerender)', () => {
    const { result, rerender } = renderHook(() => useAdvisorThreadSession(null, 'demo'))

    act(() => {
      result.current.updateSessionChats((prev) => [
        ...prev,
        {
          id: 'session-1',
          title: bi('Thread', 'Fil'),
          pinned: false,
          bucket: 'today' as const,
          flowKey: 'hiring' as const,
        },
      ])
    })
    rerender()
    expect(result.current.sessionChats.map((c) => c.id)).toEqual(['session-1'])
  })
})
