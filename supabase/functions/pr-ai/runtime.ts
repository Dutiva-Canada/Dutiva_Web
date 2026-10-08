import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { postChatCompletion, readUpstreamText } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import { createReplyDeltaExtractor } from '../_shared/replyDelta.ts'
import {
  parsePrChatReply,
  prChatPrompt,
  prReactPrompt,
  resolveNameRef,
  type PrChatAction,
  type PrChatContext,
  type PrChatReply,
  type PrReactEvent,
} from './handlers.ts'

/* Runtime for pr-ai — everything the serve() router delegates to: the chat
   and react kinds, their shared desk-context load, action execution + undo,
   and the SSE plumbing. Kept out of index.ts so the router stays readable
   under the repo's file-size budget. Deno-only — the pure/prompt layer
   lives in handlers.ts where vitest can reach it. */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trigger-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const UPSTREAM_TIMEOUT_MS = 45_000
const CHAT_HISTORY = 20
const CHAT_LIST_CAP = 15

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface ExecutedAction {
  type: string
  /** Human-facing subject — the campaign name, contact name, etc. */
  detail: string
  ok: boolean
  /** Row id of the created/touched row — lets the client offer undo. */
  refId?: string
  /** For update_campaign_status: the status the row had before — what undo
      restores instead of deleting the row. */
  prevStatus?: string
  /** Set once chat_undo reverses the write — the client hides the chip. */
  undone?: boolean
}

/** The desk's own rows, shared by chat and react — names, statuses, counts,
    capped per list. Every row belongs to the caller. */
export async function loadDeskContext(
  admin: SupabaseClient,
  userId: string,
): Promise<{ ctx: PrChatContext; campaigns: { id: string; name: string }[] }> {
  const [
    { data: campaigns },
    { data: contentItems },
    { data: contacts },
    { data: keywords },
    { data: mentions },
    { data: geoPrompts },
    { count: feedCount },
    { data: connections },
  ] = await Promise.all([
    admin.from('pr_campaigns').select('id, name, status, channel').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_content_items').select('id, title, status').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_media_contacts').select('name, outlet, beat').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_keywords').select('keyword, position').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_mentions').select('title, source, sentiment').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_geo_prompts').select('prompt, result').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    admin.from('pr_feeds').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('pr_connections').select('provider, status').eq('user_id', userId),
  ])

  const contentByStatus: Record<string, number> = {}
  for (const c of contentItems ?? []) {
    contentByStatus[String(c.status)] = (contentByStatus[String(c.status)] ?? 0) + 1
  }
  const mentionsBySentiment: Record<string, number> = {}
  for (const m of mentions ?? []) {
    mentionsBySentiment[String(m.sentiment)] = (mentionsBySentiment[String(m.sentiment)] ?? 0) + 1
  }

  const ctx: PrChatContext = {
    campaigns: (campaigns ?? []).map((c) => ({
      name: String(c.name), status: String(c.status), channel: String(c.channel),
    })),
    contentByStatus,
    recentContent: (contentItems ?? []).slice(0, 8).map((c) => String(c.title)),
    contacts: (contacts ?? []).map((c) => ({
      name: String(c.name), outlet: String(c.outlet ?? ''), beat: String(c.beat ?? ''),
    })),
    keywords: (keywords ?? []).map((k) => ({
      keyword: String(k.keyword),
      position: typeof k.position === 'number' ? k.position : null,
    })),
    mentionsBySentiment,
    recentMentions: (mentions ?? []).slice(0, 8).map((m) => ({
      title: String(m.title), source: String(m.source ?? ''),
    })),
    geoPrompts: (geoPrompts ?? []).map((g) => ({
      prompt: String(g.prompt), result: String(g.result ?? 'unchecked'),
    })),
    feeds: feedCount ?? 0,
    connections: (connections ?? []).map((c) => ({
      provider: String(c.provider), status: String(c.status),
    })),
  }
  return { ctx, campaigns: (campaigns ?? []) as { id: string; name: string }[] }
}

/** Model-route + key resolution, shared by the model-backed kinds. */
export async function modelRoute(admin: SupabaseClient) {
  const found = await activeModelRoute(admin, ['pr_ai', 'advisor_chat'])
  if ('error' in found) {
    return {
      error: json(
        found.error === 'no_route'
          ? { error: 'No active AI route', code: 'no_route' }
          : { error: found.error },
        found.error === 'no_route' ? 503 : 500,
      ),
    }
  }
  const keyResult = routeApiKey(found)
  if ('missingSecret' in keyResult) {
    return {
      error: json(
        { error: `Provider secret ${keyResult.missingSecret} not configured`, code: 'no_key' },
        503,
      ),
    }
  }
  return { found, keyResult }
}

/** One Server-Sent-Events channel: send() emits `data: {…}` events, close()
    ends the stream. The pump runs after the Response is already returned. */
function sseChannel() {
  const ts = new TransformStream<Uint8Array, Uint8Array>()
  const writer = ts.writable.getWriter()
  const encoder = new TextEncoder()
  return {
    response: new Response(ts.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    }),
    send: (event: Record<string, unknown>) => {
      void writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    },
    close: () => {
      void writer.close()
    },
  }
}

/* Persist both turns — history is server-side so the next device/session
   sees the same conversation, and the assistant row keeps what it did.
   The assistant id goes back so the client can attach feedback to it. */
async function persistChatTurns(
  admin: SupabaseClient,
  userId: string,
  message: string,
  reply: string,
  executed: ExecutedAction | null,
): Promise<{ userId: string | null; assistantId: string | null }> {
  const nowIso = new Date().toISOString()
  const { data: userRow } = await admin
    .from('pr_chat_messages')
    .insert({ user_id: userId, role: 'user', content: message, created_at: nowIso })
    .select('id')
    .single()
  const { data: assistantRow } = await admin
    .from('pr_chat_messages')
    .insert({
      user_id: userId,
      role: 'assistant',
      content: reply,
      action: executed,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    })
    .select('id')
    .single()
  return { userId: userRow?.id ?? null, assistantId: assistantRow?.id ?? null }
}

/* ── kind 'chat' ──────────────────────────────────────────────────────────
   The conversational surface — Paige answers over the desk's own rows plus
   the last CHAT_HISTORY turns, and acts only through executeChatAction's
   additive whitelist. */

export async function runChat(
  admin: SupabaseClient,
  userId: string,
  message: string,
  lang: 'en' | 'fr',
  stream: boolean,
): Promise<Response> {
  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route

  const [desk, { data: historyRows, error: histError }] = await Promise.all([
    loadDeskContext(admin, userId),
    admin
      .from('pr_chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(CHAT_HISTORY),
  ])
  if (histError) return json({ error: histError.message }, 500)

  const history = ((historyRows ?? []) as { role: string; content: string }[])
    .reverse()
    .map((r) => ({
      role: r.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: r.content.slice(0, 1500),
    }))

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages: [
          prChatPrompt(desk.ctx, lang),
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.4,
        max_tokens: 500,
        stream,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (e) {
    return json(
      { error: `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`, code: 'upstream' },
      502,
    )
  }
  if (!upstream.ok) return json({ error: `Upstream returned ${upstream.status}`, code: 'upstream' }, 502)

  if (stream) {
    /* SSE out, SSE in — but only the reply text streams through. The model's
       output is one JSON object; createReplyDeltaExtractor emits its reply
       field without the scaffolding, so the action JSON never leaks into
       the bubble. The done event carries the parsed payload + row ids. */
    const sse = sseChannel()
    const extractor = createReplyDeltaExtractor()
    void (async () => {
      try {
        const fullText = await readUpstreamText(upstream, (piece) => {
          const visible = extractor.push(piece)
          if (visible) sse.send({ type: 'delta', text: visible })
        })
        const parsed: PrChatReply | null = parsePrChatReply(fullText)
        if (!parsed) {
          sse.send({ type: 'error', error: 'Model returned no usable reply', code: 'unparseable' })
          return
        }
        const executed = parsed.action
          ? await executeChatAction(admin, userId, parsed.action, desk.campaigns)
          : null
        const ids = await persistChatTurns(admin, userId, message, parsed.reply, executed)
        sse.send({ type: 'done', reply: parsed.reply, action: executed, ...ids })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  const parsed: PrChatReply | null = parsePrChatReply(payload.choices?.[0]?.message?.content)
  if (!parsed) return json({ error: 'Model returned no usable reply', code: 'unparseable' }, 502)

  const executed = parsed.action
    ? await executeChatAction(admin, userId, parsed.action, desk.campaigns)
    : null
  const ids = await persistChatTurns(admin, userId, message, parsed.reply, executed)

  return json({ reply: parsed.reply, action: executed, ...ids })
}

/** Execute a whitelisted additive write on the caller's own rows. Nothing
    here publishes, sends, schedules, or deletes — everything lands as a
    draft or log row the user could have written. A failure reports
    ok:false so the reply can still land. */
async function executeChatAction(
  admin: SupabaseClient,
  userId: string,
  action: PrChatAction,
  campaigns: { id: string; name: string }[],
): Promise<ExecutedAction> {
  switch (action.type) {
    case 'add_campaign': {
      const { data, error } = await admin
        .from('pr_campaigns')
        .insert({
          user_id: userId,
          name: action.name,
          channel: action.channel ?? 'mixed',
          status: 'draft',
          objective: action.objective ?? '',
        })
        .select('id')
        .single()
      return { type: action.type, detail: action.name, ok: !error, refId: data?.id }
    }
    case 'add_content_item': {
      /* Status is forced — chat can only file drafts, never publish. */
      const campaignRef = action.campaign ? resolveNameRef(action.campaign, campaigns) : null
      if (action.campaign && !campaignRef) {
        return { type: action.type, detail: action.title, ok: false }
      }
      const { data, error } = await admin
        .from('pr_content_items')
        .insert({
          user_id: userId,
          campaign_id: campaignRef?.id ?? null,
          kind: action.kind ?? 'post',
          title: action.title,
          body: action.body ?? '',
          channel: action.channel ?? '',
          status: 'draft',
        })
        .select('id')
        .single()
      return { type: action.type, detail: action.title, ok: !error, refId: data?.id }
    }
    case 'add_media_contact': {
      const { data, error } = await admin
        .from('pr_media_contacts')
        .insert({
          user_id: userId,
          name: action.name,
          outlet: action.outlet ?? '',
          beat: action.beat ?? '',
          email: action.email ?? '',
          note: action.note ?? '',
        })
        .select('id')
        .single()
      return { type: action.type, detail: action.name, ok: !error, refId: data?.id }
    }
    case 'add_mention': {
      const { data, error } = await admin
        .from('pr_mentions')
        .insert({
          user_id: userId,
          title: action.title,
          source: action.source ?? '',
          url: action.url ?? '',
          sentiment: action.sentiment ?? 'neutral',
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      return { type: action.type, detail: action.title, ok: !error, refId: data?.id }
    }
    case 'add_keyword': {
      const { data, error } = await admin
        .from('pr_keywords')
        .insert({ user_id: userId, keyword: action.keyword, target_url: action.targetUrl ?? '' })
        .select('id')
        .single()
      return { type: action.type, detail: action.keyword, ok: !error, refId: data?.id }
    }
    case 'add_geo_prompt': {
      const { data, error } = await admin
        .from('pr_geo_prompts')
        .insert({ user_id: userId, prompt: action.prompt, engine: action.engine ?? 'chatgpt' })
        .select('id')
        .single()
      return { type: action.type, detail: action.prompt, ok: !error, refId: data?.id }
    }
    case 'update_campaign_status': {
      /* The grammar's one non-additive action — it flips a status field on
         a row the person already has. The previous status rides along as
         prevStatus so chat_undo can put it back. */
      const target = resolveNameRef(action.campaign, campaigns)
      if (!target) return { type: action.type, detail: action.campaign, ok: false }
      const { data: prev, error: readError } = await admin
        .from('pr_campaigns')
        .select('status')
        .eq('id', target.id)
        .eq('user_id', userId)
        .maybeSingle()
      if (readError || !prev) return { type: action.type, detail: action.campaign, ok: false }
      const prevStatus = String(prev.status)
      if (prevStatus === action.status) {
        /* Already there — nothing moved; still stamp prevStatus so an undo
           restores (harmlessly) rather than reporting "nothing to undo". */
        return { type: action.type, detail: action.campaign, ok: true, refId: target.id, prevStatus }
      }
      const { error } = await admin
        .from('pr_campaigns')
        .update({ status: action.status })
        .eq('id', target.id)
        .eq('user_id', userId)
      return {
        type: action.type,
        detail: `${action.campaign} → ${action.status}`,
        ok: !error,
        refId: target.id,
        prevStatus,
      }
    }
  }
}

/* ── kind 'chat_undo' ────────────────────────────────────────────────────
   Every action the chat can execute is an additive insert — the inverse is
   uniformly "delete the row it made". The action payload sits on the
   assistant message row, so the undo call names the message; the write is
   then marked undone on that same row so a reload doesn't offer the chip
   again. */

const ACTION_TABLE: Record<string, string> = {
  add_campaign: 'pr_campaigns',
  add_content_item: 'pr_content_items',
  add_media_contact: 'pr_media_contacts',
  add_mention: 'pr_mentions',
  add_keyword: 'pr_keywords',
  add_geo_prompt: 'pr_geo_prompts',
}

/** Reverse one executed action: additive writes delete their row; a status
    flip restores prevStatus. False when the action has nothing reversible. */
async function undoChatAction(
  admin: SupabaseClient,
  userId: string,
  action: ExecutedAction,
): Promise<boolean> {
  if (action.type === 'update_campaign_status') {
    if (typeof action.prevStatus !== 'string') return false
    const { error } = await admin
      .from('pr_campaigns')
      .update({ status: action.prevStatus })
      .eq('id', action.refId as string)
      .eq('user_id', userId)
    return !error
  }
  const table = ACTION_TABLE[action.type]
  if (!table) return false
  const { error } = await admin
    .from(table)
    .delete()
    .eq('id', action.refId as string)
    .eq('user_id', userId)
  return !error
}

export async function runChatUndo(
  admin: SupabaseClient,
  userId: string,
  messageId: string,
): Promise<Response> {
  const { data: msg, error } = await admin
    .from('pr_chat_messages')
    .select('id, action')
    .eq('id', messageId)
    .eq('user_id', userId)
    .eq('role', 'assistant')
    .maybeSingle()
  if (error) return json({ error: error.message }, 500)
  const action = (msg?.action ?? null) as ExecutedAction | null
  if (!msg || !action || !action.ok || action.undone === true || !action.refId) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  if (!(await undoChatAction(admin, userId, action))) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  const { error: markError } = await admin
    .from('pr_chat_messages')
    .update({ action: { ...action, undone: true } })
    .eq('id', messageId)
    .eq('user_id', userId)
  if (markError) return json({ error: markError.message }, 500)
  return json({ ok: true })
}

/* ── kind 'react' ─────────────────────────────────────────────────────────
   Paige reacts to what the person just did elsewhere on the desk — a
   mention logged, a content draft saved. No action grammar — one short
   plain-text line that persists to pr_chat_messages so it still exists on
   the next visit; the originating page renders it inline too. */

export function parsePrReactEvent(raw: unknown): PrReactEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const ev = raw as Record<string, unknown>
  if (ev.type === 'mention_logged') {
    const title = typeof ev.title === 'string' ? ev.title.trim().slice(0, 300) : ''
    if (!title) return null
    return {
      type: 'mention_logged',
      title,
      source: typeof ev.source === 'string' ? ev.source.slice(0, 120) : undefined,
      sentiment: typeof ev.sentiment === 'string' ? ev.sentiment.slice(0, 20) : undefined,
    }
  }
  if (ev.type === 'content_saved') {
    const title = typeof ev.title === 'string' ? ev.title.trim().slice(0, 200) : ''
    if (!title) return null
    return {
      type: 'content_saved',
      title,
      kind: typeof ev.kind === 'string' ? ev.kind.slice(0, 40) : undefined,
    }
  }
  if (ev.type === 'campaign_created') {
    const name = typeof ev.name === 'string' ? ev.name.trim().slice(0, 120) : ''
    if (!name) return null
    return {
      type: 'campaign_created',
      name,
      channel: typeof ev.channel === 'string' ? ev.channel.slice(0, 40) : undefined,
    }
  }
  if (ev.type === 'keyword_tracked') {
    const keyword = typeof ev.keyword === 'string' ? ev.keyword.trim().slice(0, 120) : ''
    if (!keyword) return null
    return { type: 'keyword_tracked', keyword }
  }
  if (ev.type === 'contact_added') {
    const name = typeof ev.name === 'string' ? ev.name.trim().slice(0, 120) : ''
    if (!name) return null
    return {
      type: 'contact_added',
      name,
      outlet: typeof ev.outlet === 'string' ? ev.outlet.slice(0, 120) : undefined,
    }
  }
  return null
}

export async function runReact(
  admin: SupabaseClient,
  userId: string,
  event: PrReactEvent,
  lang: 'en' | 'fr',
  stream: boolean,
): Promise<Response> {
  const route = await modelRoute(admin)
  if ('error' in route) return route.error
  const { found, keyResult } = route
  const desk = await loadDeskContext(admin, userId)

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      found.provider,
      keyResult.apiKey,
      {
        model: found.modelName,
        messages: [{ role: 'user', content: prReactPrompt(event, desk.ctx, lang) }],
        temperature: 0.5,
        max_tokens: 160,
        stream,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (e) {
    return json(
      { error: `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`, code: 'upstream' },
      502,
    )
  }
  if (!upstream.ok) return json({ error: `Upstream returned ${upstream.status}`, code: 'upstream' }, 502)

  if (stream) {
    const sse = sseChannel()
    void (async () => {
      try {
        const reply = (
          await readUpstreamText(upstream, (piece) => {
            if (piece) sse.send({ type: 'delta', text: piece })
          })
        ).trim()
        if (!reply) {
          sse.send({ type: 'error', error: 'Model returned empty text', code: 'empty' })
          return
        }
        const { data: row } = await admin
          .from('pr_chat_messages')
          .insert({ user_id: userId, role: 'assistant', content: reply })
          .select('id')
          .single()
        sse.send({ type: 'done', reply, assistantId: row?.id ?? null })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  const reply = (payload.choices?.[0]?.message?.content ?? '').trim()
  if (!reply) return json({ error: 'Model returned empty text', code: 'empty' }, 502)

  const { data: row } = await admin
    .from('pr_chat_messages')
    .insert({ user_id: userId, role: 'assistant', content: reply })
    .select('id')
    .single()
  return json({ reply, assistantId: row?.id ?? null })
}
