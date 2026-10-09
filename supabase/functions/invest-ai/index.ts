import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient as SbClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { withCors } from '../_shared/cors.ts'
import {
  buildDraftPrompt,
  parseDraft,
  sanitizeGoal,
  SYSTEM_PROMPT,
  validateAiAction,
} from './handlers.ts'
import {
  json,
  modelRoute,
  runChat,
  runChatUndo,
  UPSTREAM_TIMEOUT_MS,
} from './runtime.ts'
import { parseInvestReactEvent, runReact } from './reactRuntime.ts'

/**
 * invest-ai — AI assistance for the invest portal, in Tally's voice.
 * Deliberately narrow: the model *authors* strategy drafts; the
 * deterministic invest-bot engine executes them. A draft is validated
 * server-side, returned disabled, and only reaches the book after the user
 * reviews and saves it.
 *
 * Actions (POST body, portal JWT + invest_access grant required):
 *   { action: 'draft-strategy', goal: string, lang?: 'en'|'fr' }
 *     → { draft: { name, cadence, asset_classes, rules } }
 *
 *   { kind: 'chat', message, lang?, today? } → { reply, action, assistantId }
 *     — Tally, the book's watch clerk: answers over the book's own rows and
 *     executes whitelisted additive writes (watchlist add/remove, a QUEUED
 *     draft order — never a fill, signal status, a strategy draft filed for
 *     review). Both turns persist to invest_chat_messages.
 *   { kind: 'react', event, lang? } → { reply }
 *     — she reacts when the person does something: watched a symbol,
 *     queued a draft order. Her line persists to invest_chat_messages.
 *   { kind: 'chat_history', limit? } → { turns }
 *   { kind: 'chat_clear' }           → { cleared: true }
 *   { kind: 'chat_feedback', messageId, rating } → { ok }
 *   { kind: 'chat_undo', messageId } → { ok }
 *     — reverses an assistant turn's write while it's still reversible
 *     (queued order untouched, watch row, signal status, filed draft).
 *
 * `stream: true` on the chat/react kinds switches the response to
 * text/event-stream — same event contract as health-ai: delta events carry
 * reply text (never the action JSON), one done event carries the parsed
 * payload.
 *
 * The chat/react/undo handlers live in ./runtime.ts — this file is auth +
 * routing + the draft-strategy one-shot.
 */

type SupabaseClient = SbClient<Database>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

function serverConfig(): ServerConfig | Response {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }
  return { supabaseUrl, anonKey, serviceRoleKey }
}

async function authenticateInvestUser(
  req: Request,
  config: ServerConfig,
): Promise<{ userId: string; adminClient: SupabaseClient } | Response> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Missing bearer token' }, 401)

  const adminClient = createClient<Database>(config.supabaseUrl, config.serviceRoleKey)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData?.user) return json({ error: 'Invalid user token' }, 401)

  const { data: access, error: accessError } = await adminClient
    .from('invest_access')
    .select('user_id, role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return json({ error: accessError.message }, 500)
  if (!access) return json({ error: 'Invest access not granted', code: 'no_access' }, 403)

  return { userId: userData.user.id, adminClient }
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok')
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  const authed = await authenticateInvestUser(req, config)
  if (authed instanceof Response) return authed
  const { userId, adminClient } = authed

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const lang = body['lang'] === 'fr' ? 'fr' : 'en'

  /* History read/clear/feedback/undo need no model — they run through this
     function so the table's only writer is this code path (a client can't
     file its own 'assistant' rows under the owner policy). */
  if (body['kind'] === 'chat_history') {
    const limit =
      typeof body['limit'] === 'number' && Number.isInteger(body['limit'])
        ? Math.min(Math.max(body['limit'], 1), 120)
        : 60
    const { data, error } = await adminClient
      .from('invest_chat_messages')
      .select('id, role, content, action, feedback, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return json({ error: error.message }, 500)
    return json({ turns: (data ?? []).reverse() })
  }
  if (body['kind'] === 'chat_clear') {
    const { error } = await adminClient
      .from('invest_chat_messages')
      .delete()
      .eq('user_id', userId)
    if (error) return json({ error: error.message }, 500)
    return json({ cleared: true })
  }
  if (body['kind'] === 'chat_feedback') {
    const messageId = typeof body['messageId'] === 'string' ? body['messageId'] : ''
    const rating = body['rating']
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId) ||
      (rating !== 1 && rating !== -1 && rating !== 0 && rating !== null)
    ) {
      return json({ error: 'messageId (uuid) and rating (-1|0|1) required' }, 400)
    }
    const { error } = await adminClient
      .from('invest_chat_messages')
      .update({ feedback: rating === 0 ? null : rating })
      .eq('id', messageId)
      .eq('user_id', userId)
      .eq('role', 'assistant')
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }
  if (body['kind'] === 'chat_undo') {
    const messageId = typeof body['messageId'] === 'string' ? body['messageId'] : ''
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
      return json({ error: 'messageId (uuid) required' }, 400)
    }
    return await runChatUndo(adminClient, userId, messageId)
  }

  /* stream:true answers Server-Sent Events instead of one JSON payload —
     see the module header for the event shapes. */
  const stream = body['stream'] === true
  if (body['kind'] === 'chat') {
    const message = typeof body['message'] === 'string' ? body['message'].trim().slice(0, 1200) : ''
    if (!message) return json({ error: 'message is required' }, 400)
    return await runChat(adminClient, userId, message, lang, stream)
  }
  if (body['kind'] === 'react') {
    const event = parseInvestReactEvent(body['event'])
    if (!event) return json({ error: 'bad event' }, 400)
    return await runReact(adminClient, userId, event, lang, stream)
  }

  const actionCheck = validateAiAction(body['action'])
  if (!actionCheck.ok) return json({ error: actionCheck.error }, 400)

  /* draft-strategy */
  const goal = sanitizeGoal(body['goal'])
  if (!goal) return json({ error: 'goal must be at least 10 characters' }, 400)

  const routed = await modelRoute(adminClient)
  if ('error' in routed) return routed.error
  const { route, provider, apiKey } = routed

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      provider,
      apiKey,
      {
        model: route.model_name,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildDraftPrompt(goal, lang) },
        ],
        max_tokens: route.config?.max_tokens ?? 900,
        temperature: 0.3,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (error) {
    console.error('invest-ai: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }
  if (!upstream.ok) {
    const errText = await upstream.text()
    console.error('invest-ai: upstream error', upstream.status, errText.slice(0, 300))
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }

  const completion = await upstream.json()
  const content = completion?.choices?.[0]?.message?.content
  if (typeof content !== 'string') return json({ error: 'Empty response from model' }, 502)

  const draft = parseDraft(content)
  if (!draft) {
    return json({ error: 'Could not turn that goal into a strategy — try describing it differently.', code: 'no_draft' }, 422)
  }

  /* File the draft for review — a wizard abandoned mid-edit shouldn't lose
     it. Deduped on the normalized goal so re-describing the same strategy
     returns the pending row instead of a twin; the draft itself ships
     disabled either way — the user reviews, then enables. */
  const shipped = { ...draft, enabled: false, autonomy: 'suggest', template: 'ai-draft' }
  const filed = await fileSuggestion(adminClient, {
    userId,
    surface: 'invest',
    kind: 'strategy',
    title: shipped.name,
    payload: { goal, draft: shipped },
    dedupeKey: textDedupeKey(goal),
  })
  return json({ draft: shipped, suggestionId: filed?.id ?? null })
}

Deno.serve(async (req) => withCors(req, await handler(req)))
