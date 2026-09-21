/**
 * Shared upstream dispatch for OpenAI-compatible model providers.
 *
 * Every dutiva-* function that completes against `ai_model_routes` /
 * `ai_model_providers` calls `{base_url}/chat/completions`. Until now each
 * function carried its own copy of that call — and each copy required a
 * bearer secret, which ruled out the local/LAN providers the route table
 * already allows (`provider_type` 'local' / 'custom': Ollama, LM Studio,
 * llama.cpp, vLLM — docs/LOCAL_INFERENCE.md §7 shape (a), "completion-only
 * local": RAG, prompts and metering stay server-side, only this POST goes to
 * the tenant endpoint).
 *
 * Kept dependency-free (no npm:/jsr: imports, no Deno globals) so the pure
 * parts are unit-testable under Vitest — the functions inject `Deno.env.get`.
 */

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface UpstreamProvider {
  base_url: string | null
  /** Env var NAME holding the API key — null/empty means the endpoint takes
   *  no credentials (typical for local servers). */
  secret_ref: string | null
}

/** OpenAI multimodal content part. Text is still sent as a plain string when
 *  there are no attachments — not every local server accepts parts arrays. */
export type UpstreamContentPart =
  { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }

export interface UpstreamMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | UpstreamContentPart[]
}

export type AttachmentKind = 'image' | 'document'

/** Wire shape the client sends (`sendAdvisorMessage` → `attachments`). */
export interface AdvisorAttachment {
  kind: AttachmentKind
  name: string
  /** `data:<mime>;base64,<…>` for images. */
  data_url?: string
  /** Client-extracted text for documents (PDF/DOCX/XLSX/plain-text). */
  text?: string
}

export type Modality = 'text' | 'image' | 'document'

/* ── Limits ────────────────────────────────────────────────────────────── */

export const MAX_ATTACHMENTS = 4
/** ~5 MB decoded → ~6.7 MB of base64; enough for a phone photo of a posting
 *  without letting a single turn dwarf the context window. */
export const MAX_IMAGE_DATA_URL_CHARS = 7_000_000
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
/** Extracted document text is inlined as prompt text — cap per file and in
 *  total so a 200-page PDF cannot buy an unbounded input bill. */
export const MAX_DOCUMENT_TEXT_CHARS = 20_000
export const MAX_TOTAL_DOCUMENT_CHARS = 40_000
const MAX_ATTACHMENT_NAME_CHARS = 120

/** Data-URL images the vision pipeline accepts. SVG is excluded on purpose —
 *  it is markup, not a raster, and an HTML-bearing payload has no business
 *  being inlined into a prompt. */
export const IMAGE_MIME_ALLOWLIST = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

/* ── Provider plumbing ─────────────────────────────────────────────────── */

/** `{base}/chat/completions` — tolerates a configured trailing slash and a
 *  `/v1`-style root, which is what every local server exposes. */
export function chatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/chat/completions`
}

export type ApiKeyResult = { apiKey: string | null } | { missingSecret: string }

/**
 * Resolve the provider credential. Three honest states:
 * - `secret_ref` unset → keyless local endpoint, no Authorization header.
 * - `secret_ref` set and the env var resolves → bearer token.
 * - `secret_ref` set but the env var is absent → config error, fail loudly
 *   (a typo'd ref must not silently downgrade to an unauthenticated call).
 */
export function resolveApiKey(
  secretRef: string | null | undefined,
  envGet: (name: string) => string | undefined,
): ApiKeyResult {
  const ref = (secretRef ?? '').trim()
  if (!ref) return { apiKey: null }
  const key = envGet(ref)
  if (!key) return { missingSecret: ref }
  return { apiKey: key }
}

export function upstreamHeaders(apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  return headers
}

export const DEFAULT_UPSTREAM_TIMEOUT_MS = 120_000

/**
 * One POST to the provider. Throws on network failure / timeout — callers
 * map that to their own 502 path. `AbortSignal.timeout` is supported on the
 * edge runtime; a slow local model must not pin the function open forever.
 */
export async function postChatCompletion(
  provider: UpstreamProvider,
  apiKey: string | null,
  body: Record<string, unknown>,
  timeoutMs: number = DEFAULT_UPSTREAM_TIMEOUT_MS,
): Promise<Response> {
  const base = (provider.base_url ?? '').trim()
  if (!base) throw new Error('provider has no base_url')
  return await fetch(chatCompletionsUrl(base), {
    method: 'POST',
    headers: upstreamHeaders(apiKey),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
}

/* ── Attachments ───────────────────────────────────────────────────────── */

export type AttachmentError =
  'too_many' | 'bad_shape' | 'bad_image_mime' | 'image_too_large' | 'document_too_large' | 'empty'

export type AttachmentsResult = { attachments: AdvisorAttachment[] } | { error: AttachmentError }

const DATA_URL_RE = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,[a-z0-9+/=\s]+$/i

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw.trim().slice(0, MAX_ATTACHMENT_NAME_CHARS)
  return name || 'attachment'
}

/**
 * Validate the client-sent `attachments` array. Documents arrive already
 * extracted to text (parsing happens in the browser); images arrive as data
 * URLs. Anything else is rejected before it can reach the prompt.
 */
export function parseAttachments(raw: unknown): AttachmentsResult {
  if (raw === undefined || raw === null) return { attachments: [] }
  if (!Array.isArray(raw)) return { error: 'bad_shape' }
  if (raw.length > MAX_ATTACHMENTS) return { error: 'too_many' }

  const out: AdvisorAttachment[] = []
  let totalDocChars = 0
  for (const item of raw) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return { error: 'bad_shape' }
    }
    const a = item as Record<string, unknown>
    const kind = a.kind
    const name = sanitizeName(a.name)
    if (!name) return { error: 'bad_shape' }

    if (kind === 'image') {
      const dataUrl = typeof a.data_url === 'string' ? a.data_url : ''
      const mime = DATA_URL_RE.exec(dataUrl)?.[1]?.toLowerCase() ?? ''
      if (!IMAGE_MIME_ALLOWLIST.has(mime)) return { error: 'bad_image_mime' }
      if (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS) return { error: 'image_too_large' }
      out.push({ kind: 'image', name, data_url: dataUrl })
      continue
    }

    if (kind === 'document') {
      const text = typeof a.text === 'string' ? a.text.trim() : ''
      if (!text) return { error: 'empty' }
      if (text.length > MAX_DOCUMENT_TEXT_CHARS) return { error: 'document_too_large' }
      totalDocChars += text.length
      if (totalDocChars > MAX_TOTAL_DOCUMENT_CHARS) return { error: 'document_too_large' }
      out.push({ kind: 'document', name, text })
      continue
    }

    return { error: 'bad_shape' }
  }
  return { attachments: out }
}

/**
 * Modalities declared by the active route — `config.modalities`, e.g.
 * `["text","image","document"]`. Absent/malformed → text-only, the safe
 * default for every route that predates attachments.
 */
export function routeModalities(config: unknown): Set<Modality> {
  const raw = (config as Record<string, unknown> | null)?.modalities
  const out = new Set<Modality>(['text'])
  if (Array.isArray(raw)) {
    for (const m of raw) {
      if (m === 'image' || m === 'document') out.add(m)
    }
  }
  return out
}

/**
 * The first modality the attachments need that the route does not declare —
 * currently only 'image' (documents inline to text, so every model accepts
 * them). Returns null when nothing is missing.
 */
export function missingModality(
  attachments: AdvisorAttachment[],
  modalities: Set<Modality>,
): Modality | null {
  if (attachments.some((a) => a.kind === 'image') && !modalities.has('image')) {
    return 'image'
  }
  return null
}

/**
 * The user message as upstream content: plain string when there is nothing
 * attached, OpenAI content parts when there is. Document text is inlined as
 * labelled text parts so text-only models still see it.
 */
export function userMessageContent(
  message: string,
  attachments: AdvisorAttachment[],
): string | UpstreamContentPart[] {
  if (attachments.length === 0) return message
  const parts: UpstreamContentPart[] = [{ type: 'text', text: message }]
  for (const a of attachments) {
    if (a.kind === 'document' && a.text) {
      parts.push({
        type: 'text',
        text: `Attached document "${a.name}":\n---\n${a.text}\n---`,
      })
    } else if (a.kind === 'image' && a.data_url) {
      parts.push({ type: 'image_url', image_url: { url: a.data_url } })
    }
  }
  return parts
}

/**
 * What persists in `conversations.messages`: the text plus a one-line
 * attachment manifest. Raw data URLs never touch the table (a 6 MB base64
 * column per turn would swamp it), but the model still knows on follow-ups
 * that an image/document was attached.
 */
export function persistedUserContent(message: string, attachments: AdvisorAttachment[]): string {
  if (attachments.length === 0) return message
  const manifest = attachments.map((a) => `[Attached ${a.kind}: ${a.name}]`).join('\n')
  return `${manifest}\n${message}`
}
