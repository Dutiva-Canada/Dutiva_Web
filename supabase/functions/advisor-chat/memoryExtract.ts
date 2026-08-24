/**
 * Parse optional memory-extraction trailer from an Advisor reply.
 *
 * When organization memory is active, the system prompt asks the model to
 * append a fenced ```dutiva-memory JSON array of durable workplace facts.
 * Those candidates are stored as inferred facts (never auto-confirmed) and
 * stripped from the user-visible reply.
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
    'when there is nothing durable to remember. The fence is stripped before the user sees ' +
    'the reply.'
  )
}
