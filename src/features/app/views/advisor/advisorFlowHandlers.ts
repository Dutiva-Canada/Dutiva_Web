/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { RefObject } from 'react'
import type { LText } from '@/i18n/core'
import { sendAdvisorMessage } from '@/features/app/advisor/chatApi'
import type { AdvisorTurnSpec, ToneCardData } from '@/features/app/advisor/types'
import type { AuthStatus } from '@/features/app/auth/authContext'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { lightFlowFallbackText, lightFlows } from '@/data'
import type { FixtureToneCard } from '@/data'
import type { ProductionConversation } from '@/features/app/views/memory/conversationsApi'
import {
  fallbackChips,
  fallbackIntro,
  flowTitles,
  freshQuickForm,
  terminationIntro,
} from './advisorFlows'
import type { FlowKeyOrFallback, MessageExtras } from './advisorFlows'
import { advisorSession, type SessionChat } from './advisorSession'
import type { ThreadResponseState } from './advisorSession'
import { conversationTitle } from './advisorViewHelpers'
import { applyRealChatResult } from './advisorProductionChat'

interface FlowHandlersOptions {
  authStatus: AuthStatus
  organizationId: string | null
  pushUser: (text: LText, chips?: LText[]) => string
  pushAdvisor: (spec: AdvisorTurnSpec) => string
  updateSessionChats: (updater: (prev: SessionChat[]) => SessionChat[]) => void
  updateActiveChatId: (id: string | null) => void
  updateExtras: (
    updater: (prev: Record<string, MessageExtras>) => Record<string, MessageExtras>,
  ) => void
  patchResponseState: (chatId: string, patch: Partial<ThreadResponseState>) => void
  setProdThreads: (updater: (prev: ProductionConversation[]) => ProductionConversation[]) => void
  bindBackendConversationId: (threadId: string | null, backendId: string) => void
  engineReset: (messages: []) => void
  stashActive: () => void
  conversationIdRef: RefObject<string | null>
  interceptCrisis: (raw: string, chatId: string | null) => boolean
  toToneCard: (card: FixtureToneCard) => ToneCardData
  setSendingReal: (sending: boolean) => void
  handleRealChatFailure: (error: unknown) => void
}

/** Start a demo flow thread or route free text to the real backend when signed in. */
export function createAdvisorFlowHandlers(options: FlowHandlersOptions) {
  const {
    authStatus,
    organizationId,
    pushUser,
    pushAdvisor,
    updateSessionChats,
    updateActiveChatId,
    updateExtras,
    patchResponseState,
    setProdThreads,
    bindBackendConversationId,
    engineReset,
    stashActive,
    conversationIdRef,
    interceptCrisis,
    toToneCard,
    setSendingReal,
    handleRealChatFailure,
  } = options

  const startFlow = (flowKey: FlowKeyOrFallback, userText: LText) => {
    stashActive()
    const id = `session-${advisorSession.nextChatSeq++}`
    const userTextString = typeof userText === 'string' ? userText : userText.en
    const title =
      flowKey === 'fallback'
        ? conversationTitle([{ role: 'user', content: userTextString }])
        : flowTitles[flowKey]
    updateSessionChats((prev) => [{ id, title, pinned: false, bucket: 'today', flowKey }, ...prev])
    updateActiveChatId(id)
    conversationIdRef.current = null
    engineReset([])
    pushUser(userText)

    const raw = typeof userText === 'string' ? userText : `${userText.en}\n${userText.fr}`
    if (interceptCrisis(raw, id)) {
      updateSessionChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: M.advisorview_crisis_thread_title } : c)),
      )
      return
    }

    if (flowKey === 'termination') {
      const turnId = pushAdvisor({
        text: terminationIntro.text,
        reasoning: terminationIntro.reasoning,
      })
      updateExtras((prev) => ({ ...prev, [turnId]: { quickForm: freshQuickForm() } }))
      return
    }

    if (flowKey === 'fallback') {
      if (authStatus === 'signed-in') {
        setSendingReal(true)
        void sendAdvisorMessage(userTextString, conversationIdRef.current, organizationId)
          .then((result) =>
            applyRealChatResult({
              result,
              threadId: id,
              userText: userTextString,
              pushAdvisor,
              patchResponseState,
              setProdThreads,
              updateExtras,
              bindBackendConversationId,
            }),
          )
          .catch(handleRealChatFailure)
          .finally(() => setSendingReal(false))
        return
      }
      const turnId = pushAdvisor({ text: fallbackIntro })
      updateExtras((prev) => ({ ...prev, [turnId]: { suggestChips: fallbackChips } }))
      return
    }

    const flow = lightFlows[flowKey]
    if (!flow) {
      pushAdvisor({ text: lightFlowFallbackText })
      return
    }
    const turnId = pushAdvisor({
      text: flow.text,
      reasoning: flow.reasoning,
      cards: flow.cards?.map(toToneCard),
    })
    if ((flow.docs?.length ?? 0) > 0 || (flow.followups?.length ?? 0) > 0) {
      updateExtras((prev) => ({
        ...prev,
        [turnId]: { docs: flow.docs, followups: flow.followups },
      }))
    }
  }

  return { startFlow }
}
