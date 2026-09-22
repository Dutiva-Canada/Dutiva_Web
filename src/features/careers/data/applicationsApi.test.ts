import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Mocks the supabase client with a response queue — each awaited query
 * consumes the next queued { data, error } pair, so multi-call flows like
 * submitApplication (profile lookup → insert) can stub each step.
 */
const { fromMock, builder, queueResponse, selectSpy } = vi.hoisted(() => {
  const queue: { data: unknown; error: unknown }[] = []

  const b = {
    select: vi.fn((_columns?: string) => b),
    eq: vi.fn(() => b),
    in: vi.fn(() => b),
    order: vi.fn(() => b),
    insert: vi.fn(() => b),
    update: vi.fn(() => b),
    delete: vi.fn(() => b),
    single: vi.fn(() => b),
    maybeSingle: vi.fn(() => b),
    then: vi.fn((resolve: (value: unknown) => void) =>
      resolve(queue.shift() ?? { data: null, error: null }),
    ),
  }

  return {
    fromMock: vi.fn(() => b),
    builder: b,
    selectSpy: b.select,
    queueResponse: (value: { data: unknown; error: unknown }) => {
      queue.push(value)
    },
  }
})

vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: fromMock } }))

import {
  DuplicateApplicationError,
  deleteApplication,
  listMyApplications,
  submitApplication,
} from './applicationsApi'

const ROW = {
  id: 'a1',
  candidate_id: 'p1',
  job_posting_id: 'jp-1',
  status: 'submitted',
  cover_letter: null,
  submitted_resume: 'Resume text',
  ai_match_score: 82,
  ai_suggestions: ['Mention logistics'],
  applied_at: '2026-01-20T00:00:00Z',
  updated_at: '2026-01-20T00:00:00Z',
}

const POSTING = {
  id: 'jp-1',
  title: 'Senior PM',
  department: 'Product',
  location: 'Toronto',
  type: 'Full-time',
}

describe('applicationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('joins posting details from public_job_postings (not the protected table)', async () => {
    queueResponse({ data: [ROW], error: null })
    queueResponse({ data: [POSTING], error: null })
    const [app] = await listMyApplications()

    expect(app?.jobPostingId).toBe('jp-1')
    expect(app?.jobPosting?.id).toBe('jp-1')
    expect(app?.jobPosting?.title).toBe('Senior PM')
    // Candidates can't read hr_job_postings under RLS — the lookup must hit
    // the safe public view, and the posting select must not re-embed the base
    // table (which would resolve to null).
    expect(fromMock).toHaveBeenNthCalledWith(1, 'candidate_applications')
    expect(fromMock).toHaveBeenNthCalledWith(2, 'public_job_postings')
    const selectArg = selectSpy.mock.calls[0]?.[0] ?? ''
    expect(selectArg).not.toContain('job_posting_id(')
  })

  it('leaves jobPosting undefined when the posting is no longer listed', async () => {
    queueResponse({ data: [ROW], error: null })
    queueResponse({ data: [], error: null })
    const [app] = await listMyApplications()

    expect(app?.jobPostingId).toBe('jp-1')
    expect(app?.jobPosting).toBeUndefined()
  })

  it('skips the postings lookup when there are no applications', async () => {
    queueResponse({ data: [], error: null })
    await listMyApplications()
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('throws DuplicateApplicationError on the 23505 unique violation', async () => {
    queueResponse({ data: { id: 'p1' }, error: null }) // profile lookup
    queueResponse({ data: null, error: { code: '23505', message: 'duplicate' } }) // insert

    await expect(
      submitApplication({ jobPostingId: 'jp-1', submittedResume: 'Resume' }),
    ).rejects.toBeInstanceOf(DuplicateApplicationError)
  })

  it('rethrows non-duplicate insert errors', async () => {
    queueResponse({ data: { id: 'p1' }, error: null })
    queueResponse({ data: null, error: { code: '42501', message: 'rls' } })

    await expect(
      submitApplication({ jobPostingId: 'jp-1', submittedResume: 'Resume' }),
    ).rejects.toMatchObject({ code: '42501' })
  })

  it('deletes an application by id', async () => {
    queueResponse({ data: null, error: null })
    await deleteApplication('a1')
    expect(fromMock).toHaveBeenCalledWith('candidate_applications')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'a1')
  })
})
