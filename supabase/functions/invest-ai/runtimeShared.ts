/** Shared plumbing for the invest-ai runtime modules — response helpers and
    the upstream timeout budget. Kept dependency-free so runtime.ts,
    chatActions.ts and reactRuntime.ts can all import it without a cycle. */

export const UPSTREAM_TIMEOUT_MS = 45_000

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** One Server-Sent-Events channel: send() emits `data: {…}` events, close()
    ends the stream. The pump runs after the Response is already returned. */
export function sseChannel() {
  const ts = new TransformStream<Uint8Array, Uint8Array>()
  const writer = ts.writable.getWriter()
  const encoder = new TextEncoder()
  return {
    response: new Response(ts.readable, {
      headers: {
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
