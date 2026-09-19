import { bi } from '@/i18n/core'
/* Registers the CRM tools this parser proposes (side effect — the registry
   fills at module load so confirm cards resolve labels before CRM mounts). */
import './agentTools'
import { createProposal } from '@/features/app/agent/propose'
import type { AgentToolProposal } from '@/features/app/agent/types'
import type { CrmActivityType } from './types'

/**
 * Deterministic CRM intent parser — the stand-in proposer.
 *
 * Until the Advisor engine emits `proposedActions` over the wire, this is
 * what produces real proposals in the demo: a small pattern match over
 * free text in the rail. It is deliberately dumb — no fuzzy guessing, no
 * invented params — because whatever it proposes still passes the full
 * executor gate (schema → role → module → confirm) before anything writes.
 * When a model takes this seat, only this file's caller changes: the
 * proposal shape and everything downstream stay identical.
 *
 * Recognizes, EN + FR:
 *   "log a call with Amara re: onboarding"  → crm.log_activity
 *   "note un appel avec Amara"              → crm.log_activity
 *   "add a follow-up with Ben next Friday"  → crm.log_activity (+followUpDate)
 *   "add contact Amara Chen at Northgate"   → crm.add_contact
 *   "ajoute un contact Amara Chen chez X"   → crm.add_contact
 */

const EN_VERB = String.raw`(?:log|record|add|note|create)`
const FR_VERB = String.raw`(?:consigne[rz]?|note[rz]?|ajoute[rz]?|crée[rz]?)`

const EN_TYPES: Record<string, CrmActivityType> = {
  call: 'call',
  email: 'email',
  meeting: 'meeting',
  note: 'note',
  task: 'task',
}

const FR_TYPES: Record<string, CrmActivityType> = {
  appel: 'call',
  courriel: 'email',
  email: 'email',
  réunion: 'meeting',
  reunion: 'meeting',
  note: 'note',
  tâche: 'task',
  tache: 'task',
}

const SUBJECT_TAIL = String.raw`(?:[\s:—–-]+(?:with|for|to|about|re|avec|pour|concernant)?:?\s*(.+))?$`

const LOG_RE = new RegExp(
  `^(?:${EN_VERB}|${FR_VERB})\\s+(?:a|an|une?|des)?\\s*` +
    `(call|email|meeting|note|task|appel|courriel|réunion|reunion|tâche|tache)` +
    SUBJECT_TAIL,
  'i',
)

const FOLLOWUP_RE = new RegExp(
  `^(?:${EN_VERB}|${FR_VERB})\\s+(?:a|an|une?|my)?\\s*` +
    `(?:follow[\\s-]?up|reminder|suivi|rappel)` +
    SUBJECT_TAIL,
  'i',
)

const ADD_CONTACT_RE = new RegExp(
  `^(?:add|create|ajoute[rz]?|crée[rz]?)\\s+(?:a|an|new|un|une|nouveau|nouvelle)?\\s*` +
    `contact\\s+(.+?)(?:\\s+(?:at|from|for|chez|à|pour)\\s+(.+))?$`,
  'i',
)

/** One week out — lands inside the dashboard's upcoming-followups window. */
function defaultFollowUpDate(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function stripTrailingDate(subject: string): string {
  return subject
    .replace(/\s+(?:tomorrow|today|next week|demain|aujourd'hui|la semaine prochaine)\.?$/i, '')
    .trim()
}

function activityTypeOf(raw: string): CrmActivityType {
  const key = raw.toLowerCase()
  return EN_TYPES[key] ?? FR_TYPES[key] ?? 'note'
}

function logActivityProposal(
  type: CrmActivityType,
  subject: string,
  followUpDate: string | undefined,
): AgentToolProposal {
  const detail = stripTrailingDate(subject) || undefined
  const typeLabel: Record<CrmActivityType, { en: string; fr: string }> = {
    call: { en: 'call', fr: 'appel' },
    email: { en: 'email', fr: 'courriel' },
    meeting: { en: 'meeting', fr: 'réunion' },
    note: { en: 'note', fr: 'note' },
    task: { en: 'follow-up', fr: 'suivi' },
  }
  const label = typeLabel[type]
  const text = detail ? `${label.en} — ${detail}` : label.en
  const summary = bi(
    `Log a ${label.en}${detail ? `: “${detail}”` : ''}${followUpDate ? ` — follow-up ${followUpDate}` : ''}.`,
    `Consigner un ${label.fr}${detail ? ` : « ${detail} »` : ''}${followUpDate ? ` — suivi le ${followUpDate}` : ''}.`,
  )
  return createProposal('crm.log_activity', summary, {
    type,
    /* `summary` is the free-text line the activity stores — user data, same
       string in both languages (the tool wraps it `bi(text, text)`). */
    summary: text,
    /* `contact` fails safe: when the detail isn't an existing contact name
       the tool leaves `contactId` unset rather than guessing. */
    ...(detail ? { contact: detail } : {}),
    ...(followUpDate ? { followUpDate } : {}),
  })
}

/**
 * Parse a free-text rail message into a CRM proposal, or `null` when no
 * intent matches — callers fall back to their normal reply path.
 */
export function proposeCrmAction(text: string): AgentToolProposal | null {
  const input = text.trim().replace(/[.!]+$/, '')
  if (!input) return null

  const followUp = FOLLOWUP_RE.exec(input)
  if (followUp) {
    return logActivityProposal('task', followUp[1] ?? '', defaultFollowUpDate())
  }

  const log = LOG_RE.exec(input)
  if (log) {
    return logActivityProposal(activityTypeOf(log[1] ?? ''), log[2] ?? '', undefined)
  }

  const contact = ADD_CONTACT_RE.exec(input)
  if (contact) {
    const name = (contact[1] ?? '').trim()
    const company = contact[2]?.trim()
    const summary = bi(
      `Add a contact — “${name}”${company ? ` at ${company}` : ''}.`,
      `Ajouter un contact — « ${name} »${company ? ` chez ${company}` : ''}.`,
    )
    return createProposal('crm.add_contact', summary, {
      name,
      ...(company ? { company } : {}),
    })
  }

  return null
}
