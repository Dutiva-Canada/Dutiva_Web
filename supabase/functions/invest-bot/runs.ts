import {
  buildDigestEmail,
  buildSignalEmail,
  digestFlushDue,
  draftExpiryCutoff,
  draftKey,
  planRun,
  signalKey,
  strategyDue,
  type MarketSnapshot,
  type Position,
} from './handlers.ts'
import { maybeEmitInsights } from './insights.ts'
import { convertFx, fetchFxTable } from './fx.ts'
import { isInternalDutivaAccount } from '../_shared/adminAccess.ts'
import { resendSend } from '../_shared/resendSend.ts'
import type { SupabaseClient } from './botShared.ts'
import type { PostgrestSingleResponse } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'
import { loadStrategies } from './strategies.ts'

/* ── Org run ───────────────────────────────────────────────────────────────
   One user's sweep: expire stale drafts, load the book, plan the run, write
   signals + draft proposals, emit insights and email alerts, then record
   per-strategy history. */

export async function runUser(
  adminClient: SupabaseClient,
  userId: string,
  opts: { force?: boolean; email?: string | null } = {},
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

  /* Dedupe reads 0218 columns when they exist — older schemas retry without
     them and fall back to title-keyed rows (rule_id null, in_feed true). */
  const signalsSelect = (cols: string) =>
    adminClient
      .from('invest_signals')
      .select(cols)
      .eq('user_id', userId)
      /* 'new' and 'acknowledged' both suppress a refire — acknowledged means
         "still open"; only 'dismissed' frees the key. */
      .in('status', ['new', 'acknowledged'])
  let signalsRes = await signalsSelect(
    'strategy_id, symbol, kind, title, rule_id, in_feed, created_at',
  )
  if (signalsRes.error && /rule_id|in_feed/.test(signalsRes.error.message)) {
    signalsRes = await signalsSelect('strategy_id, symbol, kind, title, created_at')
  }
  let draftsRes: PostgrestSingleResponse<Parameters<typeof draftKey>[0][]> =
    await adminClient
      .from('invest_orders')
      .select('strategy_id, symbol, note, rule_id')
      .eq('user_id', userId)
      .eq('status', 'draft')
  if (draftsRes.error && /rule_id/.test(draftsRes.error.message)) {
    draftsRes = await adminClient
      .from('invest_orders')
      .select('strategy_id, symbol, note')
      .eq('user_id', userId)
      .eq('status', 'draft')
  }
  const [snapshotsRes, positionsRes, accountsRes, watchlistRes] = await Promise.all([
    adminClient
      .from('invest_market_snapshots')
      .select('asset_class, symbol, price, day_change_pct, ma50, currency')
      .eq('user_id', userId),
    adminClient
      .from('invest_positions')
      .select('id, account_id, asset_class, symbol, name, quantity, avg_cost, currency')
      .eq('user_id', userId),
    adminClient
      .from('invest_accounts')
      .select('cash_balance, base_currency')
      .eq('user_id', userId)
      .eq('status', 'active'),
    adminClient.from('invest_watchlist').select('symbol').eq('user_id', userId),
  ])
  for (const res of [snapshotsRes, positionsRes, signalsRes, accountsRes, watchlistRes]) {
    if (res.error) throw new Error(res.error.message)
  }
  /* draftsRes may 42703 on a pre-0184 schema (no strategy_id column) —
     degrade to no proposal dedupe rather than failing the run. */
  const openDraftKeys = new Set(
    (draftsRes.error ? [] : (draftsRes.data ?? [])).map(draftKey),
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

  /* Book currency follows the first active account's base — same rule the
     portal uses for its blended headline. FX rates convert every position
     and cash leg into it; without rates, foreign-currency rows stay out of
     the totals rather than blend currencies at face value. */
  const accounts = (accountsRes.data ?? []) as { cash_balance: number; base_currency: string | null }[]
  const bookCurrency = (accounts[0]?.base_currency ?? 'CAD').toUpperCase()
  const fx = await fetchFxTable()
  let cashSkipped = false
  const cashTotal = accounts.reduce((sum, a) => {
    const v = convertFx(Number(a.cash_balance), a.base_currency ?? bookCurrency, bookCurrency, fx)
    if (v === null) {
      cashSkipped = true
      return sum
    }
    return sum + v
  }, 0)
  /* Feed-visible signals dedupe for as long as the user leaves them open —
     that's the current contract. Hidden rows (in_feed=false, an in-app-off
     strategy) can never be dismissed, so they'd lock the key forever; they
     only suppress repeats for DEDUPE_WINDOW before re-arming. */
  const DEDUPE_WINDOW_MS = 7 * 86_400_000
  const dedupeRows = ((signalsRes.data ?? []) as unknown as (
    Parameters<typeof signalKey>[0] & { in_feed?: boolean; created_at?: string }
  )[]).filter(
    (s) =>
      s.in_feed !== false ||
      !s.created_at ||
      Date.now() - Date.parse(s.created_at) < DEDUPE_WINDOW_MS,
  )
  const existingKeys = new Set(dedupeRows.map(signalKey))

  const plan = planRun(strategies, snapshots, positions, existingKeys, {
    cashTotal,
    fx,
    bookCurrency,
    force: opts.force === true,
    openDraftKeys,
  })
  if (cashSkipped) {
    plan.warnings.push('some cash balances skipped — no FX rate for their base currency')
    plan.warningDetails.push({ code: 'cash_fx_missing', params: {} })
  }

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

  /* Signals always persist — the row is both the audit trail and the dedupe
     record. notify.in_app === false only hides it from the feed (0218
     in_feed); before that column, suppressed signals never landed, so the
     key never existed and email-only strategies re-emailed the identical
     hit every sweep. */
  const inAppOff = new Set(
    strategies.filter((s) => s.notify_in_app === false).map((s) => s.id),
  )
  /* 0218 columns ride every insert on projects that have them; the first
     'undefined column' error retires them for the rest of this run. */
  let signalCols0218 = true
  let writesFailed = false
  for (const signal of plan.signals) {
    const base = {
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
    }
    const withNewCols = {
      ...base,
      rule_id: signal.rule_id ?? null,
      in_feed: !inAppOff.has(signal.strategy_id),
    }
    let { error } = await adminClient
      .from('invest_signals')
      .insert(signalCols0218 ? withNewCols : base)
    if (error && signalCols0218 && /rule_id|in_feed/.test(error.message)) {
      signalCols0218 = false
      ;({ error } = await adminClient.from('invest_signals').insert(base))
    }
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
      plan.warningDetails.push({ code: 'no_paper_account', params: {} })
    } else {
      let orderCols0218 = true
      for (const proposal of plan.proposals) {
        const base = {
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
        }
        const withRuleId = { ...base, rule_id: proposal.rule_id ?? null }
        let { error } = await adminClient
          .from('invest_orders')
          .insert(orderCols0218 ? withRuleId : base)
        if (error && orderCols0218 && /rule_id/.test(error.message)) {
          orderCols0218 = false
          ;({ error } = await adminClient.from('invest_orders').insert(base))
        }
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
     Never fatal: a model outage must not lose the deterministic signals.
     Runs when a strategy actually evaluated this sweep, or when the user
     explicitly asked (manual scan) — an idle run-all (nothing due, or
     every strategy paused) must not emit daily book observations or write
     sweep rows for them. The advice tier keys off the sign-in email (the
     JWT path passes it in opts; run-all resolves it here) — only looked
     up when the pass can produce. */
  const insightsDue = evaluatedIds.length > 0 || opts.force === true
  let authEmail = opts.email ?? null
  if (insightsDue && authEmail === null && (positions.length > 0 || cashTotal > 0)) {
    const { data: userData } = await adminClient.auth.admin.getUserById(userId)
    authEmail = userData?.user?.email ?? null
  }
  const insights = insightsDue
    ? await maybeEmitInsights(adminClient, {
        snapshots,
        positions,
        cashTotal,
        signalsEmitted: plan.signals.length,
        ordersPlanned: plan.proposals.length,
        fx,
        bookCurrency,
      }, { advice: isInternalDutivaAccount(authEmail) })
    : []
  /* Insight rows dedupe on their own (strategy,symbol,kind,title) key —
     identical repeat observations stack no more than one open row, same as
     rule signals. Insert failures are tolerated like the rest of the pass. */
  let insightsInserted = 0
  for (const insight of insights) {
    const kind = insight.severity === 'warn' ? 'alert' : 'insight'
    const key = signalKey({
      strategy_id: null,
      symbol: '',
      kind,
      title: insight.title_en,
    })
    if (existingKeys.has(key)) continue
    existingKeys.add(key)
    const base = {
      user_id: userId,
      strategy_id: null,
      asset_class: 'other',
      symbol: '',
      name: '',
      /* Warn-severity observations render as alerts — a model-noticed decline
         deserves the same warning pill a rule-driven drop gets. */
      kind,
      title: insight.title_en,
      title_fr: insight.title_fr,
      body: insight.body_en,
      body_fr: insight.body_fr,
      score: null,
    }
    const withNewCols = { ...base, in_feed: true, rule_id: null }
    let { error } = await adminClient
      .from('invest_signals')
      .insert(signalCols0218 ? withNewCols : base)
    if (error && signalCols0218 && /rule_id|in_feed/.test(error.message)) {
      signalCols0218 = false
      ;({ error } = await adminClient.from('invest_signals').insert(base))
    }
    if (!error) insightsInserted += 1
  }

  /* Email alerts — notify.email strategies get one bilingual summary per
     scan that produced hits, or buffer into pending_email when the user's
     digest cadence is daily/weekly (one consolidated email per window).
     No provider key configured → nothing sends and the preference stays
     inert; a send failure degrades to a run warning rather than failing
     the scan. */
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

  const { data: prefsRow } = resendKey === ''
    ? { data: null }
    : await adminClient
        .from('invest_notification_prefs')
        .select('email_cadence, pending_email, digest_last_sent_at')
        .eq('user_id', userId)
        .maybeSingle()
  const cadence =
    prefsRow?.email_cadence === 'daily' || prefsRow?.email_cadence === 'weekly'
      ? prefsRow.email_cadence
      : 'immediate'

  /* Digest cadences buffer hits into the prefs row; the first sweep past
     the window flushes them as one consolidated email. A missing `to` or
     a failed send keeps the buffer — hits are never silently dropped. */
  let pending: { name: string; signals: string[]; proposals: string[] }[] = []
  let digestDue = false
  if (cadence !== 'immediate') {
    const prior = Array.isArray(prefsRow?.pending_email)
      ? (prefsRow.pending_email as typeof pending)
      : []
    pending = [...prior, ...emailHits]
    digestDue = digestFlushDue(cadence, pending.length, prefsRow?.digest_last_sent_at)
  }

  const sendsNow = cadence === 'immediate' ? emailHits.length > 0 : digestDue
  let to: string | null = null
  if (resendKey !== '' && sendsNow) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('account_email')
      .eq('id', userId)
      .maybeSingle()
    to = (profile?.account_email as string | null | undefined) ?? null
    if (!to) {
      const { data: userData } = await adminClient.auth.admin.getUserById(userId)
      to = userData?.user?.email ?? null
    }
  }
  if (resendKey !== '') {
    const from =
      Deno.env.get('INVEST_EMAIL_FROM') ??
      Deno.env.get('SUPPORT_EMAIL_FROM') ??
      'Dutiva Invest <invest@dutiva.ca>'
    const portalUrl = `${Deno.env.get('SITE_URL') ?? 'https://dutiva.ca'}/invest`
    const nowIso = new Date().toISOString()
    const upsertPending = (rows: typeof pending, sent: boolean) =>
      adminClient.from('invest_notification_prefs').upsert({
        user_id: userId,
        pending_email: rows,
        ...(sent ? { digest_last_sent_at: nowIso } : {}),
        updated_at: nowIso,
      })

    if (cadence === 'immediate' && emailHits.length > 0 && to) {
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
          plan.warningDetails.push({ code: 'email_failed', params: { name: hit.name } })
        }
      }
    } else if (cadence !== 'immediate' && pending.length > 0) {
      if (digestDue && to) {
        const { subject, text } = buildDigestEmail({ items: pending, portalUrl, cadence })
        try {
          await resendSend(resendKey, from, { to, subject, text })
          await upsertPending([], true)
        } catch (err) {
          plan.warnings.push(
            `digest email failed: ${(err as Error).message.slice(0, 120)}`,
          )
          plan.warningDetails.push({ code: 'digest_failed', params: {} })
          await upsertPending(pending, false)
        }
      } else {
        /* Not due yet — or no recipient resolvable; keep accumulating. */
        await upsertPending(pending, false)
      }
    }
  }

  /* Run history is per strategy — one row for each strategy evaluated this
     sweep, so rule_hits and symbols_scanned never mix across strategies
     that share a rule title. Proposals count what was actually inserted.
     Sweeps where nothing was due write no row at all — a daily "0 symbols
     scanned" record claimed a scan that never happened. */
  const durationMs = Date.now() - startedAt
  const runRows: Database['public']['Tables']['invest_bot_runs']['Insert'][] =
    plan.perStrategy.map((s) => {
      return {
        user_id: userId,
        strategy_id: s.strategyId,
        signals_emitted: s.signals,
        orders_suggested: proposalsByStrategy.get(s.strategyId) ?? 0,
        orders_executed: 0,
        summary:
          s.symbolsScanned.length === 1
            ? '1 symbol scanned'
            : `${s.symbolsScanned.length} symbols scanned`,
        status: writesFailed ? 'partial' : 'ok',
        symbols_scanned: s.symbolsScanned,
        rule_hits: s.ruleHits,
        duration_ms: s.durationMs,
      }
    })
  if (insightsInserted > 0) {
    runRows.push({
      user_id: userId,
      strategy_id: null,
      signals_emitted: insightsInserted,
      orders_suggested: 0,
      orders_executed: 0,
      summary:
        plan.symbolsScanned.length === 1
          ? '1 symbol scanned'
          : `${plan.symbolsScanned.length} symbols scanned`,
      status: writesFailed ? 'partial' : 'ok',
      symbols_scanned: plan.symbolsScanned,
      rule_hits: {},
      duration_ms: durationMs,
    })
  }
  if (runRows.length > 0) {
    const runInsert = await adminClient.from('invest_bot_runs').insert(runRows)
    if (
      runInsert.error &&
      /strategy_id|symbols_scanned|rule_hits|duration_ms/.test(runInsert.error.message)
    ) {
      /* Pre-0184 schema — record a single flat row without diagnostics. */
      await adminClient.from('invest_bot_runs').insert({
        user_id: userId,
        signals_emitted: plan.signals.length + insightsInserted,
        orders_suggested: proposalsCreated,
        orders_executed: 0,
        summary:
          plan.symbolsScanned.length === 1
            ? '1 symbol scanned'
            : `${plan.symbolsScanned.length} symbols scanned`,
        status: writesFailed ? 'partial' : 'ok',
      })
    } else if (runInsert.error) {
      /* A non-schema insert failure must not vanish — history silently
         dropped reads as "the bot never ran". */
      plan.warnings.push(`run history not recorded: ${runInsert.error.message.slice(0, 160)}`)
      plan.warningDetails.push({
        code: 'run_history_failed',
        params: { error: runInsert.error.message.slice(0, 160) },
      })
      console.error('invest-bot: run history insert failed', runInsert.error)
    }
  }

  return {
    scanned: plan.symbolsScanned,
    signals: plan.signals.length,
    proposals: proposalsCreated,
    ruleHits: plan.ruleHits,
    warnings: plan.warnings,
    warningDetails: plan.warningDetails,
    durationMs: Date.now() - startedAt,
  }
}
