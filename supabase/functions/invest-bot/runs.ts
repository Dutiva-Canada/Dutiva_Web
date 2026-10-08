import {
  buildSignalEmail,
  draftExpiryCutoff,
  draftKey,
  planRun,
  signalKey,
  strategyDue,
  type MarketSnapshot,
  type Position,
} from './handlers.ts'
import { maybeEmitInsights } from './insights.ts'
import { resendSend } from '../_shared/resendSend.ts'
import type { SupabaseClient } from './botShared.ts'
import type { Database } from '../_shared/database.types.ts'
import { loadStrategies } from './strategies.ts'

/* ── Org run ───────────────────────────────────────────────────────────────
   One user's sweep: expire stale drafts, load the book, plan the run, write
   signals + draft proposals, emit insights and email alerts, then record
   per-strategy history. */

export async function runUser(
  adminClient: SupabaseClient,
  userId: string,
  opts: { force?: boolean } = {},
): Promise<Record<string, unknown>> {
  const startedAt = Date.now()

  /* Expire stale drafts first — an expired draft frees its dedupe slot, so
     a rule that keeps firing proposes fresh evidence instead of staying
     suppressed behind a week-old proposal nobody approved. Runs before the
     draft read below so dedupe sees the post-sweep set. Tolerated on
     pre-0185 schemas, where the check rejects 'expired'. */
  const { error: expiryError } = await adminClient
    .from('invest_orders')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'draft')
    .lt('created_at', draftExpiryCutoff())
  if (expiryError && !/check|expired/i.test(expiryError.message)) {
    throw new Error(expiryError.message)
  }

  const [snapshotsRes, positionsRes, signalsRes, accountsRes, watchlistRes, draftsRes] =
    await Promise.all([
      adminClient
        .from('invest_market_snapshots')
        .select('asset_class, symbol, price, day_change_pct, ma50, currency')
        .eq('user_id', userId),
      adminClient
        .from('invest_positions')
        .select('id, account_id, asset_class, symbol, name, quantity, avg_cost')
        .eq('user_id', userId),
      adminClient
        .from('invest_signals')
        .select('strategy_id, symbol, kind, title')
        .eq('user_id', userId)
        .eq('status', 'new'),
      adminClient
        .from('invest_accounts')
        .select('cash_balance')
        .eq('user_id', userId)
        .eq('status', 'active'),
      adminClient.from('invest_watchlist').select('symbol').eq('user_id', userId),
      adminClient
        .from('invest_orders')
        .select('strategy_id, symbol, note')
        .eq('user_id', userId)
        .eq('status', 'draft'),
    ])
  for (const res of [snapshotsRes, positionsRes, signalsRes, accountsRes, watchlistRes]) {
    if (res.error) throw new Error(res.error.message)
  }
  /* draftsRes may 42703 on a pre-0184 schema (no strategy_id column) —
     degrade to no proposal dedupe rather than failing the run. */
  const openDraftKeys = new Set(
    ((draftsRes.error ? [] : (draftsRes.data ?? [])) as Parameters<typeof draftKey>[0][]).map(
      draftKey,
    ),
  )

  const snapshots = (snapshotsRes.data ?? []) as MarketSnapshot[]
  const positions = (positionsRes.data ?? []) as (Position & { id: string; name: string })[]
  /* Scope resolution universe: held symbols ∪ watched symbols — the set
     market-sync keeps snapshots fresh for. */
  const knownSymbols = [
    ...new Set(
      [
        ...positions.map((p) => p.symbol),
        ...((watchlistRes.data ?? []) as { symbol: string }[]).map((w) => w.symbol),
      ].map((s) => s.toUpperCase()),
    ),
  ]
  const { strategies } = await loadStrategies(adminClient, userId, knownSymbols)

  const cashTotal = ((accountsRes.data ?? []) as { cash_balance: number }[]).reduce(
    (sum, a) => sum + Number(a.cash_balance),
    0,
  )
  const existingKeys = new Set(
    ((signalsRes.data ?? []) as Parameters<typeof signalKey>[0][]).map(signalKey),
  )

  const plan = planRun(strategies, snapshots, positions, existingKeys, {
    cashTotal,
    force: opts.force === true,
    openDraftKeys,
  })

  /* The evaluation clock is stamped after writes, below — a run whose
     inserts failed is recorded 'partial' and must stay due so the next
     scheduled sweep retries it (weekly/monthly windows would otherwise be
     burned by a transient failure). Manual scans stamp too: cadence means
     "at most". */
  const evaluatedIds = strategies
    .filter(
      (s) => s.enabled && s.rules.length > 0 && (opts.force === true || strategyDue(s, new Date())),
    )
    .map((s) => s.id)

  /* Insert signals — strategies with notify.in_app === false stay out of the
     in-app feed entirely; their hits still feed emails and run history. */
  const inAppOff = new Set(
    strategies.filter((s) => s.notify_in_app === false).map((s) => s.id),
  )
  let writesFailed = false
  for (const signal of plan.signals) {
    if (inAppOff.has(signal.strategy_id)) continue
    const { error } = await adminClient.from('invest_signals').insert({
      user_id: userId,
      strategy_id: signal.strategy_id,
      asset_class: signal.asset_class,
      symbol: signal.symbol,
      name: signal.name,
      kind: signal.kind,
      title: signal.title,
      title_fr: signal.title_fr ?? null,
      body: signal.body,
      body_fr: signal.body_fr ?? null,
      score: signal.score,
    })
    if (error) writesFailed = true
  }

  /* Order proposals → DRAFT orders on the first active paper account.
     Nothing executes: approval happens in the Orders tab via
     execute-order, and only ever at the user's request. */
  const { data: paperAccount } = await adminClient
    .from('invest_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', 'paper')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  let proposalsCreated = 0
  const proposalsByStrategy = new Map<string, number>()
  /* Only proposals that actually landed as drafts may be announced — the
     email summary reads this set, not plan.proposals, so recipients are
     never told about an order they cannot approve. */
  const insertedProposals: typeof plan.proposals = []
  if (plan.proposals.length > 0) {
    if (!paperAccount) {
      plan.warnings.push('order proposals skipped — no active paper account')
    } else {
      for (const proposal of plan.proposals) {
        const { error } = await adminClient.from('invest_orders').insert({
          user_id: userId,
          account_id: paperAccount.id,
          strategy_id: proposal.strategy_id,
          asset_class: proposal.asset_class,
          symbol: proposal.symbol,
          name: proposal.name,
          side: proposal.side,
          quantity: proposal.quantity,
          order_type: 'market',
          mode: 'paper',
          status: 'draft',
          requested_price: proposal.requested_price,
          note: proposal.note,
        })
        if (error) {
          writesFailed = true
          continue
        }
        proposalsCreated += 1
        insertedProposals.push(proposal)
        proposalsByStrategy.set(
          proposal.strategy_id,
          (proposalsByStrategy.get(proposal.strategy_id) ?? 0) + 1,
        )
      }
    }
  }

  /* Stamp the evaluation clock only when every write landed — see the
     comment above evaluatedIds. */
  if (evaluatedIds.length > 0 && !writesFailed) {
    await adminClient
      .from('invest_strategies')
      .update({ last_evaluated_at: new Date().toISOString() })
      .in('id', evaluatedIds)
  }

  /* AI insight pass — bilingual plain-language observations on the run.
     Never fatal: a model outage must not lose the deterministic signals. */
  const insights = await maybeEmitInsights(adminClient, {
    snapshots,
    positions,
    cashTotal,
    signalsEmitted: plan.signals.length,
    ordersPlanned: plan.proposals.length,
  })
  for (const insight of insights) {
    await adminClient.from('invest_signals').insert({
      user_id: userId,
      strategy_id: null,
      asset_class: 'other',
      symbol: '',
      name: '',
      kind: 'insight',
      title: insight.title_en,
      title_fr: insight.title_fr,
      body: insight.body_en,
      body_fr: insight.body_fr,
      score: null,
    })
  }

  /* Email alerts — notify.email strategies get one bilingual summary per
     scan that produced hits. No provider key configured → nothing sends and
     the preference stays inert; a send failure degrades to a run warning
     rather than failing the scan. */
  const resendKey =
    Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('SUPPORT_EMAIL_PROVIDER_API_KEY') ?? ''
  const emailHits = strategies
    .filter((s) => s.notify_email === true)
    .map((s) => ({
      name: s.name ?? 'Strategy',
      signals: plan.signals
        .filter((sig) => sig.strategy_id === s.id)
        .map((sig) => `${sig.title} (${sig.symbol})`),
      proposals: insertedProposals
        .filter((p) => p.strategy_id === s.id)
        .map((p) => `${p.side} ${p.quantity} ${p.symbol}`),
    }))
    .filter((e) => e.signals.length + e.proposals.length > 0)
  if (resendKey !== '' && emailHits.length > 0) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('account_email')
      .eq('id', userId)
      .maybeSingle()
    let to = (profile?.account_email as string | null | undefined) ?? null
    if (!to) {
      const { data: userData } = await adminClient.auth.admin.getUserById(userId)
      to = userData?.user?.email ?? null
    }
    if (to) {
      const from =
        Deno.env.get('INVEST_EMAIL_FROM') ??
        Deno.env.get('SUPPORT_EMAIL_FROM') ??
        'Dutiva Invest <invest@dutiva.ca>'
      const portalUrl = `${Deno.env.get('SITE_URL') ?? 'https://dutiva.ca'}/invest`
      for (const hit of emailHits) {
        const { subject, text } = buildSignalEmail({
          strategyName: hit.name,
          signals: hit.signals,
          proposals: hit.proposals,
          portalUrl,
        })
        try {
          await resendSend(resendKey, from, { to, subject, text })
        } catch (err) {
          plan.warnings.push(
            `email delivery failed for "${hit.name}": ${(err as Error).message.slice(0, 120)}`,
          )
        }
      }
    }
  }

  /* Run history is per strategy — one row for each strategy evaluated this
     sweep, so rule_hits and symbols_scanned never mix across strategies
     that share a rule title. Proposals count what was actually inserted. */
  const durationMs = Date.now() - startedAt
  const runRows: Database['public']['Tables']['invest_bot_runs']['Insert'][] =
    plan.perStrategy.map((s) => {
      return {
        user_id: userId,
        strategy_id: s.strategyId,
        signals_emitted: s.signals,
        orders_suggested: proposalsByStrategy.get(s.strategyId) ?? 0,
        orders_executed: 0,
        summary: `${s.symbolsScanned.length} symbol(s) scanned`,
        status: writesFailed ? 'partial' : 'ok',
        symbols_scanned: s.symbolsScanned,
        rule_hits: s.ruleHits,
        duration_ms: durationMs,
      }
    })
  if (insights.length > 0 || runRows.length === 0) {
    runRows.push({
      user_id: userId,
      strategy_id: null,
      signals_emitted: insights.length,
      orders_suggested: 0,
      orders_executed: 0,
      summary: `${plan.symbolsScanned.length} symbol(s) scanned`,
      status: writesFailed ? 'partial' : 'ok',
      symbols_scanned: plan.symbolsScanned,
      rule_hits: {},
      duration_ms: durationMs,
    })
  }
  const runInsert = await adminClient.from('invest_bot_runs').insert(runRows)
  if (
    runInsert.error &&
    /strategy_id|symbols_scanned|rule_hits|duration_ms/.test(runInsert.error.message)
  ) {
    /* Pre-0184 schema — record a single flat row without diagnostics. */
    await adminClient.from('invest_bot_runs').insert({
      user_id: userId,
      signals_emitted: plan.signals.length + insights.length,
      orders_suggested: proposalsCreated,
      orders_executed: 0,
      summary: `${plan.symbolsScanned.length} symbol(s) scanned`,
      status: writesFailed ? 'partial' : 'ok',
    })
  }

  return {
    scanned: plan.symbolsScanned,
    signals: plan.signals.length,
    proposals: proposalsCreated,
    ruleHits: plan.ruleHits,
    warnings: plan.warnings,
    durationMs: Date.now() - startedAt,
  }
}
