/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { RefObject } from 'react'
import type { LText } from '@/i18n/core'
import { sendAdvisorMessage } from '@/features/app/advisor/chatApi'
import type { AdvisorTurnSpec, ToneCardData } from '@/features/app/advisor/types'
import { followupFallbackText, followupReplies } from '@/data'
import type { FixtureToneCard } from '@/data'
import type { ProductionConversation } from '@/features/app/views/memory/conversationsApi'
import type { ToastAction } from '@/features/app/toasts/toastsContext'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { estimatorFollowup, genericAck } from './advisorFlows'
import type { MessageExtras } from './advisorFlows'
import type { ThreadResponseState } from './advisorSession'
import { applyRealChatResult } from './advisorProductionChat'
import { scenarioAck, scenarioAckSignedOut } from './advisorScenarios'

import type { AuthStatus } from '@/features/app/auth/authContext'

interface ChatSendHandlersOptions {
  authStatus: AuthStatus
  organizationId: string | null
  getActiveChatId: () => string | null
  getResponseState: () => Record<string, ThreadResponseState>
  pushUser: (text: LText, chips?: LText[]) => string
  pushAdvisor: (spec: AdvisorTurnSpec) => string
  patchResponseState: (chatId: string, patch: Partial<ThreadResponseState>) => void
  setProdThreads: (updater: (prev: ProductionConversation[]) => ProductionConversation[]) => void
  updateExtras: (
    updater: (prev: Record<string, MessageExtras>) => Record<string, MessageExtras>,
  ) => void
  bindBackendConversationId: (threadId: string | null, backendId: string) => void
  conversationIdRef: RefObject<string | null>
  interceptCrisis: (raw: string, chatId: string | null) => boolean
  toToneCard: (card: FixtureToneCard) => ToneCardData
  setSendingReal: (sending: boolean) => void
  handleRealChatFailure: (error: unknown) => void
  showToast: (message: LText, tone?: 'ok' | 'info', action?: ToastAction) => void
}

/** In-thread send and scripted follow-up chip handling. */
export function createAdvisorChatSendHandlers(options: ChatSendHandlersOptions) {
  const {
    authStatus,
    organizationId,
    getActiveChatId,
    getResponseState,
    pushUser,
    pushAdvisor,
    patchResponseState,
    setProdThreads,
    updateExtras,
    bindBackendConversationId,
    conversationIdRef,
    interceptCrisis,
    toToneCard,
    setSendingReal,
    handleRealChatFailure,
    showToast,
  } = options

  const sendInThread = (text: string) => {
    const chatId = getActiveChatId()
    pushUser(text)
    if (interceptCrisis(text, chatId)) return
    const isScenarioThread = chatId !== null && getResponseState()[chatId]?.scenarioId != null
    if (isScenarioThread) {
      pushAdvisor({ text: authStatus === 'signed-in' ? scenarioAck : scenarioAckSignedOut })
      return
    }
    if (authStatus !== 'signed-in') {
      pushAdvisor({ text: genericAck })
      return
    }
    setSendingReal(true)
    void sendAdvisorMessage(text, conversationIdRef.current, organizationId)
      .then((result) =>
        applyRealChatResult({
          result,
          threadId: chatId,
          userText: text,
          pushAdvisor,
          patchResponseState,
          setProdThreads,
          updateExtras,
          bindBackendConversationId,
          showToast,
        }),
      )
      .catch(handleRealChatFailure)
      .finally(() => setSendingReal(false))
  }

  const handleFollowup = (labelEn: string) => {
    if (labelEn === estimatorFollowup.labelEn) {
      pushAdvisor({
        text: '',
        isError: true,
        errorText: estimatorFollowup.errorText,
        retryText: estimatorFollowup.retryText,
      })
      return
    }
    const reply = followupReplies[labelEn]
    if (!reply) {
      pushAdvisor({ text: followupFallbackText })
      return
    }
    const turnId = pushAdvisor({
      text: reply.text,
      reasoning: reply.reasoning,
      cards: reply.cards?.map(toToneCard),
    })
    if ((reply.docs?.length ?? 0) > 0) {
      updateExtras((prev) => ({ ...prev, [turnId]: { docs: reply.docs } }))
    }
    if (reply.isEscalation === true) showToast(M.advisorview_toast_counsel, 'ok')
  }

  return { sendInThread, handleFollowup }
}
