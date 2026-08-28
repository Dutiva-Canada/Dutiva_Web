import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { bi } from '@/i18n/core'
import type { LText } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { createAdvisorCrisisHandlers } from './advisorCrisisHandlers'
import { createAdvisorScenarioHandlers } from './advisorScenarioHandlers'
import { createAdvisorThreadNavigation } from './advisorThreadNavigation'
import { createRealChatFailureHandler } from './advisorProductionChat'
import { createAdvisorFlowHandlers } from './advisorFlowHandlers'
import { createAdvisorChatSendHandlers } from './advisorChatSendHandlers'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { useAdvisorEngine } from '@/features/app/advisor/useAdvisorEngine'
import type { AdvisorTurnSpec, ChatMessage, ToneCardData } from '@/features/app/advisor/types'
import { useAuth } from '@/features/app/auth/authContext'
import { startAdvisorPackCheckout } from '@/features/app/advisor/packCheckout'
import type { AdvisorPackSize } from '@/config/advisorUsage'
import { usePayRail, useWellbeingRail } from '@/features/app/rail/useEntityRails'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useDocStudio } from '@/features/app/docstudio/docStudioContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import {
  chats,
} from '@/data'
import type { FixtureAction, FixtureToneCard } from '@/data'
import type { JurisdictionPillTone } from './ChatPane'
import {
  flowJurisdictions,
  terminationAssessment,
} from './advisorFlows'
import {
  routeScenarioFromText,
} from './advisorScenarios'
import type { ScenarioId } from './advisorScenarios'
import { readNavNewChat, readNavStartFlow } from './advisorNav'
import type { FlowKeyOrFallback, MessageExtras, SuggestChipSpec } from './advisorFlows'
import type { HomeAction } from '@/features/app/views/home/homeData'
import {
  buildAdvisorThreadEntries,
  buildAdvisorThreadGroups,
  isBackendConversationId,
  readNavChatId,
  resolveJurisdictionTone,
  resolveScenarioTurn,
  resolveStartFlowKey,
  resolveWorkspaceState,
  scenarioForResponseState,
  scenarioForThread,
  scenarioThreadId,
  seedExtras,
  seedId,
  settle,
  supportiveJurisdictionLine,
} from './advisorViewHelpers'
import { useAdvisorMessageActions } from './useAdvisorMessageActions'
import { useAdvisorProductionThreads } from './useAdvisorProductionThreads'
import { useAdvisorThreadSession } from './useAdvisorThreadSession'

/**
 * Advisor view controller — thread session, streaming engine, demo flows,
 * production chat, crisis intercept, and workspace state. Render shell lives
 * in AdvisorView.tsx.
 */
export function useAdvisorViewController() {
  const navigate = useNavigate()
  const location = useLocation()
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { openDocStudio } = useDocStudio()
  const auth = useAuth()
  const { status: authStatus } = auth
  const workspaceModeCtx = useWorkspaceMode()
  const { mode: workspaceMode, organizationId } = workspaceModeCtx
  const { isPublicDemo } = useWorkspaceRoot()
  const [sendingReal, setSendingReal] = useState(false)
  const [buyingAdvisorPack, setBuyingAdvisorPack] = useState<AdvisorPackSize | null>(null)
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

  const { pushScenarioTurn, startScenario, pickProvince, toggleWeb } =
    createAdvisorScenarioHandlers({
      pushUser,
      pushAdvisor,
      updateExtras,
      patchResponseState,
      updateSessionChats,
      updateActiveChatId,
      setResponseState,
      engineReset: (messages) => engine.reset(messages),
      stashActive,
      conversationIdRef,
      getActiveChatId: () => activeChatId,
      getResponseState: () => responseState,
    })

  /* ---------------------------------------------------- thread navigation */

  const {
    selectChat,
    newConversation,
    canDeleteThread,
    deleteConversation: deleteConversationCore,
  } = createAdvisorThreadNavigation({
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
    engineReset: (messages) => engine.reset(messages),
    pushUser,
    pushScenarioTurn,
    seedFor,
    stashActive,
    updateExtras,
    showToast,
    confirmDelete: (message) => window.confirm(x(message)),
    deleteOkToast: M.advisorview_delete_ok,
    deleteFailedToast: M.advisorview_delete_failed,
  })
  const deleteConversation = (chatId: string) =>
    deleteConversationCore(chatId, M.advisorview_delete_confirm)
  selectChatRef.current = selectChat

  const publicDemoBooted = useRef(false)
  useEffect(() => {
    if (!isPublicDemo || publicDemoBooted.current || activeChatId !== null) return
    if (!location.pathname.endsWith('/advisor')) return
    publicDemoBooted.current = true
    selectChatRef.current(scenarioThreadId('s1'))
  }, [isPublicDemo, activeChatId, location.pathname])

  newConversationRef.current = newConversation

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

  const { interceptCrisis, startCrisisThread } = createAdvisorCrisisHandlers({
    pushUser,
    pushAdvisor,
    patchResponseState,
    updateSessionChats,
    updateActiveChatId,
    setResponseState,
    engineReset: (messages) => engine.reset(messages),
    stashActive,
    conversationIdRef,
  })

  const handleRealChatFailure = createRealChatFailureHandler({ pushAdvisor, updateExtras })

  const { startFlow } = createAdvisorFlowHandlers({
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
    engineReset: () => engine.reset([]),
    stashActive,
    conversationIdRef,
    interceptCrisis,
    toToneCard,
    setSendingReal,
    handleRealChatFailure,
  })
  startFlowRef.current = startFlow

  const { sendInThread, handleFollowup } = createAdvisorChatSendHandlers({
    authStatus,
    organizationId,
    getActiveChatId: () => activeChatId,
    getResponseState: () => responseState,
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
  })

  /* ----------------------------------------------------------- chat flows */

  const handleBuyAdvisorPack = (pack: AdvisorPackSize) => {
    if (buyingAdvisorPack) return
    setBuyingAdvisorPack(pack)
    void startAdvisorPackCheckout(pack)
      .then((result) => {
        if (result.kind === 'bypass') {
          showToast(M.advisorview_pack_internal_skip, 'info')
          return
        }
        window.location.assign(result.url)
      })
      .catch((error) => {
        console.error('advisor: pack checkout failed', error)
        showToast(M.advisorview_pack_checkout_failed, 'info')
      })
      .finally(() => {
        setBuyingAdvisorPack(null)
      })
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

  const homeSend = (text: string) => {
    if (startCrisisThread(text)) return
    if (authStatus === 'signed-in') startFlow('fallback', text)
    else startScenario(routeScenarioFromText(text), text)
  }

  return {
    groups,
    activeChatId,
    selectChat,
    newConversation,
    deleteConversation,
    canDeleteThread,
    isPublicDemo,
    hasActiveChat,
    authStatus,
    engine,
    sendingReal,
    jurisdictionLine,
    jurisdictionTone,
    getExtras,
    sendInThread,
    handleFollowup,
    openDocStudio,
    onSuggestChip,
    changeQuickField,
    submitQuickForm,
    handleCopyMessage,
    handleExportMessage,
    pickProvince,
    workspaceOpen,
    setWorkspaceOpen,
    handleBuyAdvisorPack,
    buyingAdvisorPack,
    workspaceState,
    activeScenario,
    toggleWeb,
    idleSend,
    homeSend,
    navigate,
    startScenario,
    runPriorityAction,
  }
}