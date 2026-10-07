/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * One POST to the Supabase Management API, with a curl fallback.
 *
 * Node's HTTP stack can fail where curl succeeds — corporate proxies and
 * TLS middleboxes intercept fetch/undici differently than libcurl. Retry
 * once through curl (present on Windows 10+, macOS, and every CI image we
 * run) before declaring the request failed, so the drift gate keeps its
 * live half on machines whose Node path is intercepted.
 *
 * Note: a *stale token* fails identically through both transports — the
 * fallback cannot fix bad credentials, only transport divergence.
 *
 * Returns a Response-shaped object (ok/status/text/json) so callers keep
 * their existing handling — the original Response when fetch worked, a
 * shim over curl's stdout when it had to.
 */
import { execFile } from 'node:child_process'

function curlPostJson(url, token, body) {
  return new Promise((resolve) => {
    execFile(
      'curl',
      [
        '-sS',
        '-X',
        'POST',
        url,
        '-H',
        `Authorization: Bearer ${token}`,
        '-H',
        'Content-Type: application/json',
        '-d',
        body,
        '-w',
        '\n%{http_code}',
      ],
      { timeout: 30_000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout) => {
        if (err || typeof stdout !== 'string') return resolve(null)
        const m = /\n(\d{3})\s*$/.exec(stdout)
        const status = m ? Number(m[1]) : 0
        const text = m ? stdout.slice(0, m.index) : stdout
        resolve({
          ok: status >= 200 && status < 300,
          status,
          text: async () => text,
          json: async () => JSON.parse(text),
        })
      },
    )
  })
}

export function managementApiUrl(projectRef) {
  return `https://api.supabase.com/v1/projects/${projectRef}/database/query`
}

export async function managementQuery(projectRef, token, query) {
  const url = managementApiUrl(projectRef)
  const body = JSON.stringify({ query })
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
    })
  } catch {
    response = null
  }
  /* Fall back when Node never stood a chance: a network failure, or the
     TLS-fingerprint refusal that surfaces as 401/403 with a valid token. */
  if (!response || response.status === 401 || response.status === 403) {
    const viaCurl = await curlPostJson(url, token, body)
    if (viaCurl) return viaCurl
  }
  return response
}
