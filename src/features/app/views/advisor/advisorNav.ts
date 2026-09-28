import type { LText } from '@/i18n/core'
import { flowTitles } from './advisorFlows'
import type { FlowKeyOrFallback } from './advisorFlows'

/**
 * Router-state contracts for navigating to /app/advisor.
 *
 * `AdvisorStartFlowNavState` mirrors the prototype's `startFlow(key, text)`:
 * producers (Home hero/priorities/catalog, Workflows catalog) pass the
 * EXPLICIT flow key alongside the bilingual prompt — the flow must never be
 * re-derived from localized text (the keyword router is EN-only and is
 * reserved for free-typed composer input, exactly like the prototype).
 */
export interface AdvisorStartFlowNavState {
  prompt: LText
  /** Explicit prototype flow key; omit only for free-typed user text. */
  flowKey?: FlowKeyOrFallback
}

function isFlowKey(value: unknown): value is FlowKeyOrFallback {
  return typeof value === 'string' && value in flowTitles
}

function isLText(value: unknown): value is LText {
  if (typeof value === 'string') return value.trim().length > 0
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { en?: unknown }).en === 'string' &&
    typeof (value as { fr?: unknown }).fr === 'string'
  )
}

export function readNavStartFlow(state: unknown): AdvisorStartFlowNavState | null {
  if (state === null || typeof state !== 'object' || !('prompt' in state)) return null
  const { prompt, flowKey } = state as { prompt?: unknown; flowKey?: unknown }
  if (!isLText(prompt)) return null
  return { prompt, flowKey: isFlowKey(flowKey) ? flowKey : undefined }
}

/** Sidebar "New conversation" / mobile Ask tab — always reset to a fresh chat. */
export function readNavNewChat(state: unknown): boolean {
  return (
    state !== null &&
    typeof state === 'object' &&
    (state as { newConversation?: unknown }).newConversation === true
  )
}
