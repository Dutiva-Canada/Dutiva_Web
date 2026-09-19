import { proposeCrmAction } from '@/features/app/views/crm/agentIntent'
import { proposeTasksAction } from '@/features/app/views/tasks/agentIntent'
import { proposeCommsAction } from '@/features/app/views/communications/agentIntent'
import { proposeGovernanceAction } from '@/features/app/views/governance/agentIntent'
import { proposeFinanceAction } from '@/features/app/views/finance/agentIntent'
import { proposeOperationsAction } from '@/features/app/views/operations/agentIntent'
import { proposeDocumentsAction } from '@/features/app/documents/agentIntent'
import { proposeSecurityAction } from '@/features/app/views/security/agentIntent'
import type { AgentToolProposal } from './types'

/**
 * The deterministic proposer entry point — tries each module's parser in
 * order and returns the first proposal, or `null` for the normal reply path.
 *
 * Order matters at two overlaps. "Add a task to X" reads as a checklist
 * task while "log a task with X" reads as a CRM activity — tasks' create
 * patterns only accept the "to/de/pour" connector, so CRM phrasing falls
 * through untouched. And "mark the project as done/complete" would land in
 * the tasks parser's generic mark-done regex and fail there as an
 * unmatched title — operations runs first because every one of its
 * patterns requires a literal operations noun (vendor/fournisseur,
 * shipment/livraison, project/projet), so it claims only project-status
 * phrasing and steals nothing. Governance and finance run last and only
 * claim their own nouns — "approve the decision" lands in governance while
 * "approve the request" falls through to finance. Importing the parsers is
 * also what registers every module's tools (each parser imports its
 * `agentTools` for the side effect).
 */
export function proposeAgentAction(text: string): AgentToolProposal | null {
  return (
    proposeOperationsAction(text) ??
    /* Security also runs before tasks: "mark the access review X as done"
       would die in the generic mark-done regex as an unmatched task title.
       Its patterns all require a literal security noun, so nothing else is
       stolen — same ordering rationale as operations. */
    proposeSecurityAction(text) ??
    proposeTasksAction(text) ??
    proposeCommsAction(text) ??
    proposeCrmAction(text) ??
    proposeGovernanceAction(text) ??
    proposeFinanceAction(text) ??
    /* Documents runs last: its patterns are noun-guarded (document/
       lettre/contrat…), so nothing else shadows them — and it claims
       nothing that isn't explicitly a document noun. */
    proposeDocumentsAction(text)
  )
}
