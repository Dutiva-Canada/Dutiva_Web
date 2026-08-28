/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { Bi } from '@/i18n/core'
import type { AuthStatus } from '@/features/app/auth/authContext'
import type { WorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import type { ProductionConversation } from '@/features/app/views/memory/conversationsApi'
import type { ChatMessage } from '@/features/app/advisor/types'
import { chats } from '@/data'
import type { JurisdictionPillTone } from './ChatPane'
import type { FlowKeyOrFallback } from './advisorFlows'
import { flowJurisdictions } from './advisorFlows'
import type { SessionChat, ThreadResponseState } from './advisorSession'
import {
  buildAdvisorThreadEntries,
  buildAdvisorThreadGroups,
  isBackendConversationId,
  resolveJurisdictionTone,
  resolveScenarioTurn,
  resolveWorkspaceState,
  scenarioForResponseState,
  scenarioForThread,
  supportiveJurisdictionLine,
} from './advisorViewHelpers'

interface AdvisorViewPresentationInput {
  activeChatId: string | null
  sessionChats: SessionChat[]
  prodThreads: ProductionConversation[]
  transcripts: Map<string, ChatMessage[]>
  responseState: Record<string, ThreadResponseState>
  workspaceMode: WorkspaceMode
  authStatus: AuthStatus
  engineBusy: boolean
  sendingReal: boolean
  groupLabels: { pinned: Bi; today: Bi; week: Bi; older: Bi }
}

/** Derived Advisor chrome: thread groups, jurisdiction pill, workspace payload. */
export function computeAdvisorViewPresentation(input: AdvisorViewPresentationInput) {
  const {
    activeChatId,
    sessionChats,
    prodThreads,
    transcripts,
    responseState,
    workspaceMode,
    authStatus,
    engineBusy,
    sendingReal,
    groupLabels,
  } = input

  const activeFixture = activeChatId !== null ? chats.find((c) => c.id === activeChatId) : undefined
  const activeSession =
    activeChatId !== null ? sessionChats.find((c) => c.id === activeChatId) : undefined
  const activeScenarioThread = scenarioForThread(activeChatId)
  const hasActiveChat =
    activeChatId !== null &&
    (activeFixture !== undefined ||
      activeSession !== undefined ||
      activeScenarioThread !== undefined ||
      prodThreads.some((t) => t.id === activeChatId) ||
      sessionChats.some((c) => c.id === activeChatId) ||
      isBackendConversationId(activeChatId) ||
      transcripts.has(activeChatId))
  const activeFlowKey: FlowKeyOrFallback =
    activeFixture?.flowKey ?? activeSession?.flowKey ?? 'fallback'

  const activeResponseState = activeChatId !== null ? responseState[activeChatId] : undefined
  const activeScenario = scenarioForResponseState(activeResponseState)
  const currentScenarioTurn = resolveScenarioTurn(activeScenario, activeResponseState)
  const supportModeActive = activeResponseState?.response?.supportNotice === true
  const jurisdictionLine = supportModeActive
    ? (supportiveJurisdictionLine ?? flowJurisdictions[activeFlowKey])
    : (currentScenarioTurn?.jurisdictionLine ?? flowJurisdictions[activeFlowKey])
  const jurisdictionTone: JurisdictionPillTone = supportModeActive
    ? 'support'
    : resolveJurisdictionTone(currentScenarioTurn)
  const workspaceState = resolveWorkspaceState(
    authStatus,
    engineBusy || sendingReal,
    activeResponseState?.response,
    currentScenarioTurn,
  )

  const allThreads = buildAdvisorThreadEntries(
    workspaceMode,
    sessionChats,
    prodThreads,
    activeChatId,
  )
  const groups = buildAdvisorThreadGroups(allThreads, groupLabels)

  return {
    groups,
    hasActiveChat,
    jurisdictionLine,
    jurisdictionTone,
    workspaceState,
    activeScenario,
  }
}
