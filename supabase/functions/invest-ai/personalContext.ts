import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { MemoryPromptFact } from './handlers.ts'
import { convertFx, fetchFxTable } from '../invest-bot/fx.ts'

/* The "knows you" loaders — confirmed memories plus the declared mandate
   and profile dims. Shared by the draft actions (index.ts) and the
   chat-side draft path (chatActions.ts); a leaf module so neither
   imports the other. */

/** Confirmed memories for the draft prompts — the holder's own retained
    facts shape drafts the same way they shape chat context. */
export async function loadMemories(
  adminClient: SupabaseClient,
  userId: string,
): Promise<MemoryPromptFact[]> {
  const { data } = await adminClient
    .from('invest_memories')
    .select('symbol, kind, text')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  return (data ?? []).map((m) => ({
    symbol: m.symbol ? String(m.symbol) : null,
    kind: String(m.kind ?? 'fact'),
    text: String(m.text ?? '').slice(0, 400),
  }))
}

/** The declared profile dims a draft should scale to — the same columns
    the Profile page edits, plus the plan's objective line. Raw enum
    values ('balanced', 'long', 'growth') — the model reads them fine. */
export interface ProfileDims {
  riskTolerance: string | null
  horizon: string | null
  goal: string | null
  experience: string | null
  planObjective: string | null
}

/** Memories plus the declared mandate and profile dims — the full
    personal context a draft should align with. Two reads in parallel;
    both are cheap. */
export async function loadPersonalContext(
  adminClient: SupabaseClient,
  userId: string,
): Promise<{
  memories: MemoryPromptFact[]
  mandate: string | null
  profile: ProfileDims
}> {
  const [memories, { data: profile }] = await Promise.all([
    loadMemories(adminClient, userId),
    adminClient
      .from('invest_user_profile')
      .select('mandate, risk_tolerance, horizon, goal, experience, plan_objective')
      .eq('user_id', userId)
      .maybeSingle(),
  ])
  return {
    memories,
    mandate: (profile?.mandate as string | null) ?? null,
    profile: {
      riskTolerance: (profile?.risk_tolerance as string | null) ?? null,
      horizon: (profile?.horizon as string | null) ?? null,
      goal: (profile?.goal as string | null) ?? null,
      experience: (profile?.experience as string | null) ?? null,
      planObjective: (profile?.plan_objective as string | null) ?? null,
    },
  }
}

/** Live facts for one tracked symbol — what the position actually is and
    where the tape sits right now, so a drafted threshold anchors to the
    real read (a break at −20% vs the 50-day means nothing if the price
    already sits at −19%). Every field is honestly null when its data
    isn't on file; the prompt names which metrics have a live read. */
export interface PositionFacts {
  held: boolean
  quantity: number | null
  avgCost: number | null
  costCurrency: string | null
  price: number | null
  priceCurrency: string | null
  dayChangePct: number | null
  /** % distance from the 50-day average — the vs_ma50 read. */
  vsMa50Pct: number | null
  unrealizedGainPct: number | null
  marketValue: number | null
  marketValueCurrency: string | null
  /** Share of the marked book — null when the book can't be priced. */
  weightPct: number | null
  bookCurrency: string | null
  priceAsOf: string | null
}

export async function loadPositionFacts(
  adminClient: SupabaseClient,
  userId: string,
  assetClass: string,
  symbol: string,
): Promise<PositionFacts> {
  const sym = symbol.toUpperCase()
  const [{ data: pos }, { data: snap }, { data: positions }, { data: snaps }, { data: accounts }] =
    await Promise.all([
      adminClient
        .from('invest_positions')
        .select('quantity, avg_cost, currency')
        .eq('user_id', userId)
        .eq('asset_class', assetClass)
        .ilike('symbol', sym)
        .maybeSingle(),
      adminClient
        .from('invest_market_snapshots')
        .select('price, day_change_pct, ma50, currency, as_of')
        .eq('user_id', userId)
        .eq('asset_class', assetClass)
        .ilike('symbol', sym)
        .maybeSingle(),
      /* Book rows for the weight read — same basis the sweep prices on:
         every priced position plus account cash, converted into the book
         currency. A leg without an FX rate drops the whole weight read —
         a guess is worse than a gap. */
      adminClient
        .from('invest_positions')
        .select('asset_class, symbol, quantity, currency')
        .eq('user_id', userId),
      adminClient
        .from('invest_market_snapshots')
        .select('asset_class, symbol, price, currency')
        .eq('user_id', userId),
      adminClient
        .from('invest_accounts')
        .select('base_currency, cash_balance')
        .eq('user_id', userId)
        .eq('status', 'active'),
    ])

  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null
  const price = num(snap?.price)
  const ma50 = num(snap?.ma50)
  const vsMa50Pct = price !== null && ma50 !== null && ma50 !== 0
    ? ((price - ma50) / ma50) * 100
    : null
  const quantity = num(pos?.quantity)
  const avgCost = num(pos?.avg_cost)
  const costCcy = typeof pos?.currency === 'string' ? pos.currency : null
  const priceCcy = typeof snap?.currency === 'string' ? snap.currency : null
  const marketValue =
    quantity !== null && price !== null ? quantity * price : null
  const mvCcy = priceCcy ?? costCcy
  /* Cost and price in different currencies have no honest diff — same
     rule the engine applies to unrealized_gain_pct. */
  const unrealizedGainPct =
    marketValue !== null &&
    avgCost !== null &&
    avgCost > 0 &&
    quantity !== null &&
    priceCcy !== null &&
    costCcy !== null &&
    priceCcy.toUpperCase() === costCcy.toUpperCase()
      ? ((marketValue - avgCost * quantity) / (avgCost * quantity)) * 100
      : null

  let weightPct: number | null = null
  const bookCurrency =
    typeof accounts?.[0]?.base_currency === 'string'
      ? accounts[0].base_currency.toUpperCase()
      : null
  if (marketValue !== null && mvCcy && bookCurrency && positions && snaps) {
    /* One rate fetch only when a foreign currency is actually in play —
       a single-currency book never waits on Frankfurter. */
    const ccys = new Set(
      [
        mvCcy,
        ...positions.map((p) => String(p.currency ?? '')),
        ...snaps.map((s) => String(s.currency ?? '')),
        ...(accounts ?? []).map((a) => String(a.base_currency ?? '')),
      ].map((c) => c.toUpperCase()),
    )
    ccys.delete(bookCurrency)
    const fx = ccys.size === 0 ? null : await fetchFxTable()
    const snapMap = new Map(
      snaps.map((s) => [
        `${s.asset_class}:${String(s.symbol).toUpperCase()}`,
        { price: num(s.price), ccy: String(s.currency ?? '') },
      ]),
    )
    let book = 0
    let complete = true
    for (const p of positions) {
      const q = num(p.quantity)
      const s = snapMap.get(`${p.asset_class}:${String(p.symbol).toUpperCase()}`)
      if (q === null || !s || s.price === null || !s.ccy) {
        complete = false
        break
      }
      const v = convertFx(q * s.price, s.ccy, bookCurrency, fx)
      if (v === null) {
        complete = false
        break
      }
      book += v
    }
    if (complete) {
      for (const a of accounts ?? []) {
        const ccy = typeof a.base_currency === 'string' ? a.base_currency : bookCurrency
        const v = convertFx(num(a.cash_balance) ?? 0, ccy, bookCurrency, fx)
        if (v === null) {
          complete = false
          break
        }
        book += v
      }
    }
    if (complete && book > 0) {
      const v = convertFx(marketValue, mvCcy, bookCurrency, fx)
      weightPct = v !== null ? (v / book) * 100 : null
    }
  }

  return {
    held: pos !== null && pos !== undefined,
    quantity,
    avgCost,
    costCurrency: costCcy,
    price,
    priceCurrency: priceCcy,
    dayChangePct: num(snap?.day_change_pct),
    vsMa50Pct,
    unrealizedGainPct,
    marketValue,
    marketValueCurrency: mvCcy,
    weightPct,
    bookCurrency,
    priceAsOf: typeof snap?.as_of === 'string' ? snap.as_of : null,
  }
}
