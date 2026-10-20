import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFn, invokeEdgeFnStream } from '@/lib/edgeStream'
import {
  parseChatSources,
  type ChatSourceRow,
} from '@/components/chat/portalChatUtils'

/* ---------- chat — Paige, the desk's press specialist ---------- */

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

/** True when pr-ai refused on the usage guardrail (429 ai_usage_limit).
   The transport differs — FunctionsHttpError carries a context Response,
   the SSE path encodes the status in its message — so check both. */
export function isUsageLimited(err: unknown): boolean {
  if (err instanceof Error && /\b429\b/.test(err.message)) return true
  const ctx = (err as { context?: { status?: number } } | null)?.context
  return ctx?.status === 429
}

/** A write Paige executed on the user's own rows during a turn —
    additive and undoable by design (see pr-ai's action grammar): campaigns
    and content land as drafts, contacts/mentions/keywords/GEO prompts as
    log rows; a campaign status flip restores the previous status on undo. */
export interface PrChatAction {
  type:
    | 'add_campaign'
    | 'add_content_item'
    | 'add_media_contact'
    | 'add_mention'
    | 'add_keyword'
    | 'add_geo_prompt'
    | 'update_campaign_status'
  /** Human-facing subject — the campaign name, contact name, headline. */
  detail: string
  ok: boolean
  /** Row the action created — chat_undo needs it. */
  refId?: string
  /** Set once the write was reversed via chat_undo. */
  undone?: boolean
}

export interface PrChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  action: PrChatAction | null
  /** The model's thinking trace — set on assistant turns when the route
      reasons; null when it doesn't. */
  reasoning?: string | null
  /** What the reply grounded on — coverage rows for the outlets it cites;
      empty when the desk data wasn't the basis. */
  sources?: ChatSourceRow[] | null
  /** 1 = helpful, -1 = not, null = unrated. */
  feedback: number | null
  /** Why a downvote landed — set when feedback is -1. */
  feedbackReason?: string | null
  createdAt: string
  /** Client-only — an optimistic user turn whose send threw; the bubble
      keeps the text and offers a retry instead of vanishing. */
  failed?: boolean
  /** Client-only — an assistant turn stopped mid-stream; its content is a
      prefix of the reply the server still persists. The history poll
      adopts the persisted row into this slot instead of duplicating it. */
  stopped?: boolean
}

/** A named conversation — the default thread (threadId null) always exists;
    these are extra ones the user started from the switcher. */
export interface PrChatThread {
  id: string
  title: string | null
  createdAt: string
}

/** Options every chat call shares — thread scope plus abort for the
    streaming path's stop button. */
export interface PrChatCallOpts {
  threadId?: string | null
  signal?: AbortSignal
  /** Live thinking trace — cumulative text per reasoning piece. Streamed
      path only. */
  onReasoning?: (text: string) => void
  onStatus?: (code: string) => void
}

/** One turn of the desk conversation. The server writes both sides to
    pr_chat_messages, so history is consistent across sessions — the caller
    only sends the message and the locale. assistantId is the persisted
    row's id — the client needs it to attach feedback. Pass onDelta to
    stream the reply into the UI as it generates. */
export interface PrChatSendResult {
  reply: string
  action: PrChatAction | null
  /** The persisted user-row id — adopting it onto the optimistic turn is
     what keeps the history poll from re-adding it as a duplicate. */
  userId: string | null
  assistantId: string | null
  /** Short follow-up prompts the reply suggested — ephemeral chips, never
      persisted with the turn. */
  suggests: string[]
  /** The thinking trace behind the reply — null when none was emitted. */
  reasoning: string | null
  /** Grounding sources behind the reply — the coverage rows it cites. */
  sources: ChatSourceRow[]
}

function toPrChatResult(raw: {
  reply?: string
  action?: PrChatAction | null
  userId?: string | null
  assistantId?: string | null
  suggests?: unknown
  reasoning?: unknown
  sources?: unknown
}): PrChatSendResult {
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reply from pr-ai')
  }
  return {
    reply: raw.reply,
    action: raw.action ?? null,
    userId: raw.userId ?? null,
    assistantId: raw.assistantId ?? null,
    suggests: Array.isArray(raw.suggests)
      ? raw.suggests.filter((s): s is string => typeof s === 'string').slice(0, 3)
      : [],
    reasoning: typeof raw.reasoning === 'string' && raw.reasoning ? raw.reasoning : null,
    sources: parseChatSources(raw.sources),
  }
}

export async function sendPrChat(
  message: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
  opts?: PrChatCallOpts,
): Promise<PrChatSendResult> {
  const client = requireClient()
  const body = { kind: 'chat', message, lang, threadId: opts?.threadId ?? null }
  const raw = (
    onDelta
      ? await invokeEdgeFnStream(
          client, 'pr-ai', body, onDelta, opts?.signal, opts?.onReasoning, opts?.onStatus,
        )
      : await invokeEdgeFn(client, 'pr-ai', body)
  ) as Parameters<typeof toPrChatResult>[0]
  return toPrChatResult(raw)
}

/** Re-run the thread's last user turn — the server drops the stale pair
    and answers fresh. Same payload shape as sendPrChat. */
export async function regeneratePrChat(
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
  opts?: PrChatCallOpts,
): Promise<PrChatSendResult> {
  const client = requireClient()
  const body = { kind: 'chat_regenerate', lang, threadId: opts?.threadId ?? null }
  const raw = (
    onDelta
      ? await invokeEdgeFnStream(
          client, 'pr-ai', body, onDelta, opts?.signal, opts?.onReasoning, opts?.onStatus,
        )
      : await invokeEdgeFn(client, 'pr-ai', body)
  ) as Parameters<typeof toPrChatResult>[0]
  return toPrChatResult(raw)
}

/** The user's named conversations — the default thread isn't listed; it's
    always selectable as "main". */
export async function listPrChatThreads(): Promise<PrChatThread[]> {
  const data = await invokeEdgeFn(requireClient(), 'pr-ai', { kind: 'chat_threads' })
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
export async function newPrChatThread(): Promise<PrChatThread> {
  const data = await invokeEdgeFn(requireClient(), 'pr-ai', { kind: 'chat_thread_new' })
  const t = (data as { thread?: Record<string, unknown> } | null)?.thread
  if (!t?.id) throw new Error('Thread creation failed')
  return {
    id: String(t.id),
    title: typeof t.title === 'string' ? t.title : null,
    createdAt: String(t.created_at ?? ''),
  }
}

/** Rename a named conversation — an empty title resets it to untitled so
    the next first message names it again. */
export async function renamePrChatThread(threadId: string, title: string): Promise<void> {
  await invokeEdgeFn(requireClient(), 'pr-ai', {
    kind: 'chat_thread_rename',
    threadId,
    title,
  })
}

/** Delete a named conversation and its turns. */
export async function deletePrChatThread(threadId: string): Promise<void> {
  await invokeEdgeFn(requireClient(), 'pr-ai', { kind: 'chat_thread_delete', threadId })
}

/** Reverses the write an assistant turn's action made — deletes the row it
    created. The turn keeps a record marked undone. */
export async function undoPrChatAction(messageId: string): Promise<void> {
  await invokeEdgeFn(requireClient(), 'pr-ai', { kind: 'chat_undo', messageId })
}

/* ---------- reactions — Paige noticing what the user just did ---------- */

export type PrReactEvent =
  | { type: 'mention_logged'; title: string; source?: string; sentiment?: string }
  | { type: 'content_saved'; title: string; kind?: string }
  | { type: 'campaign_created'; name: string; channel?: string }
  | { type: 'keyword_tracked'; keyword: string }
  | { type: 'contact_added'; name: string; outlet?: string }

/* Reactions fire a model call per qualifying action — someone saving three
   drafts shouldn't produce three calls. A floor between calls keeps the
   noise and the bill down; a skipped reaction resolves reply:null and the
   page simply stays quiet. */
const REACTION_MIN_INTERVAL_MS = 90_000
let lastReactionAt = 0

/** Test hook — the throttle is module state, which carries between tests. */
export function resetPrReactionThrottle(): void {
  lastReactionAt = 0
}

/** One short reaction to something the user just did elsewhere in the
    portal — a logged mention or a saved content draft. The line is written
    into the conversation too (assistant turn), so it survives the session.
    Callers treat this as best-effort: a failed or throttled reaction never
    blocks the action it responds to — reply comes back null then, and the
    page shows nothing. onDelta streams the line in as it generates. */
export async function sendPrReaction(
  event: PrReactEvent,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
): Promise<{ reply: string | null; assistantId: string | null }> {
  if (Date.now() - lastReactionAt < REACTION_MIN_INTERVAL_MS) {
    return { reply: null, assistantId: null }
  }
  lastReactionAt = Date.now()
  try {
    const client = requireClient()
    const body = { kind: 'react', event, lang }
    const raw = (
      onDelta
        ? await invokeEdgeFnStream(client, 'pr-ai', body, onDelta)
        : await invokeEdgeFn(client, 'pr-ai', body)
    ) as {
      reply?: string
      assistantId?: string | null
    }
    if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
      throw new Error('Empty reaction from pr-ai')
    }
    return { reply: raw.reply, assistantId: raw.assistantId ?? null }
  } catch (e) {
    /* Hand the slot back — a failed call shouldn't silence the next save
       for 90s. */
    lastReactionAt = 0
    throw e
  }
}

/** Thumbs up/down on one assistant turn (1 | -1 | 0 to clear). A downvote
    may carry a one-tap `reason` so the signal says why. Routed through the
    function — it constrains the write to the caller's own assistant rows. */
export async function ratePrChatTurn(
  messageId: string,
  rating: 1 | -1 | 0,
  reason?: string,
): Promise<void> {
  await invokeEdgeFn(requireClient(), 'pr-ai', {
    kind: 'chat_feedback',
    messageId,
    rating,
    reason,
  })
}

export async function loadPrChatHistory(
  limit = 60,
  before?: string,
  threadId?: string | null,
): Promise<PrChatTurn[]> {
  const data = await invokeEdgeFn(requireClient(), 'pr-ai', {
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
    action: (r.action as PrChatAction | null) ?? null,
    reasoning: typeof r.reasoning === 'string' ? r.reasoning : null,
    sources: parseChatSources(r.sources),
    feedback: typeof r.feedback === 'number' ? r.feedback : null,
    feedbackReason: typeof r.feedback_reason === 'string' ? r.feedback_reason : null,
    createdAt: String(r.created_at ?? ''),
  }))
}

/** Clears the current conversation for the signed-in user — scoped to the
    thread when one is selected. Routed through the function so the table's
    writer stays server-side. */
export async function clearPrChat(threadId?: string | null): Promise<void> {
  await invokeEdgeFn(requireClient(), 'pr-ai', {
    kind: 'chat_clear',
    threadId: threadId ?? null,
  })
}
