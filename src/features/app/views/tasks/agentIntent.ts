import { bi } from '@/i18n/core'
/* Registers the tasks tools this parser proposes (side effect — the registry
   fills at module load so confirm cards resolve labels before Tasks mounts). */
import './agentTools'
import { createProposal } from '@/features/app/agent/propose'
import type { AgentToolProposal } from '@/features/app/agent/types'

/**
 * Deterministic tasks intent parser — same contract as the CRM one:
 * deliberately dumb, no invented params, everything it proposes still passes
 * the full executor gate before anything writes.
 *
 * The connector word is what keeps this unambiguous next to the CRM parser:
 *   "create a task to review the policy"  → tasks.create   (checklist)
 *   "log a task with Amara"               → crm.log_activity (activity on a contact)
 * so create-patterns only match when the "to/pour/de" infinitive connector —
 * or a colon — introduces the title, never "with/avec".
 *
 * Recognizes, EN + FR:
 *   "create a task to review the policy"   → tasks.create
 *   "ajoute une tâche de relire la police" → tasks.create
 *   "remind me to call the broker"         → tasks.create
 *   "mark the policy review as done"       → tasks.complete
 *   "complete the task onboarding"         → tasks.complete
 *   "termine la tâche intégration"         → tasks.complete
 */

const CREATE_RE =
  /^(?:create|add|new|make)\s+(?:a\s+|an\s+|new\s+)?task\s+(?:to\s+|for\s+|:\s*)(.+)$/i
const CREATE_FR_RE =
  /^(?:crée[rz]?|ajoute[rz]?)\s+(?:une\s+)?(?:nouvelle\s+)?tâche\s+(?:de\s+|pour\s+|:\s*)(.+)$/i
const REMIND_RE = /^remind me to\s+(.+)$/i
const REMIND_FR_RE = /^rappelle[- ]moi de\s+(.+)$/i

const MARK_DONE_RE = /^mark\s+(?:the\s+)?(?:task\s+)?(.+?)\s+as\s+(?:done|complete|finished)$/i
const COMPLETE_RE = /^(?:complete|finish|close)\s+(?:the\s+|my\s+)?task\s+(.+)$/i
const MARK_DONE_FR_RE =
  /^marque[rz]?\s+(?:la\s+)?(?:tâche\s+)?(.+?)\s+comme\s+(?:terminée?|faite?|complétée?)$/i
const COMPLETE_FR_RE = /^termine[rz]?\s+(?:la\s+)?tâche\s+(.+)$/i

/**
 * Parse a free-text rail message into a tasks proposal, or `null` when no
 * intent matches — callers fall through to the next parser.
 */
export function proposeTasksAction(text: string): AgentToolProposal | null {
  const input = text.trim().replace(/[.!]+$/, '')
  if (!input) return null

  const create =
    CREATE_RE.exec(input) ??
    CREATE_FR_RE.exec(input) ??
    REMIND_RE.exec(input) ??
    REMIND_FR_RE.exec(input)
  if (create) {
    const title = (create[1] ?? '').trim()
    if (!title) return null
    return createProposal(
      'tasks.create',
      bi(`Create a task — “${title}”.`, `Créer une tâche — « ${title} ».`),
      { title },
    )
  }

  const done =
    MARK_DONE_RE.exec(input) ??
    COMPLETE_RE.exec(input) ??
    MARK_DONE_FR_RE.exec(input) ??
    COMPLETE_FR_RE.exec(input)
  if (done) {
    const title = (done[1] ?? '').trim()
    if (!title) return null
    return createProposal(
      'tasks.complete',
      bi(`Mark the task as done — “${title}”.`, `Marquer la tâche comme terminée — « ${title} ».`),
      { title },
    )
  }

  return null
}
