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
  json,
  modelRoute,
  parsePrReactEvent,
  runChat,
  runChatUndo,
  runReact,
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
 *   POST { kind:'chat_history', limit? }      → { turns }
 *   POST { kind:'chat_clear' }                → { cleared: true }
 *   POST { kind:'chat_feedback', messageId, rating } → { ok }
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

  /* History read/clear/feedback/undo need no model — they run through this
     function so the table's only writer is this code path (a client can't
     file its own 'assistant' rows under the owner policy). */
  if (body.kind === 'chat_history') {
    const limit =
      typeof body.limit === 'number' && Number.isInteger(body.limit)
        ? Math.min(Math.max(body.limit, 1), 120)
        : 60
    const { data, error } = await admin
      .from('pr_chat_messages')
      .select('id, role, content, action, feedback, created_at')
      .eq('user_id', portal.userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return json({ error: error.message }, 500)
    return json({ turns: (data ?? []).reverse() })
  }
  if (body.kind === 'chat_clear') {
    const { error } = await admin
      .from('pr_chat_messages')
      .delete()
      .eq('user_id', portal.userId)
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
    const { error } = await admin
      .from('pr_chat_messages')
      .update({ feedback: rating === 0 ? null : rating })
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
    return await runChat(admin, portal.userId, message, lang, stream, advice)
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
    const out = await modelText(found.provider, keyResult.apiKey, found.modelName, singleTonePrompt(title, source), 16)
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
    const out = await modelText(found.provider, keyResult.apiKey, found.modelName, draftPrompt(input), 900)
    if ('error' in out) return out.error
    const draft = cleanDraft(out.text)
    if (!draft) return json({ error: 'Model returned an empty draft', code: 'empty' }, 502)
    return json({ draft })
  }

  if (body.kind === 'summary') {
    const month = clip(body.month, 40)
    const statsJson = JSON.stringify(body.stats ?? {}).slice(0, MAX_STATS_CHARS)
    const out = await modelText(
      found.provider, keyResult.apiKey, found.modelName,
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
    const out = await modelText(
      found.provider, keyResult.apiKey, found.modelName,
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
    const out = await modelText(
      found.provider, keyResult.apiKey, found.modelName,
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
    const out = await modelText(
      found.provider, keyResult.apiKey, found.modelName,
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

  return json({ error: 'kind must be "tone", "draft", "summary", "clusters", "prompts", "pitch", "chat", "react", "chat_history", "chat_clear", "chat_feedback", or "chat_undo"' }, 400)
}

const CORS = {
  allowHeaders: 'authorization, x-client-info, apikey, content-type, x-trigger-secret',
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))
