import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { LText } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { createAdvisorCrisisHandlers } from './advisorCrisisHandlers'
import { createAdvisorScenarioHandlers } from './advisorScenarioHandlers'
import { createAdvisorThreadNavigation } from './advisorThreadNavigation'
import { createRealChatFailureHandler } from './advisorProductionChat'
import { createAdvisorFlowHandlers } from './advisorFlowHandlers'
import { createAdvisorChatSendHandlers } from './advisorChatSendHandlers'
import { createAdvisorQuickFormHandlers } from './advisorQuickFormHandlers'
import { createAdvisorPriorityActionRunner } from './advisorPriorityActions'
import { createAdvisorComposerHandlers } from './advisorComposerHandlers'
import { computeAdvisorViewPresentation } from './advisorViewPresentation'
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
import { chats } from '@/data'
import type { FixtureAction, FixtureToneCard } from '@/data'
import type { FlowKeyOrFallback } from './advisorFlows'
import type { MessageExtras } from './advisorFlows'
import { readNavNewChat, readNavStartFlow } from './advisorNav'
import {
  readNavChatId,
  resolveStartFlowKey,
  scenarioThreadId,
  seedExtras,
  seedId,
  settle,
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

  const { changeQuickField, submitQuickForm } = createAdvisorQuickFormHandlers({
    extras,
    updateExtras,
    pushUser,
    pushAdvisor,
    toToneCard,
  })

  /* ------------------------------------------------- home priority rails */

  const openCompRail = usePayRail()
  const openWellbeingRail = useWellbeingRail()

  const runPriorityAction = createAdvisorPriorityActionRunner({
    navigate,
    selectChat: (chatId) => selectChatRef.current(chatId),
    startFlow: (flowKey, userText) => startFlowRef.current(flowKey, userText),
    openDocStudio,
    openCompRail,
    openWellbeingRail,
  })

  /* -------------------------------------------------------------- render */

  const {
    groups,
    hasActiveChat,
    jurisdictionLine,
    jurisdictionTone,
    workspaceState,
    activeScenario,
  } = computeAdvisorViewPresentation({
    activeChatId,
    sessionChats,
    prodThreads,
    transcripts: transcripts.current,
    responseState,
    workspaceMode,
    authStatus,
    engineBusy: engine.busy,
    sendingReal,
    groupLabels: {
      pinned: M.advisorview_group_pinned,
      today: M.advisorview_group_today,
      week: M.advisorview_group_week,
      older: M.advisorview_group_older,
    },
  })

  const getExtras = (messageId: string): MessageExtras | undefined =>
    extras[messageId] ?? seedExtras[messageId]

  const { idleSend, homeSend, onSuggestChip } = createAdvisorComposerHandlers({
    authStatus,
    startCrisisThread,
    startFlow,
    startScenario,
  })

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