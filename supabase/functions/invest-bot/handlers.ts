/**
 * Pure, Deno-free rules engine for the invest-bot edge function. Kept
 * separate from index.ts so it can be unit-tested under Vitest — same split
 * as candidate-ai/handlers.ts and candidate-job-agent/handlers.ts.
 *
 * The bot is deliberately deterministic: strategies are declarative rules
 * over the user's market snapshots and positions. Signal rules emit
 * signals; order-proposal rules emit DRAFT orders that sit in the Orders
 * tab until the user executes or cancels them. Nothing here ever executes
 * a trade — the only fill path is the manual `execute-order` action in
 * index.ts, and live orders are always bookkeeping a human confirms.
 */
import { convertFx, type FxTable } from './fx.ts'

export type AssetClass = 'equity' | 'etf' | 'crypto' | 'bond' | 'cash' | 'other'
export const ASSET_CLASSES: readonly AssetClass[] = [
  'equity',
  'etf',
  'crypto',
  'bond',
  'cash',
  'other',
]
export type RuleMetric =
  'day_change_pct' | 'vs_ma50' | 'price' | 'value_floor' | 'weight_pct' | 'unrealized_gain_pct' | 'cash_above'
export type RuleOp = 'lt' | 'gt' | 'between'
export type SignalKind = 'screen' | 'insight' | 'alert' | 'thesis'
export type SignalSeverity = 'insight' | 'alert'
export type OrderSide = 'buy' | 'sell'
export type QuantityUnit = 'shares' | 'percent_of_position' | 'currency'
export type RuleType = 'signal' | 'order_proposal'
export type StrategyCadence = 'daily' | 'weekly' | 'monthly'
/** How a strategy surfaces multiple rule hits in one scan — see planRun. */
export type MultiMatch = 'each' | 'summary'

interface RuleBase {
  /** Stable identity written at rule-creation time (0218) — dedupe keys and
      firing history key on this, not the title: a renamed label must not
      reset either, and two same-title rules get separate slots. Absent on
      legacy/AI-drafted rules, where the title is the identity. */
  id?: string
  metric: RuleMetric
  op: RuleOp
  value: number
  /** Second bound for 'between' — required then, ignored otherwise. */
  value2?: number
  title: string
}

/** The key a rule owns in dedupe sets and rule_hits — its id when it has
    one, else the title (legacy rows and model-drafted rules). */
export function ruleIdent(rule: RuleBase): string {
  return rule.id ?? rule.title
}

export interface SignalRule extends RuleBase {
  type: 'signal'
  severity: SignalSeverity
}

export interface OrderProposalRule extends RuleBase {
  type: 'order_proposal'
  side: OrderSide
  qty: number
  qty_unit: QuantityUnit
}

export type StrategyRule = SignalRule | OrderProposalRule

export interface Strategy {
  id: string
  /** Display name for alert emails; optional so loaders on pre-0184
      schemas (and test fixtures) still typecheck. */
  name?: string
  enabled: boolean
  /** Resolved, uppercased symbol universe — index.ts expands the stored
      scope ({watchlist, symbols}) into this list before planning. */
  scope_symbols: string[]
  rules: StrategyRule[]
  cadence: StrategyCadence
  last_evaluated_at: string | null
  /** Legacy 0180 column — strategies saved before scope existed restricted
      scans to these classes. Empty/missing means unrestricted; saves made
      through the scope UI write the full class list explicitly. */
  asset_classes?: string[]
  /** notify.email — send one summary email per scan that produced hits. */
  notify_email?: boolean
  /** notify.in_app — persist hits to the in-app signal feed. */
  notify_in_app?: boolean
  /** 0190 column — 'summary' collapses the scan's signal hits into one
      in-app signal; absent (pre-0190 schemas/fixtures) behaves as 'each'. */
  multi_match?: MultiMatch
}

export interface MarketSnapshot {
  asset_class: AssetClass
  symbol: string
  price: number
  day_change_pct: number | null
  ma50: number | null
  currency: string
  /** When the quote was marked — market-sync writes it each pass. Optional:
      test fixtures and pre-0246 callers may not carry it; absent = treated
      fresh (no evidence to judge otherwise). */
  as_of?: string
}

export interface Position {
  account_id: string
  asset_class: AssetClass
  symbol: string
  quantity: number
  avg_cost: number
  /** Currency the cost basis is held in — needed to compare avg_cost to a
      snapshot price quoted in a different currency. Optional: rows and tests
      predating the column read as same-currency as the quote. */
  currency?: string
  /** The sync's last write-back (quote currency) — the book-mark fallback
      between the live snapshot and cost basis. */
  last_price?: number | null
}

export interface NewSignal {
  strategy_id: string
  /** The firing rule's identity — persisted (0218 column) so dedupe reads
      it back on the next sweep. 'summary' on collapsed multi-match rows. */
  rule_id?: string
  asset_class: AssetClass
  symbol: string
  name: string
  kind: SignalKind
  title: string
  /** French twin of `title` — only summary-mode signals populate it; per-rule
      signals keep null because their titles are user-authored text. */
  title_fr?: string | null
  body: string
  /** French twin of `body` — same contract as title_fr. */
  body_fr?: string | null
  score: number | null
}

/** A draft order the user must approve in the Orders tab — never executed
    by the bot. `quantity` is always resolved to shares at plan time. */
export interface NewOrderProposal {
  strategy_id: string
  /** Dedupe key — an identical open draft suppresses a repeat proposal.
      Keyed on rule identity (id ?? title). */
  rule_key: string
  /** The rule's own identity — persisted (0218 column) so dedupe survives a
      label rename. */
  rule_id?: string
  asset_class: AssetClass
  symbol: string
  name: string
  side: OrderSide
  quantity: number
  requested_price: number
  note: string
}

const METRICS: readonly string[] = [
  'day_change_pct',
  'vs_ma50',
  'price',
  'value_floor',
  'weight_pct',
  'unrealized_gain_pct',
  'cash_above',
]
export const CADENCES: readonly string[] = ['daily', 'weekly', 'monthly']

/** A draft proposal's evidence is the snapshot that fired it — stale within
    days. Runs sweep drafts older than this to 'expired' (migration 0185). */
export const DRAFT_EXPIRY_DAYS = 7
export function draftExpiryCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() - DRAFT_EXPIRY_DAYS * 86_400_000).toISOString()
}
const OPS: readonly string[] = ['lt', 'gt', 'between']
const SEVERITIES: readonly string[] = ['insight', 'alert']
const SIDES: readonly string[] = ['buy', 'sell']
const QTY_UNITS: readonly string[] = ['shares', 'percent_of_position', 'currency']

/* --- Rule parsing ---------------------------------------------------------- */

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Validates the `rules` jsonb column — malformed entries drop, not throw.
 *
 * Accepts both shapes:
 *   new:    {type:'signal', severity} | {type:'order_proposal', side, qty, qty_unit}
 *   legacy: {kind, side?, qty?} — pre-0184 rows; side+qty ⇒ order_proposal
 *           (qty_unit 'shares'), otherwise a signal whose severity maps from
 *           kind ('alert' stays 'alert', everything else becomes 'insight').
 */
export function parseRules(raw: unknown): StrategyRule[] {
  if (!Array.isArray(raw)) return []
  const rules: StrategyRule[] = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const metric = o['metric']
    const op = o['op']
    const value = num(o['value'])
    const value2 = num(o['value2'])
    const title = o['title']
    if (
      typeof metric !== 'string' ||
      !METRICS.includes(metric) ||
      typeof op !== 'string' ||
      !OPS.includes(op) ||
      value === null ||
      (op === 'between' && value2 === null) ||
      typeof title !== 'string' ||
      title.trim() === ''
    ) {
      continue
    }
    const base: RuleBase = {
      ...(typeof o['id'] === 'string' && o['id'].trim() !== ''
        ? { id: o['id'].trim() }
        : {}),
      metric: metric as RuleMetric,
      op: op as RuleOp,
      value,
      ...(value2 !== null ? { value2 } : {}),
      title: title.trim(),
    }

    const legacySide = typeof o['side'] === 'string' && SIDES.includes(o['side'])
    const legacyQty = num(o['qty'])
    const isProposal =
      o['type'] === 'order_proposal' ||
      (o['type'] !== 'signal' && legacySide && legacyQty !== null && legacyQty > 0)

    if (isProposal) {
      const side = o['side']
      const qty = num(o['qty'])
      const unit =
        typeof o['qty_unit'] === 'string' && QTY_UNITS.includes(o['qty_unit'])
          ? (o['qty_unit'] as QuantityUnit)
          : 'shares'
      if (typeof side !== 'string' || !SIDES.includes(side) || qty === null || qty <= 0) continue
      rules.push({ ...base, type: 'order_proposal', side: side as OrderSide, qty, qty_unit: unit })
      continue
    }

    /* Signal rule — severity from the new field, else mapped from legacy
       kind. Signal rules carry no order fields by construction. */
    const severity: SignalSeverity =
      typeof o['severity'] === 'string' && SEVERITIES.includes(o['severity'])
        ? (o['severity'] as SignalSeverity)
        : o['kind'] === 'alert'
          ? 'alert'
          : 'insight'
    rules.push({ ...base, type: 'signal', severity })
  }
  return rules.slice(0, 20)
}

/* --- Rule evaluation ------------------------------------------------------- */

/**
 * Book-level context for portfolio metrics — computed once per run in
 * planRun. `bookValue` is the marked-to-market total, in `bookCurrency`, of
 * positions whose symbol has a snapshot *and* whose quote currency could be
 * converted — a position with no FX rate is excluded rather than blended in
 * at face value, so a CAD-denominated denominator never quietly adds USD
 * prices. `cashTotal` is the converted sum of active account balances.
 */
export interface RunContext {
  bookValue: number
  cashTotal: number
  /** Currency bookValue and cashTotal are denominated in ('CAD' by default). */
  bookCurrency?: string
  /** Convert `amount` in `currency` into bookCurrency — null when no rate
      exists. Absent in unit tests: metrics then use raw same-currency sums,
      which is correct for a single-currency fixture book. */
  toBook?: (amount: number, currency: string) => number | null
}

/** Position market value in the book currency — null when the quote
    currency can't convert. */
function positionBookValue(p: Position, snap: MarketSnapshot, ctx: RunContext): number | null {
  const raw = p.quantity * snap.price
  return ctx.toBook ? ctx.toBook(raw, snap.currency) : raw
}

/** Metrics that describe the whole book, not one symbol — evaluated once
    per strategy rather than once per snapshot. */
export const BOOK_METRICS: readonly string[] = ['cash_above']

/** Metrics tied to a single day's move — they can only fire meaningfully on
    a daily scan; on slower cadences the UI suggests Daily. */
export const DAILY_METRICS: readonly string[] = ['day_change_pct']

/** The engine's metric reader — exported for the thesis evaluator, which
    needs the observed value (not just the boolean) for its per-rule
    detail rows. */
export function metricValue(
  metric: RuleMetric,
  snap: MarketSnapshot,
  position: Position | null,
  ctx: RunContext,
): number | null {
  switch (metric) {
    case 'day_change_pct':
      return snap.day_change_pct
    case 'vs_ma50':
      if (snap.ma50 === null || snap.ma50 === 0) return null
      return ((snap.price - snap.ma50) / snap.ma50) * 100
    /* Raw last mark in the listing currency — the watchlist price alert's
       substrate. Not FX-converted: a "SHOP above 150" rule means 150 of
       the currency the symbol quotes in, same as the exchange ticket. */
    case 'price':
      return snap.price
    case 'value_floor':
      return position ? positionBookValue(position, snap, ctx) : null
    case 'weight_pct': {
      if (!position || ctx.bookValue <= 0) return null
      const v = positionBookValue(position, snap, ctx)
      return v === null ? null : (v / ctx.bookValue) * 100
    }
    case 'unrealized_gain_pct': {
      /* Compare cost and price in the book currency — a CAD-cost position
         quoted in USD must not diff raw numbers across currencies. When a
         leg can't convert the ratio has no honest answer, so return null. */
      if (!position || position.avg_cost <= 0) return null
      const costCurrency = position.currency ?? snap.currency
      const px = ctx.toBook
        ? ctx.toBook(snap.price, snap.currency)
        : snap.price
      const cost = ctx.toBook
        ? ctx.toBook(position.avg_cost, costCurrency)
        : position.avg_cost
      if (px === null || cost === null || cost === 0) return null
      return ((px - cost) / cost) * 100
    }
    case 'cash_above':
      return ctx.cashTotal
  }
}

/** Single point of truth for the op comparison — 'between' is inclusive
    and order-agnostic (bounds normalize to min/max at eval time). */
export function opMatches(rule: RuleBase, m: number): boolean {
  switch (rule.op) {
    case 'lt':
      return m < rule.value
    case 'gt':
      return m > rule.value
    case 'between': {
      if (rule.value2 === undefined) return false
      const lo = Math.min(rule.value, rule.value2)
      const hi = Math.max(rule.value, rule.value2)
      return m >= lo && m <= hi
    }
  }
}

export function ruleMatches(
  rule: RuleBase,
  snap: MarketSnapshot,
  position: Position | null,
  ctx: RunContext,
): boolean {
  const m = metricValue(rule.metric, snap, position, ctx)
  if (m === null) return false
  return opMatches(rule, m)
}

/** Resolves an order-proposal quantity to shares at the snapshot price.
    Returns null when the unit can't resolve (no position for a percent-of-
    position rule, no usable price for a currency amount). */
export function resolveQuantity(
  rule: OrderProposalRule,
  snap: MarketSnapshot,
  position: Position | null,
  ctx?: Pick<RunContext, 'toBook'>,
): number | null {
  switch (rule.qty_unit) {
    case 'shares':
      return rule.qty
    case 'currency': {
      /* rule.qty is a book-currency amount — convert the quote price into it
         rather than dividing raw USD by raw CAD. */
      const px = ctx?.toBook ? ctx.toBook(snap.price, snap.currency) : snap.price
      if (px === null || px <= 0) return null
      const shares = Math.round((rule.qty / px) * 10000) / 10000
      return shares > 0 ? shares : null /* rounds to zero — can't satisfy a positive-qty insert */
    }
    case 'percent_of_position': {
      if (!position || position.quantity <= 0) return null
      const shares = Math.round(((position.quantity * rule.qty) / 100) * 10000) / 10000
      return shares > 0 ? shares : null
    }
  }
}

/* --- Cadence ----------------------------------------------------------------- */

/** Cadence windows in days. Daily is a real window — the sweep fires
    twice per weekday (morning + midday), so an unguarded 'daily' would
    evaluate twice a day. A never-run strategy is always due. */
const CADENCE_DAYS: Record<StrategyCadence, number> = { daily: 1, weekly: 7, monthly: 30 }

export function strategyDue(
  strategy: Pick<Strategy, 'cadence' | 'last_evaluated_at'>,
  now: Date,
): boolean {
  if (!strategy.last_evaluated_at) return true
  const last = new Date(strategy.last_evaluated_at).getTime()
  if (!Number.isFinite(last)) return true
  return now.getTime() - last >= CADENCE_DAYS[strategy.cadence] * 24 * 60 * 60 * 1000
}

/* --- Snapshot freshness --------------------------------------------------------

   Market-sync only writes in market sessions (Mon–Fri 13:00–22:00 UTC), so
   a mark's wall-clock age can't tell a dead sync from a weekend — Friday's
   close is still the freshest quote on Monday morning. Count closed market
   sessions since the mark instead. A stale mark still prices the book
   denominator (an old mark beats dropping the leg) but never fires a rule
   or moves a thesis. */

/** Market sessions (Mon–Fri 13:00–22:00 UTC) that fully closed after
    `asOfMs`, looking back from `nowMs`. A session containing asOf is not
    missed — the mark was refreshed inside it. Lookback caps at 14 days:
    older marks have simply missed them all. */
export function marketSessionsMissed(asOfMs: number, nowMs: number): number {
  let missed = 0
  const day = new Date(nowMs)
  day.setUTCHours(0, 0, 0, 0)
  for (let i = 0; i < 14; i++) {
    const dow = day.getUTCDay()
    if (dow >= 1 && dow <= 5) {
      const open = day.getTime() + 13 * 3_600_000
      const close = day.getTime() + 22 * 3_600_000
      if (close <= nowMs && open > asOfMs) missed += 1
    }
    day.setUTCDate(day.getUTCDate() - 1)
    if (day.getTime() + 22 * 3_600_000 <= asOfMs) break
  }
  return missed
}

/** Sessions a mark may miss before rules stop trusting it. One missed
    session is a single bad sync window; two means the mark predates two
    closed sessions — alerting off it would present stale prices as live. */
export const SNAPSHOT_STALE_SESSIONS = 2

export function snapshotStale(snap: MarketSnapshot, nowMs: number): boolean {
  if (!snap.as_of) return false
  const t = Date.parse(snap.as_of)
  if (!Number.isFinite(t)) return false
  return marketSessionsMissed(t, nowMs) >= SNAPSHOT_STALE_SESSIONS
}

/* --- Signal dedupe ------------------------------------------------------------

   Whether a stored row still suppresses a repeat, shared between the
   scheduler's dedupe read and tests. */

export const DEDUPE_WINDOW_MS = 7 * 86_400_000
/** A dismissed signal re-arms after this window: the user said "seen it",
    so resurfacing the identical hit next sweep is noise — but a still-true
    condition stays worth reporting once the quiet period ends. */
export const DISMISS_REARM_MS = DEDUPE_WINDOW_MS

export function dedupeRowActive(
  s: {
    status?: string
    in_feed?: boolean
    created_at?: string
    dismissed_at?: string | null
  },
  nowMs: number,
): boolean {
  if (s.status === 'dismissed') {
    const t = s.dismissed_at ? Date.parse(s.dismissed_at) : NaN
    return Number.isFinite(t) && nowMs - t < DISMISS_REARM_MS
  }
  /* 'new' and 'acknowledged' both suppress a refire — acknowledged means
     "still open"; only 'dismissed' frees the key. Hidden rows can never be
     dismissed, so they'd lock the key forever — they only suppress for
     DEDUPE_WINDOW before re-arming. */
  return (
    s.in_feed !== false ||
    !s.created_at ||
    nowMs - Date.parse(s.created_at) < DEDUPE_WINDOW_MS
  )
}

/* --- Run planning ------------------------------------------------------------ */

/** One rule×symbol evaluation that came out true — the per-rule result
    rows a test scan reports. `symbol` is '' for book-level metrics. */
export interface RuleMatch {
  /** Position of the rule in the strategy's rules array (list order — the
      engine evaluates every rule; order is display order, not priority). */
  ruleIndex: number
  ruleTitle: string
  symbol: string
  /** The evaluated metric reading that crossed the threshold. */
  metricValue: number
  /** Set when dedupe covered this hit — an open signal/draft already owns
      the key, so a real run would not re-emit it (test scans only). */
  suppressed?: boolean
  outcome:
    | { kind: 'signal'; severity: SignalSeverity }
    | { kind: 'order'; side: OrderSide; quantity: number | null }
}

export interface RunPlan {
  signals: NewSignal[]
  proposals: NewOrderProposal[]
  /** Distinct symbols that were actually scanned (scope ∩ snapshots). */
  symbolsScanned: string[]
  /** Rule title → number of matches across all strategies, counted before dedupe. */
  ruleHits: Record<string, number>
  /** Per-rule match detail — populated only when opts.collectMatches is
      set (the test-scan dry run); runs leave it empty to keep run memory
      proportional to output. */
  matches: RuleMatch[]
  /** Per-strategy diagnostics — run history is recorded per strategy so
      rules sharing a title never mix across strategies. */
  perStrategy: {
    strategyId: string
    ruleHits: Record<string, number>
    symbolsScanned: string[]
    signals: number
    proposals: number
    /** Wall time of this strategy's evaluation — the run row reports its own
        duration, not the whole sweep's. */
    durationMs: number
  }[]
  /** Explanations for anything skipped (e.g. unresolvable quantity). */
  warnings: string[]
  /** Structured twins of `warnings` — stable codes + params so the client
      can localize; the raw strings stay for logs and older consumers. */
  warningDetails: { code: string; params: Record<string, string> }[]
  /** Strategies actually evaluated this run — past the enabled/rules/
      cadence gates, whether or not anything matched. */
  evaluated: number
}

/**
 * Evaluate every strategy due this run against the snapshots. `existingKeys`
 * dedupes signals — a strategy won't re-emit a signal with the same (kind,
 * symbol, title) while an identical `new` signal is still open. `openDraftKeys`
 * does the same for order proposals: a proposal is never re-created while an
 * identical draft order is still awaiting approval.
 *
 * `opts.force` bypasses cadence gating — manual "Scan now" runs always
 * evaluate; only the scheduled sweep respects the cadence window.
 */
export function planRun(
  strategies: Strategy[],
  snapshots: MarketSnapshot[],
  positions: Position[],
  existingKeys: ReadonlySet<string>,
  opts: {
    cashTotal?: number
    /** ECB rates — when absent, only same-currency positions price into
        bookValue; foreign-currency rows drop out with a warning instead of
        being summed as if currencies were interchangeable. */
    fx?: FxTable | null
    /** Currency bookValue/cashTotal are denominated in — 'CAD' default. */
    bookCurrency?: string
    now?: Date
    force?: boolean
    openDraftKeys?: ReadonlySet<string>
    /** Collect per-rule match detail for the dry-run diagnostic surface
        (test-scan). Off by default — scheduled runs don't need it. */
    collectMatches?: boolean
  } = {},
): RunPlan {
  const plan: RunPlan = {
    signals: [],
    proposals: [],
    symbolsScanned: [],
    ruleHits: {},
    matches: [],
    perStrategy: [],
    warnings: [],
    warningDetails: [],
    evaluated: 0,
  }
  const collect = opts.collectMatches === true
  const now = opts.now ?? new Date()
  /* Working copy of the persisted dedupe set — newly emitted keys join it
     within this run so two identical hits in one sweep can't double-emit. */
  const dedupeKeys = new Set(existingKeys)
  const openDraftKeys = new Set(opts.openDraftKeys ?? [])
  const positionBySymbol = new Map<string, Position>()
  const snapBySymbol = new Map<string, MarketSnapshot>()
  for (const p of positions) positionBySymbol.set(`${p.asset_class}:${p.symbol}`, p)
  for (const s of snapshots) snapBySymbol.set(`${s.asset_class}:${s.symbol}`, s)

  const bookCurrency = (opts.bookCurrency ?? 'CAD').toUpperCase()
  const toBook = (amount: number, currency: string): number | null =>
    convertFx(amount, currency, bookCurrency, opts.fx ?? null)

  /* Warning strings + their structured twins are pushed together — the
     client localizes from code/params, logs keep the raw English. */
  const warn = (code: string, params: Record<string, string>, message: string) => {
    plan.warnings.push(message)
    plan.warningDetails.push({ code, params })
  }

  /* Marked-to-market book value in the book currency — the denominator for
     weight_pct. Only positions the book can price count, and only when the
     quote currency converts: summing raw prices across CAD and USD books
     overstated foreign positions by ~40% and corrupted every weight. The
     mark chain matches thesisBookContext and the track-record writer —
     snapshot → last mirrored price → cost basis — so a feed gap shrinks
     a leg's accuracy without vanishing it from every weight. Cash counts
     toward the book — "portfolio weight" reads as share of everything
     held, not just the invested slice. */
  let bookValue = 0
  const unconvertible = new Set<string>()
  const fellBack = new Set<string>()
  const unpriced = new Set<string>()
  for (const p of positions) {
    const snap = snapBySymbol.get(`${p.asset_class}:${p.symbol}`)
    const px = snap?.price ?? p.last_price ?? (p.avg_cost > 0 ? p.avg_cost : null)
    /* last_price is a quote-currency mark; with no snapshot the position's
       own currency is the nearest honest guess for it. */
    const ccy = snap?.currency ?? p.currency ?? bookCurrency
    if (px === null) {
      unpriced.add(p.symbol.toUpperCase())
      continue
    }
    if (!snap) fellBack.add(p.symbol.toUpperCase())
    const v = toBook(p.quantity * px, ccy)
    if (v === null) {
      unconvertible.add(ccy.toUpperCase())
      continue
    }
    bookValue += v
  }
  const cashTotal = opts.cashTotal ?? 0
  if (unconvertible.size > 0) {
    warn(
      'fx_missing',
      { currencies: [...unconvertible].sort().join(', ') },
      `positions quoted in ${[...unconvertible].sort().join(', ')} skipped — no FX rate; their value-based rules did not run`,
    )
  }
  if (fellBack.size > 0) {
    warn(
      'no_snapshot',
      { symbols: [...fellBack].sort().join(', ') },
      `positions without live price data — ${[...fellBack].sort().join(', ')}; their price rules did not run and weights value them at last marks`,
    )
  }
  if (unpriced.size > 0) {
    warn(
      'no_mark',
      { symbols: [...unpriced].sort().join(', ') },
      `positions with no price data at all — ${[...unpriced].sort().join(', ')}; their rules did not run and weights exclude them`,
    )
  }
  const ctx: RunContext = {
    bookValue: bookValue + cashTotal,
    cashTotal,
    bookCurrency,
    toBook,
  }

  /* Stale marks — a snapshot that missed ≥SNAPSHOT_STALE_SESSIONS closed
     sessions still priced the denominator above but never fires a rule:
     an alert off a dead feed would read as live. Only in-scope staleness
     is warned on — a stale symbol no strategy watches changed nothing. */
  const staleMarks = new Set<string>()
  for (const snap of snapshots) {
    if (snapshotStale(snap, now.getTime())) {
      staleMarks.add(`${snap.asset_class}:${snap.symbol}`)
    }
  }
  const staleWarned = new Set<string>()

  const scanned = new Set<string>()
  const hit = (diag: RunPlan['perStrategy'][number], rule: RuleBase, n = 1) => {
    const ident = ruleIdent(rule)
    plan.ruleHits[ident] = (plan.ruleHits[ident] ?? 0) + n
    diag.ruleHits[ident] = (diag.ruleHits[ident] ?? 0) + n
  }

  for (const strategy of strategies) {
    if (!strategy.enabled || strategy.rules.length === 0) continue
    if (!opts.force && !strategyDue(strategy, now)) continue
    plan.evaluated += 1
    const stratStart = Date.now()
    const diag: RunPlan['perStrategy'][number] = {
      strategyId: strategy.id,
      ruleHits: {},
      symbolsScanned: [],
      signals: 0,
      proposals: 0,
      durationMs: 0,
    }
    plan.perStrategy.push(diag)
    const scope = new Set(strategy.scope_symbols.map((s) => s.toUpperCase()))
    /* Pre-0184 strategies restricted scans by asset class; the scope
       backfill widened them to every watched/held symbol. Honor the legacy
       restriction so an equity-only strategy never fires on crypto. */
    const classes = new Set(strategy.asset_classes ?? [])
    const summaryMode = strategy.multi_match === 'summary'
    /* 'One summary' holds the scan's signal hits for a single feed row
       emitted after the loops. Order proposals never join it — each draft
       needs its own approval, so merging them would hide a proposal. */
    const summaryHits: { rule: SignalRule; snap: MarketSnapshot; position: Position | null }[] = []
    /* Rules keep their array index so match rows can point back to the
       rule in the strategy's list order. */
    const symbolRules = strategy.rules
      .map((rule, i) => [i, rule] as const)
      .filter(([, r]) => !BOOK_METRICS.includes(r.metric))
    const bookRules = strategy.rules
      .map((rule, i) => [i, rule] as const)
      .filter(([, r]) => BOOK_METRICS.includes(r.metric))

    for (const snap of snapshots) {
      if (!scope.has(snap.symbol.toUpperCase())) continue
      if (classes.size > 0 && !classes.has(snap.asset_class)) continue
      if (staleMarks.has(`${snap.asset_class}:${snap.symbol}`)) {
        staleWarned.add(snap.symbol.toUpperCase())
        continue
      }
      /* "Symbols scanned" counts symbols fed through an actual rule — a
         book-only strategy scans nothing no matter how wide its scope. */
      if (symbolRules.length > 0) {
        scanned.add(snap.symbol.toUpperCase())
        diag.symbolsScanned.push(snap.symbol.toUpperCase())
      }
      const position = positionBySymbol.get(`${snap.asset_class}:${snap.symbol}`) ?? null
      for (const [ruleIndex, rule] of symbolRules) {
        const m = metricValue(rule.metric, snap, position, ctx)
        if (m === null || !opMatches(rule, m)) continue
        hit(diag, rule)

        if (rule.type === 'signal') {
          /* Dedupe keys on rule identity; the title-keyed check keeps
             pre-0218 open rows (which carry no rule_id) suppressing until
             they clear. */
          const ident = ruleIdent(rule)
          const idKey = `${strategy.id}:${snap.symbol}:${rule.severity}:${ident}`
          const titleKey = `${strategy.id}:${snap.symbol}:${rule.severity}:${rule.title}`
          const suppressed = dedupeKeys.has(idKey) || dedupeKeys.has(titleKey)
          if (collect) {
            plan.matches.push({
              ruleIndex,
              ruleTitle: rule.title,
              symbol: snap.symbol,
              metricValue: m,
              suppressed: suppressed || undefined,
              outcome: { kind: 'signal', severity: rule.severity },
            })
          }
          if (summaryMode) {
            summaryHits.push({ rule, snap, position })
            continue
          }
          if (suppressed) continue
          dedupeKeys.add(idKey)
          plan.signals.push({
            strategy_id: strategy.id,
            rule_id: ident,
            asset_class: snap.asset_class,
            symbol: snap.symbol,
            name: snap.symbol,
            kind: rule.severity,
            title: rule.title,
            body: buildSignalBody(rule, snap, position, ctx),
            score: scoreFor(rule, snap, position, ctx),
          })
          diag.signals += 1
          continue
        }

        /* order_proposal — resolve quantity, dedupe against open drafts
           (including drafts planned earlier in this same run), and only
           ever PLAN a draft; execution stays with the user. Keys ride rule
           identity — a title rename re-arms nothing, and two same-title
           rules each keep their own draft slot. */
        let qty = resolveQuantity(rule, snap, position, ctx)
        /* A sell can never promise more than the book holds — applyFill
           would floor the fill at zero and the draft would overstate what
           it can do. Nothing held → no proposal; oversized units clamp to
           the held quantity (a ">100% of position" sell just means out). */
        let sellClamp = false
        if (rule.side === 'sell' && qty !== null) {
          const held = position?.quantity ?? 0
          if (held <= 0) qty = null
          else if (qty > held) {
            qty = held
            sellClamp = true
          }
        }
        const ident = ruleIdent(rule)
        const idKey = `${strategy.id}:${snap.symbol}:${ident}`
        const titleKey = `${strategy.id}:${snap.symbol}:${rule.title}`
        const suppressed = openDraftKeys.has(idKey) || openDraftKeys.has(titleKey)
        if (collect) {
          plan.matches.push({
            ruleIndex,
            ruleTitle: rule.title,
            symbol: snap.symbol,
            metricValue: m,
            suppressed: suppressed || undefined,
            outcome: { kind: 'order', side: rule.side, quantity: qty },
          })
        }
        if (qty === null) {
          /* Sell with nothing held reads differently from a unit that
             couldn't resolve — don't let one warn as the other. */
          const nothingHeld = rule.side === 'sell' && (position?.quantity ?? 0) <= 0
          warn(
            nothingHeld ? 'sell_nothing_held' : 'qty_unresolvable',
            { title: rule.title, symbol: snap.symbol, unit: rule.qty_unit },
            nothingHeld
              ? `${rule.title}: sell rule fired for ${snap.symbol} but nothing is held`
              : `${rule.title}: quantity not resolvable for ${snap.symbol} (${rule.qty_unit})`,
          )
          continue
        }
        if (sellClamp) {
          warn(
            'qty_clamped',
            { title: rule.title, symbol: snap.symbol, qty: String(qty) },
            `${rule.title}: sell clamped to ${qty} ${snap.symbol} — the rule sized past the position`,
          )
        }
        if (suppressed) continue
        openDraftKeys.add(idKey)
        plan.proposals.push({
          strategy_id: strategy.id,
          rule_key: idKey,
          rule_id: ident,
          asset_class: snap.asset_class,
          symbol: snap.symbol,
          name: snap.symbol,
          side: rule.side,
          quantity: qty,
          requested_price: snap.price,
          note: `Order proposal — ${rule.title}`,
        })
        diag.proposals += 1
      }
    }

    /* Book-level rules (cash_above) fire once per strategy — no symbol, so
       they can only ever produce signals, never order proposals. */
    for (const [ruleIndex, rule] of bookRules) {
      const m = metricValue(rule.metric, EMPTY_SNAP, null, ctx)
      if (m === null) continue
      if (!opMatches(rule, m)) continue
      hit(diag, rule)
      const ident = ruleIdent(rule)
      const suppressed =
        rule.type === 'signal' &&
        (dedupeKeys.has(`${strategy.id}::${rule.severity}:${ident}`) ||
          dedupeKeys.has(`${strategy.id}::${rule.severity}:${rule.title}`))
      if (collect) {
        plan.matches.push({
          ruleIndex,
          ruleTitle: rule.title,
          symbol: '',
          metricValue: m,
          suppressed: suppressed || undefined,
          outcome:
            rule.type === 'order_proposal'
              ? { kind: 'order', side: rule.side, quantity: null }
              : { kind: 'signal', severity: rule.severity },
        })
      }
      if (rule.type === 'order_proposal') {
        warn(
          'book_metric_proposal',
          { title: rule.title },
          `${rule.title}: order proposals need a symbol-level metric`,
        )
        continue
      }
      if (summaryMode) {
        summaryHits.push({ rule, snap: EMPTY_SNAP, position: null })
        continue
      }
      if (suppressed) continue
      dedupeKeys.add(`${strategy.id}::${rule.severity}:${ident}`)
      /* Engine-authored body — carries both languages; the title stays the
         user's own label (untranslated by design). */
      const cashFmt = new Intl.NumberFormat('en-CA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(ctx.cashTotal)
      const cashFmtFr = new Intl.NumberFormat('fr-CA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(ctx.cashTotal)
      plan.signals.push({
        strategy_id: strategy.id,
        rule_id: ident,
        asset_class: 'cash',
        symbol: '',
        name: '',
        kind: rule.severity,
        title: rule.title,
        body: `cash total across accounts: ${cashFmt} ${ctx.bookCurrency}`,
        body_fr: `liquidités totales des comptes : ${cashFmtFr} ${ctx.bookCurrency}`,
        score: scoreFor(rule, EMPTY_SNAP, null, ctx),
      })
      diag.signals += 1
    }

    /* Summary mode emits one feed row per scan that matched anything —
       kind follows the strongest hit, the body lists each matched rule.
       Bilingual titles because the row is engine-authored chrome, not
       user text. Dedupe on (strategy, kind, title) keeps an unread
       summary from restacking identical repeats. */
    if (summaryHits.length > 0) {
      const anyAlert = summaryHits.some((h) => h.rule.severity === 'alert')
      const n = summaryHits.length
      const title = n === 1 ? '1 rule matched' : `${n} rules matched`
      /* The dedupe key is constant ('summary') — the old key embedded the
         match count in the title, so "2 rules matched" and "3 rules
         matched" stacked as separate open signals every sweep. */
      const key = `${strategy.id}::${anyAlert ? 'alert' : 'insight'}:summary`
      if (!dedupeKeys.has(key)) {
        dedupeKeys.add(key)
        const lines = summaryHits.map((h) =>
          h.snap.symbol ? `${h.snap.symbol} — ${h.rule.title}` : h.rule.title,
        )
        plan.signals.push({
          strategy_id: strategy.id,
          rule_id: 'summary',
          asset_class: 'other',
          symbol: '',
          name: strategy.name ?? '',
          kind: anyAlert ? 'alert' : 'insight',
          title,
          title_fr: n <= 1 ? '1 règle déclenchée' : `${n} règles déclenchées`,
          body: lines.join('\n'),
          score: null,
        })
        diag.signals += 1
      }
    }
    diag.durationMs = Date.now() - stratStart
  }
  if (staleWarned.size > 0) {
    warn(
      'snapshot_stale',
      { symbols: [...staleWarned].sort().join(', ') },
      `price data for ${[...staleWarned].sort().join(', ')} missed ${SNAPSHOT_STALE_SESSIONS}+ market sessions — their rules did not run`,
    )
  }
  plan.symbolsScanned = [...scanned].sort()
  return plan
}

const EMPTY_SNAP: MarketSnapshot = {
  asset_class: 'cash',
  symbol: '',
  price: 0,
  day_change_pct: null,
  ma50: null,
  currency: '',
}

export function signalKey(s: {
  strategy_id: string | null
  symbol: string
  kind: string
  title: string
  /** 0218 column — present on new rows; absent → the title is the key. */
  rule_id?: string | null
}): string {
  return `${s.strategy_id}:${s.symbol}:${s.kind}:${s.rule_id ?? s.title}`
}

/** Dedupe key for a stored draft order row — matches planRun's rule_key.
    New rows carry rule_id; older ones derive the title from the note. */
export function draftKey(o: {
  strategy_id: string | null
  symbol: string
  note: string | null
  rule_id?: string | null
}): string {
  const title = (o.note ?? '').replace(/^Order proposal — /, '')
  return `${o.strategy_id}:${o.symbol}:${o.rule_id ?? title}`
}

function buildSignalBody(
  rule: RuleBase,
  snap: MarketSnapshot,
  position: Position | null,
  ctx: RunContext,
): string {
  const parts = [
    `${snap.symbol} — ${snap.price.toFixed(2)} ${snap.currency}`,
    rule.metric === 'day_change_pct' && snap.day_change_pct !== null
      ? `day change ${snap.day_change_pct.toFixed(2)}%`
      : null,
    rule.metric === 'vs_ma50' && snap.ma50 !== null
      ? `vs 50-day avg ${snap.ma50.toFixed(2)}`
      : null,
    position
      ? `held: ${position.quantity} @ ${position.avg_cost.toFixed(2)} ${position.currency ?? snap.currency}`
      : null,
    rule.metric === 'weight_pct' && position && ctx.bookValue > 0
      ? (() => {
          const v = positionBookValue(position, snap, ctx)
          return v === null ? null : `weight ${((v / ctx.bookValue) * 100).toFixed(1)}%`
        })()
      : null,
    /* Same FX-aware math the firing decision used — raw quote minus raw
       cost would mix currencies in the display (a USD quote against a CAD
       cost once read -100% while the rule fired at a real gain). */
    rule.metric === 'unrealized_gain_pct' && position && position.avg_cost > 0
      ? (() => {
          const u = metricValue('unrealized_gain_pct', snap, position, ctx)
          return u === null ? null : `unrealized ${u.toFixed(1)}%`
        })()
      : null,
  ]
  return parts.filter(Boolean).join(' · ')
}

/** Heuristic 0-100: distance past the threshold, saturating at 100. */
function scoreFor(
  rule: RuleBase,
  snap: MarketSnapshot,
  position: Position | null,
  ctx: RunContext,
): number | null {
  const m = metricValue(rule.metric, snap, position, ctx)
  if (m === null || rule.value === 0) return null
  const distance = Math.abs(m - rule.value) / Math.max(Math.abs(rule.value), 1)
  return Math.round(Math.min(100, 50 + distance * 50) * 10) / 10
}

/* --- Paper execution ------------------------------------------------------- */

export interface PositionFill {
  quantity: number
  avg_cost: number
}

/** Average-cost math for a fill — used only by the manual execute-order
    path; the bot itself never fills anything. */
export function applyFill(
  position: Position | null,
  side: OrderSide,
  qty: number,
  price: number,
): PositionFill {
  const held = position?.quantity ?? 0
  const cost = position?.avg_cost ?? 0
  if (side === 'buy') {
    const total = held * cost + qty * price
    const newQty = held + qty
    return { quantity: newQty, avg_cost: newQty > 0 ? total / newQty : 0 }
  }
  /* sell — quantity floors at zero; avg cost unchanged for the remainder */
  return { quantity: Math.max(0, held - qty), avg_cost: cost }
}

/* --- Request validation ------------------------------------------------------ */

export type BotAction = 'run' | 'run-all' | 'execute-order' | 'import-fill' | 'test-scan'

export function validateBotAction(
  action: unknown,
): { ok: true; value: BotAction } | { ok: false; error: string } {
  if (
    action === 'run' ||
    action === 'run-all' ||
    action === 'execute-order' ||
    action === 'import-fill' ||
    action === 'test-scan'
  ) {
    return { ok: true, value: action }
  }
  return { ok: false, error: `Unknown action: ${String(action)}` }
}

/* --- Email summaries --------------------------------------------------------- */

export interface SignalEmailSummary {
  strategyName: string
  /** Human-readable signal lines, e.g. "SHOP fell 6% in a day (SHOP)". */
  signals: string[]
  /** Human-readable proposal lines, e.g. "buy 10 SHOP". */
  proposals: string[]
  /** Portal URL the review link points at (…/invest). */
  portalUrl: string
}

/** Bilingual plain-text summary for a scan that produced hits. One email per
    strategy per run — never per hit. Proposals are labelled drafts so the
    email can't read as a trade confirmation. */
export function buildSignalEmail(s: SignalEmailSummary): { subject: string; text: string } {
  const total = s.signals.length + s.proposals.length
  const lines = (items: string[]) => items.map((i) => `— ${i}`).join('\n')
  const en = [
    `"${s.strategyName}" produced ${total} hit(s) in its latest scan.`,
    '',
    ...(s.signals.length > 0 ? ['Signals', lines(s.signals), ''] : []),
    ...(s.proposals.length > 0
      ? [
          'Order proposals — drafts only; nothing executes without your approval.',
          lines(s.proposals),
          '',
        ]
      : []),
    `Review: ${s.portalUrl}`,
    'You’re receiving this because email alerts are on for this strategy.',
  ].join('\n')
  const fr = [
    `« ${s.strategyName} » a produit ${total} déclenchement(s) dans sa dernière analyse.`,
    '',
    ...(s.signals.length > 0 ? ['Signaux', lines(s.signals), ''] : []),
    ...(s.proposals.length > 0
      ? [
          'Propositions d’ordre — brouillons seulement; rien ne s’exécute sans votre approbation.',
          lines(s.proposals),
          '',
        ]
      : []),
    `Révision : ${s.portalUrl}`,
    'Vous recevez ce courriel parce que les alertes par courriel sont activées pour cette stratégie.',
  ].join('\n')
  return {
    subject: `Dutiva Invest — ${s.strategyName}`,
    text: `${en}\n\n—\n\n${fr}`,
  }
}

/** True when a buffered digest should flush now: something is pending and
    a full cadence window has elapsed since the last send (or no send is on
    record at all — an unparseable/absent timestamp counts as due). */
export function digestFlushDue(
  cadence: 'daily' | 'weekly',
  pendingCount: number,
  lastSentIso: string | null | undefined,
  now = Date.now(),
): boolean {
  if (pendingCount <= 0) return false
  const lastSent = lastSentIso ? Date.parse(lastSentIso) : NaN
  const windowMs = cadence === 'daily' ? 86_400_000 : 7 * 86_400_000
  return !Number.isFinite(lastSent) || now - lastSent >= windowMs
}

/** The consolidated digest for daily/weekly cadences — one email covering
    every strategy's buffered hits since the last send. Same bilingual
    shape as the per-scan summary, same drafts-not-trades wording. */
export function buildDigestEmail(d: {
  items: { name: string; signals: string[]; proposals: string[] }[]
  portalUrl: string
  cadence: 'daily' | 'weekly'
}): { subject: string; text: string } {
  const total = d.items.reduce((n, i) => n + i.signals.length + i.proposals.length, 0)
  const hasProposals = d.items.some((i) => i.proposals.length > 0)
  const blocks = d.items
    .map(
      (i) =>
        `${i.name} — ${i.signals.length + i.proposals.length} hit(s)\n` +
        [...i.signals, ...i.proposals.map((p) => `${p} (draft)`)].map((l) => `— ${l}`).join('\n'),
    )
    .join('\n\n')
  const en = [
    `Your strategies produced ${total} hit(s) since the last ${d.cadence} digest.`,
    '',
    blocks,
    '',
    ...(hasProposals
      ? [
          'Order proposals are drafts only — nothing executes without your approval.',
          '',
        ]
      : []),
    `Review: ${d.portalUrl}`,
    'You’re receiving this digest because you picked digest email alerts in Settings.',
  ].join('\n')
  const fr = [
    `Vos stratégies ont produit ${total} déclenchement(s) depuis le dernier sommaire ${d.cadence === 'daily' ? 'quotidien' : 'hebdomadaire'}.`,
    '',
    blocks,
    '',
    ...(hasProposals
      ? [
          'Les propositions d’ordre sont des brouillons — rien ne s’exécute sans votre approbation.',
          '',
        ]
      : []),
    `Révision : ${d.portalUrl}`,
    'Vous recevez ce sommaire parce que vous avez choisi les alertes par courriel groupées dans les paramètres.',
  ].join('\n')
  return {
    subject: `Dutiva Invest — ${d.cadence === 'daily' ? 'daily' : 'weekly'} digest`,
    text: `${en}\n\n—\n\n${fr}`,
  }
}
