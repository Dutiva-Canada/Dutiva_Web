/**
 * Reading Québec's codified-legislation dataset out of Données Québec's
 * CKAN API.
 *
 * LégisQuébec itself is reachable — the earlier "unreachable" finding does
 * not reproduce; the refusal is a CloudFront WAF rule keyed on `User-Agent`,
 * observed flipping between 403 and 200 on identical URLs seconds apart
 * (docs/LAW_MONITORING.md § Sourcing evaluation for Ontario and Québec). That
 * makes it exactly the wrong thing to hash: whole-page hashing would produce
 * a false alert on a normal day from the block alone, on top of an embedded
 * `historique=YYYYMMDD` value that changes on every request regardless of
 * any amendment.
 *
 * Données Québec publishes the same underlying corpus as a first-party,
 * no-bot-filter, machine-readable dataset instead:
 *
 *   https://www.donneesquebec.ca/recherche/api/3/action/package_show
 *     ?id=c8433300-f752-4815-8ea2-69cad416dd80
 *
 * ("Lois et règlements codifiés du Québec" — dataset id verified live and
 * byte-stable across two independent fetches, 2026-08-05.) Its "Lois"
 * resource is a dated zip (`20260720_lois.zip`) containing every codified
 * Act in XML, refreshed on an "as needed" cadence; the resource's
 * `last_modified` timestamp and the date embedded in its filename both move
 * when a new release lands.
 *
 * Detection is per-statute, not dataset-level. A republish of the "Lois"
 * resource triggers a drill-down (zipRange.ts — a few Range requests, not a
 * 45 MB download): `Statutes_EN_Status.txt` says which Act's consolidation
 * stamp moved, and the Act's own XML (`Statutes\<CODE>\EN\<CODE>_EN.xml`)
 * carries a `date-eev` per section so the change row can name the provisions
 * that actually moved. A corpus refresh that leaves the Act's section map
 * untouched files nothing — dataset noise is not a law change.
 */

interface CkanResource {
  id?: string
  name?: string
  last_modified?: string
  url?: string
  format?: string
}

export interface QuebecPackageFacts {
  resourceId: string
  resourceName: string
  lastModified: string
  url: string
}

export type QuebecPackageVerdict =
  | { readonly ok: true; readonly facts: QuebecPackageFacts }
  | { readonly ok: false; readonly reason: 'invalid-json'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'api-error'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'no-resources'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'resource-missing'; readonly detail: string }

/**
 * Parse *and* confirm the named resource (e.g. `"Lois"`) is present with a
 * `last_modified` value — the same "prove this is the thing we think it is"
 * discipline the Ontario and Justice Canada sources apply, so a dataset
 * reorganization surfaces as `broken` rather than silently stopping
 * detection.
 */
export function assessQuebecPackage(
  jsonText: string,
  expectedResourceName: string,
): QuebecPackageVerdict {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return {
      ok: false,
      reason: 'invalid-json',
      detail: 'Response was not valid JSON — the CKAN API shape may have changed.',
    }
  }

  const body = parsed as { success?: boolean; result?: { resources?: CkanResource[] } }
  if (body.success !== true) {
    return {
      ok: false,
      reason: 'api-error',
      detail: 'CKAN package_show did not report success=true.',
    }
  }

  const resources = body.result?.resources
  if (!Array.isArray(resources) || resources.length === 0) {
    return {
      ok: false,
      reason: 'no-resources',
      // A zero-resource result is an outage, never "no change" — same guard as Ontario's zero-version case.
      detail: 'The dataset returned zero resources.',
    }
  }

  const resource = resources.find((r) => r.name === expectedResourceName)
  if (resource === undefined || !resource.last_modified) {
    return {
      ok: false,
      reason: 'resource-missing',
      detail: `No resource named "${expectedResourceName}" with a last_modified value — it may have been renamed or restructured.`,
    }
  }

  return {
    ok: true,
    facts: {
      resourceId: resource.id ?? '',
      resourceName: resource.name ?? expectedResourceName,
      lastModified: resource.last_modified,
      url: resource.url ?? '',
    },
  }
}

/**
 * Fingerprint stored in `law_page_hashes.content_hash`. Both the timestamp
 * and the URL are included because the dated filename (e.g.
 * `20260720_lois.zip`) is itself informative and has moved independently of
 * `last_modified` in principle, even though neither has been observed to.
 */
export function quebecFingerprint(facts: QuebecPackageFacts): string {
  return `quebec-ckan:${facts.lastModified}|${facts.url}`
}

// ── Per-statute drill-down ──────────────────────────────────────────────────
/* The dataset fingerprint above can only say "the corpus moved" — the first
   version of this monitor therefore filed the same change row against every
   Québec law on every release. The zip itself answers better: its manifest
   (`Statutes_EN_Status.txt`) gives each Act's own consolidation stamp, and
   each Act's XML carries a `date-eev` per section plus a HistoricalNote
   trail naming the amending instrument. The functions below read those —
   via zipRange.ts, so a check costs a few kilobytes, not a 45 MB download. */

export interface StatuteStatus {
  /** Alphanumeric codification — 'N-1.1', 'C-12'. */
  code: string
  /** Publisher's own words — 'Updated to 10 June 2026', 'Repealed on …'. */
  statusText: string
  /** J = à jour/current, A = abrogée/repealed, R = remplacée/replaced. */
  flag: string
  /** Compact date — '20260610'. */
  ymd: string
}

/**
 * The manifest is a flat list of `"CODE", "English status", "FLAG", "YYYYMMDD"`
 * lines. Quotes are literal in the file and dates arrive pre-normalized in
 * the fourth column, so no date parsing is needed.
 */
export function parseStatuteStatus(text: string): Map<string, StatuteStatus> {
  const map = new Map<string, StatuteStatus>()
  const row = /^"([^"]+)"\s*,\s*"([^"]*)"\s*,\s*"([A-Z])"\s*,\s*"(\d{8})"/gm
  let m: RegExpExecArray | null
  while ((m = row.exec(text)) !== null) {
    map.set(m[1], { code: m[1], statusText: m[2], flag: m[3], ymd: m[4] })
  }
  return map
}

export interface StatuteSection {
  /** Display label — '81.1', 'SCHEDULE I'. */
  number: string
  /** In-force date of the section's current text — '20251028'. */
  eev: string
  /** Last HistoricalNote ref — the most recent amending instrument
      ('2025, c. 12, s. 3'). Null when the section carries none. */
  latestRef: string | null
}

export interface StatuteXmlFacts {
  /** Document-level in-force stamp — the newest amendment date in the Act. */
  docEev: string | null
  /** The Act's own English title, from its Identification block. */
  title: string | null
  sections: StatuteSection[]
}

/**
 * Extract the legally meaningful skeleton of a statute XML: which sections
 * exist, when each one's current text entered into force, and what amended
 * it last. `date-eev` appears only on LegislativeDocument, Section and
 * Schedule elements — verified against the published corpus — so those are
 * the only elements scanned.
 */
export function parseStatuteXml(xml: string): StatuteXmlFacts {
  const docEev = /<LegislativeDocument\b[^>]*\bdate-eev="(\d{8})"/.exec(xml)?.[1] ?? null
  const title = /<LongTitle\b[^>]*>([^<]+)<\/LongTitle>/.exec(xml)?.[1] ?? null

  const sections: StatuteSection[] = []
  const el = /<(Section|Schedule)\b[^>]*\bdate-eev="(\d{8})"[^>]*>([\s\S]*?)<\/\1>/g
  let m: RegExpExecArray | null
  while ((m = el.exec(xml)) !== null) {
    const body = m[3]
    const number =
      /<Label\b[^>]*>([^<]+)<\/Label>/.exec(body)?.[1]?.trim() ||
      /* A Schedule without a Label still diffs — name it by kind. */
      (m[1] === 'Schedule' ? 'SCHEDULE' : '?')
    const refs = [...body.matchAll(/<RefFreeForm>([^<]+)<\/RefFreeForm>/g)].map((r) => r[1].trim())
    sections.push({ number, eev: m[2], latestRef: refs.at(-1) ?? null })
  }
  return { docEev, title, sections }
}

/** The serialized per-section map is itself the fingerprint input — a
    cosmetic republish that preserves every section's in-force date cannot
    raise an alert. */
export function sectionFingerprint(sections: readonly StatuteSection[]): string {
  return sections
    .map((s) => `${s.number}:${s.eev}`)
    .sort()
    .join('|')
}

export interface SectionDiff {
  /** Sections present now that were absent before. */
  added: StatuteSection[]
  /** Sections whose in-force date moved later. */
  amended: StatuteSection[]
  /** Sections present before that are gone — repealed or renumbered. */
  removedNumbers: string[]
}

export function diffStatuteSections(
  prev: readonly StatuteSection[] | null,
  cur: readonly StatuteSection[],
): SectionDiff {
  const prevByNum = new Map((prev ?? []).map((s) => [s.number, s.eev]))
  const curNums = new Set(cur.map((s) => s.number))
  const added: StatuteSection[] = []
  const amended: StatuteSection[] = []
  for (const s of cur) {
    const before = prevByNum.get(s.number)
    if (before === undefined) added.push(s)
    else if (s.eev > before) amended.push(s)
  }
  const removedNumbers = prev === null ? [] : [...prevByNum.keys()].filter((n) => !curNums.has(n))
  return { added, amended, removedNumbers }
}
