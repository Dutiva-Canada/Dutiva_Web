import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { bi } from '@/i18n/core'
import type { LText } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import {
  deleteOwnConversation,
  getOwnConversation,
} from '@/features/app/views/memory/conversationsApi'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { useAdvisorEngine } from '@/features/app/advisor/useAdvisorEngine'
import type { AdvisorTurnSpec, ChatMessage, ToneCardData } from '@/features/app/advisor/types'
import { useAuth } from '@/features/app/auth/authContext'
import { AdvisorUsageLimitError, sendAdvisorMessage } from '@/features/app/advisor/chatApi'
import { usageLimitReply } from '@/features/app/advisor/usageLimit'
import { detectCrisisSignal } from '@/features/app/advisor/safety'
import { reportSafetyEvent } from '@/features/app/advisor/safetyTelemetry'
import { usePayRail, useWellbeingRail } from '@/features/app/rail/useEntityRails'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useDocStudio } from '@/features/app/docstudio/docStudioContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  chats,
  followupFallbackText,
  followupReplies,
  lightFlowFallbackText,
  lightFlows,
} from '@/data'
import type { FixtureAction, FixtureToneCard } from '@/data'
import { AdvisorHome } from './AdvisorHome'
import { ChatPane } from './ChatPane'
import type { JurisdictionPillTone } from './ChatPane'
import { ComplianceWorkspace } from './ComplianceWorkspace'
import { ThreadList } from './ThreadList'
import {
  estimatorFollowup,
  fallbackChips,
  fallbackIntro,
  flowJurisdictions,
  flowTitles,
  freshQuickForm,
  genericAck,
  terminationAssessment,
  terminationIntro,
} from './advisorFlows'
import {
  advisorScenarios,
  routeScenarioFromText,
  scenarioAck,
  scenarioAckSignedOut,
} from './advisorScenarios'
import type { ScenarioId, ScenarioTurn } from './advisorScenarios'
import { readNavNewChat, readNavStartFlow } from './advisorNav'
import { advisorSession } from './advisorSession'
import type { FlowKeyOrFallback, MessageExtras, SuggestChipSpec } from './advisorFlows'
import type { HomeAction } from '@/features/app/views/home/homeData'
import {
  buildAdvisorThreadEntries,
  buildAdvisorThreadGroups,
  conversationTitle,
  freshResponseState,
  isBackendConversationId,
  operationalNextStepChips,
  productionTranscript,
  readNavChatId,
  resolveJurisdictionTone,
  resolveScenarioTurn,
  resolveStartFlowKey,
  resolveWorkspaceState,
  scenarioExtras,
  scenarioForResponseState,
  scenarioForThread,
  seedExtras,
  seedId,
  settle,
  supportiveCrisisResponse,
  supportiveJurisdictionLine,
} from './advisorViewHelpers'
import { useAdvisorMessageActions } from './useAdvisorMessageActions'
import { useAdvisorProductionThreads } from './useAdvisorProductionThreads'
import { useAdvisorThreadSession } from './useAdvisorThreadSession'

/**
 * Advisor view — the full-page AI chat (prototype `isAdvisorView`):
 *
 * - left column: thread list grouped Pinned / Today / Previous 7 days / Older
 *   (the prototype renders these groups in the sidebar nav while the Advisor
 *   view is active; here they live inside the view — the shell sidebar is
 *   shared chrome);
 * - no active thread → the Advisor home empty state (metrics, daily brief,
 *   priorities, composer, suggestion grid);
 * - active thread → the transcript with the shared streaming engine, canned
 *   light flows, follow-up replies, doc-generate chips, and the termination
 *   quick form.
 *
 * Honours router state `{ chatId }` (AdvisorSearchNavState) to select a
 * thread on mount / on search navigation.
 */

export function AdvisorView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { openDocStudio } = useDocStudio()
  const auth = useAuth()
  const { status: authStatus } = auth
  const workspaceModeCtx = useWorkspaceMode()
  const { mode: workspaceMode, organizationId } = workspaceModeCtx
  const [sendingReal, setSendingReal] = useState(false)
  const {
    sessionChats,
    updateSessionChats,
    extras,
    updateExtras,
    responseState,
    setResponseState,
    patchResponseState,
    activeChatId,
    updateActiveChatId: setActiveChatIdBase,
    activeChatIdRef,
    transcripts,
    enginePrefix,
  } = useAdvisorThreadSession(location.state, workspaceMode)
  const selectChatRef = useRef<(chatId: string) => void>(() => {})
  /* Compliance Workspace as a sheet below the xl breakpoint. */
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const updateActiveChatId = (id: string | null) => {
    setActiveChatIdBase(id)
    setWorkspaceOpen(false)
  }
  const {
    prodThreads,
    setProdThreads,
    conversationIdRef,
    pendingNavChatIdRef,
    bindBackendConversationId,
  } = useAdvisorProductionThreads({
    workspaceMode,
    activeChatIdRef,
    updateActiveChatId,
    updateSessionChats,
    transcripts,
    setResponseState,
    selectChatRef,
  })
  const { handleCopyMessage, handleExportMessage } = useAdvisorMessageActions()
  const nextEngineId = useRef(1)
  const startFlowRef = useRef<(flowKey: FlowKeyOrFallback, userText: LText) => void>(() => {})
  const newConversationRef = useRef<() => void>(() => {})
  /* Last-handled router state (by identity) — guards StrictMode double-runs
     and re-renders between the replace-navigation and the state clearing. */
  const handledNavState = useRef<unknown>(undefined)

  /* ---------------------------------------------- fixture-card translation */

  const runFixtureAction = (action: FixtureAction) => {
    switch (action.kind) {
      case 'open-case':
        navigate(`/app/cases/${action.target}`)
        break
      case 'open-employee':
        navigate(`/app/employees/${action.target}`)
        break
      case 'open-chat':
        selectChatRef.current(action.target)
        break
      case 'open-compliance':
        navigate('/app/compliance')
        break
      case 'open-view':
        navigate(`/app/${action.target}`)
        break
      case 'draft-doc':
        openDocStudio(action.target)
        break
    }
  }

  const toToneCard = (card: FixtureToneCard): ToneCardData => ({
    tone: card.tone,
    title: card.title,
    body: card.body,
    confidence: card.confidence,
    citations: card.citations,
    actions: card.actions?.map((action) => ({
      label: action.label,
      primary: action.primary,
      onClick: () => runFixtureAction(action),
    })),
  })

  const seedFor = (chatId: string): ChatMessage[] => {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return []
    return chat.messages.map((m) => ({
      id: seedId(chatId, m.id),
      author: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      text: m.text ?? '',
      userChips: m.userChips,
      reasoning: m.reasoning,
      cards: m.cards?.map(toToneCard),
      status: 'done' as const,
    }))
  }

  /* --------------------------------------------------------------- engine */

  const initialMessages = useRef<ChatMessage[] | null>(null)
  initialMessages.current ??=
    activeChatId !== null ? (transcripts.current.get(activeChatId) ?? seedFor(activeChatId)) : []

  const engine = useAdvisorEngine({ idPrefix: enginePrefix, initial: initialMessages.current })

  /** Append a user bubble and return its (mirrored) engine id. */
  const pushUser = (text: LText, chips?: LText[]): string => {
    const id = `${enginePrefix}-${nextEngineId.current++}`
    engine.sendUser(text, chips)
    return id
  }

  /** Push an advisor turn and return its (mirrored) engine id. */
  const pushAdvisor = (spec: AdvisorTurnSpec): string => {
    const id = `${enginePrefix}-${nextEngineId.current++}`
    engine.pushTurn(spec)
    return id
  }

  const stashActive = () => {
    if (activeChatId !== null) transcripts.current.set(activeChatId, settle(engine.messages))
  }

  /* Stash the open transcript when the view unmounts (route change) so the
     conversation is still there when the user comes back. */
  const stashRef = useRef(stashActive)
  stashRef.current = stashActive
  useEffect(() => () => stashRef.current(), [])

  /* ------------------------------------------------- response experience */

  /**
   * Append one scenario advisor turn: streams the reply, attaches its chat
   * extras (banner / gated docs / follow-ups / province prompt), and replaces
   * the thread's structured payload — a fresh turn context every time, per
   * the response contract.
   */
  const pushScenarioTurn = (chatId: string, turn: ScenarioTurn) => {
    const turnId = pushAdvisor({ text: turn.reply })
    /* Obey the gates, always — document chips only render when the route
       allows documents (handoff rule 3). */
    const messageExtras = scenarioExtras(turn)
    if (Object.keys(messageExtras).length > 0) {
      updateExtras((prev) => ({ ...prev, [turnId]: messageExtras }))
    }
    patchResponseState(chatId, { response: turn.response })
  }

  /** Start one of the six demo response-mode conversations. */
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
    engine.reset([])
    pushUser(userText ?? scenario.user)
    pushScenarioTurn(id, scenario.turn)
  }

  /** Province chip pick on a jurisdiction-unknown turn (prototype `pickProvince`). */
  const pickProvince = (province: LText) => {
    const chatId = activeChatId
    if (chatId === null) return
    const state = responseState[chatId]
    const scenario = scenarioForResponseState(state)
    if (!state || !scenario?.resolved || state.provinceResolved) return
    pushUser('', [province])
    patchResponseState(chatId, { provinceResolved: true })
    pushScenarioTurn(chatId, scenario.resolved)
  }

  /** Web-search toggle on a current-info turn (prototype `toggleWeb`). */
  const toggleWeb = () => {
    const chatId = activeChatId
    if (chatId === null) return
    const state = responseState[chatId]
    const scenario = scenarioForResponseState(state)
    if (!state || !scenario?.webOff) return
    const webOn = !state.webOn
    patchResponseState(chatId, { webOn })
    pushScenarioTurn(chatId, webOn ? scenario.turn : scenario.webOff)
  }

  /* ---------------------------------------------------- thread navigation */

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
      const restoreWorkspace = (
        response: NonNullable<(typeof prodThreads)[number]['lastAdvisorResponse']> | null,
      ) => {
        if (response != null) patchResponseState(chatId, { response })
      }
      const stashed = transcripts.current.get(chatId)
      if (stashed) {
        engine.reset(stashed)
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
      engine.reset([])
      void getOwnConversation(chatId)
        .then((conv) => {
          if (conv === null || activeChatIdRef.current !== chatId) return
          const messages = productionTranscript(conv)
          transcripts.current.set(chatId, messages)
          engine.reset(messages)
          restoreWorkspace(conv.lastAdvisorResponse)
        })
        .catch(() => {
          if (activeChatIdRef.current !== chatId) return
          engine.reset([])
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
      /* First visit to a demo thread — seed and stream it. */
      setResponseState((prev) => {
        const next = { ...prev, [chatId]: freshResponseState(scenario.id) }
        advisorSession.responseState = next
        return next
      })
      engine.reset([])
      pushUser(scenario.user)
      pushScenarioTurn(chatId, scenario.turn)
      return
    }
    engine.reset(stashed ?? seedFor(chatId))
  }
  selectChatRef.current = selectChat

  const newConversation = () => {
    stashActive()
    updateActiveChatId(null)
    conversationIdRef.current = null
    engine.reset([])
  }
  newConversationRef.current = newConversation

  const canDeleteThread = (chatId: string): boolean => {
    if (chatId.startsWith('session-')) return true
    return workspaceMode === 'production' && isBackendConversationId(chatId)
  }

  const deleteConversation = (chatId: string) => {
    if (!canDeleteThread(chatId)) return
    if (!window.confirm(x(M.advisorview_delete_confirm))) return

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
        engine.reset([])
      } else if (conversationIdRef.current === chatId) {
        conversationIdRef.current = null
      }
      showToast(M.advisorview_delete_ok, 'ok')
    }

    if (chatId.startsWith('session-')) {
      finishLocal()
      return
    }

    void deleteOwnConversation(chatId)
      .then(finishLocal)
      .catch(() => showToast(M.advisorview_delete_failed, 'info'))
  }

  /* Search overlay navigation: /app/advisor with { chatId } router state. */
  useEffect(() => {
    const chatId = readNavChatId(location.state)
    if (chatId === null) return
    navigate(location.pathname, { replace: true, state: null })
    pendingNavChatIdRef.current = chatId
    selectChatRef.current(chatId)
  }, [location.state, location.pathname, navigate])

  /* Home / Workflows navigation contracts: { prompt, flowKey? } starts a
     fresh flow (explicit key wins — the EN-keyword router is only for
     free-typed text, matching the prototype's startFlow(key, text));
     { newConversation } resets to the empty state. State is handled once by
     identity, then cleared via replace-navigation. */
  useEffect(() => {
    const state: unknown = location.state
    if (state === null || state === undefined || handledNavState.current === state) return
    handledNavState.current = state

    const start = readNavStartFlow(state)
    if (start) {
      navigate(location.pathname, { replace: true, state: null })
      /* An explicit flowKey (a deliberate structured-workflow request from
         elsewhere in the app) always wins. Only a bare free-form prompt
         falls back to keyword routing — and only when signed out; signed
         in, free text always goes to the real backend (see startFlow's
         'fallback' branch). */
      startFlowRef.current(resolveStartFlowKey(start, authStatus), start.prompt)
      return
    }
    if (readNavNewChat(state)) {
      navigate(location.pathname, { replace: true, state: null })
      newConversationRef.current()
    }
  }, [location.state, location.pathname, navigate, authStatus])

  /* ----------------------------------------------------------- chat flows */

  /* Crisis intercept (AGENT.md §8, AI_USAGE_STRATEGY §5.1): deterministic and
     BEFORE any model call or flow routing, on every free-text entry point. A
     crisis message never reaches the LLM, never starts an HR workflow, and
     always gets the maintained resource — fail-safe regardless of auth state.
     Returns true when it fired (callers stop the turn). */
  const interceptCrisis = (raw: string, chatId: string | null): boolean => {
    if (!detectCrisisSignal(raw)) return false
    /* Fresh-turn contract: replace any prior structured payload with the
       maintained supportive one, so no compliance scaffolding (risk meters,
       legal basis, stale scenario reads) sits beside the crisis reply. */
    if (chatId !== null) patchResponseState(chatId, { response: supportiveCrisisResponse })
    pushAdvisor({ text: M.advisorview_crisis_support })
    void reportSafetyEvent({
      conversationId: conversationIdRef.current,
      actions: ['crisis-intercept'],
    })
    return true
  }

  /* Home-composer crisis: start a dedicated support thread — support title,
     the supportive workspace payload, the maintained 9-8-8 reply — instead of
     any flow or scenario routing. Returns false when there is no crisis
     signal (caller proceeds normally). */
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
    engine.reset([])
    pushUser(text)
    pushAdvisor({ text: M.advisorview_crisis_support })
    void reportSafetyEvent({ conversationId: null, actions: ['crisis-intercept'] })
    return true
  }

  /**
   * Shared failure handling for the two real-backend send paths.
   *
   * A beta usage limit is not an outage: it answers as an ordinary Advisor
   * turn explaining when the Advisor frees up and that the rest of the product
   * is unaffected. The red error turn is reserved for things that are actually
   * broken — its Retry button would only earn a second refusal here.
   */
  const handleRealChatFailure = (error: unknown) => {
    if (error instanceof AdvisorUsageLimitError) {
      pushAdvisor({ text: usageLimitReply(error) })
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

  const startFlow = (flowKey: FlowKeyOrFallback, userText: LText) => {
    stashActive()
    const id = `session-${advisorSession.nextChatSeq++}`
    const userTextString = typeof userText === 'string' ? userText : userText.en
    const title =
      flowKey === 'fallback'
        ? conversationTitle([{ role: 'user', content: userTextString }])
        : flowTitles[flowKey]
    updateSessionChats((prev) => [
      { id, title, pinned: false, bucket: 'today', flowKey },
      ...prev,
    ])
    updateActiveChatId(id)
    conversationIdRef.current = null
    engine.reset([])
    pushUser(userText)

    /* Before flow routing: a crisis phrase containing a flow keyword (e.g.
       "terminate") must not launch the termination quick-form. The thread
       sheds its flow framing too — it is a support thread now. */
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
      /* Free text that matched no known flow keyword. Signed in: ask the
         real backend instead of the scripted "point you in the right
         direction" chips — same pattern as sendInThread. Signed out (or on
         failure): the original scripted fallback, unchanged. */
      if (authStatus === 'signed-in') {
        setSendingReal(true)
        void sendAdvisorMessage(userTextString, conversationIdRef.current, organizationId)
          .then((result) => {
            bindBackendConversationId(id, result.conversationId)
            const stateChatId =
              id.startsWith('session-') && result.conversationId !== id ? result.conversationId : id
            const reply = result.reply || genericAck
            const turnId = pushAdvisor({ text: reply })
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
            const replyText = typeof reply === 'string' ? reply : reply.en
            const navChips = operationalNextStepChips(userTextString, replyText)
            updateExtras((prev) => ({
              ...prev,
              [turnId]: {
                ...prev[turnId],
                ...(result.response?.memory != null ? { memory: result.response.memory } : {}),
                ...(navChips.length > 0 ? { navChips } : {}),
              },
            }))
          })
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
  startFlowRef.current = startFlow

  /**
   * Free-form send inside an active thread (prototype `sendComposer`).
   * Demo scenario threads keep the prototype's scripted acknowledgements.
   * Signed in elsewhere: routes to the real advisor-chat backend (see
   * chatApi.ts); a structured payload on the result replaces the thread's
   * workspace payload — and its absence clears it (fresh turn context).
   * Otherwise (or on failure): the prototype's canned acknowledgement.
   */
  const sendInThread = (text: string) => {
    const chatId = activeChatId
    pushUser(text)
    /* Before the scenario/auth branches — scripted threads must not answer a
       crisis message with a canned acknowledgement either. */
    if (interceptCrisis(text, chatId)) return
    const isScenarioThread = chatId !== null && responseState[chatId]?.scenarioId != null
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
      .then((result) => {
        bindBackendConversationId(chatId, result.conversationId)
        const stateChatId =
          chatId !== null && chatId.startsWith('session-') && result.conversationId !== chatId
            ? result.conversationId
            : chatId
        const replyPayload = result.reply || genericAck
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
        const navChips = operationalNextStepChips(text, replyText)
        updateExtras((prev) => ({
          ...prev,
          [turnId]: {
            ...prev[turnId],
            ...(result.response?.memory != null ? { memory: result.response.memory } : {}),
            ...(navChips.length > 0 ? { navChips } : {}),
          },
        }))
      })
      .catch(handleRealChatFailure)
      .finally(() => setSendingReal(false))
  }

  /** Follow-up chip click (prototype `handleFollowup`). */
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

  /* ------------------------------------------------------------ quick form */

  const changeQuickField = (messageId: string, fieldIndex: number, valueEn: string) => {
    updateExtras((prev) => {
      const entry = prev[messageId]
      const form = entry?.quickForm
      if (!entry || !form) return prev
      return {
        ...prev,
        [messageId]: {
          ...entry,
          quickForm: {
            ...form,
            fields: form.fields.map((f, i) => (i === fieldIndex ? { ...f, value: valueEn } : f)),
          },
        },
      }
    })
  }

  const submitQuickForm = (messageId: string) => {
    const form = extras[messageId]?.quickForm
    if (!form || form.submitted) return
    updateExtras((prev) => {
      const entry = prev[messageId]
      const current = entry?.quickForm
      if (!entry || !current) return prev
      return { ...prev, [messageId]: { ...entry, quickForm: { ...current, submitted: true } } }
    })
    const values = form.fields.map(
      (f) => f.options.find((o) => o.en === f.value) ?? bi(f.value, f.value),
    )
    pushUser('', values)
    const turnId = pushAdvisor({
      text: terminationAssessment.text,
      reasoning: terminationAssessment.reasoning,
      cards: terminationAssessment.cards.map(toToneCard),
    })
    updateExtras((prev) => ({
      ...prev,
      [turnId]: { docs: terminationAssessment.docs, followups: terminationAssessment.followups },
    }))
  }

  /* ------------------------------------------------- home priority rails */

  /* Shared askAboutComp / askAboutWellbeing ports (rail/useEntityRails). */
  const openCompRail = usePayRail()
  const openWellbeingRail = useWellbeingRail()

  /* Resolve the canonical HomeAction (home/homeData) inside the Advisor:
     'chat'/'flow' use the in-view thread machinery instead of navigating. */
  const runPriorityAction = (action: HomeAction) => {
    switch (action.kind) {
      case 'route':
        navigate(action.to)
        break
      case 'chat':
        selectChatRef.current(action.chatId)
        break
      case 'doc':
        openDocStudio(action.templateKey)
        break
      case 'flow':
        startFlowRef.current(action.flowKey, action.prompt)
        break
      case 'comp-rail':
        openCompRail(action.employeeId)
        break
      case 'wellbeing-rail':
        openWellbeingRail(action.employeeId)
        break
    }
  }

  /* -------------------------------------------------------------- render */

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
      transcripts.current.has(activeChatId))
  const activeFlowKey: FlowKeyOrFallback =
    activeFixture?.flowKey ?? activeSession?.flowKey ?? 'fallback'

  /* Response-experience state of the active thread: which scenario turn is
     current (jurisdiction resolved / web toggled) drives the jurisdiction
     pill and the workspace payload. */
  const activeResponseState = activeChatId !== null ? responseState[activeChatId] : undefined
  const activeScenario = scenarioForResponseState(activeResponseState)
  const currentScenarioTurn = resolveScenarioTurn(activeScenario, activeResponseState)
  /* Support mode wins the pill (AGENT.md §8): a crisis-patched supportive
     payload must not leave compliance framing ("Ontario — ESA, 2000",
     "Confirm jurisdiction before use") pinned over the crisis reply. */
  const supportModeActive = activeResponseState?.response?.supportNotice === true
  const jurisdictionLine = supportModeActive
    ? (supportiveJurisdictionLine ?? flowJurisdictions[activeFlowKey])
    : (currentScenarioTurn?.jurisdictionLine ?? flowJurisdictions[activeFlowKey])
  const jurisdictionTone: JurisdictionPillTone = supportModeActive
    ? 'support'
    : resolveJurisdictionTone(currentScenarioTurn)
  const workspaceState = resolveWorkspaceState(
    authStatus,
    engine.busy || sendingReal,
    activeResponseState?.response,
    currentScenarioTurn,
  )

  /* Scenario threads group like the handoff prototype: s1 under Pinned only,
     the rest under Today. Fixture chats keep the App v2 grouping (a pinned
     chat also shows in its recency bucket). In production mode only the
     real conversations started this session appear — the demo scenario and
     Northgate fixture threads are demo-only. */
  const allThreads = buildAdvisorThreadEntries(
    workspaceMode,
    sessionChats,
    prodThreads,
    activeChatId,
  )
  const groups = buildAdvisorThreadGroups(allThreads, {
    pinned: M.advisorview_group_pinned,
    today: M.advisorview_group_today,
    week: M.advisorview_group_week,
    older: M.advisorview_group_older,
  })

  const getExtras = (messageId: string): MessageExtras | undefined =>
    extras[messageId] ?? seedExtras[messageId]

  const onSuggestChip = (chip: SuggestChipSpec) => startFlow(chip.flowKey, chip.label)

  const idleSend = (prompt: string) => {
    if (startCrisisThread(prompt)) return
    if (authStatus === 'signed-in') startFlow('fallback', prompt)
    else startScenario(routeScenarioFromText(prompt), prompt)
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ThreadList
        groups={groups}
        activeChatId={activeChatId}
        onSelect={selectChat}
        onNewConversation={newConversation}
        onDelete={deleteConversation}
        canDelete={canDeleteThread}
      />
      {hasActiveChat ? (
        <>
          <ChatPane
            messages={engine.messages}
            busy={engine.busy || sendingReal}
            jurisdiction={jurisdictionLine}
            jurisdictionTone={jurisdictionTone}
            getExtras={getExtras}
            onSend={sendInThread}
            onRetry={engine.retryTurn}
            onFollowup={handleFollowup}
            onGenerateDoc={openDocStudio}
            onSuggestChip={onSuggestChip}
            onQuickFormChange={changeQuickField}
            onQuickFormSubmit={submitQuickForm}
            onCopyMessage={handleCopyMessage}
            onExportMessage={handleExportMessage}
            onPickProvince={pickProvince}
            onOpenWorkspace={() => setWorkspaceOpen(true)}
          />
          <ComplianceWorkspace
            state={workspaceState}
            onPickProvince={pickProvince}
            onToggleWeb={activeScenario?.webOff ? toggleWeb : undefined}
            onIdleSend={idleSend}
            onIdleNavigate={(to) => navigate(to)}
            showIdleStarters={engine.messages.length === 0}
            mobileOpen={workspaceOpen}
            onCloseMobile={() => setWorkspaceOpen(false)}
          />
        </>
      ) : (
        <>
          <AdvisorHome
            onSend={(text) => {
              /* Crisis first — regardless of auth state, before flow or
                 scenario routing (AGENT.md §8). */
              if (startCrisisThread(text)) return
              if (authStatus === 'signed-in') startFlow('fallback', text)
              else startScenario(routeScenarioFromText(text), text)
            }}
            onScenario={(scenarioId) => startScenario(scenarioId)}
            onPriorityAction={runPriorityAction}
            onMetricClick={(view) => navigate(`/app/${view}`)}
          />
          {/* Keep the third column present on home so opening a thread doesn’t
              jump the layout; idle starters mirror the empty workspace. */}
          <ComplianceWorkspace
            state={authStatus === 'signed-in' ? { kind: 'idle' } : { kind: 'locked' }}
            onIdleSend={idleSend}
            onIdleNavigate={(to) => navigate(to)}
            showIdleStarters
            mobileOpen={false}
            onCloseMobile={() => {}}
          />
        </>
      )}
    </div>
  )
}
