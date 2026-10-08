import { parseRules, planRun, type MarketSnapshot, type Position, type Strategy } from './handlers.ts'
import { json, type SupabaseClient } from './botShared.ts'

/* ── Test scan (dry run — evaluates a draft strategy, writes nothing) ────── */

/** A test scan evaluates caller-supplied symbols — cap the request so a
    draft strategy can't turn into an unbounded read. */
const MAX_TEST_SYMBOLS = 64

export async function testScan(
  adminClient: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  /* The caller generates the correlation id and we echo it on every
     response — errors included — so the UI can surface "request <id>" and
     support can line it up with function logs. */
  const requestId =
    typeof body['request_id'] === 'string' && body['request_id'].length <= 80
      ? body['request_id']
      : crypto.randomUUID()
  const err = (error: string, status: number, code?: string) =>
    json({ error, ...(code ? { code } : {}), request_id: requestId }, status)

  const rules = parseRules(body['rules'])
  const symbols = Array.isArray(body['symbols'])
    ? [
        ...new Set(
          (body['symbols'] as unknown[]).map((s) => String(s).toUpperCase()).filter(Boolean),
        ),
      ]
    : []
  if (rules.length === 0) return err('No valid rules', 400, 'no_rules')
  if (symbols.length === 0) return err('No symbols in scope', 400, 'no_scope')
  if (symbols.length > MAX_TEST_SYMBOLS) {
    return err(`Too many symbols (max ${MAX_TEST_SYMBOLS})`, 400, 'too_many_symbols')
  }

  const [snapshotsRes, positionsRes, accountsRes] = await Promise.all([
    adminClient
      .from('invest_market_snapshots')
      .select('asset_class, symbol, price, day_change_pct, ma50, currency')
      .eq('user_id', userId),
    adminClient
      .from('invest_positions')
      .select('id, account_id, asset_class, symbol, name, quantity, avg_cost')
      .eq('user_id', userId),
    adminClient
      .from('invest_accounts')
      .select('cash_balance')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ])
  for (const res of [snapshotsRes, positionsRes, accountsRes]) {
    if (res.error) return err(res.error.message, 500)
  }

  const cashTotal = (accountsRes.data ?? []).reduce((sum, a) => sum + Number(a.cash_balance), 0)
  const draft: Strategy = {
    id: 'test-scan',
    enabled: true,
    scope_symbols: symbols,
    rules,
    cadence: 'daily',
    last_evaluated_at: null,
    /* multi_match flows through so the reported signal count reflects the
       mode the strategy will actually run in — 'summary' collapses hits
       into one signal here just like a real run. */
    multi_match: body['multi_match'] === 'summary' ? 'summary' : 'each',
  }
  const plan = planRun(
    [draft],
    (snapshotsRes.data ?? []) as MarketSnapshot[],
    (positionsRes.data ?? []) as Position[],
    new Set(),
    { cashTotal, force: true, collectMatches: true },
  )
  return json({
    request_id: requestId,
    symbolsScanned: plan.symbolsScanned,
    ruleHits: plan.ruleHits,
    signals: plan.signals.length,
    proposals: plan.proposals.length,
    warnings: plan.warnings,
    matches: plan.matches,
  })
}
