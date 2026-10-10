/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ChatMessage } from '@/features/app/advisor/types'
import { prodTurnRatingKey } from './advisorViewHelpers'
import { turnRatingKey, useTurnRatings } from './advisorTurnRatings'

const rateAdvisorTurn = vi.fn().mockResolvedValue(undefined)
const loadAdvisorTurnRatings = vi.fn().mockResolvedValue(new Map())

vi.mock('@/features/app/advisor/chatApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/app/advisor/chatApi')>()),
  rateAdvisorTurn: (...args: unknown[]) => rateAdvisorTurn(...args),
  loadAdvisorTurnRatings: (...args: unknown[]) => loadAdvisorTurnRatings(...args),
}))

const assistant = (id: string): ChatMessage => ({
  id,
  author: 'assistant',
  text: 'reply',
  status: 'done',
})

describe('prodTurnRatingKey', () => {
  it('recovers the conversation id and index from a prod turn id', () => {
    expect(prodTurnRatingKey('prod-abc-123-3')).toEqual({
      conversationId: 'abc-123',
      turnIndex: 3,
    })
    expect(prodTurnRatingKey('prod-conv-0')).toEqual({ conversationId: 'conv', turnIndex: 0 })
  })

  it('returns null for non-prod ids', () => {
    expect(prodTurnRatingKey('demo-1')).toBeNull()
    expect(prodTurnRatingKey('a-9')).toBeNull()
    expect(prodTurnRatingKey('prod-')).toBeNull()
    expect(prodTurnRatingKey('prod-conv-')).toBeNull()
    expect(prodTurnRatingKey('prod--5')).toBeNull()
    expect(prodTurnRatingKey('prod-conv-x')).toBeNull()
  })
})

describe('turnRatingKey', () => {
  it('prefers the fresh-turn ratingKey from extras', () => {
    const key = turnRatingKey(assistant('a-1'), {
      ratingKey: { conversationId: 'conv-9', turnIndex: 4 },
    })
    expect(key).toEqual({ conversationId: 'conv-9', turnIndex: 4 })
  })

  it('falls back to the prod id index for rehydrated turns', () => {
    expect(turnRatingKey(assistant('prod-conv-7-2'), undefined)).toEqual({
      conversationId: 'conv-7',
      turnIndex: 2,
    })
  })

  it('returns null for user turns and unrated-id assistant turns', () => {
    expect(turnRatingKey({ ...assistant('u-1'), author: 'user' }, undefined)).toBeNull()
    expect(turnRatingKey(assistant('a-1'), undefined)).toBeNull()
    expect(turnRatingKey(assistant('a-1'), {})).toBeNull()
  })
})

describe('useTurnRatings — reasons', () => {
  afterEach(() => {
    rateAdvisorTurn.mockClear()
    loadAdvisorTurnRatings.mockReset()
    loadAdvisorTurnRatings.mockResolvedValue(new Map())
  })

  const messages = [assistant('prod-conv-7-2'), assistant('prod-conv-7-4')]
  const getExtras = () => undefined

  it('persists a reason only after a thumbs-down', async () => {
    const { result } = renderHook(() => useTurnRatings(messages, getExtras))

    /* Reason on an unrated turn is a no-op — no write, no state. */
    act(() => result.current.rateReason('prod-conv-7-2', 'wrong_info'))
    expect(rateAdvisorTurn).not.toHaveBeenCalled()
    expect(result.current.reasonFor('prod-conv-7-2')).toBeNull()

    act(() => result.current.rate('prod-conv-7-2', -1))
    expect(result.current.ratingFor('prod-conv-7-2')).toBe(-1)
    expect(rateAdvisorTurn).toHaveBeenLastCalledWith('conv-7', 2, -1, null)

    act(() => result.current.rateReason('prod-conv-7-2', 'wrong_info'))
    expect(result.current.reasonFor('prod-conv-7-2')).toBe('wrong_info')
    expect(rateAdvisorTurn).toHaveBeenLastCalledWith('conv-7', 2, -1, 'wrong_info')
  })

  it('clears the reason when the rating flips up or clears', async () => {
    const { result } = renderHook(() => useTurnRatings(messages, getExtras))
    act(() => result.current.rate('prod-conv-7-2', -1))
    act(() => result.current.rateReason('prod-conv-7-2', 'tone'))

    act(() => result.current.rate('prod-conv-7-2', 1))
    expect(result.current.reasonFor('prod-conv-7-2')).toBeNull()
    expect(rateAdvisorTurn).toHaveBeenLastCalledWith('conv-7', 2, 1, null)
  })

  it('hydrates persisted reasons on load', async () => {
    loadAdvisorTurnRatings.mockResolvedValue(
      new Map([[4, { rating: -1 as const, reason: 'too_vague' }]]),
    )
    const { result } = renderHook(() => useTurnRatings(messages, getExtras))

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.ratingFor('prod-conv-7-4')).toBe(-1)
    expect(result.current.reasonFor('prod-conv-7-4')).toBe('too_vague')
    expect(result.current.ratingFor('prod-conv-7-2')).toBeNull()
  })

  it('rolls back rating and reason together on a failed write', async () => {
    const { result } = renderHook(() => useTurnRatings(messages, getExtras))
    act(() => result.current.rate('prod-conv-7-2', -1))
    rateAdvisorTurn.mockRejectedValueOnce(new Error('offline'))

    act(() => result.current.rateReason('prod-conv-7-2', 'tone'))
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.ratingFor('prod-conv-7-2')).toBe(-1)
    expect(result.current.reasonFor('prod-conv-7-2')).toBeNull()
  })
})
