/**
 * Pure helpers for the invest-ai edge function — prompt construction and
 * draft validation. Deno-free so Vitest can run them; index.ts owns auth,
 * the model route, and the network.
 *
 * The model *authors* a strategy draft — it never executes. Everything it
 * returns is re-validated server-side against the same whitelist the engine
 * enforces (parseRules drops malformed rules), and the draft comes back
 * disabled for the user to review and save. Order proposals a draft
 * suggests can only ever become draft orders — approval stays with the
 * user in the Orders tab.
 */
import { parseRules, type StrategyRule } from '../invest-bot/handlers.ts'

export interface StrategyDraft {
  name: string
  cadence: 'daily' | 'weekly' | 'monthly'
  scope: { watchlist: boolean; symbols: string[] }
  rules: StrategyRule[]
}

const CADENCES = ['daily', 'weekly', 'monthly']
const MAX_DRAFT_RULES = 8
const MAX_NAME = 80
const MAX_GOAL = 1200
const MAX_SCOPE_SYMBOLS = 25
const SYMBOL_RE = /^[A-Z0-9.-]{1,12}$/

export function sanitizeGoal(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const g = raw.trim().slice(0, MAX_GOAL)
  return g.length >= 10 ? g : null
}

export const SYSTEM_PROMPT = `You translate an investor's goal, written in plain language, into a
deterministic watch-rule strategy for a paper-trading portal. Output ONLY a
JSON object:

{"name": string, "cadence": "daily"|"weekly"|"monthly",
 "scope": {"watchlist": boolean, "symbols": string[]},
 "rules": Rule[]}

Rule: {"metric", "op": "lt"|"gt", "value": number, "title", "type",
       "severity"?: "insight"|"alert",
       "side"?: "buy"|"sell", "qty"?: number,
       "qty_unit"?: "shares"|"percent_of_position"|"currency"}

type is either "signal" (notify-only rule — carries severity) or
"order_proposal" (proposes a DRAFT order — carries side + qty + qty_unit).
Never mix the two: a signal rule has no side/qty; an order proposal has no
severity.

Allowed metrics (choose only these):
- day_change_pct  — symbol's session change in % (e.g. lt -8 = "fell 8% today")
- vs_ma50         — % distance above/below the 50-day average (lt 0 = below)
- value_floor     — position market value in account currency
- weight_pct      — position's share of the whole book in % (drift control)
- unrealized_gain_pct — position's gain vs avg cost in %
- cash_above      — total account cash (book-level; no symbol needed; signals
  only — an order proposal needs a symbol-level metric)

Constraints:
- name in the user's language, ≤ 80 chars, concrete ("TSX dip watch", not
  "Smart strategy").
- cadence: monthly accumulation → 'monthly'; rebalancing/guards → 'weekly'
  or 'daily'; fast dip-watching → 'daily'. day_change_pct only makes sense
  on 'daily'.
- scope: watchlist=true scans everything the user watches; symbols lists
  extra tickers the goal names explicitly. Prefer watchlist=true plus the
  named tickers.
- rules: 1-4 rules, thresholds the user can edit later — prefer round,
  conservative numbers.
- order_proposal only when the goal clearly asks for order suggestions;
  qty stays small. These become draft orders for the user to approve —
  nothing trades on its own.
- Never promise returns; this is a watchlist machine, not an adviser.`

export function buildDraftPrompt(goal: string, lang: 'en' | 'fr'): string {
  const langName = lang === 'fr' ? 'Canadian French' : 'English'
  return `Language for the name field: ${langName}.\n\nGoal:\n${goal}`
}

function parseScope(raw: unknown): StrategyDraft['scope'] {
  const o = (raw ?? {}) as Record<string, unknown>
  const symbols = Array.isArray(o['symbols'])
    ? [
        ...new Set(
          (o['symbols'] as unknown[])
            .map((s) => (typeof s === 'string' ? s.trim().toUpperCase() : ''))
            .filter((s) => SYMBOL_RE.test(s)),
        ),
      ].slice(0, MAX_SCOPE_SYMBOLS)
    : []
  return { watchlist: o['watchlist'] !== false, symbols }
}

/** Model output → validated draft, or null when nothing usable came back. */
export function parseDraft(raw: string): StrategyDraft | null {
  const text = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()
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

  const scope = parseScope(o['scope'])
  /* A draft with no scope can't be saved as-is — keep watchlist=true as the
     safe default so the user sees *something*, they still pick symbols. */
  if (!scope.watchlist && scope.symbols.length === 0) scope.watchlist = true

  const cadence =
    typeof o['cadence'] === 'string' && CADENCES.includes(o['cadence'])
      ? (o['cadence'] as StrategyDraft['cadence'])
      : 'daily'

  return { name, cadence, scope, rules }
}

export type AiAction = 'draft-strategy'

export function validateAiAction(
  action: unknown,
): { ok: true; value: AiAction } | { ok: false; error: string } {
  if (action === 'draft-strategy') return { ok: true, value: action }
  return { ok: false, error: `Unknown action: ${String(action)}` }
}
