import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'

/**
 * Admin read-only viewer for the export audit trail (`export_events`).
 *
 * The table has RLS enabled with **no policies** — service-role only — so
 * the browser cannot read it directly. This edge function is the only
 * client-facing read path: it checks `is_admin` server-side, then queries
 * with the service role and returns a paginated, filtered list.
 *
 * No mutations: the table is written only by `record-export` (service role
 * via `claim_export_slot`). This function is read-only by design.
 *
 * Supports:
 *   - pagination: `page` (1-based), `perPage` (capped at 100)
 *   - filters: `surface`, `kind`, `userId`, `from`, `to` (ISO dates)
 *   - lookup: `exportId` — resolve a single export id to its audit row
 *     (the forensic use case: recover an id from a leaked artifact)
 */

const corsHeaders = makeCorsHeaders()
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

const SURFACES = ['docstudio', 'doclib', 'memory', 'advisor'] as const
const KINDS = ['pdf', 'word', 'link', 'json', 'text'] as const
const MAX_PER_PAGE = 100

function has<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (list as readonly string[]).includes(v)
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function asInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.floor(n)))
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Server-side admin gate — the real boundary.
  const { data: isAdmin } = await admin.rpc('is_admin', { check_user_id: user.id })
  if (isAdmin !== true) return json({ error: 'Admin access required.' }, 403)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  // Forensic lookup: resolve a single export id to its audit row.
  const exportId = asString(body.exportId)
  if (exportId) {
    const { data, error } = await admin
      .from('export_events')
      .select('id, user_id, surface, kind, title, content_sha256, content_chars, lang, created_at')
      .eq('id', exportId)
      .limit(1)
      .single()
    if (error) return json({ error: 'Export id not found', detail: error.message }, 404)
    return json({ row: data })
  }

  // Paginated, filtered list.
  const page = asInt(body.page, 1, 1, 10000)
  const perPage = asInt(body.perPage, 50, 1, MAX_PER_PAGE)
  const offset = (page - 1) * perPage

  let query = admin
    .from('export_events')
    .select('id, user_id, surface, kind, title, content_sha256, content_chars, lang, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const surface = asString(body.surface)
  if (surface) {
    if (!has(SURFACES, surface)) return json({ error: 'Invalid surface' }, 422)
    query = query.eq('surface', surface)
  }

  const kind = asString(body.kind)
  if (kind) {
    if (!has(KINDS, kind)) return json({ error: 'Invalid kind' }, 422)
    query = query.eq('kind', kind)
  }

  const userId = asString(body.userId)
  if (userId) query = query.eq('user_id', userId)

  const from = asString(body.from)
  if (from) query = query.gte('created_at', from)

  const to = asString(body.to)
  if (to) query = query.lte('created_at', to)

  const { data: rows, count, error } = await query
  if (error) return json({ error: 'Query failed', detail: error.message }, 500)

  return json({
    rows: rows ?? [],
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  })
}

Deno.serve(async (req) => withCors(req, await handler(req)))