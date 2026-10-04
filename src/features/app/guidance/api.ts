import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { CUSTOMER_FACING_EVENT_TYPE, MONITOR_JURISDICTION_NAMES } from './monitoringCoverage'

/**
 * Read-only access to the real backend's legal-guidance tables
 * (`guidance_sources`, `law_updates`) — RLS on both requires an
 * authenticated session, so callers must only invoke these once signed in.
 * Row shapes are zod-validated at this boundary, same pattern as the doclib
 * PostgREST reads in documents/api.ts.
 */

export interface GuidanceSource {
  id: string
  title: string
  sourceType: string
  jurisdiction: string | null
  url: string | null
  version: string | null
  effectiveDate: string | null
}

export interface LawUpdate {
  id: string
  jurisdiction: string
  lawName: string
  url: string
  /** Human-facing official statute page — `url` may be a machine endpoint. */
  referenceUrl: string | null
  /** The monitor's full detail — every provision that moved, uncapped. */
  rawDiff: string | null
  changeSummary: string | null
  detectedAt: string | null
  eventType: string | null
}

const guidanceSourceRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  source_type: z.string(),
  jurisdiction: z.string().nullable(),
  url: z.string().nullable(),
  version: z.string().nullable(),
  effective_date: z.string().nullable(),
})

const lawUpdateRowSchema = z.object({
  id: z.string(),
  jurisdiction: z.string(),
  law_name: z.string(),
  url: z.string(),
  reference_url: z.string().nullable(),
  raw_diff: z.string().nullable(),
  change_summary: z.string().nullable(),
  detected_at: z.string().nullable(),
  event_type: z.string().nullable(),
})

export async function fetchGuidanceSources(): Promise<GuidanceSource[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('guidance_sources')
    .select('id, title, source_type, jurisdiction, url, version, effective_date')
    .eq('status', 'active')
    .order('title')
  if (error) throw error
  return z
    .array(guidanceSourceRowSchema)
    .parse(data)
    .map((r) => ({
      id: r.id,
      title: r.title,
      sourceType: r.source_type,
      jurisdiction: r.jurisdiction,
      url: r.url,
      version: r.version,
      effectiveDate: r.effective_date,
    }))
}

export async function fetchRecentLawUpdates(limit = 10): Promise<LawUpdate[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('law_updates')
    .select(
      'id, jurisdiction, law_name, url, reference_url, raw_diff, change_summary, detected_at, event_type',
    )
    /* Only real amendments, only in jurisdictions Dutiva supports. Unfiltered,
       this panel showed customers URL-move notices for provinces the product
       does not cover — of the ten newest rows on 2026-07-30, none were from a
       supported jurisdiction and six were `redirect` plumbing. It would also
       have surfaced `broken` events, which report that Dutiva's own scraper
       failed. See monitoringCoverage.ts. */
    .eq('event_type', CUSTOMER_FACING_EVENT_TYPE)
    .in('jurisdiction', MONITOR_JURISDICTION_NAMES)
    .order('detected_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return z
    .array(lawUpdateRowSchema)
    .parse(data)
    .map((r) => ({
      id: r.id,
      jurisdiction: r.jurisdiction,
      lawName: r.law_name,
      url: r.url,
      referenceUrl: r.reference_url,
      rawDiff: r.raw_diff,
      changeSummary: r.change_summary,
      detectedAt: r.detected_at,
      eventType: r.event_type,
    }))
}
