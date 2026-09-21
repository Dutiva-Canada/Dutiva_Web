import { bi } from '@/i18n/core'
/* Registers the finance tools this parser proposes (side effect — the
   registry fills at module load so confirm cards resolve labels early). */
import './agentTools'
import { createProposal } from '@/features/app/agent/propose'
import { stripArticle } from '@/features/app/agent/match'
import type { AgentToolProposal } from '@/features/app/agent/types'
import type { FinanceTaxType } from './data/types'

/**
 * Deterministic finance intent parser — same contract as the other module
 * parsers: no invented params, everything still passes the executor gate.
 *
 * `add_spend_request` is only proposed when the message carries an amount —
 * the param is required, so a purpose-only proposal could only fail on
 * confirm. Same for obligations: a due date must appear as YYYY-MM-DD;
 * natural-language dates stay a UI concern, not a parser guess.
 *
 * Recognizes, EN + FR:
 *   "mark invoice INV-2026-0042 as paid"            → finance.mark_invoice_paid
 *   "mark the Maple Freight invoice as paid"        → finance.mark_invoice_paid
 *   "request approval to buy laptops for $3600"     → finance.add_spend_request
 *   "approve the spend request for laptops"         → finance.approve_spend
 *   "add a GST remittance for Q3 due 2026-09-30"    → finance.add_obligation
 *   "marque la facture INV-0042 comme payée"        → finance.mark_invoice_paid
 *   "approuve la demande pour les portables"        → finance.approve_spend
 *   "ajoute une obligation TPS pour le T3 échéance 2026-09-30" → finance.add_obligation
 */

const MARK_PAID_RE =
  /^(?:mark|record)\s+(?:the\s+)?(?:invoice\s+)?(.+?)\s+(?:invoice\s+)?as\s+paid$/i
const MARK_PAID_FR_RE = /^marque[rz]?\s+(?:la\s+)?facture\s+(.+?)\s+comme\s+payée$/i

const AMOUNT = String.raw`([\d][\d,]*(?:\.\d{1,2})?)`
const ADD_SPEND_RE = new RegExp(
  String.raw`^(?:request|submit)\s+(?:a\s+)?(?:spend\s+)?(?:approval|request|spend request)\s+(?:to\s+|for\s+|:\s*)?(.+?)\s+for\s+\$?${AMOUNT}\s*(?:CAD|dollars)?$`,
  'i',
)
const ADD_SPEND_FR_RE = new RegExp(
  String.raw`^(?:demande[rz]?|soumet(?:s|tre)?)\s+(?:une\s+)?(?:demande\s+)?(?:d['’]approbation\s+)?(?:pour|de)\s+(.+?)\s+(?:pour|de)\s+([\d][\d\s]*(?:[.,]\d{1,2})?)\s*\$?$`,
  'i',
)

const APPROVE_SPEND_RE =
  /^(?:approve|sign off on)\s+(?:the\s+)?(?:spend\s+)?request\s+(?:for\s+|on\s+|:\s*)?(.+)$/i
const APPROVE_SPEND_FR_RE = /^approuve[rz]?\s+(?:la\s+)?demande\s+(?:pour\s+|de\s+|:\s*)?(.+)$/i

const TAX_WORDS_EN = String.raw`(gst\/hst|gst|hst|sales tax|qst|income tax|corporate tax|payroll|source deductions?|employer contributions?|other)`
const ADD_OBLIGATION_RE = new RegExp(
  String.raw`^(?:add|file|record|log)\s+(?:a\s+|an\s+|the\s+)?${TAX_WORDS_EN}\s+(?:obligation|remittance|filing|payment)\s+(?:for\s+)?(.+?)\s+due\s+(\d{4}-\d{2}-\d{2})$`,
  'i',
)
const TAX_WORDS_FR = String.raw`(tps\/tvh|tps|tvh|tvq|impôt(?:\s+sur\s+le\s+revenu)?|retenues?(?:\s+à\s+la\s+source)?|cotisations?\s+employeur|paie|autre)`
const ADD_OBLIGATION_FR_RE = new RegExp(
  String.raw`^(?:ajoute[rz]?|consigne[rz]?|enregistre[rz]?)\s+(?:une\s+)?obligation\s+${TAX_WORDS_FR}\s+(?:pour\s+(?:le\s+|la\s+)?)?(.+?)\s+(?:échéance|due)\s+(\d{4}-\d{2}-\d{2})$`,
  'i',
)

const TAX_TYPE_EN: Record<string, FinanceTaxType> = {
  'gst/hst': 'gst_hst',
  gst: 'gst_hst',
  hst: 'gst_hst',
  'sales tax': 'gst_hst',
  qst: 'qst',
  'income tax': 'income_tax',
  'corporate tax': 'income_tax',
  payroll: 'payroll_source_deductions',
  'source deduction': 'payroll_source_deductions',
  'source deductions': 'payroll_source_deductions',
  'employer contribution': 'employer_contributions',
  'employer contributions': 'employer_contributions',
  other: 'other',
}
const TAX_TYPE_FR: Record<string, FinanceTaxType> = {
  'tps/tvh': 'gst_hst',
  tps: 'gst_hst',
  tvh: 'gst_hst',
  tvq: 'qst',
  impôt: 'income_tax',
  'impôt sur le revenu': 'income_tax',
  retenue: 'payroll_source_deductions',
  retenues: 'payroll_source_deductions',
  'retenue à la source': 'payroll_source_deductions',
  'retenues à la source': 'payroll_source_deductions',
  'cotisation employeur': 'employer_contributions',
  'cotisations employeur': 'employer_contributions',
  paie: 'payroll_source_deductions',
  autre: 'other',
}

function toAmount(raw: string): number | null {
  const n = Number(raw.replace(/[\s,]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Parse a free-text rail message into a finance proposal, or `null` when no
 * intent matches — callers fall through to the next parser.
 */
export function proposeFinanceAction(text: string): AgentToolProposal | null {
  const input = text.trim().replace(/[.!]+$/, '')
  if (!input) return null

  const paid = MARK_PAID_RE.exec(input) ?? MARK_PAID_FR_RE.exec(input)
  if (paid) {
    const title = stripArticle(paid[1] ?? '')
    if (!title) return null
    return createProposal(
      'finance.mark_invoice_paid',
      bi(
        `Mark the invoice as paid — “${title}”.`,
        `Marquer la facture comme payée — « ${title} ».`,
      ),
      { title },
    )
  }

  const spend = ADD_SPEND_RE.exec(input) ?? ADD_SPEND_FR_RE.exec(input)
  if (spend) {
    const purpose = stripArticle(spend[1] ?? '')
    const amount = toAmount(spend[2] ?? '')
    if (!purpose || amount === null) return null
    return createProposal(
      'finance.add_spend_request',
      bi(
        `Submit a spend request — “${purpose}” — $${amount.toFixed(2)}.`,
        `Soumettre une demande — « ${purpose} » — ${amount.toFixed(2)} $.`,
      ),
      { purpose, amount },
    )
  }

  const approve = APPROVE_SPEND_RE.exec(input) ?? APPROVE_SPEND_FR_RE.exec(input)
  if (approve) {
    const title = stripArticle(approve[1] ?? '')
    if (!title) return null
    return createProposal(
      'finance.approve_spend',
      bi(`Approve the spend request — “${title}”.`, `Approuver la demande — « ${title} ».`),
      { title },
    )
  }

  const obligation = ADD_OBLIGATION_RE.exec(input) ?? ADD_OBLIGATION_FR_RE.exec(input)
  if (obligation) {
    const word = (obligation[1] ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
    const type = TAX_TYPE_EN[word] ?? TAX_TYPE_FR[word]
    const period = (obligation[2] ?? '').trim()
    const dueDate = obligation[3] ?? ''
    if (!type || !period) return null
    return createProposal(
      'finance.add_obligation',
      bi(
        `File a ${type} obligation — ${period} — due ${dueDate}.`,
        `Consigner une obligation ${type} — ${period} — échéance ${dueDate}.`,
      ),
      { type, period, dueDate },
    )
  }

  return null
}
