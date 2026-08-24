/**
 * Org memory facts for Advisor chat prompt grounding.
 *
 * Facts come from `hr_advisor_memory_facts` (migration 0086). They are
 * organization context — not statute. Keep them out of
 * `match_advisor_guidance` (wrong index). Inject as a separate system-prompt
 * block, same pattern as `noticeScheduleBlock`.
 *
 * Policy (product default until governance expands it):
 * - confirmed only (inferred never treated as fact in the model prompt)
 * - skip sensitive rows
 * - skip visibility = restricted
 * - soft-forgotten rows are already excluded by the query
 * - hard cap so the prompt cannot grow unbounded
 *
 * Pure helpers here so vitest can cover the block without Deno/Supabase.
 */

export interface MemoryFactForPrompt {
  id: string
  scope: 'person' | 'case' | 'thread'
  entityId: string
  category: string
  statementEn: string
  statementFr: string
  sourceType: string
  visibility: 'hr' | 'case' | 'restricted'
  sensitive: boolean
  confidence: 'confirmed' | 'inferred'
}

/** Max facts appended to the system prompt per turn. */
export const MEMORY_PROMPT_FACT_CAP = 12

/**
 * Prefer thread facts for the active conversation, then other eligible
 * org facts (newest first — caller should already order that way).
 */
export function selectMemoryFactsForPrompt(
  facts: readonly MemoryFactForPrompt[],
  conversationId: string | null,
  cap: number = MEMORY_PROMPT_FACT_CAP,
): MemoryFactForPrompt[] {
  const eligible = facts.filter(
    (f) =>
      f.confidence === 'confirmed' &&
      !f.sensitive &&
      f.visibility !== 'restricted' &&
      f.statementEn.trim().length > 0,
  )
  const thread = conversationId
    ? eligible.filter((f) => f.scope === 'thread' && f.entityId === conversationId)
    : []
  const rest = eligible.filter((f) => !thread.some((t) => t.id === f.id))
  return [...thread, ...rest].slice(0, cap)
}

/**
 * Prompt block for confirmed org memory, or '' when there is nothing to
 * inject. Framed as organization memory — never as statutory authority.
 */
export function memoryBlock(facts: readonly MemoryFactForPrompt[]): string {
  if (facts.length === 0) return ''
  const items = facts
    .map((f) => {
      const fr =
        f.statementFr.trim().length > 0 && f.statementFr.trim() !== f.statementEn.trim()
          ? ` / FR: ${f.statementFr.trim()}`
          : ''
      return `- [${f.scope}:${f.entityId} · ${f.category} · ${f.sourceType}] ${f.statementEn.trim()}${fr}`
    })
    .join('\n')
  return (
    "\n\nOrganization memory (confirmed facts for this workspace) — treat these as the " +
    "employer's recorded context for THIS organization only. They are NOT statutes and " +
    'do not override retrieved guidance or the statutory-precision rules above. Prefer ' +
    'them when answering questions about this workplace\'s people, cases, or prior ' +
    'conversations; if they conflict with law or with retrieved guidance, follow the law ' +
    'and name the conflict. Never invent additional memories.\n' +
    items
  )
}
