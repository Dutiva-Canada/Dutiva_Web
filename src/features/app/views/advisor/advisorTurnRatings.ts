/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { useEffect, useRef, useState } from 'react'
import {
  loadAdvisorTurnRatings,
  rateAdvisorTurn,
} from '@/features/app/advisor/chatApi'
import type { ChatMessage } from '@/features/app/advisor/types'
import type { MessageExtras } from './advisorFlows'
import { prodTurnRatingKey } from './advisorViewHelpers'

interface RatingKey {
  conversationId: string
  turnIndex: number
}

const slot = (k: RatingKey) => `${k.conversationId}:${k.turnIndex}`

/** The persisted-turn key for one assistant message, if it has one. */
export function turnRatingKey(
  message: ChatMessage,
  extras: MessageExtras | undefined,
): RatingKey | null {
  if (message.author !== 'assistant') return null
  return extras?.ratingKey ?? prodTurnRatingKey(message.id)
}

/**
 * Thumbs state for persisted Advisor turns, scoped to the transcript in view.
 * Ratings load once per conversation that appears; writes are optimistic with
 * rollback on failure (same contract as the portal companions' rate fns).
 */
export function useTurnRatings(
  messages: readonly ChatMessage[],
  getExtras: (messageId: string) => MessageExtras | undefined,
) {
  const [ratings, setRatings] = useState<Record<string, 1 | -1>>({})
  const loadedConvs = useRef(new Set<string>())
  const keys = new Map<string, RatingKey>()
  for (const m of messages) {
    const key = turnRatingKey(m, getExtras(m.id))
    if (key) keys.set(m.id, key)
  }
  const convIds = [...new Set([...keys.values()].map((k) => k.conversationId))].sort().join('|')

  useEffect(() => {
    for (const convId of convIds.split('|').filter(Boolean)) {
      if (loadedConvs.current.has(convId)) continue
      loadedConvs.current.add(convId)
      void loadAdvisorTurnRatings(convId)
        .then((map) => {
          setRatings((prev) => {
            const next = { ...prev }
            for (const [idx, r] of map) next[slot({ conversationId: convId, turnIndex: idx })] = r
            return next
          })
        })
        .catch(() => {
          /* Ratings are ambient — a failed load just means thumbs start blank. */
          loadedConvs.current.delete(convId)
        })
    }
  }, [convIds])

  const rate = (messageId: string, rating: 1 | -1) => {
    const key = keys.get(messageId)
    if (key == null) return
    const s = slot(key)
    const before = ratings[s] ?? null
    const next = before === rating ? null : rating
    setRatings((prev) => {
      const p = { ...prev }
      if (next === null) delete p[s]
      else p[s] = next
      return p
    })
    void rateAdvisorTurn(key.conversationId, key.turnIndex, next).catch(() => {
      setRatings((prev) => {
        const p = { ...prev }
        if (before === null) delete p[s]
        else p[s] = before
        return p
      })
    })
  }

  return {
    /** null = rateable but unrated; undefined = no persisted-turn key. */
    ratingFor: (messageId: string): 1 | -1 | null | undefined => {
      const key = keys.get(messageId)
      return key == null ? undefined : (ratings[slot(key)] ?? null)
    },
    rate,
  }
}
