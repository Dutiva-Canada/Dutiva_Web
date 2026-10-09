import type { GuidanceChunk, RetrievalResult, SupabaseClient } from './chatTypes.ts'

/**
 * Ranked full-text retrieval over the curated grounding corpus — the
 * match_advisor_guidance RPC (migration 0023: OR-ed lexemes ordered by
 * ts_rank; strict websearch matching returns zero rows on conversational
 * questions). Additive: any failure returns no chunks and the reply
 * proceeds under the prompt's statutory-precision fallback rules —
 * retrieval must never take the Advisor down. Failures are still
 * distinguished from zero-hits for telemetry and the structured payload.
 */
export async function retrieveGuidance(
  adminClient: SupabaseClient,
  query: string,
): Promise<RetrievalResult> {
  try {
    const { data, error } = await adminClient.rpc('match_advisor_guidance', {
      q: query,
      k: 4,
    })
    if (error) {
      console.error('advisor-chat: retrieval failed —', error.message)
      return { chunks: [], failed: true }
    }
    return { chunks: (data as GuidanceChunk[] | null) ?? [], failed: false }
  } catch (error) {
    console.error('advisor-chat: retrieval failed —', error)
    return { chunks: [], failed: true }
  }
}

export function guidanceBlock(chunks: GuidanceChunk[]): string {
  if (chunks.length === 0) return ''
  const items = chunks
    .map((c) => {
      const effective = c.effective_note ? `; ${c.effective_note}` : ''
      return `- [${c.jurisdiction}] ${c.title}: ${c.content} (Source: ${c.source_name}, ${c.source_url}${effective})`
    })
    .join('\n')
  return (
    "\n\nRetrieved guidance from Dutiva's curated corpus — each entry carries its official " +
    'source. Treat these entries as the ONLY authoritative basis for statutory figures this ' +
    'turn: when they cover the question, answer from them and name the source; when they do ' +
    'not cover it, follow the statutory-precision rules above.\n' +
    items
  )
}
