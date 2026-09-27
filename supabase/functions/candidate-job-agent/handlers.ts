/**
 * Pure, Deno-free logic for the candidate-job-agent edge function. Kept
 * separate from index.ts so it can be unit-tested under Vitest, which cannot
 * resolve the `npm:`/`jsr:` specifiers the Deno handler uses — same split as
 * candidate-ai/handlers.ts.
 *
 * The agent searches the public job-board APIs candidates configure
 * (Greenhouse `boards-api.greenhouse.io`, Lever `api.lever.co` — both are
 * published, unauthenticated read APIs for a company's own postings),
 * filters the results against the candidate's keywords/locations, and
 * normalizes them into `candidate_discovered_jobs` rows. Submission is
 * attempted only where the source exposes an application endpoint
 * (Greenhouse's job-board API accepts applications); everything else is
 * marked `manual_required` with the prepared package attached — the agent
 * never claims a submission it did not make.
 */

export type AgentAutonomy = 'review' | 'auto_submit'
export type BoardAts = 'greenhouse' | 'lever'
export type DiscoveredStatus =
  | 'discovered'
  | 'needs_review'
  | 'queued'
  | 'submitted'
  | 'manual_required'
  | 'skipped'
  | 'failed'

export interface BoardConfig {
  ats: BoardAts
  slug: string
}

export interface AgentSettings {
  enabled: boolean
  autonomy: AgentAutonomy
  keywords: string[]
  locations: string[]
  remote_ok: boolean
  min_match_score: number
  boards: BoardConfig[]
  daily_apply_cap: number
}

export interface DiscoveredPosting {
  source: BoardAts
  external_id: string
  company: string
  title: string
  location: string
  url: string
  apply_url: string | null
  description: string
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string }

/* --- Settings ------------------------------------------------------------- */

const ATS_KEYS: readonly string[] = ['greenhouse', 'lever']
const SLUG_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/

/**
 * Validates the `boards` jsonb column. Each entry names a supported ATS and
 * the company's board slug. Entries that don't match are dropped, not
 * errored — the column is candidate-editable and a typo shouldn't break
 * the whole scan.
 */
export function parseBoardsConfig(raw: unknown): BoardConfig[] {
  if (!Array.isArray(raw)) return []
  const boards: BoardConfig[] = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>
    const ats = obj['ats']
    const slug = obj['slug']
    if (typeof ats !== 'string' || !ATS_KEYS.includes(ats)) continue
    if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) continue
    boards.push({ ats: ats as BoardAts, slug })
  }
  return boards.slice(0, 25) // hard cap — each board is a live fetch per scan
}

export function mapSettingsRow(row: Record<string, unknown>): AgentSettings {
  return {
    enabled: row['enabled'] === true,
    autonomy: row['autonomy'] === 'auto_submit' ? 'auto_submit' : 'review',
    keywords: Array.isArray(row['keywords'])
      ? (row['keywords'] as unknown[]).filter((k): k is string => typeof k === 'string')
      : [],
    locations: Array.isArray(row['locations'])
      ? (row['locations'] as unknown[]).filter((l): l is string => typeof l === 'string')
      : [],
    remote_ok: row['remote_ok'] !== false,
    min_match_score:
      typeof row['min_match_score'] === 'number'
        ? Math.max(0, Math.min(100, row['min_match_score']))
        : 70,
    boards: parseBoardsConfig(row['boards']),
    daily_apply_cap:
      typeof row['daily_apply_cap'] === 'number' && row['daily_apply_cap'] > 0
        ? Math.floor(row['daily_apply_cap'])
        : 5,
  }
}

/* --- Board fetch URLs ------------------------------------------------------ */

export function boardJobsUrl(board: BoardConfig): string {
  if (board.ats === 'greenhouse') {
    return `https://boards-api.greenhouse.io/v1/boards/${board.slug}/jobs?content=true`
  }
  return `https://api.lever.co/v0/postings/${board.slug}?mode=json`
}

/* --- Response normalization ------------------------------------------------ */

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCaseSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

/** Greenhouse `GET /v1/boards/{board}/jobs?content=true` → `{ jobs: [...] }`. */
export function normalizeGreenhouse(payload: unknown, slug: string): DiscoveredPosting[] {
  const root = asRecord(payload)
  const jobs = Array.isArray(root?.['jobs']) ? (root['jobs'] as unknown[]) : []
  const company = titleCaseSlug(slug)
  const postings: DiscoveredPosting[] = []
  for (const job of jobs) {
    const j = asRecord(job)
    if (!j) continue
    const id = j['id']
    const title = j['title']
    if (typeof id !== 'number' || typeof title !== 'string' || title.trim() === '') continue
    const location = asRecord(j['location'])
    const absoluteUrl = typeof j['absolute_url'] === 'string' ? j['absolute_url'] : ''
    postings.push({
      source: 'greenhouse',
      external_id: String(id),
      company,
      title: title.trim(),
      location: typeof location?.['name'] === 'string' ? location['name'] : '',
      url: absoluteUrl,
      apply_url: absoluteUrl || null,
      description: stripHtml(typeof j['content'] === 'string' ? j['content'] : ''),
    })
  }
  return postings
}

/** Lever `GET /v0/postings/{site}?mode=json` → array of postings. */
export function normalizeLever(payload: unknown, slug: string): DiscoveredPosting[] {
  if (!Array.isArray(payload)) return []
  const company = titleCaseSlug(slug)
  const postings: DiscoveredPosting[] = []
  for (const job of payload) {
    const j = asRecord(job)
    if (!j) continue
    const id = j['id']
    const text = j['text']
    if (typeof id !== 'string' || typeof text !== 'string' || text.trim() === '') continue
    const categories = asRecord(j['categories'])
    const hostedUrl = typeof j['hostedUrl'] === 'string' ? j['hostedUrl'] : ''
    const description = stripHtml(
      typeof j['descriptionPlain'] === 'string'
        ? j['descriptionPlain']
        : typeof j['description'] === 'string'
          ? j['description']
          : '',
    )
    postings.push({
      source: 'lever',
      external_id: id,
      company,
      title: text.trim(),
      location: typeof categories?.['location'] === 'string' ? categories['location'] : '',
      url: hostedUrl,
      apply_url: hostedUrl || null,
      description,
    })
  }
  return postings
}

/* --- Preference matching --------------------------------------------------- */

function containsAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase()
  return needles.some((n) => n.trim() !== '' && lower.includes(n.trim().toLowerCase()))
}

function looksRemote(location: string, description: string): boolean {
  return /\bremote\b/i.test(location) || /\bremote\b/i.test(description.slice(0, 2000))
}

/**
 * A posting matches when it satisfies every configured dimension. Empty
 * keyword/location lists are permissive — a candidate who only configures
 * boards still gets discoveries.
 */
export function matchesPreferences(posting: DiscoveredPosting, settings: AgentSettings): boolean {
  if (settings.keywords.length > 0) {
    const haystack = `${posting.title} ${posting.description}`.slice(0, 12000)
    if (!containsAny(haystack, settings.keywords)) return false
  }
  if (settings.locations.length > 0) {
    const inLocation = containsAny(posting.location, settings.locations)
    const remoteOk = settings.remote_ok && looksRemote(posting.location, posting.description)
    if (!inLocation && !remoteOk) return false
  } else if (!settings.remote_ok && looksRemote(posting.location, posting.description)) {
    return false
  }
  return true
}

/* --- Outcome decision -------------------------------------------------------- */

export type PlannedAction = 'prepare_review' | 'prepare_submit' | 'skip'

/**
 * Score below the candidate's bar → skip the job entirely. Otherwise the
 * autonomy setting decides: `review` queues a prepared package for the
 * candidate, `auto_submit` queues it for submission. Submission is only
 * attempted where the source supports it — see resolveSubmitChannel.
 */
export function decideAction(settings: AgentSettings, score: number | null): PlannedAction {
  const effective = score ?? 0
  if (effective < settings.min_match_score) return 'skip'
  return settings.autonomy === 'auto_submit' ? 'prepare_submit' : 'prepare_review'
}

/**
 * Which submission channel a source supports. Greenhouse's job-board API
 * accepts applications (`POST /v1/boards/{board}/jobs/{job_id}`); Lever's
 * public API is read-only, so those postings are always manual.
 */
export function resolveSubmitChannel(source: string): 'greenhouse_api' | 'manual' {
  return source === 'greenhouse' ? 'greenhouse_api' : 'manual'
}

export function greenhouseSubmitUrl(boardSlug: string, jobId: string): string {
  return `https://boards-api.greenhouse.io/v1/boards/${boardSlug}/jobs/${jobId}`
}

/* --- Request validation ------------------------------------------------------ */

export type AgentAction = 'scan' | 'scan-all' | 'submit'

export function validateAction(action: unknown): ValidationResult<AgentAction> {
  if (action === 'scan' || action === 'scan-all' || action === 'submit') {
    return { ok: true, value: action }
  }
  return { ok: false, error: `Unknown action: ${String(action)}` }
}

export function validateApplicationId(id: unknown): ValidationResult<string> {
  if (typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)) return { ok: true, value: id }
  return { ok: false, error: 'application_id must be a uuid' }
}
