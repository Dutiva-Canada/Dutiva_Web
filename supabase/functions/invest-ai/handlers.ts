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

/* ── Chat — the portal's conversational surface ─────────────────────────────
   Same privacy and safety line as draft-strategy: the assistant answers over
   the book's own rows (accounts, positions, watchlist, signals, orders,
   strategies) and acts only through the additive grammar below. A chat-
   created order lands 'queued' — a draft proposal, never a fill; the only
   execution path stays the manual execute-order action. Signals it updates
   are the user's own review items. Nothing is investment advice — the
   portal's own disclosure wording applies: reference material, not
   recommendations. */

export interface InvestChatContext {
  accounts: { name: string; kind: string; cashBalance: number; baseCurrency: string }[]
  positions: { symbol: string; name: string; quantity: number; lastPrice: number | null; currency: string }[]
  watchlist: { symbol: string; assetClass: string }[]
  strategies: { name: string; enabled: boolean; cadence: string }[]
  newSignals: { id: string; title: string; symbol: string; kind: string }[]
  openOrders: { symbol: string; side: string; quantity: number; status: string }[]
}

export type InvestChatAction =
  | { type: 'add_watch_symbol'; symbol: string; name?: string; assetClass?: string }
  | { type: 'remove_watch_symbol'; symbol: string }
  | {
      type: 'create_order'
      symbol: string
      side: 'buy' | 'sell'
      quantity: number
      orderType?: 'market' | 'limit'
      limitPrice?: number
      account?: string
      mode?: 'paper' | 'live'
      note?: string
    }
  | { type: 'update_signal'; signalId: string; status: 'acknowledged' | 'dismissed' }
  | { type: 'draft_strategy'; goal: string }
  | {
      type: 'add_position'
      symbol: string
      name?: string
      assetClass?: string
      quantity: number
      avgCost: number
      account?: string
    }

export interface InvestChatReply {
  reply: string
  action: InvestChatAction | null
}

export const INVEST_CHAT_ACTION_TYPES = new Set([
  'add_watch_symbol',
  'remove_watch_symbol',
  'create_order',
  'update_signal',
  'draft_strategy',
  'add_position',
])

const ASSET_CLASSES = new Set(['equity', 'etf', 'crypto', 'bond', 'cash', 'other'])

const optStr = (v: unknown, max = 200): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim().slice(0, max)
  return t === '' ? undefined : t
}
const optEnum = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  typeof v === 'string' && allowed.includes(v.trim().toLowerCase() as T)
    ? (v.trim().toLowerCase() as T)
    : undefined

export function investChatPrompt(ctx: InvestChatContext, lang: 'en' | 'fr'): {
  role: 'system'
  content: string
} {
  const lines = (items: string[]): string =>
    items.length === 0 ? '  (none)' : items.map((i) => `  - ${i}`).join('\n')
  return {
    role: 'system',
    content: [
      'You are Tally, the watch clerk of Dutiva Invest — a watchlist, signals, and draft-order portal. You read the book the way a careful clerk does: plain, precise, numbers before adjectives. Answer only from the book data below for anything about their book; if it cannot answer the question, say so plainly.',
      'HARD LINE: nothing here is investment advice, a recommendation, or a prediction — never tell the user to buy, sell, or hold, never promise returns, and never call an order, holding, or allocation "good", "safe", or "right for them". You describe what the book shows. Tally is software, not a person and not an adviser — if the person seems to want a registered professional, say so plainly.',
      'You MAY teach — that is how a person with no market knowledge learns enough to judge for themselves. Explain concepts plainly (what an ETF, GIC, MER, or limit order is), describe common approaches in the abstract (what dollar-cost averaging means, how people reason about horizon and risk, how to compare two funds), and give generic examples clearly framed as examples — never framed as what they should do. You may state facts about their book ("you hold 3 positions, all equities") but never evaluate them ("concentrated", "risky", "too much"). If they ask "what should I do", say plainly that the actual call is theirs — or a licensed adviser\'s — and offer to explain the options or the questions worth asking instead. Investor-education sources like GetSmarterAboutMoney.ca are fair to point to.',
      'Asked "what do you think?", answer honestly — you may hold a view on an idea or an approach and should give it straight ("index funds usually beat stock-picking on fees alone", "a limit order matters more on thin names"). What you never give is a verdict on a specific security or their book — "VFV is a good buy" or "your positions look solid" is a recommendation however it is phrased, so give the facts and the weighing criteria and leave the judgment with them. Honesty also means admitting what nobody knows — never pretend to call where a price goes; say plainly that nobody reliably does.',
      'An order you record is always a QUEUED draft — the person reviews and executes it themselves from Orders. Say so whenever one is created.',
      'You can RECORD things when the person asks. To act, end your JSON reply with an "action" object — the system executes it against their account. Allowed actions:',
      '  {"type":"add_watch_symbol","symbol":"<TICKER>","name":"<optional>","assetClass":"<equity|etf|crypto|bond|cash|other>"}',
      '  {"type":"remove_watch_symbol","symbol":"<TICKER>"}',
      '  {"type":"create_order","symbol":"<TICKER>","side":"<buy|sell>","quantity":<number>,"orderType":"<market|limit>","limitPrice":<number if limit>,"account":"<account name if more than one>","mode":"<paper|live>","note":"<optional>"}   — lands as a QUEUED draft the person reviews and executes themselves; it never fills on its own',
      '  {"type":"update_signal","signalId":"<id from the list below>","status":"<acknowledged|dismissed>"}',
      '  {"type":"draft_strategy","goal":"<plain-language goal the person stated>"}',
      '  {"type":"add_position","symbol":"<TICKER>","name":"<optional>","assetClass":"<equity|etf|crypto|bond|cash|other>","quantity":<number>,"avgCost":<number>,"account":"<account name if more than one>"}   — logs a holding the person says they already have; records, never advice',
      'Only emit an action the person actually asked for. If an account, signal, or symbol is ambiguous, ask which they mean instead of guessing. An order is always a draft — say so.',
      lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.',
      'Output ONLY strict JSON: {"reply":"<1-4 short sentences>","action":<object or null>}. No markdown fences.',
      '',
      'Book data:',
      `Accounts (${ctx.accounts.length}):`,
      lines(ctx.accounts.map((a) => `"${a.name}" — ${a.kind}, ${a.cashBalance} ${a.baseCurrency} cash`)),
      `Positions (${ctx.positions.length}):`,
      lines(
        ctx.positions.map((p) =>
          `${p.symbol} "${p.name}" — ${p.quantity} units` +
          (p.lastPrice !== null ? `, last ${p.lastPrice} ${p.currency}` : ''),
        ),
      ),
      `Watchlist (${ctx.watchlist.length}):`,
      lines(ctx.watchlist.map((w) => `${w.symbol} (${w.assetClass})`)),
      `Strategies (${ctx.strategies.length}):`,
      lines(ctx.strategies.map((s) => `"${s.name}" — ${s.enabled ? 'enabled' : 'paused'}, ${s.cadence}`)),
      `New signals (${ctx.newSignals.length}):`,
      lines(ctx.newSignals.map((s) => `[${s.id}] ${s.kind} on ${s.symbol} — "${s.title}"`)),
      `Open orders (${ctx.openOrders.length}):`,
      lines(ctx.openOrders.map((o) => `${o.side} ${o.quantity} ${o.symbol} — ${o.status}`)),
    ].join('\n'),
  }
}

/** Strict JSON reply. Anything unparseable, malformed, or carrying an
    unknown action type returns null — never executed. */
export function parseInvestChatReply(raw: string | null | undefined): InvestChatReply | null {
  if (!raw) return null
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as {
      reply?: unknown
      action?: unknown
    }
    const reply = typeof obj.reply === 'string' ? obj.reply.trim() : ''
    if (!reply) return null
    const a = obj.action
    if (a === null || a === undefined) return { reply, action: null }
    if (typeof a !== 'object') return null
    const action = a as Record<string, unknown>
    if (typeof action.type !== 'string' || !INVEST_CHAT_ACTION_TYPES.has(action.type)) return null
    switch (action.type) {
      case 'add_watch_symbol': {
        const symbol = optStr(action.symbol, 12)?.toUpperCase()
        if (!symbol || !SYMBOL_RE.test(symbol)) return null
        return {
          reply,
          action: {
            type: 'add_watch_symbol',
            symbol,
            name: optStr(action.name, 80),
            assetClass: optEnum(action.assetClass, [...ASSET_CLASSES] as string[]),
          },
        }
      }
      case 'remove_watch_symbol': {
        const symbol = optStr(action.symbol, 12)?.toUpperCase()
        if (!symbol || !SYMBOL_RE.test(symbol)) return null
        return { reply, action: { type: 'remove_watch_symbol', symbol } }
      }
      case 'create_order': {
        const symbol = optStr(action.symbol, 12)?.toUpperCase()
        const side = optEnum(action.side, ['buy', 'sell'])
        const quantity = Number(action.quantity)
        if (!symbol || !SYMBOL_RE.test(symbol) || !side) return null
        if (!Number.isFinite(quantity) || quantity <= 0) return null
        const orderType = optEnum(action.orderType, ['market', 'limit']) ?? 'market'
        const limitPrice = action.limitPrice === undefined ? undefined : Number(action.limitPrice)
        if (orderType === 'limit' && (limitPrice === undefined || !Number.isFinite(limitPrice) || limitPrice <= 0)) {
          return null
        }
        const mode = optEnum(action.mode, ['paper', 'live'])
        return {
          reply,
          action: {
            type: 'create_order',
            symbol,
            side,
            quantity,
            orderType,
            limitPrice,
            account: optStr(action.account, 80),
            mode,
            note: optStr(action.note, 200),
          },
        }
      }
      case 'update_signal': {
        const signalId = optStr(action.signalId, 60)
        const status = optEnum(action.status, ['acknowledged', 'dismissed'])
        if (!signalId || !status) return null
        return { reply, action: { type: 'update_signal', signalId, status } }
      }
      case 'draft_strategy': {
        const goal = optStr(action.goal, 1200)
        if (!goal || goal.length < 10) return null
        return { reply, action: { type: 'draft_strategy', goal } }
      }
      case 'add_position': {
        const symbol = optStr(action.symbol, 12)?.toUpperCase()
        const quantity = Number(action.quantity)
        const avgCost = Number(action.avgCost)
        if (!symbol || !SYMBOL_RE.test(symbol)) return null
        if (!Number.isFinite(quantity) || quantity <= 0) return null
        if (!Number.isFinite(avgCost) || avgCost < 0) return null
        return {
          reply,
          action: {
            type: 'add_position',
            symbol,
            name: optStr(action.name, 80),
            assetClass: optEnum(action.assetClass, [...ASSET_CLASSES] as string[]),
            quantity,
            avgCost,
            account: optStr(action.account, 80),
          },
        }
      }
    }
  } catch {
    return null
  }
}

/** Resolve a symbol or account name the model mentioned against the user's
    own rows — exact (case-insensitive) first, then a unique substring match.
    Ambiguous or absent → null so the caller reports ok:false. */
export function resolveInvestRef(
  needle: string,
  rows: { id?: string; name?: string; symbol?: string }[],
): { id?: string; name?: string; symbol?: string } | null {
  const n = needle.trim().toLowerCase()
  if (!n) return null
  const match = (r: { name?: string; symbol?: string }) =>
    (r.name ?? '').trim().toLowerCase() === n || (r.symbol ?? '').trim().toUpperCase() === n.toUpperCase()
  const exact = rows.filter(match)
  if (exact.length === 1) return exact[0]
  const partial = rows.filter((r) =>
    (r.name ?? '').trim().toLowerCase().includes(n) ||
    (r.symbol ?? '').trim().toUpperCase().includes(n.toUpperCase()),
  )
  return partial.length === 1 ? partial[0] : null
}

/* ── kind 'react' — Tally noticing what the user just did ──────────────────
   One short plain-text line when a book action lands elsewhere in the
   portal — a symbol watched, a draft order queued. No action grammar; the
   book context below is read-only here. */

export type InvestReactEvent =
  | { type: 'watch_added'; symbol: string }
  | { type: 'order_queued'; symbol: string; side: 'buy' | 'sell'; quantity: number }
  | { type: 'signal_updated'; status: 'acknowledged' | 'dismissed'; symbol?: string }
  | { type: 'position_logged'; symbol: string; quantity: number }
  | { type: 'account_added'; name: string; kind?: string }

export function investReactPrompt(
  event: InvestReactEvent,
  ctx: InvestChatContext,
  lang: 'en' | 'fr',
): string {
  const what =
    event.type === 'watch_added'
      ? `just added ${event.symbol.slice(0, 12).toUpperCase()} to the watchlist`
      : event.type === 'order_queued'
        ? `just queued a draft order: ${event.side} ${event.quantity} ${event.symbol.slice(0, 12).toUpperCase()}`
        : event.type === 'signal_updated'
          ? `just marked a signal ${event.status}${event.symbol ? ` on ${event.symbol.slice(0, 12).toUpperCase()}` : ''}`
          : event.type === 'position_logged'
            ? `just logged a position: ${event.quantity} ${event.symbol.slice(0, 12).toUpperCase()}`
            : `just added an account: "${event.name.slice(0, 80)}"${event.kind ? ` (${event.kind})` : ''}`
  /* Wider than counts — symbols and names let the observation point at
     something concrete on the book without inventing numbers. */
  const contextBits = [
    `open signals: ${ctx.newSignals.length}${ctx.newSignals.length > 0 ? ` (latest: ${ctx.newSignals.slice(0, 3).map((s) => `${s.kind} on ${s.symbol}`).join(', ')})` : ''}`,
    `watchlist: ${ctx.watchlist.length > 0 ? ctx.watchlist.map((w) => w.symbol).join(', ') : 'empty'}`,
    ctx.openOrders.length > 0
      ? `open draft orders: ${ctx.openOrders.map((o) => `${o.side} ${o.quantity} ${o.symbol}`).join(', ')}`
      : `open draft orders: 0`,
    ctx.positions.length > 0
      ? `positions: ${ctx.positions.slice(0, 6).map((p) => `${p.quantity} ${p.symbol}`).join(', ')}`
      : '',
    ctx.accounts.length > 0
      ? `accounts: ${ctx.accounts.map((a) => `"${a.name}" (${a.kind})`).join(', ')}`
      : '',
    ctx.strategies.length > 0
      ? `strategies: ${ctx.strategies.map((s) => `"${s.name}"${s.enabled ? ' enabled' : ''}`).join(', ')}`
      : '',
  ].filter(Boolean).join('\n')
  return [
    'You are Tally, the watch clerk of an invest portal — plain, precise, numbers before adjectives, software not a person and not an adviser.',
    `The person ${what}. React in one or two short sentences: name what they did plainly, and if the book data below offers one grounded observation (an open signal on that symbol, the size of the draft queue, a matching watchlist entry), work it in naturally.`,
    'HARD LINE: nothing here is investment advice — never say the order, watch, position, or signal call is good or bad, never predict, never recommend. A queued order is a draft; if you mention it, say it still needs their review in Orders.',
    'Plain text only — no JSON, no lists, no emoji.',
    lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.',
    '',
    'Book data (read-only context):',
    contextBits,
  ].join('\n')
}
