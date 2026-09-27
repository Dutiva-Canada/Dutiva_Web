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
export type StrategyAutonomy = 'suggest' | 'paper_execute'

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

export interface StrategyRule {
  metric:
    | 'day_change_pct'
    | 'vs_ma50'
    | 'value_floor'
    | 'weight_pct'
    | 'unrealized_gain_pct'
    | 'cash_above'
  op: 'lt' | 'gt'
  value: number
  kind: SignalKind
  title: string
  side?: OrderSide
  qty?: number
}

export interface InvestStrategy {
  id: string
  name: string
  enabled: boolean
  assetClasses: AssetClass[]
  rules: StrategyRule[]
  autonomy: StrategyAutonomy
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
  signalsEmitted: number
  ordersSuggested: number
  ordersExecuted: number
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
