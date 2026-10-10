import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  buildDraftPrompt,
  draftSystemPrompt,
  parseDraft,
  resolveInvestRef,
  sanitizeGoal,
  type InvestChatAction,
} from './handlers.ts'
import { json, UPSTREAM_TIMEOUT_MS } from './runtimeShared.ts'

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
  /** Set once chat_undo reverses the write — the client hides the chip. */
  undone?: boolean
}

type Provider = Parameters<typeof postChatCompletion>[0]

export interface ChatActionDeps {
  accounts: { id: string; name: string; kind: string }[]
  watchlist: { id: string; symbol: string; asset_class: string; name: string }[]
  signals: { id: string; title: string; status: string }[]
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
      const { data, error } = await adminClient
        .from('invest_watchlist')
        .upsert(
          {
            user_id: userId,
            asset_class: action.assetClass ?? 'equity',
            symbol: action.symbol,
            name: action.name ?? '',
          },
          { onConflict: 'user_id,asset_class,symbol' },
        )
        .select('id')
        .single()
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
          currency: 'CAD',
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      return {
        type: action.type,
        detail: `${action.quantity} ${action.symbol}`,
        ok: !error,
        refId: data?.id,
      }
    }
    case 'draft_strategy': {
      /* Run the existing draft pipeline — the model authors a draft the
         same way the wizard does, then files it for review. */
      const goal = sanitizeGoal(action.goal)
      if (!goal) return { type: action.type, detail: action.goal, ok: false }
      let upstream: Response
      try {
        upstream = await postChatCompletion(
          deps.provider,
          deps.apiKey,
          {
            model: deps.route.model_name,
            messages: [
              { role: 'system', content: draftSystemPrompt(deps.advice) },
              { role: 'user', content: buildDraftPrompt(goal, deps.lang) },
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
  }
}

/* ── kind 'chat_undo' ────────────────────────────────────────────────────
   Reverses what an assistant turn's action wrote, where the write is still
   reversible: a queued order that hasn't moved, a watch row (deleted or
   added), a signal status, a filed strategy suggestion. Anything that has
   since changed hands — an executed order — reports not_undoable rather
   than rewriting it. The action payload sits on the assistant message
   row; undo marks it undone there so a reload doesn't offer the chip. */

async function undoChatAction(
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
    case 'draft_strategy': {
      const { error } = await adminClient
        .from('agent_suggestions')
        .delete()
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
