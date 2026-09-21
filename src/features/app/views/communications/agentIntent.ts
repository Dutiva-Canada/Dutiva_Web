import { bi } from '@/i18n/core'
/* Registers the communications tools this parser proposes (side effect — the
   registry fills at module load so confirm cards resolve labels early). */
import './agentTools'
import { createProposal } from '@/features/app/agent/propose'
import { stripArticle } from '@/features/app/agent/match'
import type { AgentToolProposal } from '@/features/app/agent/types'

/**
 * Deterministic communications intent parser — same contract as the other
 * module parsers: no fuzzy guessing, everything it proposes still passes the
 * full executor gate before anything writes.
 *
 * Every pattern produces register entries or status records — the register's
 * own boundary: logging "that we sent X" records a send that already happened;
 * it never triggers one. Channel is left unset unless the user names it, so
 * the tool defaults to 'other' rather than asserting an email.
 *
 * Recognizes, EN + FR:
 *   "log that we sent the RTO policy update"      → communications.log (sent)
 *   "consigne que nous avons envoyé la police"    → communications.log (sent)
 *   "log a communication to all staff: …"         → communications.log (draft)
 *   "mark the RTO letter as sent"                 → communications.mark_sent
 *   "marque la lettre comme envoyée"              → communications.mark_sent
 */

const LOG_SENT_RE = /^(?:log|record)\s+(?:that\s+)?(?:we\s+)?sent\s+(.+)$/i
const LOG_SENT_FR_RE = /^consigne[rz]?\s+(?:que\s+)?(?:nous\s+avons\s+|on\s+a\s+)?envoyé\s+(.+)$/i
const LOG_RE = /^(?:log|record|add)\s+a\s+communication\s+(?:to\s+|for\s+|:\s*)?(.+)$/i
const LOG_FR_RE = /^consigne[rz]?\s+une\s+communication\s+(?:pour\s+|à\s+|:\s*)?(.+)$/i
const MARK_SENT_RE = /^mark\s+(.+?)\s+as\s+sent$/i
const MARK_SENT_FR_RE = /^marque[rz]?\s+(.+?)\s+comme\s+envoyée?$/i

function logProposal(title: string, sent: boolean): AgentToolProposal | null {
  const trimmed = stripArticle(title)
  if (!trimmed) return null
  return createProposal(
    'communications.log',
    sent
      ? bi(
          `Log a sent communication — “${trimmed}”.`,
          `Consigner une communication envoyée — « ${trimmed} ».`,
        )
      : bi(`Log a communication — “${trimmed}”.`, `Consigner une communication — « ${trimmed} ».`),
    {
      title: trimmed,
      ...(sent ? { status: 'sent' } : {}),
    },
  )
}

/**
 * Parse a free-text rail message into a communications proposal, or `null`
 * when no intent matches — callers fall through to the next parser.
 */
export function proposeCommsAction(text: string): AgentToolProposal | null {
  const input = text.trim().replace(/[.!]+$/, '')
  if (!input) return null

  const sent = LOG_SENT_RE.exec(input) ?? LOG_SENT_FR_RE.exec(input)
  if (sent) return logProposal(sent[1] ?? '', true)

  const logged = LOG_RE.exec(input) ?? LOG_FR_RE.exec(input)
  if (logged) return logProposal(logged[1] ?? '', false)

  const mark = MARK_SENT_RE.exec(input) ?? MARK_SENT_FR_RE.exec(input)
  if (mark) {
    const title = stripArticle(mark[1] ?? '')
    if (!title) return null
    return createProposal(
      'communications.mark_sent',
      bi(`Record as sent — “${title}”.`, `Consigner comme envoyée — « ${title} ».`),
      { title },
    )
  }

  return null
}
