/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { RefObject } from 'react'
import type { LText } from '@/i18n/core'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import type { AdvisorTurnSpec, ChatMessage } from '@/features/app/advisor/types'
import { detectCrisisSignal } from '@/features/app/advisor/safety'
import { reportSafetyEvent } from '@/features/app/advisor/safetyTelemetry'
import { advisorSession, type SessionChat } from './advisorSession'
import { freshResponseState, supportiveCrisisResponse } from './advisorViewHelpers'

type PushUser = (text: LText, chips?: LText[]) => string
type PushAdvisor = (spec: AdvisorTurnSpec) => string

interface CrisisHandlersOptions {
  pushUser: PushUser
  pushAdvisor: PushAdvisor
  patchResponseState: (chatId: string, patch: { response: typeof supportiveCrisisResponse }) => void
  updateSessionChats: (updater: (prev: SessionChat[]) => SessionChat[]) => void
  updateActiveChatId: (id: string | null) => void
  setResponseState: (
    updater: (
      prev: Record<string, ReturnType<typeof freshResponseState>>,
    ) => Record<string, ReturnType<typeof freshResponseState>>,
  ) => void
  engineReset: (messages: ChatMessage[]) => void
  stashActive: () => void
  conversationIdRef: RefObject<string | null>
}

/** Crisis intercept and dedicated support-thread starters (AGENT.md §8). */
export function createAdvisorCrisisHandlers(options: CrisisHandlersOptions) {
  const {
    pushUser,
    pushAdvisor,
    patchResponseState,
    updateSessionChats,
    updateActiveChatId,
    setResponseState,
    engineReset,
    stashActive,
    conversationIdRef,
  } = options

  const interceptCrisis = (raw: string, chatId: string | null): boolean => {
    if (!detectCrisisSignal(raw)) return false
    if (chatId !== null) patchResponseState(chatId, { response: supportiveCrisisResponse })
    pushAdvisor({ text: M.advisorview_crisis_support })
    void reportSafetyEvent({
      conversationId: conversationIdRef.current,
      actions: ['crisis-intercept'],
    })
    return true
  }

  const startCrisisThread = (text: string): boolean => {
    if (!detectCrisisSignal(text)) return false
    stashActive()
    const id = `session-${advisorSession.nextChatSeq++}`
    updateSessionChats((prev) => [
      {
        id,
        title: M.advisorview_crisis_thread_title,
        pinned: false,
        bucket: 'today',
        flowKey: 'fallback',
      },
      ...prev,
    ])
    updateActiveChatId(id)
    conversationIdRef.current = null
    setResponseState((prev) => {
      const next = {
        ...prev,
        [id]: { ...freshResponseState(null), response: supportiveCrisisResponse },
      }
      advisorSession.responseState = next
      return next
    })
    engineReset([])
    pushUser(text)
    pushAdvisor({ text: M.advisorview_crisis_support })
    void reportSafetyEvent({ conversationId: null, actions: ['crisis-intercept'] })
    return true
  }

  return { interceptCrisis, startCrisisThread }
}
