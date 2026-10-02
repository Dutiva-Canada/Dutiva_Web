import { supabase } from '@/lib/supabaseClient'
import {
  campaignFromRow,
  contactFromRow,
  contentFromRow,
  keywordFromRow,
  mentionFromRow,
  type PrCampaign,
  type PrCampaignStatus,
  type PrChannel,
  type PrContentItem,
  type PrContentKind,
  type PrContentStatus,
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
  const [campaignsRes, contentRes, contactsRes, keywordsRes, mentionsRes] = await Promise.all([
    client.from('pr_campaigns').select('*').order('created_at', { ascending: false }),
    client.from('pr_content_items').select('*').order('created_at', { ascending: false }),
    client.from('pr_media_contacts').select('*').order('created_at', { ascending: false }),
    client.from('pr_keywords').select('*').order('created_at', { ascending: false }),
    client.from('pr_mentions').select('*').order('published_at', { ascending: false }),
  ])
  for (const res of [campaignsRes, contentRes, contactsRes, keywordsRes, mentionsRes]) {
    if (res.error) throw res.error
  }
  return {
    campaigns: (campaignsRes.data ?? []).map(campaignFromRow),
    contentItems: (contentRes.data ?? []).map(contentFromRow),
    contacts: (contactsRes.data ?? []).map(contactFromRow),
    keywords: (keywordsRes.data ?? []).map(keywordFromRow),
    mentions: (mentionsRes.data ?? []).map(mentionFromRow),
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
