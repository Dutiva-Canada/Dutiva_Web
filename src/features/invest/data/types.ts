/**
 * Invest workspace domain types — mirror of the 0180 invest_* tables.
 * The strategy-rule shape is duplicated from
 * supabase/functions/invest-bot/handlers.ts deliberately: the edge bundle is
 * deployed separately and the two must stay structurally compatible, so any
 * change to the rule schema needs both sides updated.
 */

export type AssetClass = 'equity' | 'etf' | 'crypto' | 'bond' | 'cash' | 'other'
export const ASSET_CLASSES: readonly AssetClass[] = [
  'equity',
  'etf',
  'crypto',
  'bond',
  'cash',
  'other',
]

export type AccountKind = 'paper' | 'live' | 'external'
export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderMode = 'paper' | 'live'
export type OrderStatus = 'draft' | 'queued' | 'executed' | 'cancelled' | 'failed' | 'expired'
export type SignalKind = 'screen' | 'insight' | 'alert' | 'thesis'
export type SignalStatus = 'new' | 'acknowledged' | 'dismissed'

export interface InvestAccount {
  id: string
  name: string
  kind: AccountKind
  baseCurrency: string
  cashBalance: number
  status: 'active' | 'archived'
}

export interface InvestPosition {
  id: string
  accountId: string
  assetClass: AssetClass
  symbol: string
  name: string
  quantity: number
  avgCost: number
  currency: string
  lastPrice: number | null
  lastPriceAt: string | null
}

export interface MarketSnapshot {
  assetClass: AssetClass
  symbol: string
  price: number
  dayChangePct: number | null
  ma50: number | null
  currency: string
  source: string
  asOf: string
}

export type StrategyCadence = 'daily' | 'weekly' | 'monthly'

export type RuleMetric =
  'day_change_pct' | 'vs_ma50' | 'value_floor' | 'weight_pct' | 'unrealized_gain_pct' | 'cash_above'
export type SignalSeverity = 'insight' | 'alert'
export type QuantityUnit = 'shares' | 'percent_of_position' | 'currency'

interface RuleBase {
  /** Stable identity — dedupe keys and firing history key on this, not the
     title: a renamed label must not reset either, and two same-title rules
     keep separate slots. Optional on stored rules saved before 0218 (and
     AI-drafted rules), where the title is the identity; assigned at save. */
  id?: string
  metric: RuleMetric
  op: 'lt' | 'gt' | 'between'
  value: number
  /** Second bound — required when op is 'between', ignored otherwise. */
  value2?: number
  title: string
}

/** Notify-only rule — carries severity, never order fields. */
export interface SignalRule extends RuleBase {
  type: 'signal'
  severity: SignalSeverity
}

/** Proposes a DRAFT order — carries side + quantity + unit, never severity.
    The bot only ever creates drafts; approval stays with the user. */
export interface OrderProposalRule extends RuleBase {
  type: 'order_proposal'
  side: OrderSide
  qty: number
  qtyUnit: QuantityUnit
}

export type StrategyRule = SignalRule | OrderProposalRule

/** What a strategy scans: the whole watchlist and/or explicit symbols. */
export interface StrategyScope {
  watchlist: boolean
  symbols: string[]
}

/** Where a strategy's signals are delivered. */
export interface StrategyNotify {
  inApp: boolean
  email: boolean
}

/** How a scan that matches several rules notifies: 'each' emits one
    in-app signal per hit; 'summary' collapses them into a single signal
    listing every match. Order proposals always stay per-rule — each one
    needs its own approval. (0190 column; 'each' is the legacy behavior.) */
export type MultiMatch = 'each' | 'summary'

export interface InvestStrategy {
  id: string
  name: string
  enabled: boolean
  scope: StrategyScope
  rules: StrategyRule[]
  notify: StrategyNotify
  cadence: StrategyCadence
  multiMatch: MultiMatch
  /** Provenance: 'tpl:<slug>' from the gallery, 'ai-draft', '' = custom. */
  template: string
  /** When the bot last fully evaluated this strategy — the cadence gate's
      real clock. A partial/failed run leaves it unstamped, so the next-run
      estimate must read this, not the latest run row. Absent on write
      payloads and never-run strategies. */
  lastEvaluatedAt?: string | null
}

export interface InvestSignal {
  id: string
  strategyId: string | null
  /** Firing rule's identity (0218) — null on insight rows and rows stored
     before the column existed. */
  ruleId: string | null
  assetClass: AssetClass
  symbol: string
  name: string
  kind: SignalKind
  title: string
  body: string
  /** AI-authored insights carry both languages; engine signals leave these
      null (their bodies are locale-neutral data strings). */
  titleFr: string | null
  bodyFr: string | null
  score: number | null
  status: SignalStatus
  /** 0218 — false hides the row from the feed (in-app-off strategies still
     persist it for dedupe/audit). Absent column reads as true. */
  inFeed: boolean
  createdAt: string
}

export interface InvestOrder {
  id: string
  accountId: string
  signalId: string | null
  /** Proposing rule's identity (0218) — null on manually created orders
     and rows stored before the column existed. */
  ruleId: string | null
  assetClass: AssetClass
  symbol: string
  name: string
  side: OrderSide
  quantity: number
  orderType: OrderType
  limitPrice: number | null
  mode: OrderMode
  status: OrderStatus
  requestedPrice: number | null
  executedPrice: number | null
  executedAt: string | null
  note: string | null
  error: string | null
  createdAt: string
}

/** One rule×symbol match from a test-scan dry run — mirrors RuleMatch in
    supabase/functions/invest-bot/handlers.ts. `symbol` is '' for
    book-level metrics (cash). */
export interface TestScanMatch {
  ruleIndex: number
  ruleTitle: string
  symbol: string
  metricValue: number
  /** Set when an open signal/draft already owns this hit's dedupe key —
     the next real run would not re-emit it (the dry run reads the same
     dedupe sets the sweep does). */
  suppressed?: boolean
  outcome:
    | { kind: 'signal'; severity: SignalSeverity }
    | { kind: 'order'; side: OrderSide; quantity: number | null }
}

/** Structured run warning — a stable code + params the UI localizes; the
    raw `warnings` strings stay for logs and older consumers. */
export interface RunWarning {
  code: string
  params: Record<string, string>
}

export interface InvestBotRun {
  id: string
  ranAt: string
  /** Strategy a test scan targeted; null = full sweep. */
  strategyId: string | null
  signalsEmitted: number
  proposalsCreated: number
  /** Distinct symbols evaluated this run (post-0184 runs; [] before). */
  symbolsScanned: string[]
  /** Rule title → number of matches, counted before dedupe. */
  ruleHits: Record<string, number>
  durationMs: number | null
  summary: string
  status: 'ok' | 'partial' | 'failed'
}

/** A symbol the user wants priced/tracked without holding it — feeds the
    market-sync universe (and thereby dip-watcher strategies) and the
    per-symbol news queries. */
export interface InvestWatchItem {
  id: string
  assetClass: AssetClass
  symbol: string
  name: string
  createdAt: string
}

/** Shared market headline from invest_market_news (0183). `symbol` '' =
    a general-market item. Third-party content — English feed text. */
export interface InvestNewsItem {
  id: number
  symbol: string
  assetClass: string
  title: string
  url: string
  source: string
  summary: string
  publishedAt: string | null
}
