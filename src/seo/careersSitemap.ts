/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { createClient } from '@supabase/supabase-js'
import type { PublicJobPosting } from '@/features/careers/data/jobBoardApi'

/**
 * Build-time query for active job postings — used by `buildPrerenderManifest`
 * to add dynamic `/careers/jobs/:slug` URLs to the sitemap and prerender
 * manifest, and to pass each posting into `renderPage` so detail pages emit
 * real rendered content (not the client-side loading state). Reads the
 * `public_job_postings` view (migration 0165, extended by 0186): only active
 * rows and candidate-facing columns exist there, and the anon key is
 * sufficient.
 *
 * Returns an empty list when Supabase is not configured (no `.env` or missing
 * vars), so local builds without a backend simply omit job detail URLs from
 * the sitemap instead of failing.
 */

export type SitemapJobPosting = PublicJobPosting

/**
 * Fetch all active job postings for the sitemap and prerender manifest.
 * Uses the same `import.meta.env.VITE_*` env vars as the browser Supabase
 * client (`src/lib/supabaseClient.ts`) so the sitemap query and the
 * prerender page render always reference the same backend. Falls back to
 * `process.env.SUPABASE_URL` for CI environments that set non-VITE vars.
 * Returns `[]` if neither is configured.
 */
export async function getActiveJobPostingsForSitemap(): Promise<SitemapJobPosting[]> {
  const url = import.meta.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return []

  const client = createClient(url, anonKey)
  const { data, error } = await client
    .from('public_job_postings')
    .select(
      'id, organization_id, organization_name, slug, title, department, location, type, description, requirements, responsibilities, benefits, salary_min, salary_max, salary_period, employer_blurb, status, posted_date, closing_date',
    )
    .order('posted_date', { ascending: false, nullsFirst: false })

  if (error) {
    console.warn(`careersSitemap: could not query active job postings — ${error.message}`)
    return []
  }
  if (!data) return []

  return data.map((row) => ({
    id: row.id as string,
    organizationId: row.organization_id as string,
    organizationName: row.organization_name as string,
    slug: (row.slug as string | null) ?? (row.id as string),
    title: row.title as string,
    department: row.department as string,
    location: row.location as string,
    type: row.type as string,
    description: row.description as string,
    requirements: (row.requirements as string[] | null) ?? [],
    responsibilities: (row.responsibilities as string[] | null) ?? [],
    benefits: (row.benefits as string[] | null) ?? [],
    salaryMin: (row.salary_min as number | null) ?? null,
    salaryMax: (row.salary_max as number | null) ?? null,
    salaryPeriod: row.salary_period === 'hour' ? 'hour' : 'year',
    employerBlurb: (row.employer_blurb as string | null) ?? null,
    status: (row.status as string | null) ?? 'active',
    postedDate: (row.posted_date as string | null) ?? null,
    closingDate: (row.closing_date as string | null) ?? null,
  }))
}
