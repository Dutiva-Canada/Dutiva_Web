import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { isInternalDutivaAccount } from '../_shared/adminAccess.ts'
import { withCors } from '../_shared/cors.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  habitPrompt,
  parseHabit,
  recapPrompt,
  reflectPrompt,
} from './handlers.ts'
import {
  json,
  loadCompanionContext,
  modelRoute,
  parseReactEvent,
  runChat,
  runChatUndo,
  runEntryReact,
  runReact,
  UPSTREAM_TIMEOUT_MS,
} from './runtime.ts'

/**
 * health-ai — the wellness portal's user-triggered model calls, all in
 * Mira's voice:
 *
 *   POST { kind:'reflect', lang? } → { prompt }   — one gentle journal prompt
 *   POST { kind:'recap',   lang? } → { summary }  — a short weekly summary
 *   POST { kind:'habit',   lang? } → { habit }    — one habit suggestion
 *   POST { kind:'react', event, today?, lang? } → { reply }
 *                                             — she reacts when the person
 *                                             does something: saved a
 *                                             check-in, marked a habit done.
 *                                             Her line persists to
 *                                             health_chat_messages.
 *   POST { kind:'entry_react', entryId, today?, lang? } → { reply }
 *                                             — responds to ONE journal
 *                                             entry the person explicitly
 *                                             shared ("Let Mira read this").
 *                                             Persists the same way.
 *   POST { kind:'chat', message, today?, lang? } → { reply, action, assistantId }
 *                                             — Mira, the portal companion:
 *                                             keeps company over the caller's
 *                                             own context and can execute
 *                                             whitelisted writes
 *                                             (mark/unmark a habit today, add a
 *                                             habit, log a check-in, write a
 *                                             journal entry). Both turns persist
 *                                             to health_chat_messages.
 *   POST { kind:'chat_history', limit? } → { turns }
 *   POST { kind:'chat_clear' }           → { cleared: true }
 *   POST { kind:'chat_feedback', messageId, rating } → { ok }
 *                                             — thumbs up/down on an assistant
 *                                             turn; history read/clear/feedback
 *                                             run through the function too, so
 *                                             the table's only writer is this
 *                                             code path.
 *   POST { kind:'chat_undo', messageId }   → { ok }
 *                                             — reverses the action an
 *                                             assistant turn executed (unmark
 *                                             a habit, delete the row it made),
 *                                             then marks the action undone.
 *
 * `stream: true` on the model kinds switches the response to
 * text/event-stream: `{"type":"delta","text":…}` events carry the reply as
 * it generates (chat emits only the reply field — never the action JSON),
 * then one `{"type":"done",…}` event carries the same payload the
 * non-streaming shape would return. Errors mid-stream arrive as
 * `{"type":"error"}`.
 *
 * Auth is the portal contract only (JWT + health_access) — no scheduled path.
 *
 * PRIVACY: Mira reads what the person wrote — check-in notes and bounded
 * excerpts of journal entries they chose to share reach every kind
 * (buildCompanionSignals enforces shared_at again after the query), the
 * conversation is included on chat, and entry_react reads one entry the
 * person explicitly shared. Every row belongs to the caller; nothing is
 * shared across users. The wellness notice says this plainly.
 *
 * The kind handlers live in ./runtime.ts — this file is auth + routing.
 */

async function portalUserId(
  admin: SupabaseClient,
  req: Request,
): Promise<{ userId: string; email: string | null } | { error: Response }> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return { error: json({ error: 'Missing bearer token' }, 401) }
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData?.user) return { error: json({ error: 'Invalid user token' }, 401) }
  const { data: access, error: accessError } = await admin
    .from('health_access')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return { error: json({ error: accessError.message }, 500) }
  if (!access) return { error: json({ error: 'Health access not granted', code: 'no_access' }, 403) }
  return { userId: userData.user.id, email: userData.user.email ?? null }
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok')
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const portal = await portalUserId(admin, req)
  if ('error' in portal) return portal.error
  /* Internal-staff tier — a verified @dutiva.ca sign-in loosens the model
     register from observations-only to direct everyday advice. Access,
     consent and the write whitelist are identical either way. */
  const advice = isInternalDutivaAccount(portal.email)

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    body = {}
  }
  const kind = body.kind
  const lang = body.lang === 'fr' ? 'fr' : 'en'
  if (
    kind !== 'reflect' &&
    kind !== 'recap' &&
    kind !== 'habit' &&
    kind !== 'react' &&
    kind !== 'entry_react' &&
    kind !== 'chat' &&
    kind !== 'chat_history' &&
    kind !== 'chat_clear' &&
    kind !== 'chat_feedback' &&
    kind !== 'chat_undo'
  ) {
    return json({ error: 'unknown kind' }, 400)
  }

  /* The portal tracks habit "days" in the user's local timezone — the
     client sends its local YYYY-MM-DD so "mark it done" and "just checked
     in" land on the day the person sees, not the server's UTC date. */
  const today =
    typeof body.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today)
      ? body.today
      : new Date().toISOString().slice(0, 10)

  /* History read/clear/feedback need no model — they run through this
     function so the table's only writer is this code path (a client can't
     file its own 'assistant' rows under the owner policy). */
  if (kind === 'chat_history') {
    const limit =
      typeof body.limit === 'number' && Number.isInteger(body.limit)
        ? Math.min(Math.max(body.limit, 1), 120)
        : 60
    const { data, error } = await admin
      .from('health_chat_messages')
      .select('id, role, content, action, feedback, created_at')
      .eq('user_id', portal.userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return json({ error: error.message }, 500)
    return json({ turns: (data ?? []).reverse() })
  }
  if (kind === 'chat_clear') {
    const { error } = await admin
      .from('health_chat_messages')
      .delete()
      .eq('user_id', portal.userId)
    if (error) return json({ error: error.message }, 500)
    return json({ cleared: true })
  }
  if (kind === 'chat_feedback') {
    const messageId = typeof body.messageId === 'string' ? body.messageId : ''
    const rating = body.rating
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId) ||
      (rating !== 1 && rating !== -1 && rating !== 0 && rating !== null)
    ) {
      return json({ error: 'messageId (uuid) and rating (-1|0|1) required' }, 400)
    }
    const { error } = await admin
      .from('health_chat_messages')
      .update({ feedback: rating === 0 ? null : rating })
      .eq('id', messageId)
      .eq('user_id', portal.userId)
      .eq('role', 'assistant')
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }
  if (kind === 'chat_undo') {
    const messageId = typeof body.messageId === 'string' ? body.messageId : ''
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
      return json({ error: 'messageId (uuid) required' }, 400)
    }
    return await runChatUndo(admin, portal.userId, messageId)
  }
  /* stream:true answers Server-Sent Events instead of one JSON payload —
     see the module header for the event shapes. */
  const stream = body.stream === true
  if (kind === 'chat') {
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (message.length === 0 || message.length > 1200) {
      return json({ error: 'message must be 1–1200 characters' }, 400)
    }
    return await runChat(admin, portal.userId, message, today, lang, stream, advice)
  }
  if (kind === 'react') {
    const event = parseReactEvent(body.event)
    if (!event) return json({ error: 'bad event' }, 400)
    return await runReact(admin, portal.userId, event, today, lang, stream, advice)
  }
  if (kind === 'entry_react') {
    const entryId = typeof body.entryId === 'string' ? body.entryId : ''
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId)) {
      return json({ error: 'entryId must be a uuid' }, 400)
    }
    return await runEntryReact(admin, portal.userId, entryId, today, lang, stream, advice)
  }

  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route

  const ctx = await loadCompanionContext(admin, portal.userId, today)
  if ('error' in ctx) return ctx.error

  const prompt =
    kind === 'reflect'
      ? reflectPrompt(ctx.facts, ctx.signals, lang, advice)
      : kind === 'recap'
        ? recapPrompt(ctx.facts, ctx.signals, lang, advice)
        : habitPrompt(ctx.facts, ctx.habitNames, ctx.signals, lang, advice)

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: kind === 'reflect' ? 120 : kind === 'recap' ? 300 : 120,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (e) {
    return json({ error: `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`, code: 'upstream' }, 502)
  }
  if (!upstream.ok) {
    return json({ error: `Upstream returned ${upstream.status}`, code: 'upstream' }, 502) }
  const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  const text = (payload.choices?.[0]?.message?.content ?? '').trim()
  if (!text) return json({ error: 'Model returned empty text', code: 'empty' }, 502)

  if (kind === 'habit') {
    const habit = parseHabit(text)
    if (!habit) return json({ error: 'Model returned no usable habit', code: 'unparseable' }, 502)
    /* File for review — deduped on the habit name so re-suggesting returns
       the same pending row rather than a twin. */
    const filed = await fileSuggestion(admin, {
      userId: portal.userId,
      surface: 'health',
      kind: 'habit',
      title: habit.name,
      payload: { name: habit.name, why: habit.why },
      dedupeKey: textDedupeKey(habit.name),
    })
    return json({ habit, suggestionId: filed?.id ?? null })
  }
  return kind === 'reflect' ? json({ prompt: text }) : json({ summary: text })
}

const CORS = {
  allowHeaders: 'authorization, x-client-info, apikey, content-type, x-trigger-secret',
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))

