import { bi } from '@/i18n/core'
/* Registers the operations tools this parser proposes (side effect — the
   registry fills at module load so confirm cards resolve labels early). */
import './agentTools'
import { createProposal } from '@/features/app/agent/propose'
import { stripArticle } from '@/features/app/agent/match'
import type { AgentToolProposal } from '@/features/app/agent/types'
import type { OperationsProjectStatus } from './data/types'

/**
 * Deterministic operations intent parser — same contract as the other
 * module parsers: no invented params, everything still passes the executor
 * gate before anything writes.
 *
 * Every pattern is noun-guarded (vendor/fournisseur, shipment/livraison,
 * project/projet), so the parser can run *before* tasks in the dispatcher
 * without stealing anything. That ordering matters for exactly one phrase
 * family: "mark the project as done/complete" and "marque le projet comme
 * terminé" would otherwise land in the tasks parser's generic mark-done
 * regex and fail there as an unmatched task title. Claiming them here
 * routes them to the project they actually mean.
 *
 * Recognizes, EN + FR:
 *   "add a vendor Staples Business Advantage"       → operations.add_vendor
 *   "mark the workstation shipment as delivered"    → operations.deliver_shipment
 *   "mark the project relocation as completed"      → operations.update_project
 *   "ajoute un fournisseur Staples"                 → operations.add_vendor
 *   "marque la livraison postes comme livrée"       → operations.deliver_shipment
 *   "marque le projet déménagement comme terminé"   → operations.update_project
 */

const ADD_VENDOR_RE =
  /^(?:add|onboard|register|create)\s+(?:a\s+|an\s+|the\s+|new\s+)?vendor\s+(.+)$/i
const ADD_VENDOR_FR_RE =
  /^(?:ajoute[rz]?|enregistre[rz]?|crée[rz]?|ajout(?:e|er))\s+(?:un\s+|le\s+)?fournisseur\s+(.+)$/i

const DELIVER_RE = /^mark\s+(?:the\s+)?(?:shipment|delivery)\s+(.+?)\s+as\s+delivered$/i
const DELIVER_FREE_RE = /^mark\s+(.+?)\s+as\s+delivered$/i
const DELIVER_FR_RE = /^marque[rz]?\s+(?:la\s+)?(?:livraison\s+)?(.+?)\s+comme\s+livrée$/i

const PROJECT_RE =
  /^mark\s+(?:the\s+)?project\s+(.+?)\s+as\s+(completed|complete|done|finished|active|on\s+hold|paused|cancelled|canceled|planning)$/i
const PROJECT_SET_RE =
  /^set\s+(?:the\s+)?project\s+(.+?)\s+to\s+(completed|complete|done|finished|active|on\s+hold|paused|cancelled|canceled|planning)$/i
const PROJECT_FR_RE =
  /^marque[rz]?\s+le\s+projet\s+(.+?)\s+comme\s+(terminée?|finie?|complétée?|actifs?|en\s+pause|en\s+attente|annulée?|planification)$/i

const STATUS_EN: Record<string, OperationsProjectStatus> = {
  completed: 'completed',
  complete: 'completed',
  done: 'completed',
  finished: 'completed',
  active: 'active',
  'on hold': 'on_hold',
  paused: 'on_hold',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  planning: 'planning',
}
const STATUS_FR: Record<string, OperationsProjectStatus> = {
  terminé: 'completed',
  terminée: 'completed',
  fini: 'completed',
  finie: 'completed',
  complété: 'completed',
  complétée: 'completed',
  actif: 'active',
  actifs: 'active',
  'en pause': 'on_hold',
  'en attente': 'on_hold',
  annulé: 'cancelled',
  annulée: 'cancelled',
  planification: 'planning',
}

const STATUS_SUMMARY_LABEL: Record<OperationsProjectStatus, { en: string; fr: string }> = {
  planning: { en: 'planning', fr: 'en planification' },
  active: { en: 'active', fr: 'actif' },
  on_hold: { en: 'on hold', fr: 'en pause' },
  completed: { en: 'completed', fr: 'terminé' },
  cancelled: { en: 'cancelled', fr: 'annulé' },
}

function projectProposal(title: string, statusWord: string): AgentToolProposal | null {
  const name = stripArticle(title)
  const status = STATUS_EN[statusWord.toLowerCase()] ?? STATUS_FR[statusWord.toLowerCase()]
  if (!name || !status) return null
  const label = STATUS_SUMMARY_LABEL[status]
  return createProposal(
    'operations.update_project',
    bi(
      `Set the project to ${label.en} — “${name}”.`,
      `Passer le projet à ${label.fr} — « ${name} ».`,
    ),
    { title: name, status },
  )
}

/**
 * Parse a free-text rail message into an operations proposal, or `null`
 * when no intent matches — callers fall through to the next parser.
 */
export function proposeOperationsAction(text: string): AgentToolProposal | null {
  const input = text.trim().replace(/[.!]+$/, '')
  if (!input) return null

  const vendor = ADD_VENDOR_RE.exec(input) ?? ADD_VENDOR_FR_RE.exec(input)
  if (vendor) {
    const name = stripArticle(vendor[1] ?? '')
    if (!name) return null
    return createProposal(
      'operations.add_vendor',
      bi(`Add a vendor — “${name}”.`, `Ajouter un fournisseur — « ${name} ».`),
      { name },
    )
  }

  const project = PROJECT_RE.exec(input) ?? PROJECT_SET_RE.exec(input) ?? PROJECT_FR_RE.exec(input)
  if (project) {
    return projectProposal(project[1] ?? '', project[2] ?? '')
  }

  const delivered =
    DELIVER_RE.exec(input) ?? DELIVER_FR_RE.exec(input) ?? DELIVER_FREE_RE.exec(input)
  if (delivered) {
    const title = stripArticle(delivered[1] ?? '')
    if (!title) return null
    return createProposal(
      'operations.deliver_shipment',
      bi(
        `Mark the shipment as delivered — “${title}”.`,
        `Marquer la livraison comme livrée — « ${title} ».`,
      ),
      { title },
    )
  }

  return null
}
