import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFn, invokeEdgeFnStream } from '@/lib/edgeStream'
import { CandidateAiDailyLimitError } from './candidateAi'

/* ---------- chat — Claire, the search coach ---------- */

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export interface CandidateChatTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** 1 = helpful, -1 = not, null = unrated. */
  feedback: number | null
  createdAt: string
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
export async function sendCandidateChat(
  message: string,
  lang: 'en' | 'fr',
  onDelta?: (text: string) => void,
): Promise<{ reply: string; assistantId: string | null }> {
  const client = requireClient()
  const body = { kind: 'chat', message, lang }
  let raw: Record<string, unknown>
  try {
    raw = onDelta
      ? await invokeEdgeFnStream(client, 'candidate-ai', body, onDelta)
      : await invokeEdgeFn(client, 'candidate-ai', body)
  } catch (err) {
    rethrowKnown(err)
  }
  const reply = typeof raw.reply === 'string' ? raw.reply : ''
  if (!reply.trim()) throw new Error('Empty reply from candidate-ai')
  return {
    reply,
    assistantId: typeof raw.assistantId === 'string' ? raw.assistantId : null,
  }
}

export async function loadCandidateChatHistory(limit = 60): Promise<CandidateChatTurn[]> {
  const data = await invokeEdgeFn(requireClient(), 'candidate-ai', { kind: 'chat_history', limit })
  const rows = (((data as { turns?: unknown } | null)?.turns ?? []) as Record<string, unknown>[])
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    role: (r.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: String(r.content ?? ''),
    feedback: typeof r.feedback === 'number' ? r.feedback : null,
    createdAt: String(r.created_at ?? ''),
  }))
}

/** Clears the whole conversation for the signed-in user — routed through the
    function so the table's writer stays server-side. */
export async function clearCandidateChat(): Promise<void> {
  await invokeEdgeFn(requireClient(), 'candidate-ai', { kind: 'chat_clear' })
}

/** Thumbs up/down on one assistant turn (1 | -1 | 0 to clear). Routed
    through the function — it constrains the write to the caller's own
    assistant rows. */
export async function rateCandidateChatTurn(
  messageId: string,
  rating: 1 | -1 | 0,
): Promise<void> {
  await invokeEdgeFn(requireClient(), 'candidate-ai', {
    kind: 'chat_feedback',
    messageId,
    rating,
  })
}
