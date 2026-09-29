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
export type OrderStatus = 'draft' | 'queued' | 'executed' | 'cancelled' | 'failed'
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
  metric: RuleMetric
  op: 'lt' | 'gt'
  value: number
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

export interface InvestStrategy {
  id: string
  name: string
  enabled: boolean
  scope: StrategyScope
  rules: StrategyRule[]
  notify: StrategyNotify
  cadence: StrategyCadence
  /** Provenance: 'tpl:<slug>' from the gallery, 'ai-draft', '' = custom. */
  template: string
}

export interface InvestSignal {
  id: string
  strategyId: string | null
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
  createdAt: string
}

export interface InvestOrder {
  id: string
  accountId: string
  signalId: string | null
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
