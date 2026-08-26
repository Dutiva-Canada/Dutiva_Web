import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import type { ChatMessage } from '@/features/app/advisor/types'
import type { WorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listOwnConversations,
  type ProductionConversation,
} from '@/features/app/views/memory/conversationsApi'
import { advisorSession } from './advisorSession'
import type { SessionChat, ThreadResponseState } from './advisorSession'

interface UseAdvisorProductionThreadsParams {
  workspaceMode: WorkspaceMode
  activeChatIdRef: MutableRefObject<string | null>
  updateActiveChatId: (id: string | null) => void
  updateSessionChats: (updater: (prev: SessionChat[]) => SessionChat[]) => void
  transcripts: MutableRefObject<Map<string, ChatMessage[]>>
  setResponseState: Dispatch<SetStateAction<Record<string, ThreadResponseState>>>
  selectChatRef: MutableRefObject<(chatId: string) => void>
}

/**
 * Production-mode conversation list, session→backend id migration, and
 * deferred search-navigation hydration once the thread index loads.
 */
export function useAdvisorProductionThreads({
  workspaceMode,
  activeChatIdRef,
  updateActiveChatId,
  updateSessionChats,
  transcripts,
  setResponseState,
  selectChatRef,
}: UseAdvisorProductionThreadsParams) {
  const conversationIdRef = useRef<string | null>(null)
  const [prodThreads, setProdThreads] = useState<ProductionConversation[]>([])
  const [prodThreadsLoaded, setProdThreadsLoaded] = useState(false)
  const pendingNavChatIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (workspaceMode !== 'production') {
      setProdThreads([])
      setProdThreadsLoaded(false)
      return
    }
    setProdThreadsLoaded(false)
    void listOwnConversations(50)
      .then(setProdThreads)
      .catch(() => setProdThreads([]))
      .finally(() => setProdThreadsLoaded(true))
  }, [workspaceMode])

  const migrateThreadId = (oldId: string, newId: string) => {
    if (oldId === newId) return
    updateSessionChats((prev) => {
      const seen = new Set<string>()
      return prev
        .map((c) => (c.id === oldId ? { ...c, id: newId } : c))
        .filter((c) => {
          if (seen.has(c.id)) return false
          seen.add(c.id)
          return true
        })
    })
    const stashed = transcripts.current.get(oldId)
    if (stashed) {
      transcripts.current.set(newId, stashed)
      transcripts.current.delete(oldId)
    }
    setResponseState((prev) => {
      const moved = prev[oldId]
      if (moved === undefined) return prev
      const { [oldId]: _removed, ...rest } = prev
      const next = { ...rest, [newId]: moved }
      advisorSession.responseState = next
      return next
    })
    if (activeChatIdRef.current === oldId) updateActiveChatId(newId)
    conversationIdRef.current = newId
    setProdThreads((prev) => {
      if (prev.some((t) => t.id === newId)) return prev
      return [
        {
          id: newId,
          messages: [],
          updatedAt: new Date().toISOString(),
          lastAdvisorResponse: null,
        },
        ...prev,
      ]
    })
  }

  const bindBackendConversationId = (threadId: string | null, backendId: string) => {
    if (threadId !== null && threadId.startsWith('session-') && backendId !== threadId) {
      migrateThreadId(threadId, backendId)
      return
    }
    conversationIdRef.current = backendId
  }

  useEffect(() => {
    if (workspaceMode !== 'production' || !prodThreadsLoaded) return
    const pending = pendingNavChatIdRef.current
    if (pending === null) return
    selectChatRef.current(pending)
    pendingNavChatIdRef.current = null
  }, [workspaceMode, prodThreadsLoaded, prodThreads, selectChatRef])

  return {
    prodThreads,
    setProdThreads,
    prodThreadsLoaded,
    conversationIdRef,
    pendingNavChatIdRef,
    bindBackendConversationId,
  }
}
