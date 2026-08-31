/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
'use strict'

/**
 * ClamAV scan endpoint for Dutiva support attachments.
 *
 * `support-attachment-scan` (supabase/functions/) POSTs one JSON body per file:
 *
 *   { "url": "<5-minute signed URL>", "file_name": "…", "mime_type": "…",
 *     "size_bytes": 1234, "reference": "<attachment id>" }
 *
 * We fetch that URL, stream the bytes through clamd's INSTREAM, and answer in
 * the shape src/features/support/attachmentScan.ts holds us to:
 *
 *   { "status": "clean" }
 *   { "status": "infected",    "signature": "Eicar-Test-Signature" }
 *   { "status": "unsupported", "reason": "too_large" }
 *
 * WHAT WE NEVER DO: return 200 with anything ambiguous. The worker maps an
 * unrecognised body to `unknown`, which leaves the row pending — but a body we
 * *think* is fine and isn't could mark a file clean. So every path here either
 * produces one of the three verdicts above or a non-2xx.
 *
 * THE 200-vs-502 DISTINCTION IS THE DESIGN. `unsupported` is a settled verdict:
 * "this file cannot be established as safe, and retrying will not change that"
 * — the worker records `skipped` and stops. A 502 means "we do not know yet";
 * the worker records `http_502`, leaves the row pending, and tries again (up to
 * SCAN_MAX_ATTEMPTS). A dead signature database, an expired signed URL, or a
 * network blip must therefore be a 502 and never an `unsupported`, or a
 * transient failure would permanently settle a file as un-scannable.
 *
 * No dependencies on purpose: this runs beside customer HR files, and its
 * supply chain should be the Node runtime and nothing else.
 */

const http = require('node:http')
const net = require('node:net')
const { once } = require('node:events')

const PORT = Number(process.env.PORT || 8080)
const CLAMD_HOST = process.env.CLAMD_HOST || '127.0.0.1'
const CLAMD_PORT = Number(process.env.CLAMD_PORT || 3310)
const SCAN_TOKEN = process.env.SCAN_TOKEN || ''

/** Matches the support-attachments bucket limit (25 MiB) and clamd's StreamMaxLength. */
const MAX_BYTES = 26214400
/** The worker aborts at 30s, so finish comfortably inside that or it sees a timeout instead of a verdict. */
const BUDGET_MS = 25000
/** INSTREAM chunk ceiling. Well under clamd's read buffer; fetch hands us far less anyway. */
const CHUNK_BYTES = 32768

// Fail closed at startup rather than serving an open scan endpoint on the
// public internet. Same rule support-notify applies to SUPPORT_NOTIFY_SECRET:
// if the thing that authenticates callers is missing, do not start.
if (SCAN_TOKEN === '') {
  console.error('SCAN_TOKEN is not set — refusing to start an unauthenticated scan endpoint.')
  process.exit(1)
}

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

/** Write with backpressure — a 25 MiB file is many socket writes and ignoring drain buffers it all in memory. */
async function write(socket, buf) {
  if (!socket.write(buf)) await once(socket, 'drain')
}

/**
 * Stream a readable through clamd INSTREAM.
 *
 * Protocol: `zINSTREAM\0`, then repeating [4-byte big-endian length][bytes],
 * terminated by a zero-length chunk. clamd replies once and closes.
 */
/** Send one chunk to clamd, split into INSTREAM frames of at most CHUNK_BYTES. */
async function sendChunk(socket, buf, closed) {
  for (let offset = 0; offset < buf.length; offset += CHUNK_BYTES) {
    if (closed) break
    const slice = buf.subarray(offset, offset + CHUNK_BYTES)
    const header = Buffer.allocUnsafe(4)
    header.writeUInt32BE(slice.length, 0)
    await write(socket, header)
    await write(socket, slice)
  }
}

async function scanStream(body) {
  const socket = net.createConnection({ host: CLAMD_HOST, port: CLAMD_PORT })
  socket.setTimeout(BUDGET_MS)

  const chunks = []
  const state = { closed: false, socketError: null }

  socket.on('data', (d) => chunks.push(d))
  socket.on('close', () => {
    state.closed = true
  })
  socket.on('error', (err) => {
    state.socketError = err
    state.closed = true
  })
  socket.on('timeout', () => {
    state.socketError = new Error('clamd timed out')
    socket.destroy()
  })

  try {
    await once(socket, 'connect')
    await write(socket, Buffer.from('zINSTREAM\0'))

    let total = 0
    for await (const chunk of body) {
      // clamd aborts the connection itself on a limit breach; stop pushing
      // into a closed socket rather than taking an EPIPE.
      if (state.closed) break

      const buf = Buffer.from(chunk)
      total += buf.length
      if (total > MAX_BYTES) {
        socket.destroy()
        return { verdict: 'unsupported', reason: 'too_large' }
      }

      await sendChunk(socket, buf, state.closed)
    }

    if (!state.closed) {
      await write(socket, Buffer.alloc(4)) // zero-length chunk = end of stream
      await once(socket, 'close')
    }
  } finally {
    socket.destroy()
  }

  if (state.socketError && chunks.length === 0) throw state.socketError

  const reply = Buffer.concat(chunks).toString('utf8').replaceAll('\u0000', '').trim()
  if (reply === '') throw new Error('clamd returned an empty reply')

  // `stream: OK` / `stream: <Signature> FOUND` / `… ERROR`
  if (/\bOK$/.test(reply)) return { verdict: 'clean' }
  if (/\bFOUND$/.test(reply)) {
    const match = reply.match(/^stream:\s*(\S+)\s+FOUND$/)
    return { verdict: 'infected', signature: match ? match[1] : 'unknown' }
  }
  if (/size limit exceeded/i.test(reply)) return { verdict: 'unsupported', reason: 'too_large' }

  // Any other ERROR is not a settled "cannot scan" — let the worker retry.
  throw new Error(`clamd: ${reply.slice(0, 200)}`)
}

/** clamd PING/PONG, used by the platform health check. */
async function ping() {
  const socket = net.createConnection({ host: CLAMD_HOST, port: CLAMD_PORT })
  socket.setTimeout(5000)
  try {
    await once(socket, 'connect')
    socket.write('zPING\0')
    const [data] = await once(socket, 'data')
    return data.toString('utf8').replaceAll('\u0000', '').trim()
  } finally {
    socket.destroy()
  }
}

/** Validate and parse the fetch URL. Returns { parsed, url } or an error string. */
function validateUrl(url) {
  if (url === '') return { error: 'url_required' }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return { error: 'invalid_url' }
  }
  // ALLOW_HTTP_FETCH exists so `docker run` on a laptop can point at a local
  // file server. Never set it in a deployed environment: the signed URL is the
  // one thing standing between a private bucket and the open internet.
  const httpAllowed = process.env.ALLOW_HTTP_FETCH === '1' && parsed.protocol === 'http:'
  if (parsed.protocol !== 'https:' && !httpAllowed) return { error: 'https_required' }
  if (process.env.ALLOWED_FETCH_HOST && parsed.hostname !== process.env.ALLOWED_FETCH_HOST)
    return { error: 'host_not_allowed' }

  return { parsed, url }
}

/** Send the verdict response and log it. */
function sendVerdict(res, reference, result, elapsed) {
  const logLine = { ref: reference, verdict: result.verdict, ms: elapsed }
  if (result.verdict === 'clean') {
    console.log(JSON.stringify(logLine))
    return send(res, 200, { status: 'clean' })
  }
  if (result.verdict === 'infected') {
    console.warn(JSON.stringify({ ...logLine, signature: result.signature }))
    return send(res, 200, { status: 'infected', signature: result.signature })
  }
  console.log(JSON.stringify({ ...logLine, reason: result.reason }))
  return send(res, 200, { status: 'unsupported', reason: result.reason })
}

async function handleScan(req, res) {
  if ((req.headers.authorization || '') !== `Bearer ${SCAN_TOKEN}`) {
    return send(res, 401, { error: 'unauthorized' })
  }

  let payload
  try {
    const raw = []
    for await (const chunk of req) raw.push(chunk)
    payload = JSON.parse(Buffer.concat(raw).toString('utf8'))
  } catch {
    return send(res, 400, { error: 'invalid_json' })
  }

  const url = payload && typeof payload.url === 'string' ? payload.url : ''
  const validated = validateUrl(url)
  if (validated.error) return send(res, 400, { error: validated.error })

  // Only ever fetch the storage host we were configured for. The URL arrives
  // from our own worker, but this endpoint is reachable from the internet, and
  // an unrestricted fetcher behind an auth token is still an SSRF primitive.
  const started = Date.now()
  let response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(BUDGET_MS) })
  } catch (err) {
    // Network failure or timeout — unknown, not un-scannable.
    return send(res, 502, {
      error: 'fetch_failed',
      detail: String(err?.message).slice(0, 200),
    })
  }
  if (!response.ok || !response.body) {
    // Includes an expired signed URL (400/403). The worker will retry, and a
    // later run signs a fresh one.
    return send(res, 502, { error: 'fetch_status', detail: `origin_http_${response.status}` })
  }

  try {
    const result = await scanStream(response.body)
    return sendVerdict(res, payload.reference, result, Date.now() - started)
  } catch (err) {
    console.error(JSON.stringify({ ref: payload?.reference, error: String(err?.message) }))
    return send(res, 502, {
      error: 'scan_failed',
      detail: String(err?.message).slice(0, 200),
    })
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    ping()
      .then((pong) => send(res, pong === 'PONG' ? 200 : 503, { ok: pong === 'PONG', clamd: pong }))
      .catch((err) => send(res, 503, { ok: false, error: String(err?.message) }))
    return
  }
  if (req.method !== 'POST' || req.url !== '/scan') return send(res, 404, { error: 'not_found' })
  handleScan(req, res).catch((err) => {
    console.error(err)
    if (!res.headersSent) send(res, 500, { error: 'internal' })
  })
})

// Longer than the scan budget so the platform does not cut a slow scan short.
server.requestTimeout = BUDGET_MS + 10000
server.headersTimeout = BUDGET_MS + 10000

server.listen(PORT, () => console.log(`attachment-scanner listening on ${PORT}`))

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
