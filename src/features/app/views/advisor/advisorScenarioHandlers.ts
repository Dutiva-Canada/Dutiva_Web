/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { RefObject } from 'react'
import type { LText } from '@/i18n/core'
import type { AdvisorTurnSpec, ChatMessage } from '@/features/app/advisor/types'
import { advisorScenarios } from './advisorScenarios'
import type { ScenarioId, ScenarioTurn } from './advisorScenarios'
import { advisorSession, type SessionChat } from './advisorSession'
import type { MessageExtras } from './advisorFlows'
import { freshResponseState, scenarioExtras, scenarioForResponseState } from './advisorViewHelpers'

type PushUser = (text: LText, chips?: LText[]) => string
type PushAdvisor = (spec: AdvisorTurnSpec) => string

interface ScenarioHandlersOptions {
  pushUser: PushUser
  pushAdvisor: PushAdvisor
  updateExtras: (
    updater: (prev: Record<string, MessageExtras>) => Record<string, MessageExtras>,
  ) => void
  patchResponseState: (
    chatId: string,
    patch: Partial<ReturnType<typeof freshResponseState>>,
  ) => void
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
  getActiveChatId: () => string | null
  getResponseState: () => Record<string, ReturnType<typeof freshResponseState>>
}

/** Demo scenario turns — the six response-mode conversations and their chips. */
export function createAdvisorScenarioHandlers(options: ScenarioHandlersOptions) {
  const {
    pushUser,
    pushAdvisor,
    updateExtras,
    patchResponseState,
    updateSessionChats,
    updateActiveChatId,
    setResponseState,
    engineReset,
    stashActive,
    conversationIdRef,
    getActiveChatId,
    getResponseState,
  } = options

  const pushScenarioTurn = (chatId: string, turn: ScenarioTurn) => {
    const turnId = pushAdvisor({ text: turn.reply })
    const messageExtras = scenarioExtras(turn)
    if (Object.keys(messageExtras).length > 0) {
      updateExtras((prev) => ({ ...prev, [turnId]: messageExtras }))
    }
    patchResponseState(chatId, { response: turn.response })
  }

  const startScenario = (scenarioId: ScenarioId, userText?: LText) => {
    const scenario = advisorScenarios[scenarioId]
    stashActive()
    const id = `session-${advisorSession.nextChatSeq++}`
    updateSessionChats((prev) => [
      {
        id,
        title: scenario.title,
        pinned: false,
        bucket: 'today',
        flowKey: 'fallback',
        scenarioId,
      },
      ...prev,
    ])
    updateActiveChatId(id)
    conversationIdRef.current = null
    setResponseState((prev) => {
      const next = { ...prev, [id]: freshResponseState(scenarioId) }
      advisorSession.responseState = next
      return next
    })
    engineReset([])
    pushUser(userText ?? scenario.user)
    pushScenarioTurn(id, scenario.turn)
  }

  const pickProvince = (province: LText) => {
    const chatId = getActiveChatId()
    if (chatId === null) return
    const state = getResponseState()[chatId]
    const scenario = scenarioForResponseState(state)
    if (!state || !scenario?.resolved || state.provinceResolved) return
    pushUser('', [province])
    patchResponseState(chatId, { provinceResolved: true })
    pushScenarioTurn(chatId, scenario.resolved)
  }

  const toggleWeb = () => {
    const chatId = getActiveChatId()
    if (chatId === null) return
    const state = getResponseState()[chatId]
    const scenario = scenarioForResponseState(state)
    if (!state || !scenario?.webOff) return
    const webOn = !state.webOn
    patchResponseState(chatId, { webOn })
    pushScenarioTurn(chatId, webOn ? scenario.turn : scenario.webOff)
  }

  return { pushScenarioTurn, startScenario, pickProvince, toggleWeb }
}
