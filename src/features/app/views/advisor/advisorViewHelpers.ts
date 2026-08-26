import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import type { ChatMessage } from '@/features/app/advisor/types'
import type { AuthStatus } from '@/features/app/auth/authContext'
import type { ProductionConversation } from '@/features/app/views/memory/conversationsApi'
import type { WorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { chats } from '@/data'
import type { JurisdictionPillTone } from './ChatPane'
import type { WorkspaceState } from './ComplianceWorkspace'
import type { ThreadGroup } from './ThreadList'
import type { SessionChat } from './advisorSession'
import { routeFlowKeyFromText } from './advisorFlows'
import type { FlowKeyOrFallback, MessageExtras } from './advisorFlows'
import type { AdvisorStartFlowNavState } from './advisorNav'
import { advisorSession } from './advisorSession'
import type { ThreadResponseState } from './advisorSession'
import { advisorScenarioList, advisorScenarios } from './advisorScenarios'
import type { AdvisorScenario, ScenarioId, ScenarioTurn } from './advisorScenarios'

/** Engine message-id prefix — mirrors useAdvisorEngine's id scheme. */
export const ENGINE_PREFIX = 'advmsg'

export const seedId = (chatId: string, messageId: string) => `seed-${chatId}-${messageId}`

/** Doc/follow-up chips on the seeded transcripts, keyed by seed message id. */
export const seedExtras: Record<string, MessageExtras> = {}
for (const chat of chats) {
  for (const m of chat.messages) {
    if ((m.docs?.length ?? 0) > 0 || (m.followups?.length ?? 0) > 0) {
      seedExtras[seedId(chat.id, m.id)] = { docs: m.docs, followups: m.followups }
    }
  }
}

export const scenarioThreadId = (id: ScenarioId) => `scn-${id}`

export const scenarioThreads = advisorScenarioList.map((scenario) => ({
  id: scenarioThreadId(scenario.id),
  scenario,
}))

export function scenarioForThread(chatId: string | null): AdvisorScenario | undefined {
  return scenarioThreads.find((t) => t.id === chatId)?.scenario
}

export const freshResponseState = (scenarioId: ScenarioId | null): ThreadResponseState => ({
  scenarioId,
  provinceResolved: false,
  webOn: true,
  response: null,
})

export const supportiveCrisisResponse = advisorScenarios.s5.turn.response
export const supportiveJurisdictionLine = advisorScenarios.s5.turn.jurisdictionLine

/** Freeze in-flight turns when a thread is stashed (switching threads). */
export function settle(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) =>
    m.status === 'thinking' || m.status === 'streaming'
      ? { ...m, status: 'done' as const, streaming: false, streamedLen: undefined }
      : m,
  )
}

export function readNavChatId(state: unknown): string | null {
  if (state !== null && typeof state === 'object' && 'chatId' in state) {
    const value = (state as { chatId?: unknown }).chatId
    if (typeof value === 'string') return value
  }
  return null
}

export function resolveStartFlowKey(
  start: AdvisorStartFlowNavState,
  authStatus: AuthStatus,
): FlowKeyOrFallback {
  if (start.flowKey) return start.flowKey
  if (authStatus === 'signed-in') return 'fallback'
  return routeFlowKeyFromText(typeof start.prompt === 'string' ? start.prompt : start.prompt.en)
}

export function resolveScenarioTurn(
  scenario: AdvisorScenario | undefined,
  state: ThreadResponseState | undefined,
): ScenarioTurn | undefined {
  if (!scenario) return undefined
  if (scenario.resolved && state?.provinceResolved === true) return scenario.resolved
  if (scenario.webOff && state?.webOn === false) return scenario.webOff
  return scenario.turn
}

export function resolveJurisdictionTone(turn: ScenarioTurn | undefined): JurisdictionPillTone {
  if (!turn) return 'gold'
  if (turn.response.route.responseMode === 'supportive') return 'support'
  return turn.response.jurisdiction.status === 'unknown' ? 'warn' : 'gold'
}

export function resolveWorkspaceState(
  authStatus: AuthStatus,
  busy: boolean,
  activeResponse: ThreadResponseState['response'] | undefined,
  currentScenarioTurn: ScenarioTurn | undefined,
): WorkspaceState {
  if (authStatus !== 'signed-in') return { kind: 'locked' }
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

export function scenarioForResponseState(
  state: ThreadResponseState | undefined,
): AdvisorScenario | undefined {
  return state?.scenarioId == null ? undefined : advisorScenarios[state.scenarioId]
}

export function isBackendConversationId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export function bucketFromUpdatedAt(updatedAt: string): 'today' | 'week' | 'older' {
  const updated = new Date(updatedAt)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)
  if (updated >= startOfToday) return 'today'
  if (updated >= startOfWeek) return 'week'
  return 'older'
}

export function conversationTitle(messages: { role: string; content: string }[]): Bi {
  const firstUser = messages.find((m) => m.role === 'user')?.content?.trim()
  if (!firstUser || isGreetingOnly(firstUser)) {
    return bi('Advisor conversation', 'Conversation du Conseiller')
  }
  const clipped = firstUser.length > 72 ? `${firstUser.slice(0, 69)}…` : firstUser
  return bi(clipped, clipped)
}

/** One-message greeting threads — hide from the list until there’s substance. */
export function isFluffThread(messages: { role: string; content: string }[]): boolean {
  const users = messages.filter((m) => m.role === 'user')
  if (users.length === 0) return true
  if (users.length === 1 && isGreetingOnly(users[0]?.content?.trim() ?? '')) return true
  return false
}

const GREETING_ONLY =
  /^(hi|hello|hey|bonjour|salut|bonsoir|good\s*(morning|afternoon|evening)|thanks|thank you|merci|ok|okay|test|yo)[.!?…]*$/i

export function isGreetingOnly(text: string): boolean {
  return text.length > 0 && GREETING_ONLY.test(text)
}

/**
 * When the user asks Advisor to do operational HR work (add people, etc.) and
 * the reply explains it can’t, surface next-step nav chips into People/Studio.
 */
export function operationalNextStepChips(
  userText: string,
  replyText: string,
): { label: Bi; to: string }[] {
  const u = userText.toLowerCase()
  const r = replyText.toLowerCase()
  const aboutPeople =
    /\b(add|create|import|upload|entrer|ajouter)\b[\s\S]{0,40}\b(employee|employees|people|roster|staff|employé|employés|personnel)\b/.test(
      u,
    ) ||
    /\b(employee|employees|people|roster|staff|employé|employés)\b[\s\S]{0,40}\b(add|create|import|upload|ajouter)\b/.test(
      u,
    )
  const capabilityLimit =
    /guid(ance|e) tool|not an? operational|can'?t add|cannot add|doesn'?t (create|add)|won'?t (create|add)|i (can'?t|cannot) (add|create)|outil de conseil|pas un système (rh )?opérationnel|ne (peux|peut) pas (ajouter|créer)/i.test(
      r,
    )
  if (!aboutPeople && !(capabilityLimit && /\b(employee|people|roster|workspace|employé|personnel)\b/i.test(r))) {
    return []
  }
  return [
    {
      label: bi('Go to People', 'Aller à Personnel'),
      to: '/app/employees?new=1',
    },
    {
      label: bi('Open Studio', 'Ouvrir le Studio'),
      to: '/app/documents/studio',
    },
  ]
}

export function productionTranscript(conv: ProductionConversation): ChatMessage[] {
  return conv.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m, i) => ({
      id: `prod-${conv.id}-${i}`,
      author: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      text: m.content,
      status: 'done' as const,
    }))
}

export function resolveInitialActiveChatId(
  locationState: unknown,
  workspaceMode: WorkspaceMode,
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

export function scenarioExtras(turn: ScenarioTurn): MessageExtras {
  const extras: MessageExtras = {}
  if (turn.banner) extras.banner = turn.banner
  if ((turn.docs?.length ?? 0) > 0 && turn.response.route.documentsAllowed) extras.docs = turn.docs
  if ((turn.followups?.length ?? 0) > 0) extras.followups = turn.followups
  if (turn.provincePrompt === true) extras.provincePrompt = true
  if (turn.response.memory != null) extras.memory = turn.response.memory
  return extras
}

export interface AdvisorThreadListEntry {
  id: string
  title: Bi
  pinned: boolean
  bucket: string
}

/** Flat thread index for the sidebar — demo fixtures or production conversations. */
export function buildAdvisorThreadEntries(
  workspaceMode: WorkspaceMode,
  sessionChats: SessionChat[],
  prodThreads: ProductionConversation[],
  activeChatId: string | null = null,
): AdvisorThreadListEntry[] {
  const sessionIds = new Set(sessionChats.map((c) => c.id))
  return [
    ...sessionChats.map((c) => ({ id: c.id, title: c.title, pinned: c.pinned, bucket: c.bucket })),
    ...(workspaceMode === 'production'
      ? prodThreads
          .filter((t) => !sessionIds.has(t.id))
          .filter((t) => t.id === activeChatId || !isFluffThread(t.messages))
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
}

/** Group flat thread entries into Pinned / Today / Week / Older buckets. */
export function buildAdvisorThreadGroups(
  allThreads: AdvisorThreadListEntry[],
  groupLabels: { pinned: Bi; today: Bi; week: Bi; older: Bi },
): ThreadGroup[] {
  const groups: ThreadGroup[] = [
    { key: 'pinned', label: groupLabels.pinned, items: allThreads.filter((t) => t.pinned) },
    { key: 'today', label: groupLabels.today, items: allThreads.filter((t) => t.bucket === 'today') },
    { key: 'week', label: groupLabels.week, items: allThreads.filter((t) => t.bucket === 'week') },
    { key: 'older', label: groupLabels.older, items: allThreads.filter((t) => t.bucket === 'older') },
  ]
  return groups.filter((g) => g.items.length > 0)
}
