import type { Bi } from '@/i18n/core'
import type { ChatMessage } from '@/features/app/advisor/types'
import type { AdvisorResponse } from '@/features/app/advisor/contract'
import type { FlowKeyOrFallback, MessageExtras } from './advisorFlows'
import type { ScenarioId } from './advisorScenarios'

/** A conversation started in this session (prototype `startFlow` newChat). */
export interface SessionChat {
  id: string
  title: Bi
  pinned: boolean
  bucket: 'today'
  flowKey: FlowKeyOrFallback
  /** Set when the thread runs one of the demo response-mode scenarios. */
  scenarioId?: ScenarioId
}

/**
 * Per-thread response-experience state (Advisor chat handoff): which demo
 * scenario the thread runs, whether the jurisdiction-unknown prompt has been
 * resolved, the web-search toggle, and the latest engine payload for the
 * Compliance Workspace. A fresh turn always replaces `response` — a prior
 * turn's structured output is never carried forward (contract rule).
 */
export interface ThreadResponseState {
  scenarioId: ScenarioId | null
  /** s4 — province confirmed from the user's reply (status becomes Assumed). */
  provinceResolved: boolean
  /** s6 — live web search toggle. */
  webOn: boolean
  /** Latest structured payload (engine or scenario); null → nothing to show. */
  response: AdvisorResponse | null
}

/**
 * In-memory Advisor session — the prototype keeps chats in app-level state,
 * so conversations survive navigating to other views and back. This module
 * store gives the (route-mounted) AdvisorView the same lifetime: it lives for
 * the browser session and is intentionally not persisted (matching the
 * prototype, whose only persistence is theme + language).
 *
 * `mountSeq` gives each AdvisorView mount a distinct engine id-prefix, so ids
 * of messages restored from `transcripts` can never collide with ids the
 * freshly-mounted engine generates.
 *
 * `resetSeq` is a generation counter bumped by resetAdvisorSession — a
 * mounted view compares it during render to notice the reset even when the
 * route didn't remount it (mode / organization switch), so no component can
 * keep writing into an orphaned store.
 */
interface AdvisorSessionStore {
  chats: SessionChat[]
  extras: Record<string, MessageExtras>
  transcripts: Map<string, ChatMessage[]>
  responseState: Record<string, ThreadResponseState>
  activeChatId: string | null
  nextChatSeq: number
  mountSeq: number
  resetSeq: number
}

export const advisorSession: AdvisorSessionStore = {
  chats: [],
  extras: {},
  transcripts: new Map(),
  responseState: {},
  activeChatId: null,
  nextChatSeq: 1,
  mountSeq: 1,
  resetSeq: 0,
}

/** Test helper — clear all session state between tests. */
export function resetAdvisorSession(): void {
  advisorSession.chats = []
  advisorSession.extras = {}
  advisorSession.transcripts = new Map()
  advisorSession.responseState = {}
  advisorSession.activeChatId = null
  advisorSession.nextChatSeq = 1
  advisorSession.mountSeq = 1
  advisorSession.resetSeq += 1
}
