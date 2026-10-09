import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { assertPublicHttpUrl, extractPageMeta } from './handlers.ts'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'

/**
 * pr-fetch-meta — the coverage log's "paste a link" helper. A signed-in PR
 * user (pr_access grant required) POSTs a URL; the function fetches the
 * page server-side (browsers can't — CORS) and returns the meta worth
 * prefilling: headline, site name, publish date.
 *
 *   POST { url: string }
 *     → 200 { title, source, publishedAt }   (fields empty when not found)
 *     → 400 { error: 'invalid_url' | 'private_url' | 'fetch_failed' }
 *     → 401 / 403 on missing session or missing pr_access grant
 *
 * The URL goes through assertPublicHttpUrl first — http(s) only, no
 * loopback/private/literal-IP hosts — and the fetch is capped at 8s and
 * ~512KB, so this can't be turned into a network scanner.
 */

const corsHeaders = makeCorsHeaders()

const FETCH_TIMEOUT_MS = 8_000
const MAX_BYTES = 512 * 1024

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

const handler = async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  /* Portal JWT → caller's user id, gated on pr_access — same contract as
     invest-bot's authenticateInvestUser. */
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Missing bearer token' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData?.user) return json({ error: 'Invalid user token' }, 401)

  const { data: access, error: accessError } = await adminClient
    .from('pr_access')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return json({ error: accessError.message }, 500)
  if (!access) return json({ error: 'PR access not granted', code: 'no_access' }, 403)

  let rawUrl = ''
  try {
    const body = await req.json()
    rawUrl = typeof body?.url === 'string' ? body.url : ''
  } catch {
    return json({ error: 'invalid_url' }, 400)
  }

  let url: URL
  try {
    url = assertPublicHttpUrl(rawUrl)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'invalid_url' }, 400)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        /* A plain browser-ish UA — some outlets 403 bare fetch agents. */
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) return json({ error: 'fetch_failed', status: res.status }, 400)
    /* Redirects land on res.url — re-check the final host so a shortener
       can't bounce the fetch into a private address. */
    try {
      assertPublicHttpUrl(res.url)
    } catch {
      return json({ error: 'private_url' }, 400)
    }
    const type = res.headers.get('content-type') ?? ''
    if (type && !type.includes('text/html') && !type.includes('application/xhtml')) {
      return json({ error: 'not_html' }, 400)
    }
    const reader = res.body?.getReader()
    if (!reader) return json({ error: 'fetch_failed' }, 400)
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) break
      chunks.push(value)
    }
    const html = new TextDecoder().decode(
      chunks.length === 1 ? chunks[0] : concat(chunks),
    )
    return json(extractPageMeta(html, res.url || url.toString()))
  } catch {
    return json({ error: 'fetch_failed' }, 400)
  } finally {
    clearTimeout(timer)
  }
}

Deno.serve(async (req) => withCors(req, await handler(req)))

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.byteLength
  }
  return out
}
