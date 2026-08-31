/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Runs the real services/attachment-scanner/server.js against a mock clamd that
 * speaks the actual INSTREAM wire protocol, plus a local file server.
 *
 * Verifies everything except ClamAV's own scanning semantics: auth, URL
 * validation, the INSTREAM framing (4-byte big-endian lengths + zero-length
 * terminator), reply parsing, and the exact JSON bodies the worker consumes.
 */
const net = require('node:net')
const http = require('node:http')
const { spawn } = require('node:child_process')
const path = require('node:path')

const CLAMD_PORT = 13310
const FILE_PORT = 19000
const APP_PORT = 18080
const SERVER = path.join(__dirname, 'server.js')

const EICAR = String.raw`X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`

// What the mock clamd should answer for the next scan.
let clamdMode = 'clean'
// Records how the stream actually arrived, so we can assert the framing.
let lastStream = { chunks: 0, bytes: 0, sawTerminator: false }

function clamdReplyFor(mode) {
  switch (mode) {
    case 'infected':
      return 'stream: Win.Test.EICAR_HDB-1 FOUND\0'
    case 'sizelimit':
      return 'INSTREAM size limit exceeded. ERROR\0'
    case 'weird':
      return 'stream: something unexpected ERROR\0'
    default:
      return 'stream: OK\0'
  }
}

/** Returns true if the handshake is done (or the socket was closed), false if more data is needed. */
function handleHandshake(socket, state) {
  if (state.buf.subarray(0, 6).toString() === 'zPING\0'.slice(0, 6)) {
    socket.write('PONG\0')
    socket.end()
    return true
  }
  const header = 'zINSTREAM\0'
  if (state.buf.length < header.length) return false
  if (state.buf.subarray(0, header.length).toString() !== header) {
    socket.write('UNKNOWN COMMAND\0')
    socket.end()
    return true
  }
  state.started = true
  state.buf = state.buf.subarray(header.length)
  return true
}

function handleClamdData(socket, state, d) {
  state.buf = Buffer.concat([state.buf, d])

  if (!state.started) {
    if (!handleHandshake(socket, state)) return
    if (socket.destroyed) return
  }

  // Consume [4-byte BE length][payload] frames.
  for (;;) {
    if (state.buf.length < 4) return
    const len = state.buf.readUInt32BE(0)
    if (len === 0) {
      lastStream.sawTerminator = true
      socket.write(clamdReplyFor(clamdMode))
      socket.end()
      return
    }
    if (state.buf.length < 4 + len) return
    lastStream.chunks += 1
    lastStream.bytes += len
    state.buf = state.buf.subarray(4 + len)
  }
}

const clamd = net.createServer((socket) => {
  const state = { buf: Buffer.alloc(0), started: false }
  lastStream = { chunks: 0, bytes: 0, sawTerminator: false }

  socket.on('data', (d) => handleClamdData(socket, state, d))
  socket.on('error', () => {})
})

const files = http.createServer((req, res) => {
  if (req.url === '/eicar.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(EICAR)
  } else if (req.url === '/clean.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('a perfectly ordinary file')
  } else if (req.url === '/big.bin') {
    res.writeHead(200)
    res.end(Buffer.alloc(1024 * 512, 7))
  } else if (req.url === '/huge.bin') {
    // 27 MiB — over the 26214400 cap server.js enforces itself.
    res.writeHead(200)
    const chunk = Buffer.alloc(1024 * 1024, 3)
    let sent = 0
    const pump = () => {
      while (sent < 27) {
        sent++
        if (!res.write(chunk)) return res.once('drain', pump)
      }
      res.end()
    }
    pump()
  } else if (req.url === '/gone') {
    res.writeHead(403)
    res.end('expired')
  } else {
    res.writeHead(404)
    res.end('nope')
  }
})

const post = (body, headers = {}) =>
  fetch(`http://127.0.0.1:${APP_PORT}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token', ...headers },
    body: JSON.stringify(body),
  })

let failures = 0
function check(name, cond, extra = '') {
  if (!cond) failures++
  const suffix = extra ? `  — ${extra}` : ''
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${suffix}`)
}

async function main() {
  await new Promise((r) => clamd.listen(CLAMD_PORT, '127.0.0.1', r))
  await new Promise((r) => files.listen(FILE_PORT, '127.0.0.1', r))

  const child = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      PORT: String(APP_PORT),
      CLAMD_PORT: String(CLAMD_PORT),
      CLAMD_HOST: '127.0.0.1',
      SCAN_TOKEN: 'test-token',
      ALLOW_HTTP_FETCH: '1',
      ALLOWED_FETCH_HOST: '127.0.0.1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', (d) => process.stdout.write(`  [server] ${d}`))
  child.stderr.on('data', (d) => process.stderr.write(`  [server:err] ${d}`))

  // wait for listen
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${APP_PORT}/health`)
      break
    } catch {
      await new Promise((r) => setTimeout(r, 100))
    }
  }

  const url = (p) => `http://127.0.0.1:${FILE_PORT}${p}`

  // 1. health
  const h = await fetch(`http://127.0.0.1:${APP_PORT}/health`)
  check(
    'GET /health returns 200 with clamd PONG',
    h.status === 200 && (await h.json()).clamd === 'PONG',
  )

  // 2. auth
  const noAuth = await post({ url: url('/clean.txt') }, { Authorization: 'Bearer wrong' })
  check('bad token -> 401', noAuth.status === 401)

  // 3. clean
  clamdMode = 'clean'
  let r = await post({ url: url('/clean.txt'), reference: 'r1' })
  let body = await r.json()
  check(
    'clean file -> 200 {"status":"clean"}',
    r.status === 200 && body.status === 'clean',
    JSON.stringify(body),
  )
  check(
    'INSTREAM framed correctly (chunks>0, terminator seen)',
    lastStream.chunks > 0 && lastStream.sawTerminator,
    `chunks=${lastStream.chunks} bytes=${lastStream.bytes} term=${lastStream.sawTerminator}`,
  )
  check(
    'all bytes reached clamd',
    lastStream.bytes === Buffer.byteLength('a perfectly ordinary file'),
    `${lastStream.bytes} bytes`,
  )

  // 4. infected
  clamdMode = 'infected'
  r = await post({ url: url('/eicar.txt'), reference: 'r2' })
  body = await r.json()
  check(
    'infected -> 200 {"status":"infected", signature}',
    r.status === 200 && body.status === 'infected' && body.signature === 'Win.Test.EICAR_HDB-1',
    JSON.stringify(body),
  )

  // 5. clamd size limit -> settled unsupported
  clamdMode = 'sizelimit'
  r = await post({ url: url('/big.bin'), reference: 'r3' })
  body = await r.json()
  check(
    'clamd size limit -> 200 {"status":"unsupported","reason":"too_large"}',
    r.status === 200 && body.status === 'unsupported' && body.reason === 'too_large',
    JSON.stringify(body),
  )

  // 6. unrecognised clamd ERROR -> 502 (retryable), never a 200 verdict
  clamdMode = 'weird'
  r = await post({ url: url('/clean.txt'), reference: 'r4' })
  body = await r.json()
  check(
    'unknown clamd ERROR -> 502, not a verdict',
    r.status === 502,
    `${r.status} ${JSON.stringify(body)}`,
  )

  // 6b. Oversize is capped by server.js itself, BEFORE clamd sees it. clamd is
  // told to answer "clean" here on purpose: if the cap ever stops working, this
  // returns clean for a 27 MiB file, which is the worst wrong answer available.
  clamdMode = 'clean'
  r = await post({ url: url('/huge.bin'), reference: 'r3b' })
  body = await r.json()
  check(
    '27 MiB file -> 200 unsupported/too_large (never clean)',
    r.status === 200 && body.status === 'unsupported' && body.reason === 'too_large',
    JSON.stringify(body),
  )
  check(
    'oversize stream cut off at the cap, not fully relayed',
    lastStream.bytes <= 26214400 && !lastStream.sawTerminator,
    `relayed=${lastStream.bytes} term=${lastStream.sawTerminator}`,
  )

  // 7. origin failure (expired signed URL) -> 502 retryable
  clamdMode = 'clean'
  r = await post({ url: url('/gone'), reference: 'r5' })
  body = await r.json()
  check(
    'origin 403 (expired URL) -> 502 retryable',
    r.status === 502 && body.detail === 'origin_http_403',
    JSON.stringify(body),
  )

  // 8. URL validation
  r = await post({ url: 'https://evil.example.com/x', reference: 'r6' })
  body = await r.json()
  check(
    'host outside ALLOWED_FETCH_HOST -> 400',
    r.status === 400 && body.error === 'host_not_allowed',
    JSON.stringify(body),
  )

  r = await post({ reference: 'r7' })
  check('missing url -> 400', r.status === 400)

  // 9. wrong route / method
  const g = await fetch(`http://127.0.0.1:${APP_PORT}/scan`)
  check('GET /scan -> 404', g.status === 404)

  child.kill()
  clamd.close()
  files.close()
  console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
