import type { LText } from '@/i18n/core'
import type { AgentToolProposal } from '@/features/app/agent/types'

/**
 * Shared Advisor chat vocabulary — used by the Advisor view, the contextual
 * rail, and any surface that renders assistant replies. Mirrors the message
 * spec shape of the prototype (`pushAdvisorTurn` / `openRail` in App v2).
 */

/**
 * Tone ramp for embedded cards: risk (red), warning (amber), suggestion/info
 * (gold/accent), success (green — e.g. the "Escalation logged" card).
 */
export type CardTone = 'risk' | 'warning' | 'suggestion' | 'info' | 'success'

/** Assistant reply lifecycle (prototype `runMessageLifecycle`). */
export type MessageStatus = 'thinking' | 'streaming' | 'done' | 'error'

export interface ToneCardAction {
  label: LText
  primary?: boolean
  onClick: () => void
}

export interface Citation {
  label: LText
}

export interface ToneCardData {
  tone: CardTone
  title: LText
  body: LText
  /** Optional "Confidence:" line under the body (prototype `card.confidence`). */
  confidence?: LText
  citations?: Citation[]
  actions?: ToneCardAction[]
}

/** One assistant reply: streamed text plus optional embedded cards/citations. */
export interface AdvisorTurnSpec {
  text: LText
  /** Reasoning trace lines, collapsed behind the "Reasoning" expander. */
  reasoning?: LText[]
  cards?: ToneCardData[]
  citations?: Citation[]
  /**
   * Agent tool calls the turn proposes — each renders as an AgentActionCard
   * and executes only on user confirmation (docs/AGENT_LAYER.md).
   */
  proposedActions?: AgentToolProposal[]
  /** Simulated failure: the turn thinks, then lands in the error + retry state. */
  isError?: boolean
  /** Error bubble copy (defaults to the shared connection-issue message). */
  errorText?: LText
  /** Text the turn streams after a successful retry. */
  retryText?: LText
}

/** A file the user attached to their turn — display metadata only; the
 *  payload itself travels on the request wire (`attachments.ts`). */
export interface ChatAttachmentChip {
  name: string
  kind: 'image' | 'document'
}

export interface ChatMessage {
  id: string
  author: 'user' | 'assistant'
  text: LText
  /** Structured user answers rendered as chips (prototype quick-form submits). */
  userChips?: LText[]
  /** Files attached to a user turn, rendered as chips on the bubble. */
  attachments?: ChatAttachmentChip[]
  /** Advisor reasoning trace lines. */
  reasoning?: LText[]
  cards?: ToneCardData[]
  citations?: Citation[]
  /** Proposed agent tool calls awaiting user confirmation. */
  proposedActions?: AgentToolProposal[]
  /**
   * Reply lifecycle, managed by `useAdvisorEngine`. Absent means "done"
   * (seeded transcripts from fixtures never stream).
   */
  status?: MessageStatus
  /** Characters revealed so far, measured against the longest localization. */
  streamedLen?: number
  /** True while the assistant reply is still streaming in (mirrors `status`). */
  streaming?: boolean
  /** Error bubble copy shown when `status === 'error'`. */
  errorText?: LText
  /** Replacement text streamed after a retry. */
  retryText?: LText
}
