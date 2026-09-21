import { bi } from '@/i18n/core'
/* Registers the security tools this parser proposes (side effect — the
   registry fills at module load so confirm cards resolve labels early). */
import './agentTools'
import { createProposal } from '@/features/app/agent/propose'
import { stripArticle } from '@/features/app/agent/match'
import type { AgentToolProposal } from '@/features/app/agent/types'

/**
 * Deterministic security intent parser — same contract as the other
 * module parsers: no invented params, everything still passes the executor
 * gate before anything writes.
 *
 * Every pattern is noun-guarded (incident, access review, revue d'accès),
 * so the parser can run *before* tasks in the dispatcher without stealing
 * anything — that ordering matters for exactly one phrase family: "mark
 * the access review X as done" would otherwise land in the tasks parser's
 * generic mark-done regex and die there as an unmatched task title. Same
 * rescue pattern as operations' project-status phrasing.
 *
 * Recognizes, EN + FR:
 *   "report a security incident — phishing email reported"  → security.report_incident
 *   "log an incident: stolen laptop"                        → security.report_incident
 *   "resolve the suspicious login incident"                 → security.resolve_incident
 *   "mark the phishing incident as resolved"                → security.resolve_incident
 *   "complete the Q3 access review"                         → security.complete_access_review
 *   "mark the access review admin audit as done"            → security.complete_access_review
 *   "consigne un incident de sécurité — hameçonnage"        → security.report_incident
 *   "résous l'incident connexion suspecte"                  → security.resolve_incident
 *   "termine la revue d'accès T3"                           → security.complete_access_review
 */

const REPORT_RE =
  /^(?:report|log|record|file)\s+(?:a\s+|an\s+|the\s+|new\s+)?(?:security\s+)?incident\s*[:—–-]?\s+(.+)$/i
/* Trailing-noun variant — "report a phishing incident". */
const REPORT_TAIL_RE = /^(?:report|log|record|file)\s+(?:a\s+|an\s+|the\s+)?(.+?)\s+incident$/i
const REPORT_FR_RE =
  /^(?:consigne|signale|enregistre|déclare)[rz]?\s+(?:un\s+)?incident\s*(?:de\s+sécurité)?\s*(?:[:—–-]\s*|\s+)(?:de\s+)?(.+)$/i

/* Both noun positions — "resolve the incident X" and "resolve the X incident"
   are equally natural, and the title lands either side of the guard noun. */
const RESOLVE_A_RE = /^resolve\s+(?:the\s+)?(?:security\s+)?incident\s+(.+)$/i
const RESOLVE_B_RE =
  /^mark\s+(?:the\s+)?(?:security\s+)?incident\s+(.+?)\s+as\s+(?:resolved|closed|done)$/i
const RESOLVE_C_RE = /^resolve\s+(?:the\s+)?(.+?)\s+incident$/i
const RESOLVE_D_RE = /^mark\s+(?:the\s+)?(.+?)\s+incident\s+as\s+(?:resolved|closed|done)$/i
const RESOLVE_FR_A_RE = /^(?:résous|résolvez|régle[rz]?)\s+(?:l'|le\s+)?incident\s+(.+)$/i
const RESOLVE_FR_B_RE =
  /^marque[rz]?\s+(?:l'|le\s+)?incident\s+(.+?)\s+comme\s+(?:résolu|fermé|terminé)$/i

const REVIEW_A_RE =
  /^mark\s+(?:the\s+)?access\s+review\s+(.+?)\s+as\s+(?:done|complete|completed|finished)$/i
const REVIEW_B_RE = /^(?:complete|finish|close)\s+(?:the\s+)?access\s+review\s+(.+)$/i
const REVIEW_C_RE =
  /^mark\s+(?:the\s+)?(.+?)\s+access\s+review\s+as\s+(?:done|complete|completed|finished)$/i
const REVIEW_D_RE = /^(?:complete|finish|close)\s+(?:the\s+)?(.+?)\s+access\s+review$/i
const REVIEW_FR_A_RE =
  /^marque[rz]?\s+(?:la\s+)?revue\s+d'accès\s+(.+?)\s+comme\s+(?:terminée?|faite)$/i
const REVIEW_FR_B_RE = /^(?:termine[rz]?|clôture[rz]?)\s+(?:la\s+)?revue\s+d'accès\s+(.+)$/i

/**
 * Parse a free-text rail message into a security proposal, or `null` when
 * no intent matches — callers fall through to the next parser.
 */
export function proposeSecurityAction(text: string): AgentToolProposal | null {
  const input = text.trim().replace(/[.!]+$/, '')
  if (!input) return null

  const report = REPORT_RE.exec(input) ?? REPORT_TAIL_RE.exec(input) ?? REPORT_FR_RE.exec(input)
  if (report) {
    const title = stripArticle(report[1] ?? '')
    if (!title) return null
    return createProposal(
      'security.report_incident',
      bi(`Log a security incident — “${title}”.`, `Consigner un incident — « ${title} ».`),
      { title },
    )
  }

  const resolve =
    RESOLVE_A_RE.exec(input) ??
    RESOLVE_B_RE.exec(input) ??
    RESOLVE_C_RE.exec(input) ??
    RESOLVE_D_RE.exec(input) ??
    RESOLVE_FR_A_RE.exec(input) ??
    RESOLVE_FR_B_RE.exec(input)
  if (resolve) {
    const title = stripArticle(resolve[1] ?? '')
    if (!title) return null
    return createProposal(
      'security.resolve_incident',
      bi(`Resolve the incident — “${title}”.`, `Résoudre l'incident — « ${title} ».`),
      { title },
    )
  }

  const review =
    REVIEW_A_RE.exec(input) ??
    REVIEW_B_RE.exec(input) ??
    REVIEW_C_RE.exec(input) ??
    REVIEW_D_RE.exec(input) ??
    REVIEW_FR_A_RE.exec(input) ??
    REVIEW_FR_B_RE.exec(input)
  if (review) {
    const title = stripArticle(review[1] ?? '')
    if (!title) return null
    return createProposal(
      'security.complete_access_review',
      bi(`Complete the access review — “${title}”.`, `Terminer la revue d'accès — « ${title} ».`),
      { title },
    )
  }

  return null
}
