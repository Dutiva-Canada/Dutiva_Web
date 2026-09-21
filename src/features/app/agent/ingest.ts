import { allowedSurfaces } from '@/features/app/advisor/contract'
import type { AdvisorResponse } from '@/features/app/advisor/contract'
import { bi } from '@/i18n/core'
import type { LText } from '@/i18n/core'
/* Registers every shipped tool — the filter below resolves against the
   registry, which is only as complete as its imports. */
import '@/features/app/views/crm/agentTools'
import '@/features/app/views/tasks/agentTools'
import '@/features/app/views/communications/agentTools'
import '@/features/app/views/governance/agentTools'
import '@/features/app/views/finance/agentTools'
import '@/features/app/views/operations/agentTools'
import '@/features/app/documents/agentTools'
import '@/features/app/views/security/agentTools'
import { getTool } from './registry'
import { createProposal } from './propose'
import type { AgentToolProposal } from './types'

/**
 * Wire → workspace ingest: map a validated `AdvisorResponse` into the
 * `AgentToolProposal`s a turn renders as confirm cards.
 *
 * The engine proposes; nothing here executes. The gates are exactly the
 * contract's plus the two modes that must never surface actions even if the
 * wire says otherwise:
 *
 *   - `isCrisis` — resources only, always;
 *   - `responseMode: 'supportive'` — support mode is intentionally off;
 *   - `route.actionsAllowed` — the engine's own gate (absent means withheld);
 *   - the tool must exist in the client registry — a call the client cannot
 *     resolve can only fail, so it is dropped rather than rendered.
 *
 * Params are not revalidated here: the executor's schema gate runs on
 * confirm, which is where refusal belongs. Proposals never carry across
 * turns — the caller attaches them to exactly one turn spec.
 */
export function proposalsFromAdvisorResponse(
  response: AdvisorResponse | null | undefined,
): AgentToolProposal[] {
  if (!response) return []
  if (response.isCrisis || response.route.responseMode === 'supportive') return []
  if (!allowedSurfaces(response).actions) return []
  return (response.proposedActions ?? [])
    .filter((action) => getTool(action.toolId) !== undefined)
    .map((action) => createProposal(action.toolId, toBi(action.summary), action.params))
}

function toBi(text: LText) {
  return typeof text === 'string' ? bi(text, text) : text
}
