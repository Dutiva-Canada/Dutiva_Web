import { supabase } from '@/lib/supabaseClient'

/**
 * Candidate job-search agent API — settings, discovered postings, and the
 * external-application log. RLS (migration 0179) scopes every table to the
 * signed-in candidate; agent writes happen server-side in the
 * candidate-job-agent edge function, which the client invokes for
 * manual scans and review-mode submission approvals.
 */

export type AgentAutonomy = 'review' | 'auto_submit'

export type BoardAts = 'greenhouse' | 'lever'

export interface AgentBoard {
  ats: BoardAts
  slug: string
}

export interface AgentSettings {
  enabled: boolean
  autonomy: AgentAutonomy
  keywords: string[]
  locations: string[]
  remoteOk: boolean
  minMatchScore: number
  boards: AgentBoard[]
  dailyApplyCap: number
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  enabled: false,
  autonomy: 'review',
  keywords: [],
  locations: [],
  remoteOk: true,
  minMatchScore: 70,
  boards: [],
  dailyApplyCap: 5,
}

export type DiscoveredJobStatus =
  | 'discovered'
  | 'needs_review'
  | 'queued'
  | 'submitted'
  | 'manual_required'
  | 'skipped'
  | 'failed'

export interface DiscoveredJob {
  id: string
  source: string
  externalId: string
  company: string
  title: string
  location: string
  url: string
  applyUrl: string | null
  description: string
  matchScore: number | null
  status: DiscoveredJobStatus
  error: string | null
  discoveredAt: string
}

export type ExternalApplicationStatus =
  | 'needs_review'
  | 'queued'
  | 'submitted'
  | 'manual_required'
  | 'skipped'
  | 'failed'

export interface ExternalApplication {
  id: string
  discoveredJobId: string
  status: ExternalApplicationStatus
  tailoredResume: string
  coverLetter: string
  matchScore: number | null
  channel: 'greenhouse_api' | 'manual' | null
  submittedAt: string | null
  response: string | null
  error: string | null
  createdAt: string
  job?: {
    company: string
    title: string
    location: string
    url: string
    applyUrl: string | null
    source: string
  }
}

export interface ScanSummary {
  discovered: number
  scored: number
  prepared: number
  submitted: number
  errors: number
}

/* ── Settings ────────────────────────────────────────────────────────────── */

/** Read the signed-in candidate's agent settings; null when never saved. */
export async function getAgentSettings(): Promise<AgentSettings | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('candidate_agent_settings')
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toSettings(data)
}

/** Upsert the candidate's settings (keyed on user_id via RLS). */
export async function saveAgentSettings(settings: AgentSettings): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) throw new Error('Not signed in')
  const { error } = await client.from('candidate_agent_settings').upsert(
    {
      user_id: userData.user.id,
      enabled: settings.enabled,
      autonomy: settings.autonomy,
      keywords: settings.keywords,
      locations: settings.locations,
      remote_ok: settings.remoteOk,
      min_match_score: settings.minMatchScore,
      boards: settings.boards as never,
      daily_apply_cap: settings.dailyApplyCap,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

/* ── Discovery + application log ─────────────────────────────────────────── */

/** Discovered postings for the candidate, newest first. */
export async function listDiscoveredJobs(): Promise<DiscoveredJob[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('candidate_discovered_jobs')
    .select(
      'id, source, external_id, company, title, location, url, apply_url, description, match_score, status, error, discovered_at',
    )
    .order('discovered_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []).map(toDiscoveredJob)
}

/** External applications with their posting details joined in. */
export async function listExternalApplications(): Promise<ExternalApplication[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('candidate_external_applications')
    .select(
      'id, discovered_job_id, status, tailored_resume, cover_letter, match_score, channel, submitted_at, response, error, created_at, job:candidate_discovered_jobs(company, title, location, url, apply_url, source)',
    )
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) =>
    toExternalApplication({ ...row, job: Array.isArray(row.job) ? row.job[0] : row.job }),
  )
}

/** Skip a discovered job or a prepared application the candidate doesn't want. */
export async function skipDiscoveredJob(id: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('candidate_discovered_jobs')
    .update({ status: 'skipped', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function skipExternalApplication(id: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('candidate_external_applications')
    .update({ status: 'skipped', updated_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['needs_review', 'queued'])
  if (error) throw error
}

/* ── Agent invocations ───────────────────────────────────────────────────── */

/** Run a scan for the signed-in candidate right now. */
export async function runAgentScan(): Promise<ScanSummary> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('candidate-job-agent', {
    body: { action: 'scan' },
  })
  if (error) throw error
  return data as ScanSummary
}

/**
 * Approve a needs_review application — the edge function attempts the
 * submission and returns the resulting status.
 */
export async function submitExternalApplication(
  applicationId: string,
): Promise<{ status: string; channel: string | null }> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('candidate-job-agent', {
    body: { action: 'submit', application_id: applicationId },
  })
  if (error) throw error
  return data as { status: string; channel: string | null }
}

/* ── Mappers ─────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSettings(row: any): AgentSettings {
  return {
    enabled: row.enabled === true,
    autonomy: row.autonomy === 'auto_submit' ? 'auto_submit' : 'review',
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    locations: Array.isArray(row.locations) ? row.locations : [],
    remoteOk: row.remote_ok !== false,
    minMatchScore: typeof row.min_match_score === 'number' ? row.min_match_score : 70,
    boards: Array.isArray(row.boards)
      ? row.boards.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b: any) =>
            b &&
            (b.ats === 'greenhouse' || b.ats === 'lever') &&
            typeof b.slug === 'string',
        )
      : [],
    dailyApplyCap:
      typeof row.daily_apply_cap === 'number' && row.daily_apply_cap > 0
        ? row.daily_apply_cap
        : 5,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDiscoveredJob(row: any): DiscoveredJob {
  return {
    id: row.id,
    source: row.source,
    externalId: row.external_id,
    company: row.company,
    title: row.title,
    location: row.location,
    url: row.url,
    applyUrl: row.apply_url ?? null,
    description: row.description,
    matchScore: row.match_score,
    status: row.status,
    error: row.error,
    discoveredAt: row.discovered_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toExternalApplication(row: any): ExternalApplication {
  return {
    id: row.id,
    discoveredJobId: row.discovered_job_id,
    status: row.status,
    tailoredResume: row.tailored_resume,
    coverLetter: row.cover_letter,
    matchScore: row.match_score,
    channel: row.channel ?? null,
    submittedAt: row.submitted_at ?? null,
    response: row.response ?? null,
    error: row.error ?? null,
    createdAt: row.created_at,
    job: row.job
      ? {
          company: row.job.company,
          title: row.job.title,
          location: row.job.location,
          url: row.job.url,
          applyUrl: row.job.apply_url,
          source: row.job.source,
        }
      : undefined,
  }
}
