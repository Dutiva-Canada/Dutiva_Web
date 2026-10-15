import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { withCors } from '../_shared/cors.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'

/**
 * health-transcribe — server-side speech-to-text for the voice-call surface.
 *
 *   POST multipart/form-data  file=<audio blob>, lang=en|fr  → { text }
 *   POST { ping: true }                                   → { ok: true }
 *     (capability probe — the client hides the call affordance entirely
 *      when the function or its route row isn't live, rather than
 *      advertising a dead end)
 *
 * Exists for the browsers where the Web Speech API's recognition half is
 * missing or unbacked (Firefox has no SpeechRecognition; Brave ships the
 * constructor but strips the service). Those browsers still record fine —
 * MediaRecorder captures the audio here and the configured provider's
 * /audio/transcriptions endpoint (Whisper-compatible) turns it into text.
 * The transcript then enters sendHealthChat like typed input — the consent
 * boundary, persistence and distress detection are unchanged.
 *
 * Auth is the portal contract only (JWT + health_access). The audio is
 * transcribed and discarded — nothing is stored, logged, or attributed.
 *
 * Activation requires an ai_model_routes row with route_key
 * 'health_transcribe' whose provider serves POST /audio/transcriptions
 * (OpenAI: model_name 'whisper-1' or a transcribe variant). No chat-route
 * fallback: a text model can't transcribe, so a missing dedicated route
 * answers 503 rather than confusingly failing upstream.
 */

const MAX_AUDIO_BYTES = 10 * 1024 * 1024
const UPSTREAM_TIMEOUT_MS = 60_000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Whisper-compatible endpoints infer the audio format from the filename
    extension — MediaRecorder mimes map to the extension the upstream
    expects. */
const MIME_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
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
    .from('health_access')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return { error: json({ error: accessError.message }, 500) }
  if (!access) return { error: json({ error: 'Health access not granted', code: 'no_access' }, 403) }
  return { userId: userData.user.id }
}

/** Resolve the dedicated transcription route — shared result for the ping
    probe and a real call, so `ok:true` from the probe means a real request
    will also get a route + key. */
async function transcribeRoute(
  admin: SupabaseClient,
): Promise<
  | { error: Response }
  | { baseUrl: string; model: string; apiKey: string | null }
> {
  const found = await activeModelRoute(admin, ['health_transcribe'])
  if ('error' in found) {
    return {
      error: json(
        found.error === 'no_route'
          ? { error: 'No active transcription route', code: 'no_route' }
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
  const baseUrl = (found.provider.base_url ?? '').replace(/\/+$/, '')
  if (!baseUrl) return { error: json({ error: 'Provider base_url missing', code: 'no_route' }, 503) }
  return { baseUrl, model: found.modelName, apiKey: keyResult.apiKey }
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

  const contentType = req.headers.get('Content-Type') ?? ''

  /* Capability probe — JSON {ping:true} answers whether the function and
     its route are live without touching an audio upload. */
  if (contentType.includes('application/json')) {
    const body = (await req.json().catch(() => null)) as { ping?: boolean } | null
    if (body?.ping === true) {
      const route = await transcribeRoute(admin)
      return 'error' in route ? route.error : json({ ok: true })
    }
    return json({ error: 'Expected multipart audio' }, 400)
  }

  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Expected multipart audio' }, 400)
  }
  const form = await req.formData().catch(() => null)
  if (!form) return json({ error: 'Malformed form data' }, 400)
  const file = form.get('file')
  if (!(file instanceof Blob) || file.size === 0) {
    return json({ error: 'Missing audio file' }, 400)
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return json({ error: 'Audio too large' }, 413)
  }
  const lang = form.get('lang') === 'fr' ? 'fr' : 'en'

  const route = await transcribeRoute(admin)
  if ('error' in route) return route.error

  const ext = MIME_EXT[(file.type.split(';')[0] ?? '').trim().toLowerCase()] ?? 'webm'
  const upstream = new FormData()
  upstream.append('file', file, `voice.${ext}`)
  upstream.append('model', route.model)
  /* Whisper takes ISO-639-1; the portal's langs are already that short. */
  upstream.append('language', lang)
  upstream.append('response_format', 'json')

  const headers: Record<string, string> = {}
  if (route.apiKey) headers['Authorization'] = `Bearer ${route.apiKey}`

  let res: Response
  try {
    res = await fetch(`${route.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers,
      body: upstream,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch (e) {
    return json(
      { error: `Upstream call failed: ${e instanceof Error ? e.message : 'timeout'}`, code: 'upstream' },
      502,
    )
  }
  if (!res.ok) return json({ error: `Upstream returned ${res.status}`, code: 'upstream' }, 502)
  const payload = (await res.json().catch(() => null)) as { text?: string } | null
  const text = (payload?.text ?? '').trim()
  if (!text) return json({ text: '' })
  return json({ text })
}

Deno.serve(async (req) => withCors(req, await handler(req)))
