import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  buildDraftPrompt,
  buildThesisDraftPrompt,
  draftSystemPrompt,
  parseDraft,
  parseThesisDraft,
  resolveInvestRef,
  sanitizeGoal,
  THESIS_SYSTEM_PROMPT,
  type InvestChatAction,
} from './handlers.ts'
import { json, UPSTREAM_TIMEOUT_MS } from './runtimeShared.ts'
import { fetchOnDemandMarket } from './marketFetch.ts'
import { loadPersonalContext, loadPositionFacts } from './personalContext.ts'
import { convertFx, fetchFxTable } from '../invest-bot/fx.ts'

/* The action lifecycle for Tally's chat — the whitelisted write path
   (executeChatAction) plus its reversal (undoChatAction / runChatUndo).
   An order lands 'queued' — a draft the user executes themselves from the
   Orders tab; the function never fills it. */

export interface ExecutedAction {
  type: string
  /** Human-facing subject — the symbol, signal title, etc. */
  detail: string
  ok: boolean
  /** Row id of the created/toggled row — lets the client offer undo. */
  refId?: string
  /** The watch row remove_watch_symbol deleted — undo re-inserts it. */
  restore?: { symbol: string; name: string; asset_class: string }
  /** The status update_signal replaced — undo puts it back. */
  prevStatus?: string
  /** The position numbers record_split rewrote — undo restores them. */
  prevPosition?: { quantity: number; avg_cost: number }
  /** Set once chat_undo reverses the write — the client hides the chip. */
  undone?: boolean
}

type Provider = Parameters<typeof postChatCompletion>[0]

/** Resolve the held row a dividend or split lands on — the symbol narrows
    to held positions, an account name scopes further. Ambiguous or absent
    → null so the caller reports ok:false instead of touching the wrong row. */
function resolveHeldPosition(
  positions: NonNullable<ChatActionDeps['positions']>,
  symbol: string,
  accountName: string | undefined,
  accounts: { id: string; name: string }[],
): NonNullable<ChatActionDeps['positions']>[number] | null {
  const sym = symbol.trim().toUpperCase()
  let candidates = positions.filter((p) => p.symbol.toUpperCase() === sym)
  if (accountName) {
    const hit = resolveInvestRef(accountName, accounts)
    if (!hit?.id) return null
    candidates = candidates.filter((p) => p.account_id === hit.id)
  }
  return candidates.length === 1 ? candidates[0] : null
}

/* A just-added symbol has no market row yet — pull one quote now so the
   position and the next chat turn see a real price instead of an empty
   column until the scheduled sync. Best-effort: a failed pull just waits
   for the sync. */
async function priceFreshSymbol(
  adminClient: SupabaseClient,
  userId: string,
  symbol: string,
  assetClass: string,
): Promise<void> {
  try {
    const [entry] = await fetchOnDemandMarket([symbol])
    if (!entry?.price) return
    const asOf = entry.asOf ?? new Date().toISOString()
    await adminClient.from('invest_market_snapshots').upsert(
      {
        user_id: userId,
        asset_class: assetClass,
        symbol: entry.symbol,
        price: entry.price,
        day_change_pct: entry.dayChangePct,
        ma50: entry.ma50,
        ma200: entry.ma200,
        rsi14: entry.rsi14,
        ret_1m: entry.ret1m,
        ret_3m: entry.ret3m,
        ret_12m: entry.ret12m,
        vol_20d: entry.vol20d,
        high_52w: entry.high52w,
        low_52w: entry.low52w,
        fundamentals: entry.fundamentals,
        fundamentals_as_of: entry.fundamentals ? asOf : null,
        currency: entry.currency,
        source: 'chat-add',
        as_of: asOf,
      },
      { onConflict: 'user_id,asset_class,symbol' },
    )
    await adminClient
      .from('invest_positions')
      .update({ last_price: entry.price, last_price_at: asOf })
      .eq('user_id', userId)
      .eq('asset_class', assetClass)
      .eq('symbol', entry.symbol)
  } catch {
    /* the scheduled sync retries — an unpriced add is not an action failure */
  }
}

export interface ChatActionDeps {
  accounts: { id: string; name: string; kind: string; base_currency?: string; cash_balance?: number }[]
  watchlist: { id: string; symbol: string; asset_class: string; name: string }[]
  signals: { id: string; title: string; status: string }[]
  /** Held rows — dividend/split bookkeeping and thesis drafts resolve
      symbols against them. */
  positions?: {
    id: string
    account_id: string
    asset_class: string
    symbol: string
    name: string
    quantity: number
    avg_cost: number
    currency: string
  }[]
  route: { model_name: string; config?: Record<string, unknown> | null }
  provider: Provider
  apiKey: string | null
  lang: 'en' | 'fr'
  /** Internal-staff tier — the drafter may aim at the goal's advice. */
  advice: boolean
}

/** Execute a whitelisted action on the caller's own rows. An order lands
    'queued' — a draft the user executes themselves from the Orders tab; the
    function never fills it. A failure reports ok:false so the reply lands.
    Undo metadata rides along: refId, the restore row for a watch removal,
    the previous status for a signal update. */
export async function executeChatAction(
  adminClient: SupabaseClient,
  userId: string,
  action: InvestChatAction,
  deps: ChatActionDeps,
): Promise<ExecutedAction> {
  switch (action.type) {
    case 'add_watch_symbol': {
      const assetClass = action.assetClass ?? 'equity'
      /* Already watched — nothing to write. The upsert would overwrite the
         row's name with the action's (or '') AND return the existing row's
         id as refId, so Undo would delete a watch entry the holder added
         long before this turn. ok:true with no refId renders no chip. */
      const existing = deps.watchlist.find(
        (w) =>
          w.symbol.toUpperCase() === action.symbol.toUpperCase() &&
          w.asset_class === assetClass,
      )
      if (existing) {
        return { type: action.type, detail: action.symbol, ok: true }
      }
      const { data, error } = await adminClient
        .from('invest_watchlist')
        .upsert(
          {
            user_id: userId,
            asset_class: assetClass,
            symbol: action.symbol,
            name: action.name ?? '',
          },
          { onConflict: 'user_id,asset_class,symbol' },
        )
        .select('id')
        .single()
      if (!error) {
        await priceFreshSymbol(adminClient, userId, action.symbol, assetClass)
      }
      return { type: action.type, detail: action.symbol, ok: !error, refId: data?.id }
    }
    case 'remove_watch_symbol': {
      const target = resolveInvestRef(
        action.symbol,
        deps.watchlist as { id?: string; name?: string; symbol?: string }[],
      )
      if (!target?.id) return { type: action.type, detail: action.symbol, ok: false }
      const row = deps.watchlist.find((w) => w.id === target.id)
      const { error } = await adminClient
        .from('invest_watchlist')
        .delete()
        .eq('id', target.id)
        .eq('user_id', userId)
      return {
        type: action.type,
        detail: action.symbol,
        ok: !error,
        refId: target.id,
        /* What undo puts back — the delete throws the row away otherwise. */
        restore: row
          ? { symbol: String(row.symbol), name: String(row.name ?? ''), asset_class: String(row.asset_class) }
          : undefined,
      }
    }
    case 'create_order': {
      /* Resolve the account: named one wins; a single active account is the
         default. More than one unnamed → ask rather than guess. */
      const accounts = deps.accounts
      let accountId: string | null = null
      if (action.account) {
        const hit = resolveInvestRef(action.account, accounts)
        if (!hit?.id) return { type: action.type, detail: action.symbol, ok: false }
        accountId = hit.id
      } else if (accounts.length === 1) {
        accountId = accounts[0]!.id
      } else if (accounts.length === 0) {
        return { type: action.type, detail: action.symbol, ok: false }
      } else {
        return { type: action.type, detail: `${action.symbol} — account unclear`, ok: false }
      }
      const account = accounts.find((a) => a.id === accountId)
      const mode =
        action.mode ?? (account?.kind === 'paper' ? 'paper' : account?.kind === 'live' ? 'live' : 'paper')
      /* asset_class follows the watchlist row when the symbol is tracked —
         otherwise 'equity' is the table's default guess. */
      const watched = deps.watchlist.find(
        (w) => w.symbol.toUpperCase() === action.symbol.toUpperCase(),
      )
      /* The order lands 'queued' — the same draft state the bot's own
         proposals ship in. Nothing fills it but the Orders tab's manual
         execute action. */
      const { data, error } = await adminClient
        .from('invest_orders')
        .insert({
          user_id: userId,
          account_id: accountId,
          asset_class: watched?.asset_class ?? 'equity',
          symbol: action.symbol,
          name: action.symbol,
          side: action.side,
          quantity: action.quantity,
          order_type: action.orderType ?? 'market',
          limit_price: action.orderType === 'limit' ? (action.limitPrice ?? null) : null,
          mode,
          status: 'queued',
          note: action.note ?? null,
        })
        .select('id')
        .single()
      return {
        type: action.type,
        detail: `${action.side} ${action.quantity} ${action.symbol}`,
        ok: !error,
        refId: data?.id,
      }
    }
    case 'update_signal': {
      const target = deps.signals.find((s) => s.id === action.signalId)
      if (!target) return { type: action.type, detail: action.signalId, ok: false }
      const { error } = await adminClient
        .from('invest_signals')
        .update({ status: action.status })
        .eq('id', action.signalId)
        .eq('user_id', userId)
      return {
        type: action.type,
        detail: target.title || action.signalId,
        ok: !error,
        refId: action.signalId,
        prevStatus: target.status,
      }
    }
    case 'add_position': {
      /* Log a holding the person says they already have — a record, not an
         order. Insert-only: if the account already holds this symbol/class
         the chat refuses rather than overwriting their numbers — fixing
         quantities stays the Portfolio page's job. */
      const accounts = deps.accounts
      let accountId: string | null = null
      if (action.account) {
        const hit = resolveInvestRef(action.account, accounts)
        if (!hit?.id) return { type: action.type, detail: action.symbol, ok: false }
        accountId = hit.id
      } else if (accounts.length === 1) {
        accountId = accounts[0]!.id
      } else if (accounts.length === 0) {
        return { type: action.type, detail: action.symbol, ok: false }
      } else {
        return { type: action.type, detail: `${action.symbol} — account unclear`, ok: false }
      }
      const assetClass = action.assetClass ?? 'equity'
      const { data: existing } = await adminClient
        .from('invest_positions')
        .select('id')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .eq('asset_class', assetClass)
        .eq('symbol', action.symbol)
        .maybeSingle()
      if (existing) {
        return { type: action.type, detail: `${action.symbol} — already held`, ok: false }
      }
      const { data, error } = await adminClient
        .from('invest_positions')
        .insert({
          user_id: userId,
          account_id: accountId,
          asset_class: assetClass,
          symbol: action.symbol,
          name: action.name ?? action.symbol,
          quantity: action.quantity,
          avg_cost: action.avgCost,
          currency: action.currency ?? 'CAD',
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (!error) await priceFreshSymbol(adminClient, userId, action.symbol, assetClass)
      return {
        type: action.type,
        detail: `${action.quantity} ${action.symbol}`,
        ok: !error,
        refId: data?.id,
      }
    }
    case 'draft_strategy': {
      /* Run the existing draft pipeline — the model authors a draft the
         same way the wizard does, then files it for review. The holder's
         mandate and confirmed memories ride along here too — a draft
         asked for in conversation is the most personal surface of all. */
      const goal = sanitizeGoal(action.goal)
      if (!goal) return { type: action.type, detail: action.goal, ok: false }
      const personal = await loadPersonalContext(adminClient, userId)
      let upstream: Response
      try {
        upstream = await postChatCompletion(
          deps.provider,
          deps.apiKey,
          {
            model: deps.route.model_name,
            messages: [
              { role: 'system', content: draftSystemPrompt(deps.advice) },
              { role: 'user', content: buildDraftPrompt(goal, deps.lang, personal) },
            ],
            max_tokens: deps.route.config?.max_tokens ?? 900,
            temperature: 0.3,
          },
          UPSTREAM_TIMEOUT_MS,
        )
      } catch {
        return { type: action.type, detail: goal, ok: false }
      }
      if (!upstream.ok) return { type: action.type, detail: goal, ok: false }
      const completion = await upstream.json()
      const content = completion?.choices?.[0]?.message?.content
      const draft = typeof content === 'string' ? parseDraft(content) : null
      if (!draft) return { type: action.type, detail: goal, ok: false }
      const shipped = { ...draft, enabled: false, autonomy: 'suggest', template: 'ai-draft' }
      const filed = await fileSuggestion(adminClient, {
        userId,
        surface: 'invest',
        kind: 'strategy',
        title: shipped.name,
        payload: { goal, draft: shipped },
        dedupeKey: textDedupeKey(goal),
      })
      return { type: action.type, detail: shipped.name, ok: true, refId: filed?.id ?? undefined }
    }
    case 'draft_thesis': {
      /* Same pipeline the Theses page's "Draft with Tally" runs — the
         brief is built from the position's facts when the person holds it.
         The draft files to the review queue; nothing persists until they
         save it there. */
      const pos = deps.positions?.find(
        (p) => p.symbol.toUpperCase() === action.symbol.toUpperCase(),
      )
      const description = pos
        ? `I hold ${pos.quantity} ${pos.symbol} at an average cost of ${pos.avg_cost} ${pos.currency || 'CAD'}.`
        : `${action.name ?? action.symbol} — a holding I'm tracking.`
      /* Same personalization the page-side draft gets — profile dims and
         the live tape reads, so the bounds fit this holder and this
         position. */
      const [personal, chatFacts] = await Promise.all([
        loadPersonalContext(adminClient, userId),
        loadPositionFacts(
          adminClient,
          userId,
          pos?.asset_class ?? 'equity',
          action.symbol,
        ),
      ])
      let upstream: Response
      try {
        upstream = await postChatCompletion(
          deps.provider,
          deps.apiKey,
          {
            model: deps.route.model_name,
            messages: [
              { role: 'system', content: THESIS_SYSTEM_PROMPT },
              {
                role: 'user',
                content: buildThesisDraftPrompt(
                  {
                    symbol: action.symbol,
                    name: action.name ?? pos?.name ?? '',
                    description,
                  },
                  deps.lang,
                  personal.memories,
                  personal.mandate,
                  personal.profile,
                  chatFacts,
                ),
              },
            ],
            max_tokens: deps.route.config?.max_tokens ?? 900,
            temperature: 0.3,
          },
          UPSTREAM_TIMEOUT_MS,
        )
      } catch {
        return { type: action.type, detail: action.symbol, ok: false }
      }
      if (!upstream.ok) return { type: action.type, detail: action.symbol, ok: false }
      const completion = await upstream.json()
      const content = completion?.choices?.[0]?.message?.content
      const draft = typeof content === 'string' ? parseThesisDraft(content) : null
      if (!draft) return { type: action.type, detail: action.symbol, ok: false }
      const filed = await fileSuggestion(adminClient, {
        userId,
        surface: 'invest',
        kind: 'thesis',
        title: `${action.symbol} thesis`,
        payload: {
          asset_class: pos?.asset_class ?? 'equity',
          symbol: action.symbol,
          name: action.name ?? pos?.name ?? '',
          description,
          seed: {
            thesis: draft.thesis,
            intent: draft.intent,
            break_rules: draft.break_rules,
            drift_rules: draft.drift_rules,
          },
        },
        /* The same dedupe key the scaffold and the page's draft use — a
           chat draft supersedes whatever sat there. */
        dedupeKey: `thesis:${pos?.asset_class ?? 'equity'}:${action.symbol}`,
        dedupeMode: 'supersede',
      })
      return {
        type: action.type,
        detail: `${action.symbol} — draft filed for review`,
        ok: true,
        refId: filed?.id ?? undefined,
      }
    }
    case 'set_goal': {
      const { data, error } = await adminClient
        .from('invest_goals')
        .insert({
          user_id: userId,
          title: action.title.slice(0, 120),
          detail: '',
          metric: action.metric,
          op: action.op,
          target: action.target,
          deadline: action.deadline ?? null,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      return { type: action.type, detail: action.title, ok: !error, refId: data?.id }
    }
    case 'record_cash': {
      const accounts = deps.accounts
      let accountId: string | null = null
      if (action.account) {
        const hit = resolveInvestRef(action.account, accounts)
        if (!hit?.id) return { type: action.type, detail: action.kind, ok: false }
        accountId = hit.id
      } else if (accounts.length === 1) {
        accountId = accounts[0]!.id
      } else {
        return { type: action.type, detail: `${action.kind} — account unclear`, ok: false }
      }
      const account = accounts.find((a) => a.id === accountId)
      /* Ledger invariant: cash events are denominated in the account's
         base currency — the balance move and undo's reversal both read
         amount raw. A stated foreign currency converts at write time;
         no rate → the action fails rather than book 1:1. The original
         `amount CCY` goes in the note as the audit trail. */
      const accCcy = String(account?.base_currency ?? 'CAD').toUpperCase()
      const eventCcy = String(action.currency ?? accCcy).toUpperCase()
      let amount = action.amount
      let note = action.note ?? ''
      if (eventCcy !== accCcy) {
        const converted = convertFx(amount, eventCcy, accCcy, await fetchFxTable())
        if (converted === null) {
          return {
            type: action.type,
            detail: `${action.kind} — no ${eventCcy}->${accCcy} rate`,
            ok: false,
          }
        }
        amount = converted
        const orig = `${action.amount} ${eventCcy}`
        if (!note.includes(orig)) note = note ? `${note} (${orig})` : orig
      }
      const delta = action.kind === 'withdrawal' ? -amount : amount
      const balance = Number(account?.cash_balance ?? 0) + delta
      /* Same guard the ledger form enforces — a withdrawal can't overdraw. */
      if (balance < 0) {
        return { type: action.type, detail: `${action.kind} — exceeds cash balance`, ok: false }
      }
      const { data: ev, error } = await adminClient
        .from('invest_cash_events')
        .insert({
          user_id: userId,
          account_id: accountId,
          kind: action.kind,
          amount,
          currency: accCcy,
          occurred_at: new Date().toISOString().slice(0, 10),
          note,
        })
        .select('id')
        .single()
      if (error) return { type: action.type, detail: action.kind, ok: false }
      /* The compensating pair the client api uses — an event without its
         balance move reads the money twice. */
      const { error: balErr } = await adminClient
        .from('invest_accounts')
        .update({ cash_balance: balance, updated_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('user_id', userId)
      if (balErr) {
        await adminClient
          .from('invest_cash_events')
          .delete()
          .eq('id', ev.id)
          .eq('user_id', userId)
        return { type: action.type, detail: action.kind, ok: false }
      }
      return {
        type: action.type,
        detail: `${action.kind} ${action.amount}`,
        ok: true,
        refId: ev?.id,
      }
    }
    case 'set_recurring': {
      const accounts = deps.accounts
      let accountId: string | null = null
      if (action.account) {
        const hit = resolveInvestRef(action.account, accounts)
        if (!hit?.id) return { type: action.type, detail: 'recurring', ok: false }
        accountId = hit.id
      } else if (accounts.length === 1) {
        accountId = accounts[0]!.id
      } else {
        return { type: action.type, detail: 'recurring — account unclear', ok: false }
      }
      const account = accounts.find((a) => a.id === accountId)
      const { data, error } = await adminClient
        .from('invest_recurring_contributions')
        .insert({
          user_id: userId,
          account_id: accountId,
          amount: action.amount,
          currency: action.currency ?? account?.base_currency ?? 'CAD',
          cadence: action.cadence,
          next_run_on: action.nextRunOn ?? new Date().toISOString().slice(0, 10),
          note: action.note ?? '',
          enabled: true,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      return {
        type: action.type,
        detail: `${action.amount} ${action.cadence}`,
        ok: !error,
        refId: data?.id,
      }
    }
    case 'record_dividend': {
      const pos = resolveHeldPosition(deps.positions ?? [], action.symbol, action.account, deps.accounts)
      if (!pos) return { type: action.type, detail: action.symbol, ok: false }
      /* perShare × held quantity is the normal math; a stated flat total
         books as-is. Either way the position must exist — checked above. */
      const amount =
        action.total ?? Math.round(action.perShare! * pos.quantity * 100) / 100
      const { data: account } = await adminClient
        .from('invest_accounts')
        .select('cash_balance, base_currency')
        .eq('id', pos.account_id)
        .eq('user_id', userId)
        .maybeSingle()
      /* The dividend is declared in the position's currency; the ledger
         invariant stores the account-base equivalent — convert or fail. */
      const accCcy = String(account?.base_currency ?? 'CAD').toUpperCase()
      const posCcy = String(pos.currency || 'CAD').toUpperCase()
      let amountBase = amount
      if (posCcy !== accCcy) {
        const converted = convertFx(amount, posCcy, accCcy, await fetchFxTable())
        if (converted === null) {
          return {
            type: action.type,
            detail: `${action.symbol} dividend — no ${posCcy}->${accCcy} rate`,
            ok: false,
          }
        }
        amountBase = converted
      }
      const balance = Number(account?.cash_balance ?? 0) + amountBase
      const { data: ev, error } = await adminClient
        .from('invest_cash_events')
        .insert({
          user_id: userId,
          account_id: pos.account_id,
          kind: 'dividend',
          amount: amountBase,
          currency: accCcy,
          occurred_at: new Date().toISOString().slice(0, 10),
          note:
            posCcy !== accCcy
              ? `${pos.symbol} — ${amount} ${posCcy}` +
                (action.perShare !== undefined ? ` (${action.perShare} × ${pos.quantity})` : '')
              : action.perShare !== undefined
                ? `${pos.symbol} — ${action.perShare} × ${pos.quantity}`
                : `${pos.symbol} dividend`,
        })
        .select('id')
        .single()
      if (error) return { type: action.type, detail: action.symbol, ok: false }
      const { error: balErr } = await adminClient
        .from('invest_accounts')
        .update({ cash_balance: balance, updated_at: new Date().toISOString() })
        .eq('id', pos.account_id)
        .eq('user_id', userId)
      if (balErr) {
        await adminClient
          .from('invest_cash_events')
          .delete()
          .eq('id', ev.id)
          .eq('user_id', userId)
        return { type: action.type, detail: action.symbol, ok: false }
      }
      return {
        type: action.type,
        detail: `${action.symbol} dividend ${amount}`,
        ok: true,
        refId: ev?.id,
      }
    }
    case 'record_split': {
      const pos = resolveHeldPosition(deps.positions ?? [], action.symbol, action.account, deps.accounts)
      if (!pos) return { type: action.type, detail: action.symbol, ok: false }
      const { error } = await adminClient
        .from('invest_positions')
        .update({
          quantity: pos.quantity * action.ratio,
          avg_cost: pos.avg_cost / action.ratio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pos.id)
        .eq('user_id', userId)
      return {
        type: action.type,
        detail: `${action.symbol} ${action.ratio}:1`,
        ok: !error,
        refId: pos.id,
        prevPosition: { quantity: pos.quantity, avg_cost: pos.avg_cost },
      }
    }
  }
}

/* ── kind 'chat_undo' ────────────────────────────────────────────────────
   Reverses what an assistant turn's action wrote, where the write is still
   reversible: a queued order that hasn't moved, a watch row (deleted or
   added), a signal status, a filed strategy suggestion. Anything that has
   since changed hands — an executed order — reports not_undoable rather
   than rewriting it. The action payload sits on the assistant message
   row; undo marks it undone there so a reload doesn't offer the chip. */

export async function undoChatAction(
  adminClient: SupabaseClient,
  userId: string,
  action: ExecutedAction,
): Promise<boolean> {
  switch (action.type) {
    case 'add_watch_symbol': {
      const { error } = await adminClient
        .from('invest_watchlist')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'remove_watch_symbol': {
      if (!action.restore?.symbol) return false
      const { error } = await adminClient
        .from('invest_watchlist')
        .upsert(
          {
            user_id: userId,
            asset_class: action.restore.asset_class,
            symbol: action.restore.symbol,
            name: action.restore.name,
          },
          { onConflict: 'user_id,asset_class,symbol' },
        )
      return !error
    }
    case 'create_order': {
      /* Only while it is still a draft — once the person executed or
         cancelled it the order is theirs, not ours to delete. */
      const { data: order, error: readError } = await adminClient
        .from('invest_orders')
        .select('status')
        .eq('id', action.refId as string)
        .eq('user_id', userId)
        .maybeSingle()
      if (readError || !order || !['draft', 'queued'].includes(String(order.status))) return false
      const { error } = await adminClient
        .from('invest_orders')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'update_signal': {
      if (typeof action.prevStatus !== 'string') return false
      const { error } = await adminClient
        .from('invest_signals')
        .update({ status: action.prevStatus })
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'add_position': {
      /* Insert-only by construction, so undo is a clean delete — but not if
         the position has since been priced or edited... a delete is still
         right: the row exists only because chat made it. */
      const { error } = await adminClient
        .from('invest_positions')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'draft_strategy':
    case 'draft_thesis': {
      const { error } = await adminClient
        .from('agent_suggestions')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'set_goal': {
      const { error } = await adminClient
        .from('invest_goals')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'set_recurring': {
      const { error } = await adminClient
        .from('invest_recurring_contributions')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'record_cash':
    case 'record_dividend': {
      /* Reverse the balance move first, then the event — mirrors the
         ledger's own delete path so row and balance can't disagree. */
      const { data: ev } = await adminClient
        .from('invest_cash_events')
        .select('account_id, kind, amount')
        .eq('id', action.refId as string)
        .eq('user_id', userId)
        .maybeSingle()
      if (!ev) return false
      const { data: account } = await adminClient
        .from('invest_accounts')
        .select('cash_balance')
        .eq('id', ev.account_id as string)
        .eq('user_id', userId)
        .maybeSingle()
      if (!account) return false
      const reverse = ev.kind === 'withdrawal' ? Number(ev.amount) : -Number(ev.amount)
      const restored = Number(account.cash_balance) + reverse
      const { error: balErr } = await adminClient
        .from('invest_accounts')
        .update({ cash_balance: restored, updated_at: new Date().toISOString() })
        .eq('id', ev.account_id as string)
        .eq('user_id', userId)
      if (balErr) return false
      const { error } = await adminClient
        .from('invest_cash_events')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      if (error) {
        await adminClient
          .from('invest_accounts')
          .update({
            cash_balance: Number(account.cash_balance),
            updated_at: new Date().toISOString(),
          })
          .eq('id', ev.account_id as string)
          .eq('user_id', userId)
      }
      return !error
    }
    case 'record_split': {
      if (!action.prevPosition) return false
      const { error } = await adminClient
        .from('invest_positions')
        .update({
          quantity: action.prevPosition.quantity,
          avg_cost: action.prevPosition.avg_cost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    default:
      return false
  }
}

export async function runChatUndo(
  adminClient: SupabaseClient,
  userId: string,
  messageId: string,
): Promise<Response> {
  const { data: msg, error } = await adminClient
    .from('invest_chat_messages')
    .select('id, action')
    .eq('id', messageId)
    .eq('user_id', userId)
    .eq('role', 'assistant')
    .maybeSingle()
  if (error) return json({ error: error.message }, 500)
  const action = (msg?.action ?? null) as ExecutedAction | null
  if (!msg || !action || !action.ok || action.undone === true || !action.refId) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  if (!(await undoChatAction(adminClient, userId, action))) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  const { error: markError } = await adminClient
    .from('invest_chat_messages')
    .update({ action: { ...action, undone: true } })
    .eq('id', messageId)
    .eq('user_id', userId)
  if (markError) return json({ error: markError.message }, 500)
  return json({ ok: true })
}
