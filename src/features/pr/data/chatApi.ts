import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFn, invokeEdgeFnStream } from '@/lib/edgeStream'

/* ---------- chat — Paige, the desk's press specialist ---------- */

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
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
  /** 1 = helpful, -1 = not, null = unrated. */
  feedback: number | null
  createdAt: string
}

/** One turn of the desk conversation. The server writes both sides to
    pr_chat_messages, so history is consistent across sessions — the caller
    only sends the message and the locale. assistantId is the persisted
    row's id — the client needs it to attach feedback. Pass onDelta to
    stream the reply into the UI as it generates. */
export async function sendPrChat(
  message: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
): Promise<{ reply: string; action: PrChatAction | null; assistantId: string | null }> {
  const client = requireClient()
  const body = { kind: 'chat', message, lang }
  const raw = (
    onDelta
      ? await invokeEdgeFnStream(client, 'pr-ai', body, onDelta)
      : await invokeEdgeFn(client, 'pr-ai', body)
  ) as {
    reply?: string
    action?: PrChatAction | null
    assistantId?: string | null
  }
  if (typeof raw.reply !== 'string' || raw.reply.trim() === '') {
    throw new Error('Empty reply from pr-ai')
  }
  return { reply: raw.reply, action: raw.action ?? null, assistantId: raw.assistantId ?? null }
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
}

/** Thumbs up/down on one assistant turn (1 | -1 | 0 to clear). Routed
    through the function — it constrains the write to the caller's own
    assistant rows. */
export async function ratePrChatTurn(messageId: string, rating: 1 | -1 | 0): Promise<void> {
  await invokeEdgeFn(requireClient(), 'pr-ai', { kind: 'chat_feedback', messageId, rating })
}

export async function loadPrChatHistory(limit = 60): Promise<PrChatTurn[]> {
  const data = await invokeEdgeFn(requireClient(), 'pr-ai', { kind: 'chat_history', limit })
  const rows = (((data as { turns?: unknown } | null)?.turns ?? []) as Record<string, unknown>[])
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    role: (r.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: String(r.content ?? ''),
    action: (r.action as PrChatAction | null) ?? null,
    feedback: typeof r.feedback === 'number' ? r.feedback : null,
    createdAt: String(r.created_at ?? ''),
  }))
}

/** Clears the whole conversation for the signed-in user — routed through the
    function so the table's writer stays server-side. */
export async function clearPrChat(): Promise<void> {
  await invokeEdgeFn(requireClient(), 'pr-ai', { kind: 'chat_clear' })
}
