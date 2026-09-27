/**
 * Pure helpers for the invest-ai edge function — prompt construction and
 * draft validation. Deno-free so Vitest can run them; index.ts owns auth,
 * the model route, and the network.
 *
 * The model *authors* a strategy draft — it never executes. Everything it
 * returns is re-validated server-side against the same whitelist the engine
 * enforces (parseRules drops malformed rules), the draft comes back
 * disabled for the user to review, and autonomy is pinned to 'suggest' —
 * paper-execute is a deliberate user toggle, not something a draft sets.
 */
import {
  ASSET_CLASSES,
  parseRules,
  type StrategyRule,
} from '../invest-bot/handlers.ts'

export interface StrategyDraft {
  name: string
  cadence: 'daily' | 'weekly' | 'monthly'
  asset_classes: string[]
  rules: StrategyRule[]
}

const CADENCES = ['daily', 'weekly', 'monthly']
const MAX_DRAFT_RULES = 8
const MAX_NAME = 80
const MAX_GOAL = 1200

export function sanitizeGoal(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const g = raw.trim().slice(0, MAX_GOAL)
  return g.length >= 10 ? g : null
}

export const SYSTEM_PROMPT = `You translate an investor's goal, written in plain language, into a
deterministic watch-rule strategy for a paper-trading portal. Output ONLY a
JSON object:

{"name": string, "cadence": "daily"|"weekly"|"monthly",
 "asset_classes": string[], "rules": Rule[]}

Rule: {"metric", "op": "lt"|"gt", "value": number, "kind", "title",
       optional "side": "buy"|"sell", optional "qty": number}

Allowed metrics (choose only these):
- day_change_pct  — symbol's session change in % (e.g. lt -8 = "fell 8% today")
- vs_ma50         — % distance above/below the 50-day average (lt 0 = below)
- value_floor     — position market value in account currency
- weight_pct      — position's share of the whole book in % (drift control)
- unrealized_gain_pct — position's gain vs avg cost in %
- cash_above      — total account cash (book-level; no symbol needed)

Allowed kinds: screen | insight | alert | thesis.

Constraints:
- name in the user's language, ≤ 80 chars, concrete ("TSX dip watch", not
  "Smart strategy").
- cadence: monthly accumulation → 'monthly'; rebalancing/guards → 'weekly'
  or 'daily'; fast dip-watching → 'daily'.
- rules: 1-4 rules, thresholds the user can edit later — prefer round,
  conservative numbers.
- side+qty only when the goal clearly asks for simulated orders; qty is a
  share count, keep it small.
- Never promise returns; this is a watchlist machine, not an adviser.`

export function buildDraftPrompt(goal: string, lang: 'en' | 'fr'): string {
  const langName = lang === 'fr' ? 'Canadian French' : 'English'
  return `Language for the name field: ${langName}.\n\nGoal:\n${goal}`
}

/** Model output → validated draft, or null when nothing usable came back. */
export function parseDraft(raw: string): StrategyDraft | null {
  const text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
  if (parsed === null || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>

  const name = typeof o['name'] === 'string' ? o['name'].trim().slice(0, MAX_NAME) : ''
  if (!name) return null

  const rules = parseRules(o['rules']).slice(0, MAX_DRAFT_RULES)
  if (rules.length === 0) return null

  const classes = Array.isArray(o['asset_classes'])
    ? o['asset_classes']
        .filter((c): c is string => typeof c === 'string' && ASSET_CLASSES.includes(c))
        .slice(0, ASSET_CLASSES.length)
    : []
  if (classes.length === 0) classes.push('equity')

  const cadence = typeof o['cadence'] === 'string' && CADENCES.includes(o['cadence'])
    ? (o['cadence'] as StrategyDraft['cadence'])
    : 'daily'

  return { name, cadence, asset_classes: classes, rules }
}

export type AiAction = 'draft-strategy'

export function validateAiAction(
  action: unknown,
): { ok: true; value: AiAction } | { ok: false; error: string } {
  if (action === 'draft-strategy') return { ok: true, value: action }
  return { ok: false, error: `Unknown action: ${String(action)}` }
}
