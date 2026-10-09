/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '@/features/app/advisor/types'
import { prodTurnRatingKey } from './advisorViewHelpers'
import { turnRatingKey } from './advisorTurnRatings'

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
