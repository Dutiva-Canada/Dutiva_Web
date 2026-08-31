/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { RefObject } from 'react'
import type { LText } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import {
  deleteOwnConversation,
  getOwnConversation,
  type ProductionConversation,
} from '@/features/app/views/memory/conversationsApi'
import type { WorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { chats } from '@/data'
import type { ChatMessage } from '@/features/app/advisor/types'
import type { ScenarioTurn } from './advisorScenarios'
import { advisorSession, type SessionChat, type ThreadResponseState } from './advisorSession'
import type { MessageExtras } from './advisorFlows'
import {
  freshResponseState,
  isBackendConversationId,
  productionTranscript,
  scenarioForThread,
} from './advisorViewHelpers'

type PushUser = (text: LText, chips?: LText[]) => string

interface ThreadNavigationOptions {
  workspaceMode: WorkspaceMode
  prodThreads: ProductionConversation[]
  setProdThreads: (updater: (prev: ProductionConversation[]) => ProductionConversation[]) => void
  sessionChats: SessionChat[]
  updateSessionChats: (updater: (prev: SessionChat[]) => SessionChat[]) => void
  updateActiveChatId: (id: string | null) => void
  activeChatId: string | null
  activeChatIdRef: RefObject<string | null>
  conversationIdRef: RefObject<string | null>
  transcripts: RefObject<Map<string, ChatMessage[]>>
  responseState: Record<string, ThreadResponseState>
  setResponseState: (
    updater: (prev: Record<string, ThreadResponseState>) => Record<string, ThreadResponseState>,
  ) => void
  patchResponseState: (chatId: string, patch: Partial<ThreadResponseState>) => void
  engineReset: (messages: ChatMessage[]) => void
  pushUser: PushUser
  pushScenarioTurn: (chatId: string, turn: ScenarioTurn) => void
  seedFor: (chatId: string) => ChatMessage[]
  stashActive: () => void
  updateExtras: (
    updater: (prev: Record<string, MessageExtras>) => Record<string, MessageExtras>,
  ) => void
  showToast: (message: Bi, tone: 'ok' | 'info') => void
  confirmDelete: (message: Bi) => boolean
  deleteOkToast: Bi
  deleteFailedToast: Bi
}

/** Thread list selection, new chat, and delete — demo fixtures and production conversations. */
export function createAdvisorThreadNavigation(options: ThreadNavigationOptions) {
  const {
    workspaceMode,
    prodThreads,
    setProdThreads,
    sessionChats,
    updateSessionChats,
    updateActiveChatId,
    activeChatId,
    activeChatIdRef,
    conversationIdRef,
    transcripts,
    responseState,
    setResponseState,
    patchResponseState,
    engineReset,
    pushUser,
    pushScenarioTurn,
    seedFor,
    stashActive,
    updateExtras,
    showToast,
    confirmDelete,
    deleteOkToast,
    deleteFailedToast,
  } = options

  const selectChat = (chatId: string) => {
    const scenario = scenarioForThread(chatId)
    const isProdConversation =
      workspaceMode === 'production' &&
      (prodThreads.some((t) => t.id === chatId) || isBackendConversationId(chatId))
    const exists =
      chats.some((c) => c.id === chatId) ||
      sessionChats.some((c) => c.id === chatId) ||
      scenario !== undefined ||
      isProdConversation
    if (!exists) return

    const hydrateProdThread = () => {
      conversationIdRef.current = chatId
      const restoreWorkspace = (response: ProductionConversation['lastAdvisorResponse']) => {
        if (response != null) patchResponseState(chatId, { response })
      }
      const stashed = transcripts.current.get(chatId)
      if (stashed) {
        engineReset(stashed)
        const fromList = prodThreads.find((t) => t.id === chatId)?.lastAdvisorResponse
        if (fromList != null) restoreWorkspace(fromList)
        else if (responseState[chatId]?.response == null) {
          void getOwnConversation(chatId)
            .then((conv) => {
              if (conv === null || activeChatIdRef.current !== chatId) return
              restoreWorkspace(conv.lastAdvisorResponse)
            })
            .catch(() => {})
        }
        return
      }
      engineReset([])
      void getOwnConversation(chatId)
        .then((conv) => {
          if (conv === null || activeChatIdRef.current !== chatId) return
          const messages = productionTranscript(conv)
          transcripts.current.set(chatId, messages)
          engineReset(messages)
          restoreWorkspace(conv.lastAdvisorResponse)
        })
        .catch(() => {
          if (activeChatIdRef.current !== chatId) return
          engineReset([])
        })
    }

    if (chatId === activeChatId) {
      if (isProdConversation && !transcripts.current.has(chatId)) hydrateProdThread()
      return
    }

    stashActive()
    updateActiveChatId(chatId)

    if (isProdConversation) {
      hydrateProdThread()
      return
    }

    conversationIdRef.current = null
    const stashed = transcripts.current.get(chatId)
    if (scenario && !stashed) {
      setResponseState((prev) => {
        const next = { ...prev, [chatId]: freshResponseState(scenario.id) }
        advisorSession.responseState = next
        return next
      })
      engineReset([])
      pushUser(scenario.user)
      pushScenarioTurn(chatId, scenario.turn)
      return
    }
    engineReset(stashed ?? seedFor(chatId))
  }

  const newConversation = () => {
    stashActive()
    updateActiveChatId(null)
    conversationIdRef.current = null
    engineReset([])
  }

  const canDeleteThread = (chatId: string): boolean => {
    if (chatId.startsWith('session-')) return true
    return workspaceMode === 'production' && isBackendConversationId(chatId)
  }

  const deleteConversation = (chatId: string, deleteConfirmMessage: Bi) => {
    if (!canDeleteThread(chatId)) return
    if (!confirmDelete(deleteConfirmMessage)) return

    const finishLocal = () => {
      const stashed = transcripts.current.get(chatId) ?? []
      updateSessionChats((prev) => prev.filter((c) => c.id !== chatId))
      setProdThreads((prev) => prev.filter((t) => t.id !== chatId))
      transcripts.current.delete(chatId)
      updateExtras((prev) => {
        const next = { ...prev }
        for (const msg of stashed) delete next[msg.id]
        return next
      })
      setResponseState((prev) => {
        const { [chatId]: _removed, ...rest } = prev
        advisorSession.responseState = rest
        return rest
      })
      if (activeChatIdRef.current === chatId) {
        updateActiveChatId(null)
        conversationIdRef.current = null
        engineReset([])
      } else if (conversationIdRef.current === chatId) {
        conversationIdRef.current = null
      }
      showToast(deleteOkToast, 'ok')
    }

    if (chatId.startsWith('session-')) {
      finishLocal()
      return
    }

    void deleteOwnConversation(chatId)
      .then(finishLocal)
      .catch(() => showToast(deleteFailedToast, 'info'))
  }

  return { selectChat, newConversation, canDeleteThread, deleteConversation }
}
