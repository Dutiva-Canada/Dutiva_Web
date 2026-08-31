import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { assessLegislationText } from './contentSanity.ts'
import { amendmentFingerprint, assessJusticeStatute } from './justiceXml.ts'
import { assessOntarioActVersions, ontarioFingerprintPayload } from './ontarioApi.ts'
import { assessQuebecPackage, quebecFingerprint } from './quebecCkan.ts'

/**
 * monitor-law-changes — the law-change watcher behind the Knowledge view's
 * "Recent law changes" panel (src/features/app/guidance/).
 *
 * Ported from the retired Dutiva-Website repo, where it was driven by a Vercel
 * cron (`/api/trigger-law-monitor`, `0 7 * * *`). That cron lived in the repo's
 * `api/` directory and its `vercel.json`; when the Vercel project was
 * re-pointed at this repo — which has neither — the schedule silently ceased to
 * exist and the monitor stopped running after 2026-06-08. Scheduling now lives
 * in the database instead (0035_schedule_law_monitor.sql) so it cannot be lost
 * to a hosting or repository move again. See docs/LAW_MONITORING.md.
 *
 * What it does, per monitored page:
 *  - Detects content changes by SHA-256 over the extracted text.
 *  - Follows permanent redirects and records the new canonical URL.
 *  - Flags pages that stay unreachable, and — past a threshold — asks the model
 *    for a likely replacement URL, which is accepted only if it passes the
 *    host allowlist AND actually resolves.
 *  - Writes one structured `law_updates` row per event
 *    (change / redirect / broken / first_seen) with a plain-English summary.
 *
 * Scope note: this watches all 14 Canadian jurisdictions, which is deliberately
 * wider than the product's three supported jurisdictions (ON/QC/FED — see
 * docs/CANONICAL_FACTS.md). Watching costs nothing extra and builds history
 * ahead of AB/BC; the customer-facing panel is what filters, not the monitor.
 *
 * Required Supabase project secrets:
 *   SUPABASE_URL                — injected automatically
 *   SUPABASE_SERVICE_ROLE_KEY   — injected automatically
 *   HF_TOKEN                    — model access for summaries/URL recovery.
 *                                 Absent: the monitor still runs and still
 *                                 records events, with a generic summary.
 */

// ── All 14 Canadian jurisdictions ─────────────────────────────────────────────
// Primary source: official government legislation repositories.
// Stable / canonical URLs are preferred; avoid deep-linked PDFs where possible.
const MONITORED_PAGES: PageConfig[] = [
  // ── Federal ──────────────────────────────────────────────────────────────
  /* Federal law comes from Justice Canada's own XML publication rather than
     the Justice Laws website's HTML. Same authority, published under the Open
     Government Licence – Canada, and it states its own amendment date — so
     federal change detection reads a fact instead of inferring one from a
     hash. See docs/LAW_MONITORING.md. */
  {
    jurisdiction: 'Federal',
    law_name: 'Canada Labour Code',
    url: 'https://raw.githubusercontent.com/justicecanada/laws-lois-xml/main/eng/acts/L-2.xml',
    fallbacks: [],
    source: { kind: 'justice-xml', consolidatedNumber: 'L-2' },
  },
  {
    jurisdiction: 'Federal',
    law_name: 'Canadian Human Rights Act',
    url: 'https://raw.githubusercontent.com/justicecanada/laws-lois-xml/main/eng/acts/H-6.xml',
    fallbacks: [],
    source: { kind: 'justice-xml', consolidatedNumber: 'H-6' },
  },
  // ── Ontario ───────────────────────────────────────────────────────────────
  /* e-Laws' statute pages (www.ontario.ca/laws/statute/{id}) are a JavaScript
     app shell — after tag-stripping, every Ontario statute reduces to the
     same ~422 characters of boilerplate, so hashing that page can never
     detect an amendment (docs/LAW_MONITORING.md § Source health — audit of
     2026-07-30). The act-versions API those pages are built from is real,
     byte-stable JSON with no bot filter; see ontarioApi.ts and
     docs/LAW_MONITORING.md § Sourcing evaluation for Ontario and Québec. */
  {
    jurisdiction: 'Ontario',
    law_name: 'Employment Standards Act, 2000',
    url: 'https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/00e41',
    fallbacks: [],
    source: { kind: 'ontario-api', expectedActEn: 'Employment Standards Act' },
  },
  {
    jurisdiction: 'Ontario',
    law_name: 'Ontario Human Rights Code',
    url: 'https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/90h19',
    fallbacks: [],
    source: { kind: 'ontario-api', expectedActEn: 'Human Rights Code' },
  },
  {
    jurisdiction: 'Ontario',
    law_name: 'Workplace Safety and Insurance Act, 1997',
    url: 'https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/97w16',
    fallbacks: [],
    source: { kind: 'ontario-api', expectedActEn: 'Workplace Safety and Insurance Act' },
  },
  // ── British Columbia ──────────────────────────────────────────────────────
  {
    jurisdiction: 'British Columbia',
    law_name: 'Employment Standards Act (BC)',
    url: 'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96113_01',
    fallbacks: ['https://www.bclaws.ca/civix/document/id/complete/statreg/96113_01'],
  },
  {
    jurisdiction: 'British Columbia',
    law_name: 'Workers Compensation Act (BC)',
    url: 'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96492_01',
    fallbacks: [],
  },
  // ── Alberta ───────────────────────────────────────────────────────────────
  {
    jurisdiction: 'Alberta',
    law_name: 'Employment Standards Code (AB)',
    url: 'https://www.qp.alberta.ca/documents/Acts/E09.pdf',
    fallbacks: ['https://kings-printer.alberta.ca/documents/Acts/E09.pdf'],
  },
  // ── Quebec ────────────────────────────────────────────────────────────────
  /* LégisQuébec itself is reachable, but its CloudFront WAF rule keyed on
     User-Agent flips between 403 and 200 on identical URLs seconds apart —
     whole-page hashing there guarantees false alerts, on top of an embedded
     historique=YYYYMMDD value that changes on every request regardless of
     any amendment (docs/LAW_MONITORING.md § Sourcing evaluation). Données
     Québec's CKAN API publishes the same codified corpus as a first-party,
     byte-stable, no-bot-filter dataset instead; see quebecCkan.ts.

     Both LNT and Charter live in that dataset's single "Lois" resource, so
     detection here is dataset-level: a change to the resource is reported
     against both law_names, the same way an `html` source reports "this page
     changed" without saying which section. Per-statute drill-down into the
     zip (Statutes_EN_Status.txt names the exact statutes that changed) is a
     documented follow-up, not built here. The two rows share one API
     response but need distinct `url` values to key their own
     law_page_hashes/law_updates rows — the #LNT / #Charter fragment is never
     sent to the server (fragments are client-side only), so both fetch the
     identical endpoint. */
  {
    jurisdiction: 'Quebec',
    law_name: 'Act respecting labour standards (LNT)',
    url: 'https://www.donneesquebec.ca/recherche/api/3/action/package_show?id=c8433300-f752-4815-8ea2-69cad416dd80#LNT',
    fallbacks: [],
    source: { kind: 'quebec-ckan', resourceName: 'Lois' },
  },
  {
    jurisdiction: 'Quebec',
    law_name: 'Charter of Human Rights and Freedoms (Quebec)',
    url: 'https://www.donneesquebec.ca/recherche/api/3/action/package_show?id=c8433300-f752-4815-8ea2-69cad416dd80#Charter',
    fallbacks: [],
    source: { kind: 'quebec-ckan', resourceName: 'Lois' },
  },
  // ── Manitoba ──────────────────────────────────────────────────────────────
  {
    jurisdiction: 'Manitoba',
    law_name: 'Employment Standards Code (MB)',
    url: 'https://web2.gov.mb.ca/laws/statutes/ccsm/e110e.php',
    fallbacks: ['https://www.manitoba.ca/cca/elaws/statutes/es_employment_standards_code/'],
  },
  // ── Saskatchewan ─────────────────────────────────────────────────────────
  {
    jurisdiction: 'Saskatchewan',
    law_name: 'Saskatchewan Employment Act',
    url: 'https://www.qp.gov.sk.ca/documents/English/Statutes/Statutes/S15-1.pdf',
    fallbacks: [
      'https://publications.saskatchewan.ca/api/v1/products/73330/formats/82807/download',
    ],
  },
  // ── Nova Scotia ───────────────────────────────────────────────────────────
  {
    jurisdiction: 'Nova Scotia',
    law_name: 'Labour Standards Code (NS)',
    url: 'https://nslegislature.ca/sites/default/files/legc/statutes/labour%20standards%20code.htm',
    fallbacks: ['https://novascotia.ca/lae/employmentrights/docs/labourstandardscode.pdf'],
  },
  // ── New Brunswick ─────────────────────────────────────────────────────────
  {
    jurisdiction: 'New Brunswick',
    law_name: 'Employment Standards Act (NB)',
    url: 'https://laws.gnb.ca/en/showdoc/cs/E-7.2',
    fallbacks: ['https://gnb.ca/0062/acts/acts/e-07-2.htm'],
  },
  // ── Prince Edward Island ──────────────────────────────────────────────────
  {
    jurisdiction: 'Prince Edward Island',
    law_name: 'Employment Standards Act (PEI)',
    url: 'https://www.princeedwardisland.ca/sites/default/files/legislation/e-6_2-employment_standards_act.pdf',
    fallbacks: ['https://www.princeedwardisland.ca/en/legislation/employment-standards-act'],
  },
  // ── Newfoundland and Labrador ─────────────────────────────────────────────
  {
    jurisdiction: 'Newfoundland and Labrador',
    law_name: 'Labour Standards Act (NL)',
    url: 'https://www.assembly.nl.ca/legislation/sr/statutes/l00-2.htm',
    fallbacks: ['https://assembly.nl.ca/legislation/sr/statutes/l00-2.htm'],
  },
  // ── Northwest Territories ─────────────────────────────────────────────────
  {
    jurisdiction: 'Northwest Territories',
    law_name: 'Employment Standards Act (NWT)',
    url: 'https://www.justice.gov.nt.ca/en/files/legislation/employment-standards/employment-standards.a.pdf',
    fallbacks: ['https://www.ntassembly.ca/sites/default/files/EmploymentStandardsAct.pdf'],
  },
  // ── Nunavut ───────────────────────────────────────────────────────────────
  {
    jurisdiction: 'Nunavut',
    law_name: 'Labour Standards Act (NU)',
    url: 'https://www.nunavutlegislation.ca/en/consolidated-law/current/chapter-l-1',
    fallbacks: ['https://nunavutlegislation.ca/en/consolidated-law/current/chapter-l-1'],
  },
  // ── Yukon ─────────────────────────────────────────────────────────────────
  {
    jurisdiction: 'Yukon',
    law_name: 'Employment Standards Act (YK)',
    url: 'https://legislation.yukon.ca/acts/esta_c.pdf',
    fallbacks: ['https://www.yukon.ca/en/employment-standards'],
  },
]

/**
 * How a page's "has it changed?" question gets answered.
 *
 * `html` hashes the extracted text — the original strategy, and the only one
 * available for sources that publish nothing machine-readable.
 *
 * `justice-xml` reads `lims:lastAmendedDate` straight out of Justice Canada's
 * consolidated XML. Strictly better where it applies: no hashing, so a
 * publisher reformatting cannot fake a change and a JavaScript shell cannot
 * hide one. Only federal law is published this way today.
 *
 * `ontario-api` and `quebec-ckan` read structured JSON from e-Laws' and
 * Données Québec's machine-readable APIs respectively — see ontarioApi.ts
 * and quebecCkan.ts. Same rationale as `justice-xml`: the underlying HTML is
 * either a JS shell (Ontario) or WAF-flaky and full of request-derived noise
 * (Québec), so a hash over it is worse than useless.
 */
type PageSource =
  | { kind: 'html' }
  | { kind: 'justice-xml'; consolidatedNumber: string }
  | { kind: 'ontario-api'; expectedActEn: string }
  | { kind: 'quebec-ckan'; resourceName: string }

interface PageConfig {
  jurisdiction: string
  law_name: string
  url: string
  fallbacks: string[]
  /** Defaults to `html` when omitted. */
  source?: PageSource
}

interface FetchResult {
  ok: boolean
  text: string | null
  /** May differ from the requested URL when a redirect was followed. */
  finalUrl: string
  wasRedirected: boolean
  statusCode: number
}

function extractText(html: string): string {
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

async function sha256(text: string): Promise<string> {
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
const XML_HEAD_BYTES = 16384

async function fetchWithTimeout(
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
        'User-Agent':
          'Dutiva-LawMonitor/2.0 (compliance@dutiva.ca; Canadian employment law compliance platform)',
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

/** Try the primary URL, then each fallback in order. First success wins. */
async function fetchWithFallbacks(page: PageConfig): Promise<FetchResult & { usedUrl: string }> {
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

/** Ask the model to suggest a likely current URL for a legislation page that moved. */
async function findNewUrl(
  page: PageConfig,
  statusCode: number,
  hfToken: string,
): Promise<string | null> {
  if (!hfToken) return null
  try {
    const res = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: [
          {
            role: 'system',
            content:
              'You are a Canadian legal research assistant. When given a broken or moved ' +
              'government legislation URL, output ONLY the most likely current URL for that ' +
              'specific law — no explanation, no markdown, just the raw URL. ' +
              'Use official government domains: ontario.ca/laws, laws-lois.justice.gc.ca, ' +
              'bclaws.gov.bc.ca, qp.alberta.ca, legisquebec.gouv.qc.ca, laws.gnb.ca, ' +
              'nslegislature.ca, assembly.nl.ca, princeedwardisland.ca, web2.gov.mb.ca, ' +
              'qp.gov.sk.ca, justice.gov.nt.ca, nunavutlegislation.ca, legislation.yukon.ca.',
          },
          {
            role: 'user',
            content:
              `The following URL for "${page.law_name}" (${page.jurisdiction}) returned HTTP ${statusCode}:\n` +
              `${page.url}\n\n` +
              'What is the most likely current official URL for this legislation?',
          },
        ],
        max_tokens: 80,
        temperature: 0.1,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const suggested = data.choices?.[0]?.message?.content?.trim()
    if (suggested && /^https?:\/\/.+\..+/.test(suggested)) return suggested
    return null
  } catch {
    return null
  }
}

/** Plain-English summary of a detected change, for an HR audience. */
async function summarizeChange(
  lawName: string,
  jurisdiction: string,
  snippet: string,
  hfToken: string,
): Promise<string> {
  if (!hfToken) return `Change detected on ${lawName}. Review the legislation page directly.`
  try {
    const res = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: [
          {
            role: 'system',
            content:
              'You are a Canadian employment law specialist. Summarize detected changes ' +
              'to employment legislation in 2-3 plain-English sentences. Focus on employer ' +
              'and HR obligations: what must employers do differently, and by when.',
          },
          {
            role: 'user',
            content:
              `A change was detected on the ${jurisdiction} "${lawName}" legislation page. ` +
              `Excerpt:\n\n${snippet.slice(0, 1800)}\n\n` +
              'What changed and what does it mean for employers?',
          },
        ],
        max_tokens: 220,
        temperature: 0.2,
      }),
    })
    if (!res.ok) return `Change detected on ${lawName}. Review the legislation page.`
    const data = await res.json()
    return (
      data.choices?.[0]?.message?.content?.trim() ??
      `Change detected on ${lawName}. Review the legislation page.`
    )
  } catch {
    return `Change detected on ${lawName}. Review the legislation page.`
  }
}

const CRON_LOCK_JOB = 'monitor-law-changes'
/** Longer than any expected run — a full sweep is ~19 pages of network I/O. */
const CRON_LOCK_TTL_SECONDS = 30 * 60

/**
 * Only a service-role caller may run this job. The pg_cron schedule
 * (0035_schedule_law_monitor.sql, amended by 0049) presents the shared secret.
 * This check is the real gate — `verify_jwt` is false at the gateway, so
 * nothing upstream checks a caller at all.
 *
 * Until 2026-08-06 this also accepted any token whose JWT payload carried
 * role=service_role. That payload was base64-decoded and trusted; the
 * signature was never verified. `Bearer x.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.x`
 * authenticated anyone on the internet, to a 19-page government-site sweep
 * and the model spend behind it. The branch is gone.
 */
function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && req.headers.get('x-trigger-secret') === sharedSecret) return true

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false

  // Exact match only. Both are real credentials; neither is derived from
  // anything the caller controls.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && token === serviceKey) || (secretKey !== '' && token === secretKey)
}

/**
 * SSRF guard: a model-suggested replacement URL must be HTTPS on a known
 * government/legislation host before we fetch it server-side or store it as the
 * new monitoring target.
 */
const ALLOWED_LAW_HOST_SUFFIXES = [
  'justice.gc.ca',
  'canlii.org',
  'canada.ca',
  'ontario.ca',
  'donneesquebec.ca',
  'bclaws.gov.bc.ca',
  'bclaws.ca',
  'qp.alberta.ca',
  'kings-printer.alberta.ca',
  'legisquebec.gouv.qc.ca',
  'gov.mb.ca',
  'manitoba.ca',
  'qp.gov.sk.ca',
  'publications.saskatchewan.ca',
  'nslegislature.ca',
  'novascotia.ca',
  'laws.gnb.ca',
  'gnb.ca',
  'princeedwardisland.ca',
  'assembly.nl.ca',
  'justice.gov.nt.ca',
  'gov.nu.ca',
  'gov.yk.ca',
]

function isAllowedLawHost(candidate: string): boolean {
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return ALLOWED_LAW_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!isAuthorizedTrigger(req)) {
    return new Response(JSON.stringify({ error: 'Forbidden.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const hfToken = Deno.env.get('HF_TOKEN') ?? ''

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // Take the lease so a long run can't race the next scheduled trigger.
  const instanceId = crypto.randomUUID()
  const { data: acquired, error: lockError } = await db.rpc('acquire_cron_lock', {
    p_job_name: CRON_LOCK_JOB,
    p_instance_id: instanceId,
    p_ttl_seconds: CRON_LOCK_TTL_SECONDS,
  })
  if (lockError) {
    console.warn(
      '[monitor-law-changes] acquire_cron_lock failed; continuing without lock:',
      lockError.message,
    )
  } else if (!acquired) {
    console.warn('[monitor-law-changes] another instance already holds the lock; skipping.')
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: 'another-instance-running' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { data: hashRows } = await db.from('law_page_hashes').select('*')
  const hashMap: Record<string, { hash: string; failures: number; redirectUrl: string | null }> = {}
  for (const row of hashRows ?? []) {
    hashMap[row.url] = {
      hash: row.content_hash,
      failures: row.consecutive_failures ?? 0,
      redirectUrl: row.redirect_url ?? null,
    }
  }

  const results: string[] = []
  /** Consecutive failures before we alert and attempt URL recovery. */
  const BROKEN_ALERT_THRESHOLD = 3

  for (const page of MONITORED_PAGES) {
    try {
      const fetchResult = await fetchWithFallbacks(page)
      const record = hashMap[page.url]
      const isNew = !record

      // ── Case 1: permanent redirect ──────────────────────────────────────
      /* HTML sources only: a redirect on an XML source is not a "the page
         moved" event to record and follow — the file path is the identity of
         the Act, and the XML branch below verifies that identity directly. */
      if (
        (page.source?.kind ?? 'html') === 'html' &&
        fetchResult.ok &&
        fetchResult.wasRedirected &&
        fetchResult.finalUrl !== page.url
      ) {
        const newUrl = fetchResult.finalUrl

        await db.from('law_page_hashes').upsert({
          // Keep the original URL as the key so existing records still match.
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: await sha256(extractText(fetchResult.text ?? '')),
          redirect_url: newUrl,
          is_broken: false,
          consecutive_failures: 0,
          last_checked: new Date().toISOString(),
        })

        await db.from('law_updates').insert({
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          url: newUrl,
          content_hash: null,
          change_summary:
            `The legislation page for "${page.law_name}" (${page.jurisdiction}) has permanently moved. ` +
            `Old URL: ${page.url} → New URL: ${newUrl}. ` +
            'Dutiva has automatically updated its monitoring to the new location.',
          raw_diff: `Redirect: ${page.url} → ${newUrl}`,
          detected_at: new Date().toISOString(),
          is_new: false,
          event_type: 'redirect',
        })

        results.push(`REDIRECT  ${page.jurisdiction}/${page.law_name}: → ${newUrl}`)
        continue
      }

      // ── Case 2: unreachable ─────────────────────────────────────────────
      if (!fetchResult.ok) {
        const failures = (record?.failures ?? 0) + 1

        await db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: record?.hash ?? '',
          is_broken: true,
          consecutive_failures: failures,
          last_broken_at: new Date().toISOString(),
          last_checked: new Date().toISOString(),
        })

        let newUrlSuggestion: string | null = null
        if (failures >= BROKEN_ALERT_THRESHOLD && hfToken) {
          newUrlSuggestion = await findNewUrl(page, fetchResult.statusCode, hfToken)

          if (newUrlSuggestion && !isAllowedLawHost(newUrlSuggestion)) {
            console.warn(
              '[monitor-law-changes] discarding out-of-allowlist suggested URL:',
              newUrlSuggestion,
            )
            newUrlSuggestion = null
          }

          // Only trust a suggestion that actually resolves.
          if (newUrlSuggestion) {
            const verify = await fetchWithTimeout(newUrlSuggestion)
            if (!verify.ok) newUrlSuggestion = null
          }

          if (newUrlSuggestion) {
            const newFetch = await fetchWithTimeout(newUrlSuggestion)
            if (newFetch.ok && newFetch.text) {
              const newHash = await sha256(extractText(newFetch.text))

              await db.from('law_page_hashes').upsert({
                url: page.url,
                jurisdiction: page.jurisdiction,
                law_name: page.law_name,
                content_hash: newHash,
                redirect_url: newUrlSuggestion,
                is_broken: false,
                consecutive_failures: 0,
                last_checked: new Date().toISOString(),
              })

              await db.from('law_updates').insert({
                jurisdiction: page.jurisdiction,
                law_name: page.law_name,
                url: newUrlSuggestion,
                change_summary:
                  `The original URL for "${page.law_name}" was broken (HTTP ${fetchResult.statusCode}). ` +
                  `Dutiva automatically located the new URL: ${newUrlSuggestion}. ` +
                  'Monitoring has been updated to the new location.',
                raw_diff: `Auto-discovered: ${page.url} → ${newUrlSuggestion}`,
                detected_at: new Date().toISOString(),
                is_new: false,
                event_type: 'redirect',
              })

              results.push(
                `AUTO-FIX  ${page.jurisdiction}/${page.law_name}: broken → found ${newUrlSuggestion}`,
              )
              continue
            }
          }
        }

        // Alert once, on the run that crosses the threshold.
        if (failures === BROKEN_ALERT_THRESHOLD) {
          await db.from('law_updates').insert({
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            url: page.url,
            change_summary:
              `The "${page.law_name}" (${page.jurisdiction}) legislation page has been unreachable ` +
              `for ${failures} consecutive checks (HTTP ${fetchResult.statusCode}). ` +
              `${newUrlSuggestion ? `Suggested new URL: ${newUrlSuggestion} (could not be verified). ` : ''}` +
              'Manual review of the URL may be needed.',
            raw_diff: `Status: ${fetchResult.statusCode} · Failures: ${failures}`,
            detected_at: new Date().toISOString(),
            is_new: false,
            event_type: 'broken',
          })
        }

        results.push(
          `BROKEN    ${page.jurisdiction}/${page.law_name}: HTTP ${fetchResult.statusCode} (failure #${failures})`,
        )
        continue
      }

      // ── Case 3a: XML-sourced law — read the stated amendment date ──────
      /* No hashing: the document says when it was last amended, so we compare
         that. Nothing here can be fooled by a reformat or hidden by a shell. */
      if (page.source?.kind === 'justice-xml') {
        const verdict = assessJusticeStatute(fetchResult.text ?? '', page.source.consolidatedNumber)

        if (!verdict.ok) {
          const failures = (record?.failures ?? 0) + 1

          await db.from('law_page_hashes').upsert({
            url: page.url,
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            content_hash: record?.hash ?? '',
            is_broken: true,
            consecutive_failures: failures,
            last_broken_at: new Date().toISOString(),
            last_checked: new Date().toISOString(),
          })

          if (failures === BROKEN_ALERT_THRESHOLD) {
            await db.from('law_updates').insert({
              jurisdiction: page.jurisdiction,
              law_name: page.law_name,
              url: page.url,
              change_summary:
                `The XML source for "${page.law_name}" (${page.jurisdiction}) could not be read as ` +
                `the expected Act for ${failures} consecutive checks. ${verdict.detail} ` +
                'Federal change detection is not effective until this is resolved.',
              raw_diff: `Justice XML check: ${verdict.reason} · Failures: ${failures}`,
              detected_at: new Date().toISOString(),
              is_new: false,
              event_type: 'broken',
            })
          }

          results.push(
            `XML-BAD   ${page.jurisdiction}/${page.law_name}: ${verdict.reason} (failure #${failures})`,
          )
          continue
        }

        const fingerprint = amendmentFingerprint(verdict.facts.lastAmendedDate)
        const changed = isNew || record?.hash !== fingerprint

        await db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: fingerprint,
          is_broken: false,
          consecutive_failures: 0,
          last_checked: new Date().toISOString(),
        })

        if (!changed) {
          results.push(
            `OK        ${page.jurisdiction}/${page.law_name}: unchanged since ${verdict.facts.lastAmendedDate}`,
          )
          continue
        }

        await db.from('law_updates').insert({
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          url: page.url,
          content_hash: fingerprint,
          change_summary: isNew
            ? `"${page.law_name}" (${page.jurisdiction}) has been added to Dutiva's law monitoring, ` +
              `sourced from Justice Canada's consolidated XML. It was last amended on ` +
              `${verdict.facts.lastAmendedDate}.`
            : `"${page.law_name}" (${page.jurisdiction}) has been amended. Justice Canada now reports ` +
              `a last-amended date of ${verdict.facts.lastAmendedDate}` +
              `${record?.hash ? ` (previously ${record.hash.replace('amended:', '')})` : ''}. ` +
              'Review the consolidated Act for what changed and what it means for employers.',
          raw_diff:
            `lastAmendedDate: ${verdict.facts.lastAmendedDate}` +
            `${verdict.facts.currentDate ? ` · consolidation current to ${verdict.facts.currentDate}` : ''}`,
          detected_at: new Date().toISOString(),
          is_new: isNew,
          event_type: isNew ? 'first_seen' : 'change',
        })

        results.push(
          `${isNew ? 'FIRST_SEEN' : 'AMENDED  '} ${page.jurisdiction}/${page.law_name}: ${verdict.facts.lastAmendedDate}`,
        )
        continue
      }

      // ── Case 3b: Ontario e-Laws act-versions API ────────────────────────
      if (page.source?.kind === 'ontario-api') {
        const verdict = assessOntarioActVersions(fetchResult.text ?? '', page.source.expectedActEn)

        if (!verdict.ok) {
          const failures = (record?.failures ?? 0) + 1

          await db.from('law_page_hashes').upsert({
            url: page.url,
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            content_hash: record?.hash ?? '',
            is_broken: true,
            consecutive_failures: failures,
            last_broken_at: new Date().toISOString(),
            last_checked: new Date().toISOString(),
          })

          if (failures === BROKEN_ALERT_THRESHOLD) {
            await db.from('law_updates').insert({
              jurisdiction: page.jurisdiction,
              law_name: page.law_name,
              url: page.url,
              change_summary:
                `The e-Laws API for "${page.law_name}" (${page.jurisdiction}) could not be read as ` +
                `the expected Act for ${failures} consecutive checks. ${verdict.detail} ` +
                'Ontario change detection is not effective until this is resolved.',
              raw_diff: `Ontario API check: ${verdict.reason} · Failures: ${failures}`,
              detected_at: new Date().toISOString(),
              is_new: false,
              event_type: 'broken',
            })
          }

          results.push(
            `API-BAD   ${page.jurisdiction}/${page.law_name}: ${verdict.reason} (failure #${failures})`,
          )
          continue
        }

        const fingerprint = `ontario-api:${await sha256(ontarioFingerprintPayload(verdict.facts))}`
        const changed = isNew || record?.hash !== fingerprint

        await db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: fingerprint,
          is_broken: false,
          consecutive_failures: 0,
          last_checked: new Date().toISOString(),
        })

        if (!changed) {
          results.push(`OK        ${page.jurisdiction}/${page.law_name}: no change`)
          continue
        }

        await db.from('law_updates').insert({
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          url: page.url,
          content_hash: fingerprint,
          change_summary: isNew
            ? `"${page.law_name}" (${page.jurisdiction}) has been added to Dutiva's law monitoring, ` +
              `sourced from Ontario e-Laws' act-versions API. Current version in force from ` +
              `${verdict.facts.current?.dateFrom ?? 'an unspecified date'}.`
            : `"${page.law_name}" (${page.jurisdiction}) has a new or changed version on record. ` +
              `The current version is now in force from ${verdict.facts.current?.dateFrom ?? 'an unspecified date'}. ` +
              'Review the Act for what changed and what it means for employers.',
          raw_diff: `current dateFrom: ${verdict.facts.current?.dateFrom ?? 'unknown'} · versions on record: ${verdict.facts.versionCount}`,
          detected_at: new Date().toISOString(),
          is_new: isNew,
          event_type: isNew ? 'first_seen' : 'change',
        })

        results.push(
          `${isNew ? 'FIRST_SEEN' : 'AMENDED  '} ${page.jurisdiction}/${page.law_name}: ${verdict.facts.current?.dateFrom ?? 'unknown'}`,
        )
        continue
      }

      // ── Case 3c: Québec Données Québec CKAN dataset ─────────────────────
      if (page.source?.kind === 'quebec-ckan') {
        const verdict = assessQuebecPackage(fetchResult.text ?? '', page.source.resourceName)

        if (!verdict.ok) {
          const failures = (record?.failures ?? 0) + 1

          await db.from('law_page_hashes').upsert({
            url: page.url,
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            content_hash: record?.hash ?? '',
            is_broken: true,
            consecutive_failures: failures,
            last_broken_at: new Date().toISOString(),
            last_checked: new Date().toISOString(),
          })

          if (failures === BROKEN_ALERT_THRESHOLD) {
            await db.from('law_updates').insert({
              jurisdiction: page.jurisdiction,
              law_name: page.law_name,
              url: page.url,
              change_summary:
                `The Données Québec dataset for "${page.law_name}" (${page.jurisdiction}) could not be read ` +
                `as expected for ${failures} consecutive checks. ${verdict.detail} ` +
                'Québec change detection is not effective until this is resolved.',
              raw_diff: `Québec CKAN check: ${verdict.reason} · Failures: ${failures}`,
              detected_at: new Date().toISOString(),
              is_new: false,
              event_type: 'broken',
            })
          }

          results.push(
            `API-BAD   ${page.jurisdiction}/${page.law_name}: ${verdict.reason} (failure #${failures})`,
          )
          continue
        }

        const fingerprint = quebecFingerprint(verdict.facts)
        const changed = isNew || record?.hash !== fingerprint

        await db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: fingerprint,
          is_broken: false,
          consecutive_failures: 0,
          last_checked: new Date().toISOString(),
        })

        if (!changed) {
          results.push(`OK        ${page.jurisdiction}/${page.law_name}: no change`)
          continue
        }

        await db.from('law_updates').insert({
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          url: page.url,
          content_hash: fingerprint,
          change_summary: isNew
            ? `"${page.law_name}" (${page.jurisdiction}) has been added to Dutiva's law monitoring, ` +
              `sourced from Données Québec's codified-legislation dataset (resource last modified ` +
              `${verdict.facts.lastModified}).`
            : `"${page.law_name}" (${page.jurisdiction}): Données Québec's codified-legislation dataset ` +
              `was refreshed (resource last modified ${verdict.facts.lastModified}). This dataset covers ` +
              'every codified Quebec Act, not just this one — review LégisQuébec for what changed and ' +
              'what it means for employers.',
          raw_diff: `resource: ${verdict.facts.resourceName} · last_modified: ${verdict.facts.lastModified} · url: ${verdict.facts.url}`,
          detected_at: new Date().toISOString(),
          is_new: isNew,
          event_type: isNew ? 'first_seen' : 'change',
        })

        results.push(`${isNew ? 'FIRST_SEEN' : 'CHANGE   '} ${page.jurisdiction}/${page.law_name}`)
        continue
      }

      // ── Case 3d: HTML-sourced law — but is it actually legislation? ─────
      const text = extractText(fetchResult.text ?? '')

      /* A 200 is not proof of a real check. WAF pages served as 200, bot
         interstitials and JavaScript app shells all sail through the status
         check and then hash to something stable, so the page reports "no
         change" forever while detecting nothing. Treat those as failures so
         they surface instead of masquerading as health. See contentSanity.ts.

         No LLM URL recovery on this path, unlike a hard failure: the URL
         resolved fine, so "find a different URL" is not the remedy — a human
         needs to pick a different source format (or a route that isn't
         IP-blocked). Guessing here would burn model calls on a working URL. */
      const verdict = assessLegislationText(text)
      if (!verdict.ok) {
        const failures = (record?.failures ?? 0) + 1

        await db.from('law_page_hashes').upsert({
          url: page.url,
          jurisdiction: page.jurisdiction,
          law_name: page.law_name,
          content_hash: record?.hash ?? '',
          is_broken: true,
          consecutive_failures: failures,
          last_broken_at: new Date().toISOString(),
          last_checked: new Date().toISOString(),
        })

        if (failures === BROKEN_ALERT_THRESHOLD) {
          await db.from('law_updates').insert({
            jurisdiction: page.jurisdiction,
            law_name: page.law_name,
            url: page.url,
            change_summary:
              `The "${page.law_name}" (${page.jurisdiction}) page returned HTTP 200 but did not contain legislation ` +
              `for ${failures} consecutive checks. ${verdict.detail} ` +
              'Monitoring for this law is not effective until the source is changed — this page cannot detect an amendment.',
            raw_diff: `Sanity check: ${verdict.reason} · Failures: ${failures} · Extracted ${text.trim().length} chars`,
            detected_at: new Date().toISOString(),
            is_new: false,
            event_type: 'broken',
          })
        }

        results.push(
          `NOT-LAW   ${page.jurisdiction}/${page.law_name}: ${verdict.reason} (failure #${failures})`,
        )
        continue
      }

      const hash = await sha256(text)
      const changed = isNew || record?.hash !== hash

      await db.from('law_page_hashes').upsert({
        url: page.url,
        jurisdiction: page.jurisdiction,
        law_name: page.law_name,
        content_hash: hash,
        is_broken: false,
        consecutive_failures: 0,
        last_checked: new Date().toISOString(),
      })

      if (!changed) {
        results.push(`OK        ${page.jurisdiction}/${page.law_name}: no change`)
        continue
      }

      const snippet = text.slice(0, 2000)
      const summary = isNew
        ? `"${page.law_name}" (${page.jurisdiction}) has been added to Dutiva's law monitoring. Baseline captured.`
        : await summarizeChange(page.law_name, page.jurisdiction, snippet, hfToken)

      await db.from('law_updates').insert({
        jurisdiction: page.jurisdiction,
        law_name: page.law_name,
        url: fetchResult.finalUrl || page.url,
        content_hash: hash,
        change_summary: summary,
        raw_diff: isNew ? null : snippet,
        detected_at: new Date().toISOString(),
        is_new: isNew,
        event_type: isNew ? 'first_seen' : 'change',
      })

      results.push(`${isNew ? 'FIRST_SEEN' : 'CHANGE   '} ${page.jurisdiction}/${page.law_name}`)
    } catch (err) {
      results.push(`ERROR     ${page.jurisdiction}/${page.law_name}: ${String(err)}`)
    }
  }

  // Release the lease so the next run starts promptly. If the TTL was exceeded
  // and someone else took it, this is a no-op and the lease expires on its own.
  if (!lockError && acquired) {
    const { error: releaseError } = await db.rpc('release_cron_lock', {
      p_job_name: CRON_LOCK_JOB,
      p_instance_id: instanceId,
    })
    if (releaseError) {
      console.warn('[monitor-law-changes] release_cron_lock failed:', releaseError.message)
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      checked: MONITORED_PAGES.length,
      timestamp: new Date().toISOString(),
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
