/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getActiveJobPostingsForSitemap } from './careersSitemap'

describe('getActiveJobPostingsForSitemap', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('returns an empty list when Supabase env vars are not set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.stubEnv('SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_ANON_KEY', '')
    const postings = await getActiveJobPostingsForSitemap()
    expect(postings).toEqual([])
  })
})
