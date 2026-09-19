import type { Bi } from '@/i18n/core'
import type { AgentToolProposal } from './types'

let proposalSeq = 0

/**
 * Mint a proposal — the object a proposer (parser today, model tomorrow)
 * hands to the confirm card. The id is client-local; a server-side executor
 * would mint its own.
 */
export function createProposal(
  toolId: string,
  summary: Bi,
  params: Record<string, unknown>,
): AgentToolProposal {
  proposalSeq += 1
  return { id: `agent-${Date.now()}-${proposalSeq}`, toolId, summary, params }
}
