/**
 * The network and text layer for monitor-law-changes — fetch with timeouts,
 * Range requests for big XML/zip sources, HTML text extraction, hashing.
 */
import type { PageConfig } from './pages.ts'
import type { RangeFetcher } from './zipRange.ts'

export const LAW_MONITOR_UA =
  'Dutiva-LawMonitor/2.1 (compliance@dutiva.ca; Canadian employment law compliance platform)'

export interface FetchResult {
  ok: boolean
  text: string | null
  /** May differ from the requested URL when a redirect was followed. */
  finalUrl: string
  wasRedirected: boolean
  statusCode: number
}

export function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Bytes requested from an XML statute. Everything read from those documents
 * lives in the `<Identification>` block at the very top, and the Acts run to
 * megabytes, so a Range request turns each check into a couple of KB. A server
 * that ignores `Range` simply returns the whole file, which still parses.
 */
export const XML_HEAD_BYTES = 16384

export async function fetchWithTimeout(
  url: string,
  timeoutMs = 18000,
  rangeBytes?: number,
): Promise<FetchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': LAW_MONITOR_UA,
        Accept: 'text/html,application/xhtml+xml,application/pdf,*/*',
        ...(rangeBytes === undefined ? {} : { Range: `bytes=0-${rangeBytes - 1}` }),
      },
    })
    clearTimeout(timer)
    const text = res.ok ? await res.text() : null
    return {
      ok: res.ok,
      text,
      finalUrl: res.url,
      wasRedirected: res.url !== url && res.url !== '',
      statusCode: res.status,
    }
  } catch {
    clearTimeout(timer)
    return { ok: false, text: null, finalUrl: url, wasRedirected: false, statusCode: 0 }
  }
}

/** Content-Length of a remote file without downloading it. */
export async function headContentLength(url: string): Promise<number | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const len = Number(res.headers.get('content-length'))
    return Number.isFinite(len) && len > 0 ? len : null
  } catch {
    return null
  }
}

/**
 * A RangeFetcher for a remote file. The Données Québec host answers 206
 * (verified 2026-10-04); a server that ignores Range returns 200 with the
 * whole file — still correct once sliced to the requested window.
 */
export function zipRangeFetcher(url: string): RangeFetcher {
  return async (start: number, end: number) => {
    const res = await fetch(url, {
      headers: { Range: `bytes=${start}-${end}`, 'User-Agent': LAW_MONITOR_UA },
    })
    if (!res.ok && res.status !== 206) throw new Error(`range fetch failed: HTTP ${res.status}`)
    const buf = new Uint8Array(await res.arrayBuffer())
    return res.status === 200 ? buf.subarray(start, end + 1) : buf
  }
}

/** Try the primary URL, then each fallback in order. First success wins. */
export async function fetchWithFallbacks(page: PageConfig): Promise<FetchResult & { usedUrl: string }> {
  const urls = [page.url, ...page.fallbacks]
  const rangeBytes = page.source?.kind === 'justice-xml' ? XML_HEAD_BYTES : undefined
  let lastResult: FetchResult = {
    ok: false,
    text: null,
    finalUrl: page.url,
    wasRedirected: false,
    statusCode: 0,
  }
  for (const url of urls) {
    const result = await fetchWithTimeout(url, 18000, rangeBytes)
    if (result.ok) return { ...result, usedUrl: url }
    lastResult = result
  }
  return { ...lastResult, usedUrl: page.url }
}
