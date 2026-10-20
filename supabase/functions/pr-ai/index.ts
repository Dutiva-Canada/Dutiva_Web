import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { isInternalDutivaAccount } from '../_shared/adminAccess.ts'
import { withCors } from '../_shared/cors.ts'
import { type ResolvedRoute } from '../_shared/aiRoute.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  cleanDraft,
  clustersPrompt,
  draftPrompt,
  findRegenPair,
  parseClusters,
  parsePitch,
  parsePromptList,
  parseTone,
  pitchPrompt,
  promptsPrompt,
  singleTonePrompt,
  summaryPrompt,
  type ClusterItem,
  type DraftInput,
  type PitchInput,
  type PromptsInput,
} from './handlers.ts'
import {
  claimPrCall,
  json,
  modelRoute,
  parsePrReactEvent,
  runChat,
  runChatUndo,
  runReact,
  settlePrCall,
  UPSTREAM_TIMEOUT_MS,
} from './runtime.ts'

/**
 * pr-ai — the PR desk's user-triggered model calls, in Paige's voice:
 *
 *   POST { kind:'tone',  title, source? }                  → { sentiment }
 *   POST { kind:'draft', itemKind, channel?, title, notes?, lang? } → { draft }
 *   POST { kind:'summary', month, stats, lang? }           → { intro }
 *   POST { kind:'clusters', items:[{title,source}] }       → { clusters }
 *   POST { kind:'prompts', campaigns?, existing?, lang? }  → { prompts }
 *   POST { kind:'pitch', name, outlet?, beat?, note?, campaigns?, lang? }
 *                                                        → { subject, pitch }
 *   POST { kind:'chat', message, lang? }      → { reply, action, assistantId }
 *                                             — Paige, the desk's press
 *                                             specialist: answers over the
 *                                             desk's own data and executes
 *                                             whitelisted additive writes
 *                                             (campaign, content draft,
 *                                             contact, mention, keyword, GEO
 *                                             prompt). Both turns persist to
 *                                             pr_chat_messages.
 *   POST { kind:'react', event, lang? }       → { reply }
 *                                             — she reacts when the person
 *                                             does something: logged a
 *                                             mention, saved a content
 *                                             draft. Her line persists to
 *                                             pr_chat_messages.
 *   POST { kind:'chat_history', limit?, before?, threadId? } → { turns }
 *   POST { kind:'chat_threads' }            → { threads } — named conversations
 *   POST { kind:'chat_thread_new' }         → { thread } — starts a named one
 *   POST { kind:'chat_thread_rename', threadId, title } → { ok }
 *   POST { kind:'chat_thread_delete', threadId }        → { deleted: true }
 *                                             — removes the thread's turns
 *                                             with it.
 *   POST { kind:'chat_regenerate', threadId? } → same payload as 'chat'
 *                                             — re-runs the thread's last
 *                                             user turn after deleting the
 *                                             old pair.
 *   POST { kind:'chat_clear', threadId? }   → { cleared: true }
 *   POST { kind:'chat_feedback', messageId, rating, reason? } → { ok }
 *                                             — rating -1 may carry a short
 *                                             `reason` so a downvote says why.
 *                                             — thumbs up/down on an
 *                                             assistant turn; history
 *                                             read/clear/feedback run
 *                                             through the function too, so
 *                                             the table's only writer is
 *                                             this code path.
 *   POST { kind:'chat_undo', messageId }      → { ok }
 *                                             — deletes the row an
 *                                             assistant turn's action
 *                                             created, then marks the action
 *                                             undone.
 *
 * `stream: true` on the model kinds switches the response to
 * text/event-stream: `{"type":"delta","text":…}` events carry the reply as
 * it generates (chat emits only the reply field — never the action JSON),
 * then one `{"type":"done",…}` event carries the same payload the
 * non-streaming shape would return. Errors mid-stream arrive as
 * `{"type":"error"}`.
 *
 * Auth is the portal contract only (JWT + pr_access) — no scheduled path.
 * Route lookup is `pr_ai` first, `advisor_chat` fallback (shared aiRoute).
 * Everything returned is a suggestion: a tone tag the user can override, a
 * draft that goes into the edit field, never straight to "published".
 *
 * The chat/react handlers live in ./runtime.ts — this file is auth +
 * routing + the one-shot kinds.
 */

const MAX_TITLE_CHARS = 500
const MAX_SOURCE_CHARS = 200
const MAX_NOTES_CHARS = 2000
const MAX_STATS_CHARS = 4000
const MAX_CLUSTER_ITEMS = 24
const MAX_LIST_ITEMS = 30
const MAX_LIST_ITEM_CHARS = 200

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
    .from('pr_access')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return { error: json({ error: accessError.message }, 500) }
  if (!access) return { error: json({ error: 'PR access not granted', code: 'no_access' }, 403) }
  return { userId: userData.user.id, email: userData.user.email ?? null }
}

const clip = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

async function modelText(
  provider: ResolvedRoute['provider'],
  apiKey: string | null,
  model: string,
  prompt: string,
  maxTokens: number,
): Promise<{ text: string } | { error: Response }> {
  let upstream: Response
  try {
    upstream = await postChatCompletion(
      provider,
      apiKey,
      { model, messages: [{ role: 'user', content: prompt }], temperature: 0.4, max_tokens: maxTokens },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (e) {
    return { error: json({ error: `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`, code: 'upstream' }, 502) }
  }
  if (!upstream.ok) {
    return { error: json({ error: `Upstream returned ${upstream.status}`, code: 'upstream' }, 502) }
  }
  const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  return { text: payload.choices?.[0]?.message?.content ?? '' }
}

/** modelText with the usage guardrail around it — every one-shot kind
   claims a pr_ai slot first; the call stops on a 429/503 the same way an
   upstream failure stops on its own Response. */
async function meteredText(
  admin: SupabaseClient,
  userId: string,
  found: ResolvedRoute,
  apiKey: string | null,
  prompt: string,
  maxTokens: number,
): Promise<{ text: string } | { error: Response }> {
  const meter = await claimPrCall(admin, userId, found)
  if (meter instanceof Response) return { error: meter }
  const t0 = Date.now()
  const out = await modelText(found.provider, apiKey, found.modelName, prompt, maxTokens)
  settlePrCall(admin, meter.claimId, !('error' in out), t0)
  return out
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
  /* Internal-staff tier — a verified @dutiva.ca sign-in lets Paige advise
     like a desk editor who owns the call; everyone else keeps the
     suggest-only register. Access and the write whitelist are identical
     either way. */
  const advice = isInternalDutivaAccount(portal.email)

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const lang = body.lang === 'fr' ? 'fr' : 'en'

  /* Named conversations — threadId scopes chat/history/clear/regenerate.
     NULL is the default conversation: existing rows carry thread_id NULL
     and stay visible with no backfill. A supplied threadId must be a uuid
     the caller owns. */
  const rawThread = body.threadId
  let threadId: string | null = null
  if (rawThread !== undefined && rawThread !== null) {
    if (
      typeof rawThread !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawThread)
    ) {
      return json({ error: 'threadId must be a uuid' }, 400)
    }
    const { data: owned } = await admin
      .from('pr_chat_threads')
      .select('id')
      .eq('id', rawThread)
      .eq('user_id', portal.userId)
      .maybeSingle()
    if (!owned) return json({ error: 'Unknown thread' }, 404)
    threadId = rawThread
  }

  if (body.kind === 'chat_threads') {
    const { data, error } = await admin
      .from('pr_chat_threads')
      .select('id, title, created_at')
      .eq('user_id', portal.userId)
      .order('created_at', { ascending: true })
    if (error) return json({ error: error.message }, 500)
    return json({ threads: data ?? [] })
  }
  if (body.kind === 'chat_thread_new') {
    const { data, error } = await admin
      .from('pr_chat_threads')
      .insert({ user_id: portal.userId, title: null })
      .select('id, title, created_at')
      .single()
    if (error) return json({ error: error.message }, 500)
    return json({ thread: data })
  }
  /* threadId is already validated + ownership-checked above, so these two
     kinds just do the write. An empty title resets to null — the thread
     takes its name from the next first message. */
  if (body.kind === 'chat_thread_rename') {
    if (!threadId) return json({ error: 'threadId required' }, 400)
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : ''
    const { error } = await admin
      .from('pr_chat_threads')
      .update({ title: title || null })
      .eq('id', threadId)
      .eq('user_id', portal.userId)
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }
  if (body.kind === 'chat_thread_delete') {
    if (!threadId) return json({ error: 'threadId required' }, 400)
    const { error: messagesError } = await admin
      .from('pr_chat_messages')
      .delete()
      .eq('user_id', portal.userId)
      .eq('thread_id', threadId)
    if (messagesError) return json({ error: messagesError.message }, 500)
    const { error } = await admin
      .from('pr_chat_threads')
      .delete()
      .eq('id', threadId)
      .eq('user_id', portal.userId)
    if (error) return json({ error: error.message }, 500)
    return json({ deleted: true })
  }

  /* History read/clear/feedback/undo need no model — they run through this
     function so the table's only writer is this code path (a client can't
     file its own 'assistant' rows under the owner policy). */
  if (body.kind === 'chat_history') {
    const limit =
      typeof body.limit === 'number' && Number.isInteger(body.limit)
        ? Math.min(Math.max(body.limit, 1), 120)
        : 60
    /* `before` pages older turns — the client passes the oldest loaded
       turn's created_at; without it the newest `limit` rows come back. */
    const before = typeof body.before === 'string' && body.before ? body.before : null
    let q = admin
      .from('pr_chat_messages')
      .select('id, role, content, action, reasoning, sources, feedback, feedback_reason, created_at')
      .eq('user_id', portal.userId)
    q = threadId === null ? q.is('thread_id', null) : q.eq('thread_id', threadId)
    /* lte, not lt — two turns can share a created_at (a pair written in
       the same insert), and lt would silently skip the twin. The client
       dedupes the boundary row it already has. */
    if (before) q = q.lte('created_at', before)
    const { data, error } = await q.order('created_at', { ascending: false }).limit(limit)
    if (error) return json({ error: error.message }, 500)
    return json({ turns: (data ?? []).reverse() })
  }
  if (body.kind === 'chat_clear') {
    let q = admin
      .from('pr_chat_messages')
      .delete()
      .eq('user_id', portal.userId)
    q = threadId === null ? q.is('thread_id', null) : q.eq('thread_id', threadId)
    const { error } = await q
    if (error) return json({ error: error.message }, 500)
    return json({ cleared: true })
  }
  if (body.kind === 'chat_feedback') {
    const messageId = typeof body.messageId === 'string' ? body.messageId : ''
    const rating = body.rating
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId) ||
      (rating !== 1 && rating !== -1 && rating !== 0 && rating !== null)
    ) {
      return json({ error: 'messageId (uuid) and rating (-1|0|1) required' }, 400)
    }
    /* A downvote may carry a one-tap reason; anything else clears it. */
    const reason =
      typeof body.reason === 'string' ? body.reason.trim().slice(0, 80) : ''
    const { error } = await admin
      .from('pr_chat_messages')
      .update({
        feedback: rating === 0 || rating === null ? null : rating,
        feedback_reason: rating === -1 ? (reason || null) : null,
      })
      .eq('id', messageId)
      .eq('user_id', portal.userId)
      .eq('role', 'assistant')
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }
  if (body.kind === 'chat_undo') {
    const messageId = typeof body.messageId === 'string' ? body.messageId : ''
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
      return json({ error: 'messageId (uuid) required' }, 400)
    }
    return await runChatUndo(admin, portal.userId, messageId)
  }

  /* stream:true answers Server-Sent Events instead of one JSON payload —
     see the module header for the event shapes. */
  const stream = body.stream === true
  if (body.kind === 'chat') {
    const message = clip(body.message, 1200)
    if (!message) return json({ error: 'message is required' }, 400)
    return await runChat(admin, portal.userId, message, lang, stream, advice, threadId)
  }
  if (body.kind === 'chat_regenerate') {
    /* Re-ask the thread's last user turn. The stale pair is only EXCLUDED
       from the history window — the actual delete waits in afterPersist,
       after the fresh pair lands, so a failed call loses nothing. */
    let q = admin
      .from('pr_chat_messages')
      .select('id, role, content')
      .eq('user_id', portal.userId)
    q = threadId === null ? q.is('thread_id', null) : q.eq('thread_id', threadId)
    /* More than the last two rows — Paige's reaction lines land as bare
       assistant rows after the pair, so adjacency alone can't find it. */
    const { data: lastRows, error } = await q
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) return json({ error: error.message }, 500)
    const pair = findRegenPair((lastRows ?? []) as { id: string; role: string; content: string }[])
    if (!pair) {
      return json({ error: 'Nothing to regenerate' }, 409)
    }
    return await runChat(admin, portal.userId, pair.user.content, lang, stream, advice, threadId, {
      excludeIds: [pair.reply.id, pair.user.id],
      afterPersist: async () => {
        await admin
          .from('pr_chat_messages')
          .delete()
          .in('id', [pair.reply.id, pair.user.id])
          .eq('user_id', portal.userId)
      },
    })
  }
  if (body.kind === 'react') {
    const event = parsePrReactEvent(body.event)
    if (!event) return json({ error: 'bad event' }, 400)
    return await runReact(admin, portal.userId, event, lang, stream, advice)
  }

  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route

  if (body.kind === 'tone') {
    const title = clip(body.title, MAX_TITLE_CHARS)
    const source = clip(body.source, MAX_SOURCE_CHARS)
    if (!title) return json({ error: 'title is required' }, 400)
    const out = await meteredText(admin, portal.userId, found, keyResult.apiKey, singleTonePrompt(title, source), 16)
    if ('error' in out) return out.error
    const sentiment = parseTone(out.text)
    if (!sentiment) return json({ error: 'Model returned no usable tone', code: 'unparseable' }, 502)
    return json({ sentiment })
  }

  if (body.kind === 'draft') {
    const input: DraftInput = {
      itemKind: clip(body.itemKind, 40) || 'post',
      channel: clip(body.channel, 60),
      title: clip(body.title, MAX_TITLE_CHARS),
      notes: clip(body.notes, MAX_NOTES_CHARS),
      lang,
    }
    if (!input.title && !input.notes) {
      return json({ error: 'title or notes is required — give the draft something to work from' }, 400)
    }
    const out = await meteredText(admin, portal.userId, found, keyResult.apiKey, draftPrompt(input), 900)
    if ('error' in out) return out.error
    const draft = cleanDraft(out.text)
    if (!draft) return json({ error: 'Model returned an empty draft', code: 'empty' }, 502)
    return json({ draft })
  }

  if (body.kind === 'summary') {
    const month = clip(body.month, 40)
    const statsJson = JSON.stringify(body.stats ?? {}).slice(0, MAX_STATS_CHARS)
    const out = await meteredText(
      admin, portal.userId, found, keyResult.apiKey,
      summaryPrompt(statsJson, month, lang, advice), 220,
    )
    if ('error' in out) return out.error
    const intro = cleanDraft(out.text)
    if (!intro) return json({ error: 'Model returned an empty intro', code: 'empty' }, 502)
    return json({ intro })
  }

  if (body.kind === 'clusters') {
    const raw = Array.isArray(body.items) ? body.items : []
    const items: ClusterItem[] = raw.slice(0, MAX_CLUSTER_ITEMS).map((it) => ({
      title: clip((it as Record<string, unknown>)?.title, MAX_TITLE_CHARS),
      source: clip((it as Record<string, unknown>)?.source, MAX_SOURCE_CHARS),
    })).filter((it) => it.title !== '')
    if (items.length < 3) {
      return json({ error: 'at least 3 coverage items are needed to find themes' }, 400)
    }
    const out = await meteredText(
      admin, portal.userId, found, keyResult.apiKey,
      clustersPrompt(items), 200,
    )
    if ('error' in out) return out.error
    const clusters = parseClusters(out.text, items.length)
    if (clusters.length === 0) {
      return json({ error: 'Model returned no usable themes', code: 'unparseable' }, 502)
    }
    return json({ clusters })
  }

  if (body.kind === 'prompts') {
    const list = (v: unknown) =>
      (Array.isArray(v) ? v : []).slice(0, MAX_LIST_ITEMS)
        .map((s) => clip(s, MAX_LIST_ITEM_CHARS)).filter((s) => s !== '')
    const input: PromptsInput = {
      campaigns: list(body.campaigns),
      existing: list(body.existing),
      lang,
    }
    const out = await meteredText(
      admin, portal.userId, found, keyResult.apiKey,
      promptsPrompt(input), 300,
    )
    if ('error' in out) return out.error
    const prompts = parsePromptList(out.text, input.existing)
    if (prompts.length === 0) {
      return json({ error: 'Model returned no new questions', code: 'empty' }, 502)
    }
    /* File each question as a pending review row — deduped on normalized
       text, so re-suggesting returns the existing row instead of piling up
       twins. suggestionId=null when the queue write didn't land. */
    const items = await Promise.all(prompts.map(async (text) => {
      const filed = await fileSuggestion(admin, {
        userId: portal.userId,
        surface: 'pr',
        kind: 'geo_prompt',
        title: text,
        payload: { prompt: text },
        dedupeKey: textDedupeKey(text),
      })
      return { text, suggestionId: filed?.id ?? null }
    }))
    return json({ prompts: items })
  }

  if (body.kind === 'pitch') {
    const list = (v: unknown) =>
      (Array.isArray(v) ? v : []).slice(0, MAX_LIST_ITEMS)
        .map((s) => clip(s, MAX_LIST_ITEM_CHARS)).filter((s) => s !== '')
    const input: PitchInput = {
      name: clip(body.name, MAX_LIST_ITEM_CHARS),
      outlet: clip(body.outlet, MAX_LIST_ITEM_CHARS),
      beat: clip(body.beat, MAX_LIST_ITEM_CHARS),
      note: clip(body.note, 300),
      campaigns: list(body.campaigns),
      lang,
    }
    if (!input.name) return json({ error: 'name is required' }, 400)
    const out = await meteredText(
      admin, portal.userId, found, keyResult.apiKey,
      pitchPrompt(input), 500,
    )
    if ('error' in out) return out.error
    const parsed = parsePitch(out.text)
    if (!parsed) return json({ error: 'Model returned no usable pitch', code: 'unparseable' }, 502)
    /* File for review — a re-draft supersedes the pending one for the same
       contact so the queue never holds two drafts of one pitch. */
    const contactId = clip(body.contactId, MAX_LIST_ITEM_CHARS) || null
    const email = clip(body.email, MAX_LIST_ITEM_CHARS)
    const filed = await fileSuggestion(admin, {
      userId: portal.userId,
      surface: 'pr',
      kind: 'pitch',
      title: input.outlet
        ? `Pitch — ${input.name} (${input.outlet})`
        : `Pitch — ${input.name}`,
      payload: {
        contactId,
        contactName: input.name,
        outlet: input.outlet,
        email,
        subject: parsed.subject,
        body: parsed.body,
      },
      dedupeKey: contactId ? `contact:${contactId}` : `name:${input.name}`,
      dedupeMode: 'supersede',
    })
    return json({ subject: parsed.subject, pitch: parsed.body, suggestionId: filed?.id ?? null })
  }

  return json({ error: 'kind must be "tone", "draft", "summary", "clusters", "prompts", "pitch", "chat", "react", "chat_history", "chat_threads", "chat_thread_new", "chat_thread_rename", "chat_thread_delete", "chat_clear", "chat_feedback", or "chat_undo"' }, 400)
}

const CORS = {
  allowHeaders: 'authorization, x-client-info, apikey, content-type, x-trigger-secret',
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))
