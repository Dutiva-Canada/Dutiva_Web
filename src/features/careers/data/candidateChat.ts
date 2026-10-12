import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFn, invokeEdgeFnStream } from '@/lib/edgeStream'
import { CandidateAiDailyLimitError } from './candidateAi'
import {
  parseChatSources,
  type ChatSourceRow,
} from '@/components/chat/portalChatUtils'

/* ---------- chat — Claire, the search coach ---------- */

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export interface CandidateChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** The model's thinking trace — set on assistant turns when the route
      reasons; null when it doesn't. */
  reasoning?: string | null
  /** What the reply grounded on — the posting rows it names; empty when it
      coached from the profile alone. */
  sources?: ChatSourceRow[] | null
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
export interface CandidateChatThread {
  id: string
  title: string | null
  createdAt: string
}

/** Options every chat call shares — thread scope plus abort for the
    streaming path's stop button. */
export interface CandidateChatCallOpts {
  threadId?: string | null
  signal?: AbortSignal
  /** Live thinking trace — cumulative text per reasoning piece. Streamed
      path only. */
  onReasoning?: (text: string) => void
  onStatus?: (code: string) => void
}

/* invokeEdgeFn throws FunctionsHttpError (status on .context.status);
   invokeEdgeFnStream turns non-2xx into "candidate-ai <status>". Remap the
   daily rail either way to the typed error the AI tools already surface. */
function rethrowKnown(err: unknown): never {
  const status = (err as { context?: { status?: number } }).context?.status
  if (status === 429 || (err instanceof Error && err.message === 'candidate-ai 429')) {
    throw new CandidateAiDailyLimitError()
  }
  throw err
}

/** One turn of the search conversation. The server writes both sides to
    candidate_chat_messages, so history is consistent across sessions — the
    caller only sends the message and the locale. assistantId is the
    persisted row's id — the client needs it to attach feedback. Pass
    onDelta to stream the reply into the UI as it generates. */
export interface CandidateChatSendResult {
  reply: string
  assistantId: string | null
  /** Short follow-up prompts the reply suggested — ephemeral chips, never
      persisted with the turn. */
  suggests: string[]
  /** The thinking trace behind the reply — null when none was emitted. */
  reasoning: string | null
  /** Grounding sources behind the reply — the postings it names. */
  sources: ChatSourceRow[]
}

function toSendResult(raw: Record<string, unknown>): CandidateChatSendResult {
  const reply = typeof raw.reply === 'string' ? raw.reply : ''
  if (!reply.trim()) throw new Error('Empty reply from candidate-ai')
  return {
    reply,
    assistantId: typeof raw.assistantId === 'string' ? raw.assistantId : null,
    suggests: Array.isArray(raw.suggests)
      ? raw.suggests.filter((s): s is string => typeof s === 'string').slice(0, 3)
      : [],
    reasoning: typeof raw.reasoning === 'string' && raw.reasoning ? raw.reasoning : null,
    sources: parseChatSources(raw.sources),
  }
}

export async function sendCandidateChat(
  message: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
  opts?: CandidateChatCallOpts,
): Promise<CandidateChatSendResult> {
  const client = requireClient()
  const body = { kind: 'chat', message, lang, threadId: opts?.threadId ?? null }
  let raw: Record<string, unknown>
  try {
    raw = onDelta
      ? await invokeEdgeFnStream(
          client, 'candidate-ai', body, onDelta, opts?.signal, opts?.onReasoning, opts?.onStatus,
        )
      : await invokeEdgeFn(client, 'candidate-ai', body)
  } catch (err) {
    rethrowKnown(err)
  }
  return toSendResult(raw)
}

/** Re-run the thread's last user turn — the server drops the stale pair
    and answers fresh. Costs a daily call for external accounts. */
export async function regenerateCandidateChat(
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
  opts?: CandidateChatCallOpts,
): Promise<CandidateChatSendResult> {
  const client = requireClient()
  const body = { kind: 'chat_regenerate', lang, threadId: opts?.threadId ?? null }
  let raw: Record<string, unknown>
  try {
    raw = onDelta
      ? await invokeEdgeFnStream(
          client, 'candidate-ai', body, onDelta, opts?.signal, opts?.onReasoning, opts?.onStatus,
        )
      : await invokeEdgeFn(client, 'candidate-ai', body)
  } catch (err) {
    rethrowKnown(err)
  }
  return toSendResult(raw)
}

/** The user's named conversations — the default thread isn't listed; it's
    always selectable as "main". */
export async function listCandidateChatThreads(): Promise<CandidateChatThread[]> {
  const data = await invokeEdgeFn(requireClient(), 'candidate-ai', { kind: 'chat_threads' })
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
export async function newCandidateChatThread(): Promise<CandidateChatThread> {
  const data = await invokeEdgeFn(requireClient(), 'candidate-ai', { kind: 'chat_thread_new' })
  const t = (data as { thread?: Record<string, unknown> } | null)?.thread
  if (!t?.id) throw new Error('Thread creation failed')
  return {
    id: String(t.id),
    title: typeof t.title === 'string' ? t.title : null,
    createdAt: String(t.created_at ?? ''),
  }
}

export async function loadCandidateChatHistory(
  limit = 60,
  before?: string,
  threadId?: string | null,
): Promise<CandidateChatTurn[]> {
  const data = await invokeEdgeFn(requireClient(), 'candidate-ai', {
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
export async function clearCandidateChat(threadId?: string | null): Promise<void> {
  await invokeEdgeFn(requireClient(), 'candidate-ai', {
    kind: 'chat_clear',
    threadId: threadId ?? null,
  })
}

/** Thumbs up/down on one assistant turn (1 | -1 | 0 to clear). A downvote
    may carry a one-tap `reason` so the signal says why. Routed through the
    function — it constrains the write to the caller's own assistant rows. */
export async function rateCandidateChatTurn(
  messageId: string,
  rating: 1 | -1 | 0,
  reason?: string,
): Promise<void> {
  await invokeEdgeFn(requireClient(), 'candidate-ai', {
    kind: 'chat_feedback',
    messageId,
    rating,
    reason,
  })
}
