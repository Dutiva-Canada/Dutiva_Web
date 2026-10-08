import { CADENCES, parseRules, type Strategy, type StrategyCadence } from './handlers.ts'
import type { SupabaseClient } from './botShared.ts'

/* Strategy loading — reads invest_strategies with the newest columns when
   present and degrades column-set by column-set, so a code-before-schema
   deploy keeps working on older project schemas. */

export interface StrategyRow {
  id: string
  name?: unknown
  enabled: boolean
  rules: unknown
  cadence: unknown
  last_evaluated_at: unknown
  scope?: unknown
  notify?: unknown
  asset_classes?: unknown
  multi_match?: unknown
}

const STRATEGY_COLS_FULL =
  'id, name, enabled, rules, cadence, last_evaluated_at, scope, notify, asset_classes, multi_match'
const STRATEGY_COLS_0184 =
  'id, name, enabled, rules, cadence, last_evaluated_at, scope, notify, asset_classes'
const STRATEGY_COLS_BASE = 'id, name, enabled, rules, cadence, last_evaluated_at, asset_classes'

/** Reads strategies with the newest columns when present; falls back
    column-set by column-set so a code-before-schema deploy keeps working —
    0190's multi_match degrades to 'each', and pre-0184 schemas get the
    legacy all-symbols scope. */
export async function loadStrategies(
  adminClient: SupabaseClient,
  userId: string,
  allSymbols: string[],
): Promise<{ strategies: Strategy[]; scoped: boolean }> {
  let res = await adminClient
    .from('invest_strategies')
    .select(STRATEGY_COLS_FULL)
    .eq('user_id', userId)

  if (res.error && /multi_match/.test(res.error.message)) {
    res = await adminClient
      .from('invest_strategies')
      .select(STRATEGY_COLS_0184)
      .eq('user_id', userId)
  }

  let rows: StrategyRow[]
  let scoped = true
  if (res.error && /scope|notify/.test(res.error.message)) {
    const fallback = await adminClient
      .from('invest_strategies')
      .select(STRATEGY_COLS_BASE)
      .eq('user_id', userId)
    if (fallback.error) throw new Error(fallback.error.message)
    rows = (fallback.data ?? []) as StrategyRow[]
    scoped = false
  } else {
    if (res.error) throw new Error(res.error.message)
    rows = (res.data ?? []) as StrategyRow[]
  }

  return {
    scoped,
    strategies: rows.map((r) => {
      const scope = (r.scope ?? null) as { watchlist?: unknown; symbols?: unknown } | null
      const scopeSymbols = scoped
        ? [
            ...(Array.isArray(scope?.symbols) ? (scope.symbols as string[]) : []),
            ...(scope?.watchlist === true ? allSymbols : []),
          ]
        : allSymbols
      const notify = (r.notify ?? null) as { email?: unknown; in_app?: unknown } | null
      return {
        id: r.id as string,
        name: typeof r.name === 'string' ? r.name : '',
        enabled: r.enabled === true,
        scope_symbols: [...new Set(scopeSymbols.map((s) => String(s).toUpperCase()))],
        rules: parseRules(r.rules),
        cadence: CADENCES.includes(r.cadence as string) ? (r.cadence as StrategyCadence) : 'daily',
        last_evaluated_at: (r.last_evaluated_at as string | null) ?? null,
        /* 0180 column — [] only when the column is absent (pre-0180 project). */
        asset_classes: Array.isArray(r.asset_classes) ? (r.asset_classes as string[]) : [],
        notify_email: scoped && notify?.email === true,
        /* In-app is the default surface — only an explicit `false` in a
           scoped (post-0184) row opts a strategy out of the signal feed. */
        notify_in_app: scoped ? notify?.in_app !== false : true,
        multi_match: r.multi_match === 'summary' ? 'summary' : 'each',
      }
    }),
  }
}
