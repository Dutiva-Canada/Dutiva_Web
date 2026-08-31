/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { AdvisorUsageLimitError, type AdvisorChatResult } from '@/features/app/advisor/chatApi'
import type { AdvisorTurnSpec } from '@/features/app/advisor/types'
import type { LText } from '@/i18n/core'
import { usageLimitReply } from '@/features/app/advisor/usageLimit'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import type { ProductionConversation } from '@/features/app/views/memory/conversationsApi'
import type { MessageExtras } from './advisorFlows'
import { genericAck } from './advisorFlows'
import type { ThreadResponseState } from './advisorSession'
import { operationalNextStepChips } from './advisorViewHelpers'

/** Apply a successful advisor-chat backend result to thread state and UI extras. */
export function applyRealChatResult(options: {
  result: AdvisorChatResult
  threadId: string | null
  userText: string
  pushAdvisor: (spec: AdvisorTurnSpec) => string
  patchResponseState: (chatId: string, patch: Partial<ThreadResponseState>) => void
  setProdThreads: (updater: (prev: ProductionConversation[]) => ProductionConversation[]) => void
  updateExtras: (
    updater: (prev: Record<string, MessageExtras>) => Record<string, MessageExtras>,
  ) => void
  bindBackendConversationId: (threadId: string | null, backendId: string) => void
  fallbackReply?: LText
}) {
  const {
    result,
    threadId,
    userText,
    pushAdvisor,
    patchResponseState,
    setProdThreads,
    updateExtras,
    bindBackendConversationId,
    fallbackReply = genericAck,
  } = options

  bindBackendConversationId(threadId, result.conversationId)
  const stateChatId =
    threadId !== null && threadId.startsWith('session-') && result.conversationId !== threadId
      ? result.conversationId
      : threadId
  const replyPayload = result.reply || fallbackReply
  const turnId = pushAdvisor({ text: replyPayload })
  if (stateChatId !== null) {
    patchResponseState(stateChatId, { response: result.response })
    setProdThreads((prev) =>
      prev.map((t) =>
        t.id === stateChatId || t.id === result.conversationId
          ? {
              ...t,
              lastAdvisorResponse: result.response,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    )
  }
  const replyText = typeof replyPayload === 'string' ? replyPayload : replyPayload.en
  const navChips = operationalNextStepChips(userText, replyText)
  updateExtras((prev) => ({
    ...prev,
    [turnId]: {
      ...prev[turnId],
      ...(result.response?.memory != null ? { memory: result.response.memory } : {}),
      ...(navChips.length > 0 ? { navChips } : {}),
    },
  }))
}

/** Shared failure handling for real-backend Advisor send paths. */
export function createRealChatFailureHandler(options: {
  pushAdvisor: (spec: AdvisorTurnSpec) => string
  updateExtras: (
    updater: (prev: Record<string, MessageExtras>) => Record<string, MessageExtras>,
  ) => void
}) {
  const { pushAdvisor, updateExtras } = options
  return (error: unknown) => {
    if (error instanceof AdvisorUsageLimitError) {
      const turnId = pushAdvisor({ text: usageLimitReply(error) })
      if (error.scope === 'commercial') {
        updateExtras((prev) => ({ ...prev, [turnId]: { advisorPackOffer: true } }))
      }
      return
    }
    console.error('advisor: real chat request failed', error)
    pushAdvisor({
      text: '',
      isError: true,
      errorText: M.advisorview_real_chat_error,
      retryText: M.advisorview_real_chat_retry_prompt,
    })
  }
}
