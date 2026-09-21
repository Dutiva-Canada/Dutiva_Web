/* agentPropose.ts — engine-side agent proposals.

   A second, isolated completion call extracts workspace actions from the
   user's message and emits `proposedActions` for the client contract
   (src/features/app/advisor/contract.ts). Separation is deliberate: the
   chat reply is never asked for structured output, so a malformed proposal
   can never leak into the user-visible answer.

   The safety model mirrors the client's: the model proposes, deterministic
   code disposes. `parseExtraction` validates every item against the tool
   catalog — unknown toolIds are dropped, undeclared params are stripped,
   missing or ill-typed required params drop the action — and the client
   ingest + executor re-check everything again anyway. Nothing here can
   write; a proposal only ever renders a confirm card.

   Dark-shipped behind ADVISOR_AGENT_ACTIONS=true — code deploys inert. */

import { AGENT_TOOLS, findCatalogTool } from './agentCatalog.ts'
import type { AgentCatalogTool } from './agentCatalog.ts'
import { postChatCompletion, resolveApiKey } from '../_shared/modelUpstream.ts'

export interface ProposedActionDraft {
  toolId: string
  summary: { en: string; fr: string }
  params: Record<string, unknown>
}

/* Local structural types — index.ts's ModelProvider/ModelRoute/ChatMessage
   are assignable, and this module stays importable without a cycle. */
interface ExtractionProvider {
  base_url: string
  secret_ref: string | null
}
interface ExtractionRoute {
  model_name: string
  config?: { max_tokens?: number; temperature?: number } | null
}
interface ExtractionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const MAX_ACTIONS = 3
const EXTRACTION_MAX_TOKENS = 400
const HISTORY_TAIL = 6

/** Feature flag — set the secret to emit proposals; absent means inert. */
export function agentActionsEnabled(): boolean {
  return Deno.env.get('ADVISOR_AGENT_ACTIONS') === 'true'
}

/**
 * Cost gate, not a correctness gate — the extractor only runs when the
 * message plausibly asks for a workspace change (an action verb or a module
 * noun, EN or FR). A false negative just means no proposals this turn; a
 * false positive costs one small call and returns {"actions":[]}.
 */
const ACTIONISH =
  /\b(mark|add|log|record|approve|adopt|file|create|complete|deliver|set|onboard|register|move|note|remind|schedule|submit|request|pay|book|invoice|update|task|vendor|shipment|decision|obligation|resolution|bylaw|marque[rz]?|ajoute[rz]?|consigne[rz]?|approuve[rz]?|adopte[rz]?|classe[rz]?|crée[rz]?|cree[rz]?|termine[rz]?|livre[rz]?|passe[rz]?|enregistre[rz]?|demande[rz]?|planifie[rz]?|mettez|mets|note[rz]?|rappelle[rz]?|facture[rz]?|paie[rz]?|déplace[rz]?|deplace[rz]?|soumets|soumettez|tâche|tache|fournisseur|livraison|décision|decision|projet|résolution|reglement|règlement)\b/i

export function looksActionable(message: string): boolean {
  return ACTIONISH.test(message)
}

/* ── Prompt ─────────────────────────────────────────────────────────────── */

function paramLine(tool: AgentCatalogTool): string {
  if (tool.params.length === 0) return `${tool.id} — ${tool.purpose} (no params)`
  const params = tool.params
    .map((p) => {
      const req = p.required ? '*' : ''
      const values = p.enum ? `[${p.enum.join('|')}]` : p.type
      return `${p.name}${req}:${values}`
    })
    .join(', ')
  return `${tool.id} — ${tool.purpose} Params: ${params}`
}

const EXTRACTION_SYSTEM_PROMPT =
  'You extract workspace actions from a user’s message to a business advisor.\n' +
  'Output a JSON object {"actions": [...]} and nothing else.\n' +
  'Each action: {"toolId": <id from the catalog>, "summary": {"en": "…", "fr": "…"}, "params": {…}}.\n\n' +
  'Rules:\n' +
  '- Only use toolIds from the catalog below. Never invent one.\n' +
  '- Params marked * are required — do not emit the action without them.\n' +
  '- Only include params the catalog declares; enum values exactly as listed; dates as YYYY-MM-DD.\n' +
  '- The summary is what the user sees on a confirmation card — short, concrete, in English and French.\n' +
  '- If the message asks a question or requests no workspace change, output {"actions":[]}.\n' +
  `- At most ${MAX_ACTIONS} actions.\n\n` +
  'Catalog:\n' +
  AGENT_TOOLS.map(paramLine).join('\n')

export function buildExtractionMessages(
  userMessage: string,
  history: ExtractionMessage[],
): ExtractionMessage[] {
  /* Recent turns give "yes, log it" its antecedent — capped so the
     extraction prompt stays small. */
  return [
    { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
    ...history.slice(-HISTORY_TAIL),
    { role: 'user', content: userMessage },
  ]
}

/* ── Parse + validate ───────────────────────────────────────────────────── */

function coerceValue(type: string, value: unknown): { ok: true; value: unknown } | { ok: false } {
  switch (type) {
    case 'string':
      return typeof value === 'string' && value.trim() !== ''
        ? { ok: true, value: value.trim() }
        : { ok: false }
    case 'number': {
      /* Models emit "3600" as often as 3600 — honest repair, the client
         executor still requires a strict number. */
      const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false }
    }
    case 'boolean':
      if (typeof value === 'boolean') return { ok: true, value }
      if (value === 'true') return { ok: true, value: true }
      if (value === 'false') return { ok: true, value: false }
      return { ok: false }
    case 'date':
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? { ok: true, value }
        : { ok: false }
    default:
      return { ok: false }
  }
}

/**
 * Clean one action's params against its catalog entry: strip undeclared
 * keys (the client executor would reject the whole call over them), repair
 * sloppy values where the fix is honest (numeric strings, enum case/word
 * forms), and return `null` when a *required* param is missing or
 * ill-typed — a proposal that can't execute honestly isn't proposed.
 */
function validateParams(tool: AgentCatalogTool, raw: unknown): Record<string, unknown> | null {
  const params =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const clean: Record<string, unknown> = {}
  for (const param of tool.params) {
    const value = params[param.name]
    if (value === undefined || value === null) {
      if (param.required) return null
      continue
    }
    if (param.type === 'enum') {
      if (typeof value !== 'string') {
        if (param.required) return null
        continue
      }
      /* "On hold" / "Completed" → the closed vocabulary's exact form. */
      const needle = value
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
      const match = (param.enum ?? []).find((e) => e.toLowerCase() === needle)
      if (!match) {
        if (param.required) return null
        continue
      }
      clean[param.name] = match
      continue
    }
    const coerced = coerceValue(param.type, value)
    if (!coerced.ok) {
      if (param.required) return null
      continue
    }
    clean[param.name] = coerced.value
  }
  return clean
}

function normalizeSummary(raw: unknown, tool: AgentCatalogTool): { en: string; fr: string } {
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const s = raw as Record<string, unknown>
    if (typeof s.en === 'string' && s.en.trim() !== '') {
      return {
        en: s.en.trim(),
        fr: typeof s.fr === 'string' && s.fr.trim() !== '' ? s.fr.trim() : s.en.trim(),
      }
    }
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    return { en: raw.trim(), fr: raw.trim() }
  }
  /* Fallback — the catalog's own one-liner rather than an empty card. */
  return { en: tool.purpose, fr: tool.purpose }
}

/**
 * Turn raw model output into validated drafts. Tolerates a fenced block or
 * prose wrapping the JSON; accepts {"actions":[…]} or a bare array.
 */
export function parseExtraction(raw: string): ProposedActionDraft[] {
  const unfenced = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(unfenced)
  } catch {
    const start = unfenced.indexOf('{')
    const end = unfenced.lastIndexOf('}')
    if (start === -1 || end <= start) return []
    try {
      parsed = JSON.parse(unfenced.slice(start, end + 1))
    } catch {
      return []
    }
  }
  const list = Array.isArray(parsed)
    ? parsed
    : parsed !== null && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>).actions
      : undefined
  if (!Array.isArray(list)) return []

  const out: ProposedActionDraft[] = []
  for (const item of list) {
    if (out.length >= MAX_ACTIONS) break
    if (item === null || typeof item !== 'object' || Array.isArray(item)) continue
    const { toolId, summary, params } = item as Record<string, unknown>
    if (typeof toolId !== 'string') continue
    const tool = findCatalogTool(toolId)
    if (!tool) continue
    const clean = validateParams(tool, params)
    if (!clean) continue
    out.push({ toolId, summary: normalizeSummary(summary, tool), params: clean })
  }
  return out
}

/* ── The call ───────────────────────────────────────────────────────────── */

/**
 * One isolated completion for extraction. Every failure mode — missing
 * key, upstream error, non-JSON reply — resolves to `[]`: no proposals is
 * always a safe answer. Tokens for this call are deliberately not claimed;
 * it adds ~400 max_tokens only on action-ish turns.
 */
export async function extractActions(
  provider: ExtractionProvider,
  route: ExtractionRoute,
  userMessage: string,
  history: ExtractionMessage[],
): Promise<ProposedActionDraft[]> {
  const keyResult = resolveApiKey(provider.secret_ref, (name) => Deno.env.get(name))
  if ('missingSecret' in keyResult) return []
  try {
    const upstream = await postChatCompletion(provider, keyResult.apiKey, {
      model: route.model_name,
      messages: buildExtractionMessages(userMessage, history),
      max_tokens: EXTRACTION_MAX_TOKENS,
      temperature: 0,
    })
    if (!upstream.ok) return []
    const completion = (await upstream.json()) as {
      choices?: { message?: { content?: unknown } }[]
    }
    const text = completion.choices?.[0]?.message?.content
    if (typeof text !== 'string') return []
    return parseExtraction(text)
  } catch {
    return []
  }
}
