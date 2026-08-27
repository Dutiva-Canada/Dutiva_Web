/**
 * Pure validation for the support-analytics event sink (TODO.md D2), kept
 * side-effect-free so every branch is testable without a database. The edge
 * function calls `parseEvent` on the incoming JSON and inserts the result;
 * the client module calls `parseEvent` before sending so a malformed event
 * is dropped client-side rather than round-tripping to the server.
 *
 * The privacy model (docs/SUPPORT_ANALYTICS.md §2): anonymous Help Centre
 * events carry only a daily-rotated opaque visitor id — no user id, no
 * workspace id. Authenticated ticket events carry workspace_id (the
 * organization), never user_id. No ticket body text, document contents, or
 * chat transcripts are ever stored — only the category, source, and status.
 */

export type AnalyticsEventType =
  | 'helpfulness_vote'
  | 'help_search'
  | 'help_article_view'
  | 'ticket_submitted'
  | 'ticket_status_changed'
  | 'web_vital'

export const ANALYTICS_EVENT_TYPES: readonly AnalyticsEventType[] = [
  'helpfulness_vote',
  'help_search',
  'help_article_view',
  'ticket_submitted',
  'ticket_status_changed',
  'web_vital',
]

export type WebVitalName = 'LCP' | 'INP' | 'CLS' | 'TTFB' | 'FCP'
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'

export const WEB_VITAL_NAMES: readonly WebVitalName[] = ['LCP', 'INP', 'CLS', 'TTFB', 'FCP']
export const WEB_VITAL_RATINGS: readonly WebVitalRating[] = [
  'good',
  'needs-improvement',
  'poor',
]

/** Max length for search_query — prevents a pathological query from bloating the row. */
export const MAX_SEARCH_QUERY_LENGTH = 200

/** Max length for anonymous_visitor_id — a UUID is 36 chars, so 64 is generous. */
export const MAX_VISITOR_ID_LENGTH = 64

/** Max length for page_path on web_vital events. */
export const MAX_PAGE_PATH_LENGTH = 200

export interface AnalyticsEvent {
  event_type: AnalyticsEventType
  workspace_id?: string | null
  anonymous_visitor_id?: string | null
  article_slug?: string | null
  search_query?: string | null
  search_result_count?: number | null
  vote_value?: 'yes' | 'no' | null
  ticket_reference?: string | null
  ticket_category?: string | null
  ticket_source?: string | null
  locale?: 'en' | 'fr' | null
  web_vital_name?: WebVitalName | null
  web_vital_value?: number | null
  web_vital_rating?: WebVitalRating | null
  page_path?: string | null
}

export interface ParsedEvent extends AnalyticsEvent {
  occurred_at: string
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isEventType(value: unknown): value is AnalyticsEventType {
  return isString(value) && (ANALYTICS_EVENT_TYPES as readonly string[]).includes(value)
}

function isLocale(value: unknown): value is 'en' | 'fr' {
  return value === 'en' || value === 'fr'
}

function isVoteValue(value: unknown): value is 'yes' | 'no' {
  return value === 'yes' || value === 'no'
}

function isWebVitalName(value: unknown): value is WebVitalName {
  return isString(value) && (WEB_VITAL_NAMES as readonly string[]).includes(value)
}

function isWebVitalRating(value: unknown): value is WebVitalRating {
  return isString(value) && (WEB_VITAL_RATINGS as readonly string[]).includes(value)
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max)
}

/**
 * Validate and normalize an incoming event payload. Returns `null` if the
 * payload is structurally invalid (missing event_type, wrong types, or a
 * field that doesn't belong to the event_type). Truncates `search_query`
 * and `anonymous_visitor_id` to their max lengths rather than rejecting —
 * a long query is still useful analytics, just trimmed.
 *
 * Field-per-event-type rules:
 *   helpfulness_vote:     article_slug + vote_value required
 *   help_search:          search_query required, search_result_count optional
 *   help_article_view:    article_slug required
 *   ticket_submitted:     ticket_reference + ticket_category + ticket_source required
 *   ticket_status_changed: ticket_reference + ticket_category required, ticket_source = new status
 */
export function parseEvent(input: unknown, now: Date = new Date()): ParsedEvent | null {
  if (typeof input !== 'object' || input === null) return null
  const raw = input as Record<string, unknown>
  if (!isEventType(raw.event_type)) return null

  const event: AnalyticsEvent = { event_type: raw.event_type }

  // workspace_id: optional, must be a string (UUID) if present
  if (raw.workspace_id !== undefined && raw.workspace_id !== null) {
    if (!isString(raw.workspace_id)) return null
    event.workspace_id = raw.workspace_id
  }

  // anonymous_visitor_id: optional, truncated
  if (raw.anonymous_visitor_id !== undefined && raw.anonymous_visitor_id !== null) {
    if (!isString(raw.anonymous_visitor_id)) return null
    event.anonymous_visitor_id = truncate(raw.anonymous_visitor_id, MAX_VISITOR_ID_LENGTH)
  }

  // article_slug: optional, must be a string
  if (raw.article_slug !== undefined && raw.article_slug !== null) {
    if (!isString(raw.article_slug)) return null
    event.article_slug = raw.article_slug
  }

  // search_query: optional, truncated
  if (raw.search_query !== undefined && raw.search_query !== null) {
    if (!isString(raw.search_query)) return null
    event.search_query = truncate(raw.search_query, MAX_SEARCH_QUERY_LENGTH)
  }

  // search_result_count: optional, must be a non-negative integer
  if (raw.search_result_count !== undefined && raw.search_result_count !== null) {
    if (typeof raw.search_result_count !== 'number' || !Number.isInteger(raw.search_result_count) || raw.search_result_count < 0) return null
    event.search_result_count = raw.search_result_count
  }

  // vote_value: optional, must be 'yes' or 'no'
  if (raw.vote_value !== undefined && raw.vote_value !== null) {
    if (!isVoteValue(raw.vote_value)) return null
    event.vote_value = raw.vote_value
  }

  // ticket_reference: optional, must be a string
  if (raw.ticket_reference !== undefined && raw.ticket_reference !== null) {
    if (!isString(raw.ticket_reference)) return null
    event.ticket_reference = raw.ticket_reference
  }

  // ticket_category: optional, must be a string
  if (raw.ticket_category !== undefined && raw.ticket_category !== null) {
    if (!isString(raw.ticket_category)) return null
    event.ticket_category = raw.ticket_category
  }

  // ticket_source: optional, must be a string
  if (raw.ticket_source !== undefined && raw.ticket_source !== null) {
    if (!isString(raw.ticket_source)) return null
    event.ticket_source = raw.ticket_source
  }

  // locale: optional, must be 'en' or 'fr'
  if (raw.locale !== undefined && raw.locale !== null) {
    if (!isLocale(raw.locale)) return null
    event.locale = raw.locale
  }

  if (raw.web_vital_name !== undefined && raw.web_vital_name !== null) {
    if (!isWebVitalName(raw.web_vital_name)) return null
    event.web_vital_name = raw.web_vital_name
  }

  if (raw.web_vital_value !== undefined && raw.web_vital_value !== null) {
    if (typeof raw.web_vital_value !== 'number' || !Number.isFinite(raw.web_vital_value)) return null
    event.web_vital_value = raw.web_vital_value
  }

  if (raw.web_vital_rating !== undefined && raw.web_vital_rating !== null) {
    if (!isWebVitalRating(raw.web_vital_rating)) return null
    event.web_vital_rating = raw.web_vital_rating
  }

  if (raw.page_path !== undefined && raw.page_path !== null) {
    if (!isString(raw.page_path)) return null
    event.page_path = truncate(raw.page_path, MAX_PAGE_PATH_LENGTH)
  }

  // Per-event-type required fields
  switch (event.event_type) {
    case 'helpfulness_vote':
      if (!event.article_slug) return null
      if (!event.vote_value) return null
      break
    case 'help_search':
      if (!event.search_query) return null
      break
    case 'help_article_view':
      if (!event.article_slug) return null
      break
    case 'ticket_submitted':
      if (!event.ticket_reference) return null
      if (!event.ticket_category) return null
      if (!event.ticket_source) return null
      break
    case 'ticket_status_changed':
      if (!event.ticket_reference) return null
      if (!event.ticket_category) return null
      break
    case 'web_vital':
      if (!event.web_vital_name) return null
      if (event.web_vital_value === undefined || event.web_vital_value === null) return null
      if (!event.page_path) return null
      break
  }

  return { ...event, occurred_at: now.toISOString() }
}
