import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFn, invokeEdgeFnStream } from '@/lib/edgeStream'

/* ---------- chat — Tally, the book's watch clerk ---------- */

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

/** A write Tally executed on the user's own rows during a turn. Orders land
    'queued' — a draft the user executes manually; a strategy lands in the
    review queue disabled. Nothing fills or enables itself. */
export interface InvestChatAction {
  type:
    | 'add_watch_symbol'
    | 'remove_watch_symbol'
    | 'create_order'
    | 'update_signal'
    | 'draft_strategy'
  /** Human-facing subject — the symbol, signal title, strategy name. */
  detail: string
  ok: boolean
  /** Row the action created/toggled — chat_undo needs it. */
  refId?: string
  /** Set once the write was reversed via chat_undo. */
  undone?: boolean
}

export interface InvestChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  action: InvestChatAction | null
  /** 1 = helpful, -1 = not, null = unrated. */
  feedback: number | null
  createdAt: string
}

/** One turn of the book conversation. The server writes both sides to
    invest_chat_messages, so history is consistent across sessions — the
    caller only sends the message and the locale. assistantId is the
    persisted row's id — the client needs it to attach feedback. Pass
    onDelta to stream the reply into the UI as it generates. */
export async function sendInvestChat(
  message: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
): Promise<{ reply: string; action: InvestChatAction | null; assistantId: string | null }> {
  const client = requireClient()
  const body = { kind: 'chat', message, lang }
  const raw = (
    onDelta
      ? await invokeEdgeFnStream(client, 'invest-ai', body, onDelta)
      : await invokeEdgeFn(client, 'invest-ai', body)
  ) as {
    reply?: string
    action?: InvestChatAction | null
    assistantId?: string | null
  }
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reply from invest-ai')
  }
  return { reply: raw.reply, action: raw.action ?? null, assistantId: raw.assistantId ?? null }
}

/** Reverses the write an assistant turn's action made while it's still
    reversible — a queued order untouched, a watch row, a signal status, a
    filed draft. The turn keeps a record marked undone. */
export async function undoInvestChatAction(messageId: string): Promise<void> {
  await invokeEdgeFn(requireClient(), 'invest-ai', { kind: 'chat_undo', messageId })
}

/* ---------- reactions — Tally noticing what the user just did ---------- */

export type InvestReactEvent =
  | { type: 'watch_added'; symbol: string }
  | { type: 'order_queued'; symbol: string; side: 'buy' | 'sell'; quantity: number }

/* Reactions fire a model call per qualifying action — someone watching
   three symbols shouldn't produce three calls. A floor between calls keeps
   the noise and the bill down; a skipped reaction resolves reply:null and
   the page simply stays quiet. */
const REACTION_MIN_INTERVAL_MS = 90_000
let lastReactionAt = 0

/** Test hook — the throttle is module state, which carries between tests. */
export function resetInvestReactionThrottle(): void {
  lastReactionAt = 0
}

/** One short reaction to something the user just did elsewhere in the
    portal — a symbol watched or a draft order queued. The line is written
    into the conversation too (assistant turn), so it survives the session.
    Callers treat this as best-effort: a failed or throttled reaction never
    blocks the action it responds to — reply comes back null then, and the
    page shows nothing. onDelta streams the line in as it generates. */
export async function sendInvestReaction(
  event: InvestReactEvent,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
): Promise<{ reply: string | null; assistantId: string | null }> {
  if (Date.now() - lastReactionAt < REACTION_MIN_INTERVAL_MS) {
    return { reply: null, assistantId: null }
  }
  lastReactionAt = Date.now()
  const client = requireClient()
  const body = { kind: 'react', event, lang }
  const raw = (
    onDelta
      ? await invokeEdgeFnStream(client, 'invest-ai', body, onDelta)
      : await invokeEdgeFn(client, 'invest-ai', body)
  ) as {
    reply?: string
    assistantId?: string | null
  }
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reaction from invest-ai')
  }
  return { reply: raw.reply, assistantId: raw.assistantId ?? null }
}

/** Thumbs up/down on one assistant turn (1 | -1 | 0 to clear). Routed
    through the function — it constrains the write to the caller's own
    assistant rows. */
export async function rateInvestChatTurn(messageId: string, rating: 1 | -1 | 0): Promise<void> {
  await invokeEdgeFn(requireClient(), 'invest-ai', { kind: 'chat_feedback', messageId, rating })
}

export async function loadInvestChatHistory(limit = 60): Promise<InvestChatTurn[]> {
  const data = await invokeEdgeFn(requireClient(), 'invest-ai', { kind: 'chat_history', limit })
  const rows = (((data as { turns?: unknown } | null)?.turns ?? []) as Record<string, unknown>[])
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    role: (r.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: String(r.content ?? ''),
    action: (r.action as InvestChatAction | null) ?? null,
    feedback: typeof r.feedback === 'number' ? r.feedback : null,
    createdAt: String(r.created_at ?? ''),
  }))
}

/** Clears the whole conversation for the signed-in user — routed through the
    function so the table's writer stays server-side. */
export async function clearInvestChat(): Promise<void> {
  await invokeEdgeFn(requireClient(), 'invest-ai', { kind: 'chat_clear' })
}
