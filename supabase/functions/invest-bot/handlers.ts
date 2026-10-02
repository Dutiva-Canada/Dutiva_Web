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

export type AssetClass = 'equity' | 'etf' | 'crypto' | 'bond' | 'cash' | 'other'
export type RuleMetric =
  'day_change_pct' | 'vs_ma50' | 'value_floor' | 'weight_pct' | 'unrealized_gain_pct' | 'cash_above'
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
  metric: RuleMetric
  op: RuleOp
  value: number
  /** Second bound for 'between' — required then, ignored otherwise. */
  value2?: number
  title: string
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
}

export interface Position {
  account_id: string
  asset_class: AssetClass
  symbol: string
  quantity: number
  avg_cost: number
}

export interface NewSignal {
  strategy_id: string
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
  /** Dedupe key — an identical open draft suppresses a repeat proposal. */
  rule_key: string
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
 * planRun. `bookValue` is the marked-to-market total of positions whose
 * symbol has a snapshot; `cashTotal` is the sum of active account balances.
 */
export interface RunContext {
  bookValue: number
  cashTotal: number
}

/** Metrics that describe the whole book, not one symbol — evaluated once
    per strategy rather than once per snapshot. */
export const BOOK_METRICS: readonly string[] = ['cash_above']

/** Metrics tied to a single day's move — they can only fire meaningfully on
    a daily scan; on slower cadences the UI suggests Daily. */
export const DAILY_METRICS: readonly string[] = ['day_change_pct']

function metricValue(
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
    case 'value_floor':
      return position ? position.quantity * snap.price : null
    case 'weight_pct':
      if (!position || ctx.bookValue <= 0) return null
      return ((position.quantity * snap.price) / ctx.bookValue) * 100
    case 'unrealized_gain_pct':
      if (!position || position.avg_cost <= 0) return null
      return ((snap.price - position.avg_cost) / position.avg_cost) * 100
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
): number | null {
  switch (rule.qty_unit) {
    case 'shares':
      return rule.qty
    case 'currency': {
      if (snap.price <= 0) return null
      const shares = Math.round((rule.qty / snap.price) * 10000) / 10000
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

/** Long-horizon strategies stay quiet between windows: weekly = 7d,
    monthly = 30d. A never-run strategy is always due. */
export function strategyDue(
  strategy: Pick<Strategy, 'cadence' | 'last_evaluated_at'>,
  now: Date,
): boolean {
  if (strategy.cadence === 'daily' || !strategy.last_evaluated_at) return true
  const last = new Date(strategy.last_evaluated_at).getTime()
  if (!Number.isFinite(last)) return true
  const windowMs = strategy.cadence === 'weekly' ? 7 : 30
  return now.getTime() - last >= windowMs * 24 * 60 * 60 * 1000
}

/* --- Run planning ------------------------------------------------------------ */

/** One rule×symbol evaluation that came out true — the per-rule result
    rows a test scan reports. `symbol` is '' for book-level metrics. */
export interface RuleMatch {
  /** Position of the rule in the strategy's rules array (priority order). */
  ruleIndex: number
  ruleTitle: string
  symbol: string
  /** The evaluated metric reading that crossed the threshold. */
  metricValue: number
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
  }[]
  /** Explanations for anything skipped (e.g. unresolvable quantity). */
  warnings: string[]
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
    evaluated: 0,
  }
  const collect = opts.collectMatches === true
  const now = opts.now ?? new Date()
  const openDraftKeys = new Set(opts.openDraftKeys ?? [])
  const positionBySymbol = new Map<string, Position>()
  const priceBySymbol = new Map<string, number>()
  for (const p of positions) positionBySymbol.set(`${p.asset_class}:${p.symbol}`, p)
  for (const s of snapshots) priceBySymbol.set(`${s.asset_class}:${s.symbol}`, s.price)

  /* Marked-to-market book value — the denominator for weight_pct. Only
     positions with a snapshot count; stale symbols can't inflate weights. */
  let bookValue = 0
  for (const p of positions) {
    const price = priceBySymbol.get(`${p.asset_class}:${p.symbol}`) ?? 0
    bookValue += p.quantity * price
  }
  const ctx: RunContext = { bookValue, cashTotal: opts.cashTotal ?? 0 }

  const scanned = new Set<string>()
  const hit = (diag: RunPlan['perStrategy'][number], rule: RuleBase, n = 1) => {
    plan.ruleHits[rule.title] = (plan.ruleHits[rule.title] ?? 0) + n
    diag.ruleHits[rule.title] = (diag.ruleHits[rule.title] ?? 0) + n
  }

  for (const strategy of strategies) {
    if (!strategy.enabled || strategy.rules.length === 0) continue
    if (!opts.force && !strategyDue(strategy, now)) continue
    const diag: RunPlan['perStrategy'][number] = {
      strategyId: strategy.id,
      ruleHits: {},
      symbolsScanned: [],
      signals: 0,
      proposals: 0,
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
       rule in the strategy's priority order. */
    const symbolRules = strategy.rules
      .map((rule, i) => [i, rule] as const)
      .filter(([, r]) => !BOOK_METRICS.includes(r.metric))
    const bookRules = strategy.rules
      .map((rule, i) => [i, rule] as const)
      .filter(([, r]) => BOOK_METRICS.includes(r.metric))

    for (const snap of snapshots) {
      if (!scope.has(snap.symbol.toUpperCase())) continue
      if (classes.size > 0 && !classes.has(snap.asset_class)) continue
      scanned.add(snap.symbol.toUpperCase())
      diag.symbolsScanned.push(snap.symbol.toUpperCase())
      plan.evaluated += 1
      const position = positionBySymbol.get(`${snap.asset_class}:${snap.symbol}`) ?? null
      for (const [ruleIndex, rule] of symbolRules) {
        const m = metricValue(rule.metric, snap, position, ctx)
        if (m === null || !opMatches(rule, m)) continue
        hit(diag, rule)

        if (rule.type === 'signal') {
          if (collect) {
            plan.matches.push({
              ruleIndex,
              ruleTitle: rule.title,
              symbol: snap.symbol,
              metricValue: m,
              outcome: { kind: 'signal', severity: rule.severity },
            })
          }
          if (summaryMode) {
            summaryHits.push({ rule, snap, position })
            continue
          }
          const key = `${strategy.id}:${snap.symbol}:${rule.severity}:${rule.title}`
          if (existingKeys.has(key)) continue
          plan.signals.push({
            strategy_id: strategy.id,
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
           (including drafts planned earlier in this same run — two rules
           sharing a title must not produce two identical orders), and only
           ever PLAN a draft; execution stays with the user. */
        const qty = resolveQuantity(rule, snap, position)
        if (collect) {
          plan.matches.push({
            ruleIndex,
            ruleTitle: rule.title,
            symbol: snap.symbol,
            metricValue: m,
            outcome: { kind: 'order', side: rule.side, quantity: qty },
          })
        }
        if (qty === null) {
          plan.warnings.push(
            `${rule.title}: quantity not resolvable for ${snap.symbol} (${rule.qty_unit})`,
          )
          continue
        }
        const key = `${strategy.id}:${snap.symbol}:${rule.title}`
        if (openDraftKeys.has(key)) continue
        openDraftKeys.add(key)
        plan.proposals.push({
          strategy_id: strategy.id,
          rule_key: key,
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
      if (collect) {
        plan.matches.push({
          ruleIndex,
          ruleTitle: rule.title,
          symbol: '',
          metricValue: m,
          outcome:
            rule.type === 'order_proposal'
              ? { kind: 'order', side: rule.side, quantity: null }
              : { kind: 'signal', severity: rule.severity },
        })
      }
      if (rule.type === 'order_proposal') {
        plan.warnings.push(`${rule.title}: order proposals need a symbol-level metric`)
        continue
      }
      if (summaryMode) {
        summaryHits.push({ rule, snap: EMPTY_SNAP, position: null })
        continue
      }
      const key = `${strategy.id}::${rule.severity}:${rule.title}`
      if (existingKeys.has(key)) continue
      plan.signals.push({
        strategy_id: strategy.id,
        asset_class: 'cash',
        symbol: '',
        name: '',
        kind: rule.severity,
        title: rule.title,
        body: `cash ${ctx.cashTotal.toFixed(2)}`,
        score: scoreFor(rule, EMPTY_SNAP, null, ctx),
      })
      diag.signals += 1
      plan.evaluated += 1
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
      const key = `${strategy.id}::${anyAlert ? 'alert' : 'insight'}:${title}`
      if (!existingKeys.has(key)) {
        const lines = summaryHits.map((h) =>
          h.snap.symbol ? `${h.snap.symbol} — ${h.rule.title}` : h.rule.title,
        )
        plan.signals.push({
          strategy_id: strategy.id,
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
        plan.evaluated += 1
      }
    }
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
  strategy_id: string
  symbol: string
  kind: string
  title: string
}): string {
  return `${s.strategy_id}:${s.symbol}:${s.kind}:${s.title}`
}

/** Dedupe key for a stored draft order row — matches planRun's rule_key. */
export function draftKey(o: {
  strategy_id: string | null
  symbol: string
  note: string | null
}): string {
  const title = (o.note ?? '').replace(/^Order proposal — /, '')
  return `${o.strategy_id}:${o.symbol}:${title}`
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
    position ? `held: ${position.quantity} @ ${position.avg_cost.toFixed(2)}` : null,
    rule.metric === 'weight_pct' && position && ctx.bookValue > 0
      ? `weight ${(((position.quantity * snap.price) / ctx.bookValue) * 100).toFixed(1)}%`
      : null,
    rule.metric === 'unrealized_gain_pct' && position && position.avg_cost > 0
      ? `unrealized ${(((snap.price - position.avg_cost) / position.avg_cost) * 100).toFixed(1)}%`
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

export type BotAction = 'run' | 'run-all' | 'execute-order' | 'test-scan'

export function validateBotAction(
  action: unknown,
): { ok: true; value: BotAction } | { ok: false; error: string } {
  if (
    action === 'run' ||
    action === 'run-all' ||
    action === 'execute-order' ||
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
