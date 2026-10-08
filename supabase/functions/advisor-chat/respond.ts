import { makeCorsHeaders } from '../_shared/cors.ts'

/**
 * Response helpers shared by index.ts and the extracted pipeline modules.
 * corsHeaders() emits the fallback origin — the real, request-scoped origin
 * is stamped by withCors at the Deno.serve boundary.
 */

export const corsHeaders = makeCorsHeaders()

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json', ...extraHeaders },
  })
}
