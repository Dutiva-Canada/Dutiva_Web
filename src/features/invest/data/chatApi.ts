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
    | 'add_position'
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
  /** Why a downvote landed — set when feedback is -1. */
  feedbackReason?: string | null
  createdAt: string
  /** Client-only — an optimistic user turn whose send threw; the bubble
      keeps the text and offers a retry instead of vanishing. */
  failed?: boolean
}

/** A named conversation — the default thread (threadId null) always exists;
    these are extra ones the user started from the switcher. */
export interface InvestChatThread {
  id: string
  title: string | null
  createdAt: string
}

/** Options every chat call shares — thread scope plus abort for the
    streaming path's stop button. */
export interface InvestChatCallOpts {
  /** null = the default conversation; a uuid = one of chat_threads. */
  threadId?: string | null
  signal?: AbortSignal
}

/** One turn of the book conversation. The server writes both sides to
    invest_chat_messages, so history is consistent across sessions — the
    caller only sends the message and the locale. assistantId is the
    persisted row's id — the client needs it to attach feedback. Pass
    onDelta to stream the reply into the UI as it generates. */
export interface InvestChatSendResult {
  reply: string
  action: InvestChatAction | null
  assistantId: string | null
  /** Short follow-up prompts the reply suggested — ephemeral chips, never
      persisted with the turn. */
  suggests: string[]
}

export async function sendInvestChat(
  message: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
  opts?: InvestChatCallOpts,
): Promise<InvestChatSendResult> {
  const client = requireClient()
  const body = { kind: 'chat', message, lang, threadId: opts?.threadId ?? null }
  const raw = (
    onDelta
      ? await invokeEdgeFnStream(client, 'invest-ai', body, onDelta, opts?.signal)
      : await invokeEdgeFn(client, 'invest-ai', body)
  ) as {
    reply?: string
    action?: InvestChatAction | null
    assistantId?: string | null
    suggests?: unknown
  }
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reply from invest-ai')
  }
  return {
    reply: raw.reply,
    action: raw.action ?? null,
    assistantId: raw.assistantId ?? null,
    suggests: Array.isArray(raw.suggests)
      ? raw.suggests.filter((s): s is string => typeof s === 'string').slice(0, 3)
      : [],
  }
}

/** Re-run the thread's last user turn — the server drops the stale pair
    and answers fresh. Same payload shape as sendInvestChat. */
export async function regenerateInvestChat(
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
  opts?: InvestChatCallOpts,
): Promise<InvestChatSendResult> {
  const client = requireClient()
  const body = { kind: 'chat_regenerate', lang, threadId: opts?.threadId ?? null }
  const raw = (
    onDelta
      ? await invokeEdgeFnStream(client, 'invest-ai', body, onDelta, opts?.signal)
      : await invokeEdgeFn(client, 'invest-ai', body)
  ) as {
    reply?: string
    action?: InvestChatAction | null
    assistantId?: string | null
    suggests?: unknown
  }
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reply from invest-ai')
  }
  return {
    reply: raw.reply,
    action: raw.action ?? null,
    assistantId: raw.assistantId ?? null,
    suggests: Array.isArray(raw.suggests)
      ? raw.suggests.filter((s): s is string => typeof s === 'string').slice(0, 3)
      : [],
  }
}

/** The user's named conversations — the default thread isn't listed; it's
    always selectable as "main". */
export async function listInvestChatThreads(): Promise<InvestChatThread[]> {
  const data = await invokeEdgeFn(requireClient(), 'invest-ai', { kind: 'chat_threads' })
  const rows = (((data as { threads?: unknown } | null)?.threads ?? []) as Record<
    string,
    unknown
  >[])
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    title: typeof r.title === 'string' ? r.title : null,
    createdAt: String(r.created_at ?? ''),
  }))
}

/** Start a named conversation — untitled until its first message lands. */
export async function newInvestChatThread(): Promise<InvestChatThread> {
  const data = await invokeEdgeFn(requireClient(), 'invest-ai', { kind: 'chat_thread_new' })
  const t = (data as { thread?: Record<string, unknown> } | null)?.thread
  if (!t?.id) throw new Error('Thread creation failed')
  return {
    id: String(t.id),
    title: typeof t.title === 'string' ? t.title : null,
    createdAt: String(t.created_at ?? ''),
  }
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
  | { type: 'signal_updated'; status: 'acknowledged' | 'dismissed'; symbol?: string }
  | { type: 'position_logged'; symbol: string; quantity: number }
  | { type: 'account_added'; name: string; kind?: string }

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

/** Thumbs up/down on one assistant turn (1 | -1 | 0 to clear). A downvote
    may carry a one-tap `reason` so the signal says why. Routed through the
    function — it constrains the write to the caller's own assistant rows. */
export async function rateInvestChatTurn(
  messageId: string,
  rating: 1 | -1 | 0,
  reason?: string,
): Promise<void> {
  await invokeEdgeFn(requireClient(), 'invest-ai', {
    kind: 'chat_feedback',
    messageId,
    rating,
    reason,
  })
}

export async function loadInvestChatHistory(
  limit = 60,
  before?: string,
  threadId?: string | null,
): Promise<InvestChatTurn[]> {
  const data = await invokeEdgeFn(requireClient(), 'invest-ai', {
    kind: 'chat_history',
    limit,
    before,
    threadId: threadId ?? null,
  })
  const rows = (((data as { turns?: unknown } | null)?.turns ?? []) as Record<string, unknown>[])
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    role: (r.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: String(r.content ?? ''),
    action: (r.action as InvestChatAction | null) ?? null,
    feedback: typeof r.feedback === 'number' ? r.feedback : null,
    feedbackReason: typeof r.feedback_reason === 'string' ? r.feedback_reason : null,
    createdAt: String(r.created_at ?? ''),
  }))
}

/** Clears the current conversation for the signed-in user — scoped to the
    thread when one is selected. Routed through the function so the table's
    writer stays server-side. */
export async function clearInvestChat(threadId?: string | null): Promise<void> {
  await invokeEdgeFn(requireClient(), 'invest-ai', {
    kind: 'chat_clear',
    threadId: threadId ?? null,
  })
}
