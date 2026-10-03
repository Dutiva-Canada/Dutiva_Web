import { supabase } from '@/lib/supabaseClient'
import {
  campaignFromRow,
  connectionFromRow,
  contactFromRow,
  contentFromRow,
  feedFromRow,
  geoPromptFromRow,
  keywordFromRow,
  mentionFromRow,
  type PrCampaign,
  type PrCampaignStatus,
  type PrChannel,
  type PrContentItem,
  type PrContentKind,
  type PrContentStatus,
  type PrFeed,
  type PrGeoEngine,
  type PrGeoPrompt,
  type PrGeoResult,
  type PrKeyword,
  type PrMediaContact,
  type PrMention,
  type PrSentiment,
  type PrState,
} from './types'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase client unavailable — check env vars.')
  return supabase
}

async function requireUserId(): Promise<string> {
  const client = requireSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Not signed in.')
  return user.id
}

/** Grant gate — true when the signed-in user has a pr_access row. */
export async function hasPrAccess(): Promise<boolean> {
  const client = requireSupabase()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return false
  const { data, error } = await client
    .from('pr_access')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return !!data
}

export async function loadPrState(): Promise<PrState> {
  const client = requireSupabase()
  const [campaignsRes, contentRes, contactsRes, keywordsRes, mentionsRes, geoRes, feedsRes, connectionsRes] =
    await Promise.all([
      client.from('pr_campaigns').select('*').order('created_at', { ascending: false }),
      client.from('pr_content_items').select('*').order('created_at', { ascending: false }),
      client.from('pr_media_contacts').select('*').order('created_at', { ascending: false }),
      client.from('pr_keywords').select('*').order('created_at', { ascending: false }),
      client.from('pr_mentions').select('*').order('published_at', { ascending: false }),
      client.from('pr_geo_prompts').select('*').order('created_at', { ascending: false }),
      client.from('pr_feeds').select('*').order('created_at', { ascending: false }),
      client.from('pr_connections').select('*').order('created_at', { ascending: false }),
    ])
  for (const res of [campaignsRes, contentRes, contactsRes, keywordsRes, mentionsRes, geoRes, feedsRes, connectionsRes]) {
    if (res.error) throw res.error
  }
  return {
    campaigns: (campaignsRes.data ?? []).map(campaignFromRow),
    contentItems: (contentRes.data ?? []).map(contentFromRow),
    contacts: (contactsRes.data ?? []).map(contactFromRow),
    keywords: (keywordsRes.data ?? []).map(keywordFromRow),
    mentions: (mentionsRes.data ?? []).map(mentionFromRow),
    geoPrompts: (geoRes.data ?? []).map(geoPromptFromRow),
    feeds: (feedsRes.data ?? []).map(feedFromRow),
    connections: (connectionsRes.data ?? []).map(connectionFromRow),
    lastLoadedAt: new Date().toISOString(),
  }
}

/* ---------- campaigns ---------- */

export async function addCampaign(input: {
  name: string
  channel?: PrChannel
  status?: PrCampaignStatus
  objective?: string
  budgetCad?: number | null
  startsOn?: string | null
  endsOn?: string | null
}): Promise<PrCampaign> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('pr_campaigns')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      channel: input.channel ?? 'mixed',
      status: input.status ?? 'draft',
      objective: (input.objective ?? '').trim(),
      budget_cad: input.budgetCad ?? null,
      starts_on: input.startsOn ?? null,
      ends_on: input.endsOn ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (error) throw error
  return campaignFromRow(data)
}

export async function updateCampaign(
  id: string,
  patch: Partial<{
    name: string
    channel: PrChannel
    status: PrCampaignStatus
    objective: string
    budgetCad: number | null
    startsOn: string | null
    endsOn: string | null
  }>,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('pr_campaigns')
    .update({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.channel !== undefined ? { channel: patch.channel } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.objective !== undefined ? { objective: patch.objective.trim() } : {}),
      ...(patch.budgetCad !== undefined ? { budget_cad: patch.budgetCad } : {}),
      ...(patch.startsOn !== undefined ? { starts_on: patch.startsOn } : {}),
      ...(patch.endsOn !== undefined ? { ends_on: patch.endsOn } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteCampaign(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('pr_campaigns').delete().eq('id', id)
  if (error) throw error
}

/* ---------- content items ---------- */

export async function addContentItem(input: {
  kind?: PrContentKind
  title?: string
  body?: string
  channel?: string
  status?: PrContentStatus
  campaignId?: string | null
  scheduledFor?: string | null
  publishedUrl?: string
  publishedAt?: string | null
}): Promise<PrContentItem> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('pr_content_items')
    .insert({
      user_id: userId,
      campaign_id: input.campaignId ?? null,
      kind: input.kind ?? 'post',
      title: (input.title ?? '').trim(),
      body: (input.body ?? '').trim(),
      channel: (input.channel ?? '').trim(),
      status: input.status ?? 'draft',
      scheduled_for: input.scheduledFor ?? null,
      published_url: (input.publishedUrl ?? '').trim(),
      published_at: input.publishedAt ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (error) throw error
  return contentFromRow(data)
}

export async function updateContentItem(
  id: string,
  patch: Partial<{
    kind: PrContentKind
    title: string
    body: string
    channel: string
    status: PrContentStatus
    campaignId: string | null
    scheduledFor: string | null
    publishedUrl: string
    publishedAt: string | null
  }>,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('pr_content_items')
    .update({
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.body !== undefined ? { body: patch.body.trim() } : {}),
      ...(patch.channel !== undefined ? { channel: patch.channel.trim() } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.campaignId !== undefined ? { campaign_id: patch.campaignId } : {}),
      ...(patch.scheduledFor !== undefined ? { scheduled_for: patch.scheduledFor } : {}),
      ...(patch.publishedUrl !== undefined ? { published_url: patch.publishedUrl.trim() } : {}),
      ...(patch.publishedAt !== undefined ? { published_at: patch.publishedAt } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteContentItem(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('pr_content_items').delete().eq('id', id)
  if (error) throw error
}

/* ---------- media contacts ---------- */

export async function addMediaContact(input: {
  name: string
  outlet?: string
  beat?: string
  email?: string
  note?: string
}): Promise<PrMediaContact> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const { data, error } = await client
    .from('pr_media_contacts')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      outlet: (input.outlet ?? '').trim(),
      beat: (input.beat ?? '').trim(),
      email: (input.email ?? '').trim(),
      note: (input.note ?? '').trim(),
    })
    .select()
    .single()
  if (error) throw error
  return contactFromRow(data)
}

export async function deleteMediaContact(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('pr_media_contacts').delete().eq('id', id)
  if (error) throw error
}

/* ---------- SEO keywords ---------- */

export async function addKeyword(input: {
  keyword: string
  targetUrl?: string
}): Promise<PrKeyword> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const { data, error } = await client
    .from('pr_keywords')
    .insert({
      user_id: userId,
      keyword: input.keyword.trim(),
      target_url: (input.targetUrl ?? '').trim(),
    })
    .select()
    .single()
  if (error) throw error
  return keywordFromRow(data)
}

/** Record a fresh position check — the old position becomes the baseline so
    the UI can show which direction the keyword moved. */
export async function updateKeywordPosition(
  id: string,
  position: number | null,
): Promise<void> {
  const client = requireSupabase()
  const { data: current, error: readError } = await client
    .from('pr_keywords')
    .select('position')
    .eq('id', id)
    .single()
  if (readError) throw readError
  const { error } = await client
    .from('pr_keywords')
    .update({
      previous_position: current?.position ?? null,
      position,
      checked_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteKeyword(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('pr_keywords').delete().eq('id', id)
  if (error) throw error
}

/* ---------- mentions / coverage ---------- */

export async function addMention(input: {
  source?: string
  title: string
  url?: string
  sentiment?: PrSentiment
  publishedAt?: string
}): Promise<PrMention> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const { data, error } = await client
    .from('pr_mentions')
    .insert({
      user_id: userId,
      source: (input.source ?? '').trim(),
      title: input.title.trim(),
      url: (input.url ?? '').trim(),
      sentiment: input.sentiment ?? 'neutral',
      published_at: input.publishedAt ?? new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return mentionFromRow(data)
}

export async function deleteMention(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('pr_mentions').delete().eq('id', id)
  if (error) throw error
}

/* ---------- GEO prompts (AI answers) ---------- */

export async function addGeoPrompt(input: {
  prompt: string
  engine?: PrGeoEngine
}): Promise<PrGeoPrompt> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('pr_geo_prompts')
    .insert({
      user_id: userId,
      prompt: input.prompt.trim(),
      engine: input.engine ?? 'chatgpt',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (error) throw error
  return geoPromptFromRow(data)
}

/** Record the outcome of a manual spot-check — the human asked the prompt
    in the assistant and is logging what came back. */
export async function recordGeoCheck(
  id: string,
  result: PrGeoResult,
  note: string,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('pr_geo_prompts')
    .update({
      result,
      note: note.trim(),
      checked_at: new Date().toISOString(),
      checked_via: 'manual',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteGeoPrompt(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('pr_geo_prompts').delete().eq('id', id)
  if (error) throw error
}

/* ---------- SEO bulk import ---------- */

/** Paste an export (Search Console, a rank tracker, a spreadsheet column)
    — one `keyword[, position[, url]]` per line. Rows with a position are
    treated as a fresh check, like updateKeywordPosition for a new keyword. */
export async function bulkAddKeywords(
  rows: { keyword: string; position?: number; targetUrl?: string }[],
): Promise<number> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const now = new Date().toISOString()
  const { error } = await client.from('pr_keywords').insert(
    rows.map((r) => ({
      user_id: userId,
      keyword: r.keyword.trim(),
      target_url: (r.targetUrl ?? '').trim(),
      position: r.position ?? null,
      previous_position: null,
      checked_at: r.position != null ? now : null,
    })),
  )
  if (error) throw error
  return rows.length
}

/* ---------- mention metadata fetch ---------- */

export interface MentionMeta {
  title: string
  source: string
  publishedAt: string | null
}

/** Ask the pr-fetch-meta edge function for a page's headline/site/date so
    logging coverage is a paste-a-URL job instead of retyping it. The date
    comes back normalized to ISO (the raw meta tag may be "September 3",
    RFC-822, etc.) so callers can slice it into a <input type="date">. */
export async function fetchMentionMeta(url: string): Promise<MentionMeta> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('pr-fetch-meta', {
    body: { url },
  })
  if (error) throw error
  const raw = (data as Partial<MentionMeta> | null) ?? {}
  const parsed = raw.publishedAt ? Date.parse(raw.publishedAt) : NaN
  return {
    title: raw.title ?? '',
    source: raw.source ?? '',
    publishedAt: Number.isNaN(parsed) ? null : new Date(parsed).toISOString(),
  }
}

/* ---------- coverage feeds (RSS/Atom, e.g. Google Alerts) ---------- */

export async function addPrFeed(input: { url: string; label?: string }): Promise<PrFeed> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const { data, error } = await client
    .from('pr_feeds')
    .insert({
      user_id: userId,
      url: input.url.trim(),
      label: (input.label ?? '').trim(),
    })
    .select()
    .single()
  if (error) throw error
  return feedFromRow(data)
}

export async function deletePrFeed(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('pr_feeds').delete().eq('id', id)
  if (error) throw error
}

export interface FeedSyncResult {
  feeds: number
  added: number
}

/** Ask pr-mentions-feed to poll the caller's feeds now (or one feed when
    feedId is given). The scheduled sweep does the same daily for everyone. */
export async function syncPrFeeds(feedId?: string): Promise<FeedSyncResult> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('pr-mentions-feed', {
    body: feedId ? { feedId } : {},
  })
  if (error) throw error
  const raw = (data as Partial<FeedSyncResult> | null) ?? {}
  return { feeds: raw.feeds ?? 0, added: raw.added ?? 0 }
}

/* ---------- GEO auto-check ---------- */

export interface GeoCheckSummary {
  checked: number
  prompts: number
}

/** Ask pr-geo-check to run the caller's tracked prompts through the
    configured model route and log cited/mentioned/absent. Results are
    directional — the model's own answer, not what a specific assistant
    shows users. */
export async function runGeoChecks(promptId?: string): Promise<GeoCheckSummary> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('pr-geo-check', {
    body: promptId ? { promptId } : {},
  })
  if (error) throw error
  const raw = (data as Partial<GeoCheckSummary> | null) ?? {}
  return { checked: raw.checked ?? 0, prompts: raw.prompts ?? 0 }
}
