import { supabase } from '@/lib/supabaseClient'
import type { Bi } from '@/i18n/core'
import type { CommsFeed } from './types'
import { addCoverageItem } from './coverageApi'
import { parseFeedXml } from './feedParser'

export interface FeedSyncResult {
  added: number
  coverageDrafts?: number
  error?: string
}

function fromRow(raw: unknown): CommsFeed {
  const row = raw as {
    id: string
    url: string
    label: unknown
    source_type: string
    initiative_id: string | null
    enabled: boolean
    format: string
    last_fetched_at: string | null
    last_fetch_status: string | null
    last_fetch_message: string | null
    jurisdiction: string | null
    create_coverage_drafts: boolean
  }
  return {
    id: row.id,
    url: row.url,
    label: (row.label as Bi | undefined) ?? { en: '', fr: '' },
    sourceType: row.source_type as CommsFeed['sourceType'],
    initiativeId: row.initiative_id ?? undefined,
    enabled: row.enabled,
    format: row.format as CommsFeed['format'],
    lastFetchedAt: row.last_fetched_at ?? undefined,
    lastFetchStatus: row.last_fetch_status as CommsFeed['lastFetchStatus'] | undefined,
    lastFetchMessage: row.last_fetch_message ?? undefined,
    jurisdiction: row.jurisdiction as CommsFeed['jurisdiction'] | undefined,
    createCoverageDrafts: row.create_coverage_drafts,
  }
}

function toRow(workspaceOrgId: string, item: Omit<CommsFeed, 'id'>) {
  return {
    organization_id: workspaceOrgId,
    url: item.url,
    label: item.label as unknown,
    source_type: item.sourceType,
    initiative_id: item.initiativeId ?? null,
    enabled: item.enabled,
    format: item.format,
    last_fetched_at: item.lastFetchedAt ?? null,
    last_fetch_status: item.lastFetchStatus ?? null,
    last_fetch_message: item.lastFetchMessage ?? null,
    jurisdiction: item.jurisdiction ?? null,
    create_coverage_drafts: item.createCoverageDrafts,
  }
}

function patchToRow(patch: Partial<CommsFeed>) {
  const row: Record<string, unknown> = {}
  if (patch.url !== undefined) row.url = patch.url
  if (patch.label !== undefined) row.label = patch.label as unknown
  if (patch.sourceType !== undefined) row.source_type = patch.sourceType
  if (patch.initiativeId !== undefined) row.initiative_id = patch.initiativeId ?? null
  if (patch.enabled !== undefined) row.enabled = patch.enabled
  if (patch.format !== undefined) row.format = patch.format
  if (patch.lastFetchedAt !== undefined) row.last_fetched_at = patch.lastFetchedAt ?? null
  if (patch.lastFetchStatus !== undefined) row.last_fetch_status = patch.lastFetchStatus ?? null
  if (patch.lastFetchMessage !== undefined) row.last_fetch_message = patch.lastFetchMessage ?? null
  if (patch.jurisdiction !== undefined) row.jurisdiction = patch.jurisdiction ?? null
  if (patch.createCoverageDrafts !== undefined) row.create_coverage_drafts = patch.createCoverageDrafts
  return row
}

export async function listFeeds(workspaceOrgId: string): Promise<CommsFeed[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_feeds')
    .select('*')
    .eq('organization_id', workspaceOrgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addFeed(
  workspaceOrgId: string,
  item: Omit<CommsFeed, 'id'>,
): Promise<CommsFeed> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_feeds')
    .insert(toRow(workspaceOrgId, item) as any)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateFeed(
  workspaceOrgId: string,
  id: string,
  patch: Partial<CommsFeed>,
): Promise<CommsFeed | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('comms_feeds')
    .update(patchToRow(patch) as any)
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function removeFeed(workspaceOrgId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('comms_feeds')
    .delete()
    .eq('id', id)
    .eq('organization_id', workspaceOrgId)
  if (error) throw error
}

export async function syncFeed(workspaceOrgId: string, feedId: string): Promise<FeedSyncResult> {
  if (typeof fetch === 'undefined') return { added: 0, error: 'Fetch not available' }
  const feed = await listFeeds(workspaceOrgId).then((feeds) => feeds.find((f) => f.id === feedId))
  if (!feed) return { added: 0, error: 'Feed not found' }
  const now = new Date().toISOString()
  try {
    const res = await fetch(feed.url)
    if (!res.ok) {
      await updateFeed(workspaceOrgId, feedId, {
        lastFetchedAt: now,
        lastFetchStatus: 'error',
        lastFetchMessage: `HTTP ${res.status}`,
      })
      return { added: 0, error: `HTTP ${res.status}` }
    }
    const xml = await res.text()
    const items = parseFeedXml(xml, x(feed.label))
    let coverageDrafts = 0
    if (feed.createCoverageDrafts) {
      for (const item of items.slice(0, 20)) {
        await addCoverageItem(workspaceOrgId, {
          initiativeId: feed.initiativeId,
          outlet: { en: item.publisher || x(feed.label), fr: item.publisher || x(feed.label) },
          headline: { en: item.title, fr: item.title },
          language: 'en',
          publishedDate: item.publishedDate,
          url: item.url,
          reach: undefined,
          sentiment: 'neutral',
          provenance: 'provider',
          owner: 'Workspace user',
          notes: undefined,
        })
        coverageDrafts++
      }
    }
    await updateFeed(workspaceOrgId, feedId, {
      lastFetchedAt: now,
      lastFetchStatus: 'ok',
      lastFetchMessage: `${items.length} items`,
    })
    return { added: items.length, coverageDrafts }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await updateFeed(workspaceOrgId, feedId, {
      lastFetchedAt: now,
      lastFetchStatus: 'error',
      lastFetchMessage: message,
    })
    return { added: 0, error: message }
  }
}

export async function syncAllFeeds(
  workspaceOrgId: string,
): Promise<(FeedSyncResult & { feedId: string })[]> {
  const feeds = await listFeeds(workspaceOrgId).then((f) => f.filter((feed) => feed.enabled))
  const results = await Promise.all(feeds.map((f) => syncFeed(workspaceOrgId, f.id)))
  return results.map((r, i) => ({ ...r, feedId: feeds[i]!.id }))
}

function x(label: Bi): string {
  return label.en || label.fr || 'Feed'
}
