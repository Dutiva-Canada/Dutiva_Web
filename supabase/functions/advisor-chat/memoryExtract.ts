/**
 * Parse optional memory-extraction trailer from an Advisor reply.
 *
 * When organization memory is active, the system prompt asks the model to
 * append a fenced ```dutiva-memory JSON array of durable workplace facts.
 * Those candidates are stored as inferred facts (never auto-confirmed) and
 * stripped from the user-visible reply.
 *
 * If the model omits the fence, `fallbackExtractFromTurn` can still queue
 * inferred thread facts from clear user statements (heuristic, capped).
 *
 * Pure and dependency-free so vitest can cover it without Deno.
 */

export interface ExtractedMemoryCandidate {
  scope: 'person' | 'case' | 'thread'
  entityId: string
  category:
    | 'employment'
    | 'compensation'
    | 'matter'
    | 'record'
    | 'note'
    | 'case'
    | 'conversation'
  statementEn: string
  statementFr: string
  sensitive: boolean
}

const FENCE_RE = /```dutiva-memory\s*([\s\S]*?)```/i

const CATEGORIES = new Set([
  'employment',
  'compensation',
  'matter',
  'record',
  'note',
  'case',
  'conversation',
])

const SCOPES = new Set(['person', 'case', 'thread'])

/** Max candidates accepted from one reply. */
export const MEMORY_EXTRACT_CAP = 3

/** Max candidates from the no-fence heuristic. */
export const MEMORY_FALLBACK_CAP = 2

export interface ParsedMemoryExtract {
  /** Reply with the dutiva-memory fence removed. */
  cleanReply: string
  candidates: ExtractedMemoryCandidate[]
}

export function parseMemoryExtract(
  reply: string,
  fallbackThreadId: string,
): ParsedMemoryExtract {
  const match = FENCE_RE.exec(reply)
  if (!match) return { cleanReply: reply.trimEnd(), candidates: [] }

  const cleanReply = reply.replace(FENCE_RE, '').trimEnd()
  let parsed: unknown
  try {
    parsed = JSON.parse(match[1]!.trim())
  } catch {
    return { cleanReply, candidates: [] }
  }
  if (!Array.isArray(parsed)) return { cleanReply, candidates: [] }

  const candidates: ExtractedMemoryCandidate[] = []
  for (const raw of parsed) {
    if (candidates.length >= MEMORY_EXTRACT_CAP) break
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const statementEn =
      typeof row.statement_en === 'string'
        ? row.statement_en.trim()
        : typeof row.statementEn === 'string'
          ? row.statementEn.trim()
          : ''
    if (statementEn.length < 8) continue
    const statementFrRaw =
      typeof row.statement_fr === 'string'
        ? row.statement_fr.trim()
        : typeof row.statementFr === 'string'
          ? row.statementFr.trim()
          : ''
    const scopeRaw = typeof row.scope === 'string' ? row.scope : 'thread'
    const scope = SCOPES.has(scopeRaw) ? (scopeRaw as ExtractedMemoryCandidate['scope']) : 'thread'
    const entityId =
      typeof row.entity_id === 'string' && row.entity_id.trim().length > 0
        ? row.entity_id.trim()
        : typeof row.entityId === 'string' && row.entityId.trim().length > 0
          ? row.entityId.trim()
          : fallbackThreadId
    const categoryRaw = typeof row.category === 'string' ? row.category : 'note'
    const category = CATEGORIES.has(categoryRaw)
      ? (categoryRaw as ExtractedMemoryCandidate['category'])
      : 'note'
    const sensitive = row.sensitive === true
    candidates.push({
      scope: scope === 'thread' ? 'thread' : scope,
      entityId: scope === 'thread' ? fallbackThreadId : entityId,
      category,
      statementEn,
      statementFr: statementFrRaw || statementEn,
      sensitive,
    })
  }
  return { cleanReply, candidates }
}

const DURABLE_CUE =
  /\b(prefers?|prefer to|started|hired on|hired in|reports to|tenure|years?(?:\s+of)?\s+service|open matter|graduated return|works remotely|remote[- ]first|accommodation(?:\s+plan)?)\b/i
const DURABLE_CUE_FR =
  /\b(préfère|a commencé|embauché|relève de|ans de service|télétravail|plan d['’]accommodement)\b/i
const SENSITIVE_CUE =
  /\b(salary|wage|compensation|pay rate|diagnosis|medical|health|disability|salaire|rémunération|diagnostic|médical)\b/i
const QUESTION_LEAD =
  /^(what|how|when|where|why|who|is|are|can|should|do|does|did|could|would|quel|quelle|quels|quelles|comment|pourquoi|est-ce|puis-je)\b/i
const STATUTE_CUE =
  /\b(ESA|LNE|PIPEDA|Bardal|s\.\s*\d+|art\.\s*\d+|weeks?'?\s+notice|statutory)\b/i
const ACK_IN_REPLY =
  /\b(i'?ll (?:keep|remember|note)|noted|got it|i will remember|je (?:vais|viendrai) (?:retenir|noter)|c['’]est noté)\b/i

/**
 * When the model omitted the dutiva-memory fence, queue up to
 * MEMORY_FALLBACK_CAP inferred thread facts from durable user statements.
 * Never invents legal conclusions; marks compensation/health as sensitive.
 */
export function fallbackExtractFromTurn(
  userMessage: string,
  cleanReply: string,
  conversationId: string,
): ExtractedMemoryCandidate[] {
  const user = userMessage.trim()
  if (user.length < 12) return []
  if (STATUTE_CUE.test(user)) return []

  const sentences = user
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12)

  const candidates: ExtractedMemoryCandidate[] = []
  for (const sentence of sentences) {
    if (candidates.length >= MEMORY_FALLBACK_CAP) break
    if (sentence.endsWith('?') && QUESTION_LEAD.test(sentence)) continue
    if (QUESTION_LEAD.test(sentence) && sentence.endsWith('?')) continue
    if (!(DURABLE_CUE.test(sentence) || DURABLE_CUE_FR.test(sentence))) continue
    /* Prefer turns where the model acknowledged retention, but still accept
       a clear preference/tenure statement standing alone. */
    const acknowledged = ACK_IN_REPLY.test(cleanReply)
    if (
      !acknowledged &&
      !/\b(prefers?|reports to|started|hired|préfère|a commencé)\b/i.test(sentence)
    ) {
      continue
    }
    candidates.push({
      scope: 'thread',
      entityId: conversationId,
      category: SENSITIVE_CUE.test(sentence) ? 'compensation' : 'note',
      statementEn: sentence.slice(0, 280),
      statementFr: sentence.slice(0, 280),
      sensitive: SENSITIVE_CUE.test(sentence),
    })
  }
  return candidates
}

/** Fence parse first; heuristic only when the fence yielded nothing. */
export function extractMemoryCandidates(
  reply: string,
  userMessage: string,
  conversationId: string,
): ParsedMemoryExtract {
  const parsed = parseMemoryExtract(reply, conversationId)
  if (parsed.candidates.length > 0) return parsed
  return {
    cleanReply: parsed.cleanReply,
    candidates: fallbackExtractFromTurn(userMessage, parsed.cleanReply, conversationId),
  }
}

/** Prompt appendix when org memory extraction is enabled for the turn. */
export function memoryExtractionPromptAppendix(): string {
  return (
    '\n\nOrganization memory capture — when (and only when) the user stated a durable ' +
    'workplace fact about a person, case, or this conversation that should be remembered ' +
    '(preferences, tenure, open matter status, process decisions already made), append AFTER ' +
    'your normal reply a fenced block exactly like:\n' +
    '```dutiva-memory\n' +
    '[{"scope":"thread","entity_id":"<conversation>","category":"note","statement_en":"…",' +
    '"statement_fr":"…","sensitive":false}]\n' +
    '```\n' +
    'Rules: 0–3 objects; inferred candidates only (never invent); no statutory figures or ' +
    'legal conclusions; mark compensation/health as sensitive:true; omit the fence entirely ' +
    'when there is nothing durable to remember. If you omit the fence, clear durable user ' +
    'statements may still be queued as inferred for human review. The fence is stripped ' +
    'before the user sees the reply.'
  )
}
