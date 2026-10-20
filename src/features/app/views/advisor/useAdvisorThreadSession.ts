import { useRef, useState } from 'react'
import type { WorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import type { MessageExtras } from './advisorFlows'
import { advisorSession } from './advisorSession'
import type { SessionChat, ThreadResponseState } from './advisorSession'
import { ENGINE_PREFIX, freshResponseState, resolveInitialActiveChatId } from './advisorViewHelpers'

/**
 * Session-scoped Advisor thread state mirrored into advisorSession for
 * navigation survival. Pure UI state (workspace sheet open) stays in the view.
 */
export function useAdvisorThreadSession(
  initialLocationState: unknown,
  workspaceMode: WorkspaceMode,
) {
  const [sessionChats, setSessionChats] = useState<SessionChat[]>(() => advisorSession.chats)
  const updateSessionChats = (updater: (prev: SessionChat[]) => SessionChat[]) => {
    setSessionChats((prev) => {
      const next = updater(prev)
      advisorSession.chats = next
      return next
    })
  }

  const [extras, setExtras] = useState<Record<string, MessageExtras>>(() => advisorSession.extras)
  const updateExtras = (
    updater: (prev: Record<string, MessageExtras>) => Record<string, MessageExtras>,
  ) => {
    setExtras((prev) => {
      const next = updater(prev)
      advisorSession.extras = next
      return next
    })
  }

  const [responseState, setResponseState] = useState<Record<string, ThreadResponseState>>(
    () => advisorSession.responseState,
  )
  const patchResponseState = (chatId: string, patch: Partial<ThreadResponseState>) => {
    setResponseState((prev) => {
      const current = prev[chatId] ?? freshResponseState(null)
      const next = { ...prev, [chatId]: { ...current, ...patch } }
      advisorSession.responseState = next
      return next
    })
  }

  const [activeChatId, setActiveChatId] = useState<string | null>(() =>
    resolveInitialActiveChatId(initialLocationState, workspaceMode),
  )
  const activeChatIdRef = useRef<string | null>(null)
  activeChatIdRef.current = activeChatId

  const updateActiveChatId = (id: string | null) => {
    advisorSession.activeChatId = id
    activeChatIdRef.current = id
    setActiveChatId(id)
  }

  const transcripts = useRef(advisorSession.transcripts)
  const enginePrefixRef = useRef<string | null>(null)
  enginePrefixRef.current ??= `${ENGINE_PREFIX}m${advisorSession.mountSeq++}`
  const enginePrefix = enginePrefixRef.current

  /* resetAdvisorSession swaps the store contents for fresh objects while
     this hook may stay mounted (mode/org switch — the outlet keys on
     pathname, not mode). Syncing during render drops every captured
     reference to the orphaned store before stale state can be written back
     into it. */
  const [resetSeq, setResetSeq] = useState(advisorSession.resetSeq)
  if (resetSeq !== advisorSession.resetSeq) {
    setResetSeq(advisorSession.resetSeq)
    advisorSession.activeChatId = null
    setSessionChats(advisorSession.chats)
    setExtras(advisorSession.extras)
    setResponseState(advisorSession.responseState)
    activeChatIdRef.current = null
    setActiveChatId(null)
    transcripts.current = advisorSession.transcripts
    enginePrefixRef.current = `${ENGINE_PREFIX}m${advisorSession.mountSeq++}`
  }

  return {
    resetSeq,
    sessionChats,
    updateSessionChats,
    extras,
    updateExtras,
    responseState,
    setResponseState,
    patchResponseState,
    activeChatId,
    updateActiveChatId,
    activeChatIdRef,
    transcripts,
    enginePrefix,
  }
}
