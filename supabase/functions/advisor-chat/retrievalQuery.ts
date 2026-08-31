/**
 * Builds the corpus-retrieval query for a turn. Retrieval used to see only
 * the current message, so a follow-up like "and after 5 years?" carried
 * none of the lexemes that found the right chunk one turn earlier and
 * usually retrieved nothing. The query now includes the previous user turn
 * as context.
 *
 * Why exactly one prior turn: match_advisor_guidance is an OR-of-lexemes
 * tsquery ranked by ts_rank, so every added word broadens recall but also
 * competes in ranking. One prior user message keeps the follow-up case
 * working while bounding topic drift from older turns; the assistant's own
 * replies are excluded because their vocabulary is the corpus's vocabulary
 * — including them would let one lucky retrieval echo itself forever.
 *
 * Pure and dependency-free so it runs in Deno and under vitest.
 */

/** Cap the context contribution so a pasted-document turn cannot drown the
 *  current question's lexemes. */
const MAX_CONTEXT_CHARS = 400

export interface HistoryMessage {
  role: string
  content: string
}

export function buildRetrievalQuery(history: readonly HistoryMessage[], message: string): string {
  const previousUserTurn = [...history].reverse().find((m) => m.role === 'user')
  if (!previousUserTurn || previousUserTurn.content.trim() === '') return message
  return `${previousUserTurn.content.slice(0, MAX_CONTEXT_CHARS)}\n${message}`
}
