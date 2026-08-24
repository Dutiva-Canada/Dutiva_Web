import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { bi, pick } from '@/i18n/core'
import type { Bi, LText } from '@/i18n/core'
import {
  getOwnConversation,
  listOwnConversations,
} from '@/features/app/views/memory/conversationsApi'
import type { ProductionConversation } from '@/features/app/views/memory/conversationsApi'
import { useI18n } from '@/i18n/context'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { exportProtectionMessages as XP } from '@/i18n/messages/exportProtection'
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
  authorizeExport,
  encodeInvisibleTag,
  exportDenialMessage,
} from '@/lib/exportProtection'
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
import type { WorkspaceState } from './ComplianceWorkspace'
import { ThreadList } from './ThreadList'
import type { ThreadGroup } from './ThreadList'
import {
  estimatorFollowup,
  fallbackChips,
  fallbackIntro,
  flowJurisdictions,
  flowTitles,
  freshQuickForm,
  genericAck,
  routeFlowKeyFromText,
  terminationAssessment,
  terminationIntro,
} from './advisorFlows'
import {
  advisorScenarioList,
  advisorScenarios,
  routeScenarioFromText,
  scenarioAck,
  scenarioAckSignedOut,
} from './advisorScenarios'
import type { AdvisorScenario, ScenarioId, ScenarioTurn } from './advisorScenarios'
import { readNavNewChat, readNavStartFlow } from './advisorNav'
import type { AdvisorStartFlowNavState } from './advisorNav'
import { advisorSession } from './advisorSession'
import type { SessionChat, ThreadResponseState } from './advisorSession'
import type { FlowKeyOrFallback, MessageExtras, SuggestChipSpec } from './advisorFlows'
import type { HomeAction } from '@/features/app/views/home/homeData'

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

/**
 * Engine message-id prefix. `pushUser`/`pushAdvisor` mirror the engine's
 * sequential id scheme (`${idPrefix}-${n}`, one increment per created
 * message) so per-message extras (docs / follow-ups / quick form) can be
 * keyed by id before the state update lands.
 */
const ENGINE_PREFIX = 'advmsg'

const seedId = (chatId: string, messageId: string) => `seed-${chatId}-${messageId}`

/** Doc/follow-up chips on the seeded transcripts, keyed by seed message id. */
const seedExtras: Record<string, MessageExtras> = {}
for (const chat of chats) {
  for (const m of chat.messages) {
    if ((m.docs?.length ?? 0) > 0 || (m.followups?.length ?? 0) > 0) {
      seedExtras[seedId(chat.id, m.id)] = { docs: m.docs, followups: m.followups }
    }
  }
}

/**
 * The six demo response-mode threads (Advisor chat handoff scenarios) —
 * always listed; their transcript + workspace payload seed on first select.
 */
const scenarioThreadId = (id: ScenarioId) => `scn-${id}`

const scenarioThreads = advisorScenarioList.map((scenario) => ({
  id: scenarioThreadId(scenario.id),
  scenario,
}))

function scenarioForThread(chatId: string | null): AdvisorScenario | undefined {
  return scenarioThreads.find((t) => t.id === chatId)?.scenario
}

const freshResponseState = (scenarioId: ScenarioId | null): ThreadResponseState => ({
  scenarioId,
  provinceResolved: false,
  webOn: true,
  response: null,
})

/* Maintained supportive workspace payload for crisis turns — the s5 wellbeing
   scenario's (support notice on, every gate off), reused so the crisis
   framing stays single-sourced rather than duplicated. Same for the pill
   line ("Supportive — not a compliance matter"). */
const supportiveCrisisResponse = advisorScenarios.s5.turn.response
const supportiveJurisdictionLine = advisorScenarios.s5.turn.jurisdictionLine

/** Freeze in-flight turns when a thread is stashed (switching threads). */
function settle(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) =>
    m.status === 'thinking' || m.status === 'streaming'
      ? { ...m, status: 'done' as const, streaming: false, streamedLen: undefined }
      : m,
  )
}

function readNavChatId(state: unknown): string | null {
  if (state !== null && typeof state === 'object' && 'chatId' in state) {
    const value = (state as { chatId?: unknown }).chatId
    if (typeof value === 'string') return value
  }
  return null
}

function resolveStartFlowKey(
  start: AdvisorStartFlowNavState,
  authStatus: ReturnType<typeof useAuth>['status'],
): FlowKeyOrFallback {
  if (start.flowKey) return start.flowKey
  if (authStatus === 'signed-in') return 'fallback'
  return routeFlowKeyFromText(typeof start.prompt === 'string' ? start.prompt : start.prompt.en)
}

function resolveScenarioTurn(
  scenario: AdvisorScenario | undefined,
  state: ThreadResponseState | undefined,
): ScenarioTurn | undefined {
  if (!scenario) return undefined
  if (scenario.resolved && state?.provinceResolved === true) return scenario.resolved
  if (scenario.webOff && state?.webOn === false) return scenario.webOff
  return scenario.turn
}

function resolveJurisdictionTone(turn: ScenarioTurn | undefined): JurisdictionPillTone {
  if (!turn) return 'gold'
  if (turn.response.route.responseMode === 'supportive') return 'support'
  return turn.response.jurisdiction.status === 'unknown' ? 'warn' : 'gold'
}

function resolveWorkspaceState(
  authStatus: ReturnType<typeof useAuth>['status'],
  busy: boolean,
  activeResponse: ThreadResponseState['response'] | undefined,
  currentScenarioTurn: ScenarioTurn | undefined,
): WorkspaceState {
  if (authStatus !== 'signed-in') return { kind: 'locked' }
  /* AGENT.md §8: while a supportive payload governs the thread (crisis
     intercept, s5 wellbeing scenario), the workspace holds the support
     notice — never the HR "routing · retrieving" running state. */
  if (activeResponse?.supportNotice === true) {
    return { kind: 'ready', response: activeResponse, provincePrompt: false }
  }
  if (busy) return { kind: 'running' }
  if (activeResponse !== null && activeResponse !== undefined) {
    return {
      kind: 'ready',
      response: activeResponse,
      provincePrompt: currentScenarioTurn?.provincePrompt === true,
    }
  }
  return { kind: 'idle' }
}

function scenarioForResponseState(
  state: ThreadResponseState | undefined,
): AdvisorScenario | undefined {
  return state?.scenarioId == null ? undefined : advisorScenarios[state.scenarioId]
}

function isBackendConversationId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function bucketFromUpdatedAt(updatedAt: string): 'today' | 'week' | 'older' {
  const updated = new Date(updatedAt)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)
  if (updated >= startOfToday) return 'today'
  if (updated >= startOfWeek) return 'week'
  return 'older'
}

function conversationTitle(messages: { role: string; content: string }[]): Bi {
  const firstUser = messages.find((m) => m.role === 'user')?.content?.trim()
  if (!firstUser) return bi('Advisor conversation', 'Conversation du Conseiller')
  const clipped = firstUser.length > 72 ? `${firstUser.slice(0, 69)}…` : firstUser
  return bi(clipped, clipped)
}

function productionTranscript(conv: ProductionConversation): ChatMessage[] {
  return conv.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m, i) => ({
      id: `prod-${conv.id}-${i}`,
      author: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      text: m.content,
      status: 'done' as const,
    }))
}

function resolveInitialActiveChatId(
  locationState: unknown,
  workspaceMode: ReturnType<typeof useWorkspaceMode>['mode'],
): string | null {
  const navId = readNavChatId(locationState)
  if (navId !== null) {
    if (workspaceMode === 'production') return navId
    if (chats.some((chat) => chat.id === navId)) return navId
  }

  const resumed = advisorSession.activeChatId
  if (resumed === null) return null
  const canResume =
    chats.some((chat) => chat.id === resumed) ||
    advisorSession.chats.some((chat) => chat.id === resumed) ||
    scenarioForThread(resumed) !== undefined ||
    (workspaceMode === 'production' && isBackendConversationId(resumed))
  return canResume ? resumed : null
}

function scenarioExtras(turn: ScenarioTurn): MessageExtras {
  const extras: MessageExtras = {}
  if (turn.banner) extras.banner = turn.banner
  if ((turn.docs?.length ?? 0) > 0 && turn.response.route.documentsAllowed) extras.docs = turn.docs
  if ((turn.followups?.length ?? 0) > 0) extras.followups = turn.followups
  if (turn.provincePrompt === true) extras.provincePrompt = true
  if (turn.response.memory != null) extras.memory = turn.response.memory
  return extras
}

export function AdvisorView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToasts()
  const { openDocStudio } = useDocStudio()
  const { lang } = useI18n()
  const auth = useAuth()
  const { status: authStatus } = auth
  const workspaceModeCtx = useWorkspaceMode()
  const { mode: workspaceMode, organizationId } = workspaceModeCtx
  /* Real-backend conversation id for the active thread's free-form messages
     (see sendInThread) — reset alongside the engine whenever the thread
     changes. Scripted flows/quick-forms/follow-ups never touch this. */
  const conversationIdRef = useRef<string | null>(null)
  const [sendingReal, setSendingReal] = useState(false)
  const [prodThreads, setProdThreads] = useState<ProductionConversation[]>([])
  const [prodThreadsLoaded, setProdThreadsLoaded] = useState(false)
  const pendingNavChatIdRef = useRef<string | null>(null)
  const activeChatIdRef = useRef<string | null>(null)

  /* Session-scoped state lives in the advisorSession module store so
     conversations survive navigating away and back (prototype app-level
     state); the local useState mirrors it for rendering. */
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
  /* Per-thread response-experience state (scenario, province, web toggle,
     latest structured payload) — mirrors advisorSession like extras. */
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
  /* Compliance Workspace as a sheet below the xl breakpoint. */
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const transcripts = useRef(advisorSession.transcripts)
  const nextEngineId = useRef(1)
  /* Per-mount engine prefix — restored transcript ids never collide with the
     freshly-mounted engine's sequence. */
  const enginePrefixRef = useRef<string | null>(null)
  enginePrefixRef.current ??= `${ENGINE_PREFIX}m${advisorSession.mountSeq++}`
  const enginePrefix = enginePrefixRef.current
  const selectChatRef = useRef<(chatId: string) => void>(() => {})
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

  /* No explicit navigation target — resume the thread that was open when
     the view last unmounted (prototype app-level activeChatId). */
  const [activeChatId, setActiveChatId] = useState<string | null>(() =>
    resolveInitialActiveChatId(location.state, workspaceMode),
  )
  const updateActiveChatId = (id: string | null) => {
    advisorSession.activeChatId = id
    activeChatIdRef.current = id
    setActiveChatId(id)
    setWorkspaceOpen(false)
  }

  activeChatIdRef.current = activeChatId

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
      return [{ id: newId, messages: [], updatedAt: new Date().toISOString() }, ...prev]
    })
  }

  const bindBackendConversationId = (threadId: string | null, backendId: string) => {
    if (threadId !== null && threadId.startsWith('session-') && backendId !== threadId) {
      migrateThreadId(threadId, backendId)
      return
    }
    conversationIdRef.current = backendId
  }

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
      const stashed = transcripts.current.get(chatId)
      if (stashed) {
        engine.reset(stashed)
        return
      }
      engine.reset([])
      void getOwnConversation(chatId)
        .then((conv) => {
          if (conv === null || activeChatIdRef.current !== chatId) return
          const messages = productionTranscript(conv)
          transcripts.current.set(chatId, messages)
          engine.reset(messages)
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

  /* Search overlay navigation: /app/advisor with { chatId } router state. */
  useEffect(() => {
    const chatId = readNavChatId(location.state)
    if (chatId === null) return
    navigate(location.pathname, { replace: true, state: null })
    pendingNavChatIdRef.current = chatId
    selectChatRef.current(chatId)
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    if (workspaceMode !== 'production' || !prodThreadsLoaded) return
    const pending = pendingNavChatIdRef.current
    if (pending === null) return
    selectChatRef.current(pending)
    pendingNavChatIdRef.current = null
  }, [workspaceMode, prodThreadsLoaded, prodThreads])

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
    updateSessionChats((prev) => [
      { id, title: flowTitles[flowKey], pinned: false, bucket: 'today', flowKey },
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
        const userTextString = typeof userText === 'string' ? userText : userText.en
        setSendingReal(true)
        void sendAdvisorMessage(userTextString, conversationIdRef.current, organizationId)
          .then((result) => {
            bindBackendConversationId(id, result.conversationId)
            const stateChatId =
              id.startsWith('session-') && result.conversationId !== id ? result.conversationId : id
            const turnId = pushAdvisor({ text: result.reply || genericAck })
            patchResponseState(stateChatId, { response: result.response })
            if (result.response?.memory != null) {
              updateExtras((prev) => ({
                ...prev,
                [turnId]: { ...prev[turnId], memory: result.response!.memory },
              }))
            }
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
        const turnId = pushAdvisor({ text: result.reply || genericAck })
        if (stateChatId !== null) patchResponseState(stateChatId, { response: result.response })
        if (result.response?.memory != null) {
          updateExtras((prev) => ({
            ...prev,
            [turnId]: { ...prev[turnId], memory: result.response!.memory },
          }))
        }
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
  const sessionIds = new Set(sessionChats.map((c) => c.id))
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
  const allThreads: { id: string; title: Bi; pinned: boolean; bucket: string }[] = [
    ...sessionChats.map((c) => ({ id: c.id, title: c.title, pinned: c.pinned, bucket: c.bucket })),
    ...(workspaceMode === 'production'
      ? prodThreads
          .filter((t) => !sessionIds.has(t.id))
          .map((t) => ({
            id: t.id,
            title: conversationTitle(t.messages),
            pinned: false,
            bucket: bucketFromUpdatedAt(t.updatedAt),
          }))
      : [
          ...scenarioThreads.map((t) => ({
            id: t.id,
            title: t.scenario.title,
            pinned: t.scenario.pinned,
            bucket: t.scenario.pinned ? 'pinned' : 'today',
          })),
          ...chats.map((c) => ({ id: c.id, title: c.title, pinned: c.pinned, bucket: c.bucket })),
        ]),
  ]
  const groups: ThreadGroup[] = [
    { label: M.advisorview_group_pinned, items: allThreads.filter((t) => t.pinned) },
    { label: M.advisorview_group_today, items: allThreads.filter((t) => t.bucket === 'today') },
    { label: M.advisorview_group_week, items: allThreads.filter((t) => t.bucket === 'week') },
    { label: M.advisorview_group_older, items: allThreads.filter((t) => t.bucket === 'older') },
  ].filter((g) => g.items.length > 0)

  const getExtras = (messageId: string): MessageExtras | undefined =>
    extras[messageId] ?? seedExtras[messageId]

  const onSuggestChip = (chip: SuggestChipSpec) => startFlow(chip.flowKey, chip.label)

  const handleCopyMessage = useCallback(
    async (text: string) => {
      /* EF3: run the Copy button through the same export pipeline as Document
         Studio, so every copied message carries an invisible zero-width tag
         that resolves back to an export_events row. Surface='advisor',
         kind='text'. A velocity denial shows the same retry toast as a
         refused document export. */
      const identity = workspaceModeCtx?.identity
      const actorLabel = identity
        ? `${identity.user.name} (${identity.user.email})`
        : pick(XP.exportprot_demo_actor, lang)
      const workspaceLabel = identity?.companyName ?? pick(XP.exportprot_demo_workspace, lang)

      const decision = await authorizeExport({
        surface: 'advisor',
        kind: 'text',
        title: pick(M.advisorview_chat_copy_title, lang),
        content: text,
        lang,
        actorLabel,
        workspaceLabel,
        session: auth?.session ?? null,
      })
      if (!decision.allowed) {
        showToast(exportDenialMessage(decision), 'info')
        return
      }

      const tagged = text + encodeInvisibleTag(decision.stamp.exportId)
      navigator.clipboard.writeText(tagged).then(
        () => showToast({ en: 'Copied to clipboard', fr: 'Copié dans le presse-papiers' }, 'ok'),
        () => showToast({ en: 'Could not copy', fr: 'Impossible de copier' }, 'info'),
      )
    },
    [showToast, workspaceModeCtx, auth, lang],
  )

  const handleExportMessage = useCallback(
    (text: string) => {
      openDocStudio('T10', { initialContent: text })
      showToast({ en: 'Drafting document...', fr: 'Rédaction du document...' }, 'ok')
    },
    [openDocStudio, showToast],
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ThreadList
        groups={groups}
        activeChatId={activeChatId}
        onSelect={selectChat}
        onNewConversation={newConversation}
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
            mobileOpen={workspaceOpen}
            onCloseMobile={() => setWorkspaceOpen(false)}
          />
        </>
      ) : (
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
      )}
    </div>
  )
}
