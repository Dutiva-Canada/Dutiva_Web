import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import {
  buildReactRepairNote,
  investReactPrompt,
  REACT_FALLBACK_EN,
  REACT_FALLBACK_FR,
  screenReactDraft,
  type InvestReactEvent,
} from './handlers.ts'
import { loadBookContext, modelRoute } from './runtime.ts'
import { json, sseChannel, UPSTREAM_TIMEOUT_MS } from './runtimeShared.ts'

/* ── kind 'react' ─────────────────────────────────────────────────────────
   Tally reacts to what the person just did elsewhere on the book — a
   symbol watched, a draft order queued. No action grammar — one short
   plain-text line that persists to invest_chat_messages so it still exists
   on the next visit; the originating page renders it inline too. */

export function parseInvestReactEvent(raw: unknown): InvestReactEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const ev = raw as Record<string, unknown>
  if (ev.type === 'watch_added') {
    const symbol = typeof ev.symbol === 'string' ? ev.symbol.trim().slice(0, 12) : ''
    if (!symbol) return null
    return { type: 'watch_added', symbol }
  }
  if (ev.type === 'order_queued') {
    const symbol = typeof ev.symbol === 'string' ? ev.symbol.trim().slice(0, 12) : ''
    const side = ev.side === 'buy' || ev.side === 'sell' ? ev.side : null
    const quantity = Number(ev.quantity)
    if (!symbol || !side || !Number.isFinite(quantity) || quantity <= 0) return null
    return { type: 'order_queued', symbol, side, quantity }
  }
  if (ev.type === 'signal_updated') {
    const status = ev.status === 'acknowledged' || ev.status === 'dismissed' ? ev.status : null
    if (!status) return null
    return {
      type: 'signal_updated',
      status,
      symbol: typeof ev.symbol === 'string' ? ev.symbol.trim().slice(0, 12) : undefined,
    }
  }
  if (ev.type === 'position_logged') {
    const symbol = typeof ev.symbol === 'string' ? ev.symbol.trim().slice(0, 12) : ''
    const quantity = Number(ev.quantity)
    if (!symbol || !Number.isFinite(quantity) || quantity <= 0) return null
    return { type: 'position_logged', symbol, quantity }
  }
  if (ev.type === 'account_added') {
    const name = typeof ev.name === 'string' ? ev.name.trim().slice(0, 80) : ''
    if (!name) return null
    return {
      type: 'account_added',
      name,
      kind: typeof ev.kind === 'string' ? ev.kind.slice(0, 20) : undefined,
    }
  }
  if (ev.type === 'cash_recorded') {
    const kind =
      ev.kind === 'deposit' || ev.kind === 'withdrawal' || ev.kind === 'dividend'
        ? ev.kind
        : null
    const amount = Number(ev.amount)
    if (!kind || !Number.isFinite(amount) || amount <= 0) return null
    return {
      type: 'cash_recorded',
      kind,
      amount,
      currency: typeof ev.currency === 'string' ? ev.currency.trim().slice(0, 8).toUpperCase() : undefined,
    }
  }
  if (ev.type === 'recurring_created') {
    const amount = Number(ev.amount)
    const cadence = ev.cadence === 'weekly' || ev.cadence === 'monthly' ? ev.cadence : null
    if (!Number.isFinite(amount) || amount <= 0 || !cadence) return null
    return { type: 'recurring_created', amount, cadence }
  }
  if (ev.type === 'scenario_run') {
    const name = typeof ev.name === 'string' ? ev.name.trim().slice(0, 60) : ''
    if (!name) return null
    const deltaPct = Number(ev.deltaPct)
    return {
      type: 'scenario_run',
      name,
      deltaPct: Number.isFinite(deltaPct) ? deltaPct : undefined,
    }
  }
  if (ev.type === 'split_recorded') {
    const symbol = typeof ev.symbol === 'string' ? ev.symbol.trim().slice(0, 12) : ''
    const ratio = Number(ev.ratio)
    if (!symbol || !Number.isFinite(ratio) || ratio <= 0) return null
    return { type: 'split_recorded', symbol, ratio }
  }
  if (ev.type === 'fill_recorded') {
    const symbol = typeof ev.symbol === 'string' ? ev.symbol.trim().slice(0, 12) : ''
    const quantity = Number(ev.quantity)
    if (!symbol || !Number.isFinite(quantity) || quantity <= 0) return null
    return { type: 'fill_recorded', symbol, quantity }
  }
  return null
}

/** First choice's content from a chat completion, '' when absent. */
const completionText = (body: unknown): string => {
  const content = (body as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]
    ?.message?.content
  return typeof content === 'string' ? content : ''
}

export async function runReact(
  adminClient: SupabaseClient,
  userId: string,
  event: InvestReactEvent,
  lang: 'en' | 'fr',
  stream: boolean,
  advice: boolean,
  showPaywalled = false,
): Promise<Response> {
  const routed = await modelRoute(adminClient)
  if ('error' in routed) return routed.error
  const { route, provider, apiKey } = routed
  const book = await loadBookContext(adminClient, userId, { showPaywalled })
  const prompt = investReactPrompt(event, book.ctx, lang, { advice })

  /* The reaction gets the same screens a chat reply gets — the prompt feeds
     it market rows, so it can misquote them, and the external tier's no-
     advice line applies here too. Upstream stays buffered in every mode: a
     streamed piece can't be un-sent once the client holds it, so only the
     screened text goes out — at most one repair round between draft and
     send. */
  const callModel = (draft?: string, repairNote?: string): Promise<Response> => {
    const messages = [{ role: 'user', content: prompt }]
    if (draft) messages.push({ role: 'assistant', content: draft })
    if (repairNote) messages.push({ role: 'system', content: repairNote })
    return postChatCompletion(
      provider,
      apiKey,
      { model: route.model_name, messages, temperature: 0.5, max_tokens: 160, stream: false },
      UPSTREAM_TIMEOUT_MS,
    )
  }

  /* Draft → screen → (one repair if flagged) → final text. A draft still
     flagged after its repair ships as the neutral fallback — a reaction is
     garnish, never worth a wrong number or a stray recommendation. */
  const finalize = async (draft: string): Promise<string> => {
    let screen = screenReactDraft(draft, book.ctx.market, lang, advice)
    if (screen.mismatches.length === 0 && screen.adviceFlags.length === 0) return draft
    try {
      const repairUpstream = await callModel(draft, buildReactRepairNote(screen, lang))
      if (repairUpstream.ok) {
        const repaired = completionText(await repairUpstream.json()).trim()
        if (repaired) {
          screen = screenReactDraft(repaired, book.ctx.market, lang, advice)
          if (screen.mismatches.length === 0 && screen.adviceFlags.length === 0) return repaired
          console.warn('invest-ai react: residual flags after repair', JSON.stringify(screen))
        }
      }
    } catch (e) {
      console.warn('invest-ai react: repair call failed', e)
    }
    return lang === 'fr' ? REACT_FALLBACK_FR : REACT_FALLBACK_EN
  }

  let upstream: Response
  try {
    upstream = await callModel()
  } catch (error) {
    console.error('invest-ai react: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.', code: 'upstream' }, 502)
  }
  if (!upstream.ok) {
    return json({ error: 'The AI service is temporarily unavailable.', code: 'upstream' }, 502)
  }

  const draft = completionText(await upstream.json()).trim()
  if (!draft) return json({ error: 'Model returned empty text', code: 'empty' }, 502)
  const reply = await finalize(draft)

  if (stream) {
    const sse = sseChannel()
    void (async () => {
      try {
        sse.send({ type: 'delta', text: reply })
        const { data: row } = await adminClient
          .from('invest_chat_messages')
          .insert({ user_id: userId, role: 'assistant', content: reply })
          .select('id')
          .single()
        sse.send({ type: 'done', reply, assistantId: row?.id ?? null })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const { data: row } = await adminClient
    .from('invest_chat_messages')
    .insert({ user_id: userId, role: 'assistant', content: reply })
    .select('id')
    .single()
  return json({ reply, assistantId: row?.id ?? null })
}
