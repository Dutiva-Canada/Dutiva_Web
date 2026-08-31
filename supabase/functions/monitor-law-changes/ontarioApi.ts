/**
 * Reading Ontario statute amendment state out of e-Laws' act-versions API.
 *
 * `www.ontario.ca/laws/statute/{id}` is a JavaScript app shell — after
 * tag-stripping it reduces to the same ~422 characters of boilerplate for
 * every Ontario statute, so hashing that page can never detect an amendment
 * (docs/LAW_MONITORING.md § Source health — audit of 2026-07-30). The
 * underlying page is built from a real, byte-stable, unauthenticated JSON
 * API instead:
 *
 *   https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/{id}
 *
 * Verified byte-stable across six fetches including cache-busted ones
 * (docs/LAW_MONITORING.md § Sourcing evaluation for Ontario and Québec).
 * Each version object carries `state` (`current` | `historical`) and
 * `dateFrom` — a coming-into-force event, which is the fact a compliance
 * customer actually needs, not "did the page's bytes move".
 *
 * Deliberately regex-free and parser-free beyond `JSON.parse`: the response
 * is already structured data, so there is nothing to extract by pattern the
 * way the HTML and XML sources need.
 */

interface OntarioVersionSource {
  act?: { en?: string }
  title?: { en?: string }
  state?: { en?: string }
  dateFrom?: { en?: string }
  dateTo?: { en?: string }
  version?: number
}

/** The subset of each version worth fingerprinting — drops the ES response envelope. */
interface NormalizedVersion {
  act: string | null
  title: string | null
  state: string | null
  dateFrom: string | null
  dateTo: string | null
  version: number | null
}

export interface OntarioActFacts {
  /** All versions, oldest first, envelope-stripped — what gets hashed. */
  normalizedVersions: NormalizedVersion[]
  /** The version currently in force, if any. */
  current: NormalizedVersion | null
  versionCount: number
}

export type OntarioActVerdict =
  | { readonly ok: true; readonly facts: OntarioActFacts }
  | { readonly ok: false; readonly reason: 'invalid-json'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'no-versions'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'no-current-version'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'wrong-act'; readonly detail: string }

function normalize(source: OntarioVersionSource): NormalizedVersion {
  return {
    act: source.act?.en ?? null,
    title: source.title?.en ?? null,
    state: source.state?.en ?? null,
    dateFrom: source.dateFrom?.en ?? null,
    dateTo: source.dateTo?.en ?? null,
    version: typeof source.version === 'number' ? source.version : null,
  }
}

/**
 * Parse *and* confirm the document is the Act we meant to fetch — the same
 * identity discipline justiceXml.ts applies to Justice Canada's XML, for the
 * same reason: a URL that starts answering for the wrong statute must be
 * reported, not silently tracked as "unchanged".
 */
export function assessOntarioActVersions(
  jsonText: string,
  expectedActEn: string,
): OntarioActVerdict {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return {
      ok: false,
      reason: 'invalid-json',
      detail: 'Response was not valid JSON — the API shape may have changed.',
    }
  }

  /*
   * Three levels of `hits`, and all three are load-bearing:
   *   versions.hits      the top_hits sub-aggregation, which is *named* "hits"
   *   versions.hits.hits the Elasticsearch response object { total, max_score, hits }
   *   versions.hits.hits.hits  the array of documents
   *
   * This read was one level short until 2026-08-06, landing on the response
   * object instead of the array. `Array.isArray` was therefore always false and
   * every Ontario statute reported `no-versions` — indistinguishable from a real
   * e-Laws outage. The unit fixture had the same level missing, so it agreed
   * with the parser and the suite stayed green; only a live fetch showed it.
   */
  const hits = (
    parsed as {
      aggregations?: {
        all?: { versions?: { hits?: { hits?: { hits?: { _source?: OntarioVersionSource }[] } } } }
      }
    }
  )?.aggregations?.all?.versions?.hits?.hits?.hits

  if (!Array.isArray(hits) || hits.length === 0) {
    return {
      ok: false,
      reason: 'no-versions',
      // Per docs/LAW_MONITORING.md: a zero-version result is an outage, never "no change".
      detail: 'The API returned zero versions for this statute.',
    }
  }

  const normalizedVersions = hits
    .map((h) => h?._source)
    .filter((s): s is OntarioVersionSource => s !== undefined)
    .map(normalize)
    .sort((a, b) => (a.version ?? 0) - (b.version ?? 0))

  const current = normalizedVersions.find((v) => v.state === 'current') ?? null
  if (current === null) {
    return {
      ok: false,
      reason: 'no-current-version',
      detail: 'No version in the response carries state=current.',
    }
  }

  if (current.act !== null && !current.act.toLowerCase().includes(expectedActEn.toLowerCase())) {
    return {
      ok: false,
      reason: 'wrong-act',
      detail: `Expected an act named like "${expectedActEn}" but the current version is "${current.act}".`,
    }
  }

  return {
    ok: true,
    facts: { normalizedVersions, current, versionCount: normalizedVersions.length },
  }
}

/**
 * Fingerprint stored in `law_page_hashes.content_hash`. Hashing the whole
 * normalized version list (not just the current version's dateFrom) catches
 * a change anywhere in the history, which is a strict superset of "a new
 * current version arrived" — the alerting condition docs/LAW_MONITORING.md
 * names as the one that matters.
 */
export function ontarioFingerprintPayload(facts: OntarioActFacts): string {
  return JSON.stringify(facts.normalizedVersions)
}

/**
 * `GET .../en/currency-date` returns the plain-text date e-Laws considers
 * itself current to (e.g. "August 3, 2026") — a liveness signal independent
 * of any single statute. Not wired into per-page alerting yet; see
 * docs/LAW_MONITORING.md for the follow-up this leaves open.
 */
export function looksLikeCurrencyDate(text: string): boolean {
  const trimmed = text.trim()
  return (
    trimmed.length > 0 &&
    trimmed.length < 100 &&
    !trimmed.startsWith('{') &&
    !trimmed.startsWith('<')
  )
}
