import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey, type ResolvedRoute } from '../_shared/aiRoute.ts'
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

/**
 * pr-ai — the PR desk's user-triggered model calls:
 *
 *   POST { kind:'tone',  title, source? }                  → { sentiment }
 *   POST { kind:'draft', itemKind, channel?, title, notes?, lang? } → { draft }
 *   POST { kind:'summary', month, stats, lang? }           → { intro }
 *   POST { kind:'clusters', items:[{title,source}] }       → { clusters }
 *   POST { kind:'prompts', campaigns?, existing?, lang? }  → { prompts }
 *   POST { kind:'pitch', name, outlet?, beat?, note?, campaigns?, lang? }
 *                                                        → { subject, pitch }
 *
 * Auth is the portal contract only (JWT + pr_access) — no scheduled path.
 * Route lookup is `pr_ai` first, `advisor_chat` fallback (shared aiRoute).
 * Everything returned is a suggestion: a tone tag the user can override, a
 * draft that goes into the edit field, never straight to "published".
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trigger-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_TITLE_CHARS = 500
const MAX_SOURCE_CHARS = 200
const MAX_NOTES_CHARS = 2000
const MAX_STATS_CHARS = 4000
const MAX_CLUSTER_ITEMS = 24
const MAX_LIST_ITEMS = 30
const MAX_LIST_ITEM_CHARS = 200
const UPSTREAM_TIMEOUT_MS = 45_000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function portalUserId(
  admin: SupabaseClient,
  req: Request,
): Promise<{ userId: string } | { error: Response }> {
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
  return { userId: userData.user.id }
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const portal = await portalUserId(admin, req)
  if ('error' in portal) return portal.error

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const found = await activeModelRoute(admin, ['pr_ai', 'advisor_chat'])
  if ('error' in found) {
    return json(
      found.error === 'no_route'
        ? { error: 'No active AI route', code: 'no_route' }
        : { error: found.error },
      found.error === 'no_route' ? 503 : 500,
    )
  }
  const keyResult = routeApiKey(found)
  if ('missingSecret' in keyResult) {
    return json({ error: `Provider secret ${keyResult.missingSecret} not configured`, code: 'no_key' }, 503)
  }

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
      lang: body.lang === 'fr' ? 'fr' : 'en',
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
    const lang = body.lang === 'fr' ? 'fr' : 'en'
    const out = await modelText(
      found.provider, keyResult.apiKey, found.modelName,
      summaryPrompt(statsJson, month, lang), 220,
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
      lang: body.lang === 'fr' ? 'fr' : 'en',
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
      lang: body.lang === 'fr' ? 'fr' : 'en',
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

  return json({ error: 'kind must be "tone", "draft", "summary", "clusters", "prompts", or "pitch"' }, 400)
})
