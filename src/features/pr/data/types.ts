import type { Database } from '@/lib/supabase/types'

type CampaignRow = Database['public']['Tables']['pr_campaigns']['Row']
type ContentRow = Database['public']['Tables']['pr_content_items']['Row']
type ContactRow = Database['public']['Tables']['pr_media_contacts']['Row']
type KeywordRow = Database['public']['Tables']['pr_keywords']['Row']
type MentionRow = Database['public']['Tables']['pr_mentions']['Row']

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

export interface PrState {
  campaigns: PrCampaign[]
  contentItems: PrContentItem[]
  contacts: PrMediaContact[]
  keywords: PrKeyword[]
  mentions: PrMention[]
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
