import { bi } from '@/i18n/core'
/* Registers the documents tools this parser proposes (side effect — the
   registry fills at module load so confirm cards resolve labels early). */
import './agentTools'
import { createProposal } from '@/features/app/agent/propose'
import { stripArticle } from '@/features/app/agent/match'
import type { AgentToolProposal } from '@/features/app/agent/types'

/**
 * Deterministic documents intent parser — same contract as the other
 * module parsers: no invented params, everything still passes the executor
 * gate before anything writes.
 *
 * Every pattern is noun-guarded (document/lettre/contrat/offre…), so the
 * parser runs last in the dispatcher and steals nothing: "approve the
 * decision" stays governance, "approve the request" stays finance, and
 * only document nouns land here.
 *
 * The email is required for a send — no proposal without it, since the
 * tool can't execute a signature request with no recipient. The name is
 * optional: words before the address when present, otherwise the tool
 * falls back to the address's first part.
 *
 * Recognizes, EN + FR:
 *   "approve the offer letter for Chen"                 → documents.approve
 *   "approve the document titled remote work policy"    → documents.approve
 *   "send the contract to jane@northgate.ca for signature" → documents.send_for_signature
 *   "send the offer to Jane Doe jane@northgate.ca"      → documents.send_for_signature
 *   "approuve le contrat de travail"                    → documents.approve
 *   "envoie le contrat à jane@northgate.ca pour signature" → documents.send_for_signature
 */

const DOC_NOUN_EN = '(?:document|doc|letter|contract|agreement|offer|policy)'
/* Compound forms like "offer letter" or "employment contract" count as one
   noun — otherwise the second word leaks into the captured title. */
const DOC_NOUN_EN_COMPOUND = `${DOC_NOUN_EN}(?:\\s+${DOC_NOUN_EN})?`
const DOC_NOUN_FR = '(?:document|lettre|contrat|offre|entente|politique|convention)'
const EMAIL_RE = '([\\w.+-]+@[\\w-]+\\.[\\w.]+)'

const APPROVE_TITLED_RE = new RegExp(
  `^approve\\s+(?:the\\s+)?${DOC_NOUN_EN_COMPOUND}\\s+(?:titled|called)\\s+["'«]?(.+?)["'»]?$`,
  'i',
)
/* Free-form approve: the title itself must contain a document noun, so
   "approve the termination letter" lands here while "approve the decision"
   and "approve the request" fall through to governance/finance. */
const APPROVE_FOR_RE = /^approve\s+(?:the\s+)?(.+?)\s+for\s+.+$/i
const APPROVE_FREE_RE = /^approve\s+(?:the\s+)?(.+?)$/i
const TITLE_HAS_DOC_NOUN = new RegExp(`\\b${DOC_NOUN_EN}\\b`, 'i')
const APPROVE_FR_RE = new RegExp(
  `^approuve[rz]?\\s+(?:le|la|l')\\s*${DOC_NOUN_FR}\\s+(?:intitulé\\s+|titré\\s+|pour\\s+)?["'«]?(.+?)["'»]?$`,
  'i',
)

const SEND_RE = new RegExp(
  `^send\\s+(?:the\\s+)?(.+?)\\s+to\\s+(?:(.+?)\\s+)?<?${EMAIL_RE}>?(?:\\s+for\\s+signature|\\s+to\\s+sign)?$`,
  'i',
)
const SEND_FR_RE = new RegExp(
  `^envoie[rz]?\\s+(?:le|la|l')\\s*(.+?)\\s+à\\s+(?:(.+?)\\s+)?<?${EMAIL_RE}>?(?:\\s+pour\\s+(?:signature|signer))?$`,
  'i',
)

/**
 * Parse a free-text rail message into a documents proposal, or `null`
 * when no intent matches — callers fall through to the next parser.
 */
export function proposeDocumentsAction(text: string): AgentToolProposal | null {
  const input = text.trim().replace(/[.!]+$/, '')
  if (!input) return null

  const send = SEND_RE.exec(input) ?? SEND_FR_RE.exec(input)
  if (send) {
    const title = stripArticle(send[1] ?? '')
    const name = (send[2] ?? '').trim()
    const email = (send[3] ?? '').trim()
    if (!title || !email) return null
    return createProposal(
      'documents.send_for_signature',
      bi(
        `Send “${title}” for signature — ${name ? `${name} ` : ''}<${email}>.`,
        `Envoyer « ${title} » pour signature — ${name ? `${name} ` : ''}<${email}>.`,
      ),
      { title, email, ...(name ? { name } : {}) },
    )
  }

  const approveTitled = APPROVE_TITLED_RE.exec(input) ?? APPROVE_FR_RE.exec(input)
  if (approveTitled) {
    const title = stripArticle(approveTitled[1] ?? '')
    if (!title) return null
    return createProposal(
      'documents.approve',
      bi(`Approve the document — “${title}”.`, `Approuver le document — « ${title} ».`),
      { title },
    )
  }

  const approveFree = APPROVE_FOR_RE.exec(input) ?? APPROVE_FREE_RE.exec(input)
  if (approveFree) {
    const title = stripArticle(approveFree[1] ?? '')
    /* The captured title must name a document — otherwise this is
       governance's decision or finance's request, not ours. */
    if (!title || !TITLE_HAS_DOC_NOUN.test(title)) return null
    return createProposal(
      'documents.approve',
      bi(`Approve the document — “${title}”.`, `Approuver le document — « ${title} ».`),
      { title },
    )
  }

  return null
}
