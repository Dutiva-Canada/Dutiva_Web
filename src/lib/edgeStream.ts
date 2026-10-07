import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Shared transport for the portal companions' edge functions.
 *
 * invokeEdgeFn — the plain path: one JSON response per request, via the
 * client's built-in function invoker.
 *
 * invokeEdgeFnStream — `stream: true` switches the function to
 * text/event-stream: delta events carry reply text piece by piece (for
 * chat kinds, already extracted from the JSON envelope server-side), one
 * done event carries the same payload a plain call would return. onDelta
 * receives the accumulated text each time, ready for a state setter. When
 * a deployed function predates streaming it answers plain JSON instead —
 * the caller just sees one big delta.
 */
export async function invokeEdgeFn(
  client: SupabaseClient,
  fnName: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await client.functions.invoke(fnName, { body })
  if (error) throw error
  return (data ?? {}) as Record<string, unknown>
}

export async function invokeEdgeFnStream(
  client: SupabaseClient,
  fnName: string,
  body: Record<string, unknown>,
  onDelta: (text: string) => void,
): Promise<Record<string, unknown>> {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
  if (!base || !anon) throw new Error('Supabase env unavailable')
  const {
    data: { session },
  } = await client.auth.getSession()
  const res = await fetch(`${base}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${session?.access_token ?? anon}`,
    },
    body: JSON.stringify({ ...body, stream: true }),
  })
  if (!res.ok) throw new Error(`${fnName} ${res.status}`)
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream') || !res.body) {
    return (await res.json()) as Record<string, unknown>
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let acc = ''
  let doneEvent: Record<string, unknown> | null = null
  let streamError: string | null = null
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const line = buf.slice(0, idx).trim()
      buf = buf.slice(idx + 2)
      if (!line.startsWith('data:')) continue
      let event: { type?: string; text?: unknown; error?: unknown }
      try {
        event = JSON.parse(line.slice(5).trim())
      } catch {
        continue
      }
      if (event.type === 'delta' && typeof event.text === 'string') {
        acc += event.text
        onDelta(acc)
      } else if (event.type === 'done') {
        doneEvent = event as Record<string, unknown>
      } else if (event.type === 'error') {
        streamError = String(event.error ?? 'stream error')
      }
    }
  }
  if (!doneEvent) throw new Error(streamError ?? `${fnName} stream ended without a reply`)
  return doneEvent
}
