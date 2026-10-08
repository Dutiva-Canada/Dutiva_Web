import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { claimExportSlot, exportLimitBody, exportPolicy } from '../_shared/exportGuard.ts'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'

/**
 * Authorizes one export of company-generated content and writes its audit
 * row (`export_events`, 0033_export_audit.sql) in the same atomic claim. The
 * returned export id is what the client embeds in the artifact — visible
 * watermark, invisible tag and file metadata (src/lib/exportProtection/) —
 * so a leaked copy resolves back to this row.
 *
 * Auth follows the invite-only bearer-JWT pattern of advisor-safety-event:
 * the caller's own JWT client answers `current_user_is_workspace_member`,
 * the service-role client performs the claim. A 429 from the guard is final
 * for the client; a guard that cannot be evaluated is 503 fail-closed — the
 * client then proceeds under its local guard with a locally-minted id
 * (authorize.ts), which keeps offline/demo exports working while never
 * letting a server-side error mint unaudited *server* ids.
 */

const corsHeaders = makeCorsHeaders()

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json', ...headers },
  })
}

const ALLOWED_SURFACES = new Set(['docstudio', 'doclib', 'memory', 'advisor'])
const ALLOWED_KINDS = new Set(['pdf', 'word', 'link', 'json', 'text'])
const SHA_RE = /^([0-9a-f]{64}|fnv1a:[0-9a-f]{16})$/

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

interface ExportRequestBody {
  surface: string
  kind: string
  title: string
  sha256: string
  contentChars: number
  lang: string
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

async function authenticateRequest(req: Request, config: ServerConfig) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)

  const userClient = createClient(config.supabaseUrl, config.anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  // Invite-only — the admin account, or anyone on the beta list. Same check
  // as advisor-chat / advisor-safety-event, via the caller's own JWT client.
  const { data: isMember, error: membershipError } = await userClient.rpc(
    'current_user_is_workspace_member',
  )
  if (membershipError || isMember !== true) {
    return json({ error: 'Access to this workspace is invite-only.' }, 403)
  }

  return { user, adminClient: createClient(config.supabaseUrl, config.serviceRoleKey) }
}

/** Trust nothing from the wire: whitelist enums, cap lengths, coerce counts. */
async function readExportRequest(req: Request): Promise<ExportRequestBody | Response> {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const surface = typeof body.surface === 'string' ? body.surface : ''
  if (!ALLOWED_SURFACES.has(surface)) return json({ error: 'surface is invalid' }, 400)
  const kind = typeof body.kind === 'string' ? body.kind : ''
  if (!ALLOWED_KINDS.has(kind)) return json({ error: 'kind is invalid' }, 400)
  const sha256 = typeof body.content_sha256 === 'string' ? body.content_sha256 : ''
  if (!SHA_RE.test(sha256)) return json({ error: 'content_sha256 is invalid' }, 400)
  const title = typeof body.title === 'string' ? body.title.slice(0, 200) : ''
  const rawChars = Number(body.content_chars)
  const contentChars =
    Number.isFinite(rawChars) && rawChars > 0 ? Math.min(Math.trunc(rawChars), 10_000_000) : 0
  const lang = body.lang === 'fr' ? 'fr' : 'en'
  return { surface, kind, title, sha256, contentChars, lang }
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config
  const authenticated = await authenticateRequest(req, config)
  if (authenticated instanceof Response) return authenticated
  const request = await readExportRequest(req)
  if (request instanceof Response) return request

  const decision = await claimExportSlot(authenticated.adminClient, exportPolicy(), {
    userId: authenticated.user.id,
    surface: request.surface,
    kind: request.kind,
    title: request.title,
    sha256: request.sha256,
    contentChars: request.contentChars,
    lang: request.lang,
  })

  if (decision.kind === 'denied') {
    // Denials are logged, not stored (0033's rationale).
    console.warn(
      `record-export: denied user=${authenticated.user.id} scope=${decision.scope} used=${decision.used}/${decision.limit}`,
    )
    return json(exportLimitBody(decision), 429, {
      'Retry-After': String(decision.retryAfterSeconds),
    })
  }
  if (decision.kind === 'unavailable') {
    console.error(`record-export: guardrail unavailable — ${decision.reason}`)
    return json({ error: 'Export audit is temporarily unavailable' }, 503)
  }

  return json({ export_id: decision.exportId }, 201)
}

Deno.serve(async (req) => withCors(req, await handler(req)))