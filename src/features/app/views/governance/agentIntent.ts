import { bi } from '@/i18n/core'
/* Registers the governance tools this parser proposes (side effect — the
   registry fills at module load so confirm cards resolve labels early). */
import './agentTools'
import { createProposal } from '@/features/app/agent/propose'
import { stripArticle } from '@/features/app/agent/match'
import type { AgentToolProposal } from '@/features/app/agent/types'
import type { GovernanceRecordType } from './data/types'

/**
 * Deterministic governance intent parser — same contract as the other
 * module parsers: no fuzzy guessing, everything it proposes still passes
 * the full executor gate before anything writes.
 *
 * Governance nouns keep this unambiguous next to the other parsers — the
 * CRM activity regex only fires on call/email/meeting/note/task, and the
 * communications one needs "sent"/"communication", so "log a decision" and
 * "file a resolution" fall through cleanly to here.
 *
 * Recognizes, EN + FR:
 *   "record a decision to hire a fractional CFO"     → governance.add_decision
 *   "adopt the decision on the new office lease"     → governance.adopt_decision
 *   "file a resolution titled banking authority"     → governance.add_record
 *   "consigne une décision d'embaucher un DAF"       → governance.add_decision
 *   "adopte la décision sur le bail"                 → governance.adopt_decision
 *   "classe une résolution : pouvoir bancaire"       → governance.add_record
 */

const ADD_DECISION_RE =
  /^(?:record|log|file|add|note)\s+(?:a\s+|an\s+|the\s+|new\s+)?(?:board\s+)?decision\s+(?:to\s+|that\s+|on\s+|:\s*|—\s*|-\s*)?(.+)$/i
const ADOPT_RE =
  /^(?:adopt|ratify|approve)\s+(?:the\s+)?decision\s+(?:on\s+|to\s+|for\s+|:\s*|—\s*|-\s*)?(.+)$/i
const ADD_RECORD_RE =
  /^(?:file|log|record|add)\s+(?:a\s+|an\s+|the\s+|new\s+)?(bylaw|by-law|resolution|minutes|articles|register)\s+(?:titled\s+|called\s+|named\s+|for\s+|of\s+|on\s+|:\s*|—\s*|-\s*)?(.+)$/i

const ADD_DECISION_FR_RE =
  /^(?:consigne[rz]?|enregistre[rz]?|ajoute[rz]?|note[rz]?)\s+(?:une\s+)?décision\s+(?:de\s+|d['’]\s*|pour\s+|sur\s+|:\s*)?(.+)$/i
const ADOPT_FR_RE =
  /^(?:adopte[rz]?|ratifie[rz]?|approuve[rz]?)\s+(?:la\s+)?décision\s+(?:de\s+|d['’]\s*|sur\s+|pour\s+|:\s*)?(.+)$/i
const ADD_RECORD_FR_RE =
  /^(?:classe[rz]?|consigne[rz]?|ajoute[rz]?|enregistre[rz]?)\s+(?:un\s+|une\s+|le\s+|la\s+)?(règlement|résolution|procès-verbal|statuts|registre)\s+(?:intitulé\s+|de\s+|d['’]\s+|sur\s+|:\s*|—\s*|-\s*)?(.+)$/i

const RECORD_TYPE_EN: Record<string, GovernanceRecordType> = {
  bylaw: 'bylaw',
  'by-law': 'bylaw',
  resolution: 'resolution',
  minutes: 'minutes',
  articles: 'articles',
  register: 'register',
}
const RECORD_TYPE_FR: Record<string, GovernanceRecordType> = {
  règlement: 'bylaw',
  résolution: 'resolution',
  'procès-verbal': 'minutes',
  statuts: 'articles',
  registre: 'register',
}

/**
 * Parse a free-text rail message into a governance proposal, or `null` when
 * no intent matches — callers fall through to the next parser.
 */
export function proposeGovernanceAction(text: string): AgentToolProposal | null {
  const input = text.trim().replace(/[.!]+$/, '')
  if (!input) return null

  const adopt = ADOPT_RE.exec(input) ?? ADOPT_FR_RE.exec(input)
  if (adopt) {
    const title = stripArticle(adopt[1] ?? '')
    if (!title) return null
    return createProposal(
      'governance.adopt_decision',
      bi(`Adopt the decision — “${title}”.`, `Adopter la décision — « ${title} ».`),
      { title },
    )
  }

  const decision = ADD_DECISION_RE.exec(input) ?? ADD_DECISION_FR_RE.exec(input)
  if (decision) {
    const title = stripArticle(decision[1] ?? '')
    if (!title) return null
    return createProposal(
      'governance.add_decision',
      bi(`Record a decision — “${title}”.`, `Consigner une décision — « ${title} ».`),
      { title },
    )
  }

  const record = ADD_RECORD_RE.exec(input) ?? ADD_RECORD_FR_RE.exec(input)
  if (record) {
    const word = (record[1] ?? '').toLowerCase()
    const recordType = RECORD_TYPE_EN[word] ?? RECORD_TYPE_FR[word]
    const title = stripArticle(record[2] ?? '')
    if (!recordType || !title) return null
    return createProposal(
      'governance.add_record',
      bi(`File a ${recordType} — “${title}”.`, `Classer — « ${title} » (${recordType}).`),
      { title, recordType },
    )
  }

  return null
}
