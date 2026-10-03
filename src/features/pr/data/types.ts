import type { Database } from '@/lib/supabase/types'

type CampaignRow = Database['public']['Tables']['pr_campaigns']['Row']
type ContentRow = Database['public']['Tables']['pr_content_items']['Row']
type ContactRow = Database['public']['Tables']['pr_media_contacts']['Row']
type KeywordRow = Database['public']['Tables']['pr_keywords']['Row']
type MentionRow = Database['public']['Tables']['pr_mentions']['Row']
type GeoPromptRow = Database['public']['Tables']['pr_geo_prompts']['Row']
type FeedRow = Database['public']['Tables']['pr_feeds']['Row']
type ConnectionRow = Database['public']['Tables']['pr_connections']['Row']

/** The constrained vocabularies the migration CHECKs enforce — mirrored in
    TS so forms can't emit a value the database would reject. */
export type PrChannel =
  | 'mixed'
  | 'social'
  | 'search'
  | 'display'
  | 'email'
  | 'press'
  | 'events'
  | 'other'
export type PrCampaignStatus = 'draft' | 'active' | 'paused' | 'done'
export type PrContentKind = 'post' | 'release' | 'ad' | 'article' | 'brief'
export type PrContentStatus = 'draft' | 'scheduled' | 'published'
export type PrSentiment = 'positive' | 'neutral' | 'negative'
export type PrGeoEngine = 'chatgpt' | 'perplexity' | 'gemini' | 'copilot' | 'other'
export type PrGeoResult = 'unchecked' | 'cited' | 'mentioned' | 'absent'
/** Who produced the last check — a human spot-check or the scheduled
    auto-check through the configured model route. */
export type PrGeoCheckVia = 'manual' | 'auto'
export type PrConnectionProvider = 'buffer' | 'linkedin' | 'meta' | 'search_console'
export type PrConnectionStatus = 'pending' | 'connected' | 'error' | 'disconnected'

export interface PrCampaign {
  id: string
  name: string
  channel: PrChannel
  status: PrCampaignStatus
  objective: string
  budgetCad: number | null
  startsOn: string | null
  endsOn: string | null
  createdAt: string
  updatedAt: string
}

export interface PrContentItem {
  id: string
  campaignId: string | null
  kind: PrContentKind
  title: string
  body: string
  channel: string
  status: PrContentStatus
  /** When the user plans to publish — a reminder, not automation. */
  scheduledFor: string | null
  /** Where the piece actually went out, once the user marks it published. */
  publishedUrl: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PrMediaContact {
  id: string
  name: string
  outlet: string
  beat: string
  email: string
  note: string
  createdAt: string
}

export interface PrKeyword {
  id: string
  keyword: string
  targetUrl: string
  position: number | null
  previousPosition: number | null
  checkedAt: string | null
  createdAt: string
}

export interface PrMention {
  id: string
  source: string
  title: string
  url: string
  sentiment: PrSentiment
  publishedAt: string
  createdAt: string
}

export interface PrGeoPrompt {
  id: string
  prompt: string
  engine: PrGeoEngine
  /** What the assistant did with the brand the last time it was checked. */
  result: PrGeoResult
  note: string
  checkedAt: string | null
  /** 'auto' = the scheduled model check; 'manual' = a human spot-check. */
  checkedVia: PrGeoCheckVia
  createdAt: string
  updatedAt: string
}

/** A coverage feed the user pasted in (Google Alerts RSS, an outlet feed) —
    pr-mentions-feed polls it and logs new items as mentions. */
export interface PrFeed {
  id: string
  url: string
  label: string
  lastSyncedAt: string | null
  /** New mentions the last sync added (null = never synced). */
  lastItemCount: number | null
  createdAt: string
}

/** Status of an external platform connection. 'pending' means the OAuth
    app/review isn't done yet — the UI must never render it as usable. */
export interface PrConnection {
  id: string
  provider: PrConnectionProvider
  status: PrConnectionStatus
  accountLabel: string
  connectedAt: string | null
  createdAt: string
}

export interface PrState {
  campaigns: PrCampaign[]
  contentItems: PrContentItem[]
  contacts: PrMediaContact[]
  keywords: PrKeyword[]
  mentions: PrMention[]
  geoPrompts: PrGeoPrompt[]
  feeds: PrFeed[]
  connections: PrConnection[]
  lastLoadedAt: string
}

export function campaignFromRow(row: CampaignRow): PrCampaign {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel as PrChannel,
    status: row.status as PrCampaignStatus,
    objective: row.objective,
    budgetCad: row.budget_cad,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function contentFromRow(row: ContentRow): PrContentItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    kind: row.kind as PrContentKind,
    title: row.title,
    body: row.body,
    channel: row.channel,
    status: row.status as PrContentStatus,
    scheduledFor: row.scheduled_for,
    publishedUrl: row.published_url,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function contactFromRow(row: ContactRow): PrMediaContact {
  return {
    id: row.id,
    name: row.name,
    outlet: row.outlet,
    beat: row.beat,
    email: row.email,
    note: row.note,
    createdAt: row.created_at,
  }
}

export function keywordFromRow(row: KeywordRow): PrKeyword {
  return {
    id: row.id,
    keyword: row.keyword,
    targetUrl: row.target_url,
    position: row.position,
    previousPosition: row.previous_position,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
  }
}

export function mentionFromRow(row: MentionRow): PrMention {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    url: row.url,
    sentiment: row.sentiment as PrSentiment,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  }
}

export function geoPromptFromRow(row: GeoPromptRow): PrGeoPrompt {
  return {
    id: row.id,
    prompt: row.prompt,
    engine: row.engine as PrGeoEngine,
    result: row.result as PrGeoResult,
    note: row.note,
    checkedAt: row.checked_at,
    checkedVia: row.checked_via as PrGeoCheckVia,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function feedFromRow(row: FeedRow): PrFeed {
  return {
    id: row.id,
    url: row.url,
    label: row.label,
    lastSyncedAt: row.last_synced_at,
    lastItemCount: row.last_item_count,
    createdAt: row.created_at,
  }
}

export function connectionFromRow(row: ConnectionRow): PrConnection {
  return {
    id: row.id,
    provider: row.provider as PrConnectionProvider,
    status: row.status as PrConnectionStatus,
    accountLabel: row.account_label,
    connectedAt: row.connected_at,
    createdAt: row.created_at,
  }
}
