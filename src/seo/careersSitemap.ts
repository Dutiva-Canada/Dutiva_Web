/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { createClient } from '@supabase/supabase-js'

/**
 * Build-time query for active job postings — used by `buildPrerenderManifest`
 * to add dynamic `/careers/jobs/:postingId` URLs to the sitemap and prerender
 * manifest. The public job board RLS policy (migration 0153) allows anonymous
 * SELECT on active rows, so the anon key is sufficient.
 *
 * Returns an empty list when Supabase is not configured (no `.env` or missing
 * vars), so local builds without a backend simply omit job detail URLs from
 * the sitemap instead of failing.
 */

export interface SitemapJobPosting {
  id: string
  title: string
  description: string
  postedDate: string | null
}

/**
 * Fetch all active job postings for the sitemap. Uses the same
 * `import.meta.env.VITE_*` env vars as the browser Supabase client
 * (`src/lib/supabaseClient.ts`) so the sitemap query and the prerender
 * page render always reference the same backend. Falls back to
 * `process.env.SUPABASE_URL` for CI environments that set non-VITE vars.
 * Returns `[]` if neither is configured.
 */
export async function getActiveJobPostingsForSitemap(): Promise<SitemapJobPosting[]> {
  const url = import.meta.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return []

  const client = createClient(url, anonKey)
  const { data, error } = await client
    .from('hr_job_postings')
    .select('id, title, description, posted_date')
    .eq('status', 'active')
    .order('posted_date', { ascending: false, nullsFirst: false })

  if (error) {
    console.warn(`careersSitemap: could not query active job postings — ${error.message}`)
    return []
  }
  if (!data) return []

  return data.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    postedDate: (row.posted_date as string | null) ?? null,
  }))
}
