import { describe, expect, it, vi, beforeEach } from 'vitest'

const invoke = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabaseClient', () => ({ supabase: { functions: { invoke } } }))

import { createPublicSupportTicket } from './publicSupportApi'
import type { PublicSupportRequestInput } from './publicSupportApi'

const baseInput: PublicSupportRequestInput = {
  category: 'accessibility',
  email: 'a@b.ca',
  subject: 's',
  description: 'd',
  impact: 'none',
  urgency: 'whenever',
  language: 'en',
  preferredResponseMethod: 'email',
  consent: true,
}

describe('createPublicSupportTicket', () => {
  beforeEach(() => invoke.mockReset())

  it('shapes the payload and maps the honeypot to contact_fax', async () => {
    invoke.mockResolvedValue({
      data: { data: { public_reference: 'DUT-2026-000009' } },
      error: null,
    })
    const ref = await createPublicSupportTicket({ ...baseInput, honeypot: '' })
    expect(ref).toBe('DUT-2026-000009')
    const [fn, opts] = invoke.mock.calls[0] as [string, { body: Record<string, unknown> }]
    expect(fn).toBe('create-public-support-ticket')
    expect(opts.body).toMatchObject({
      category: 'accessibility',
      email: 'a@b.ca',
      preferred_response_method: 'email',
      consent: true,
      contact_fax: '',
    })
  })

  it('returns null when the honeypot swallowed the submission', async () => {
    invoke.mockResolvedValue({ data: { data: { ok: true } }, error: null })
    expect(await createPublicSupportTicket(baseInput)).toBeNull()
  })

  it('maps HTTP 429 to a rate_limited error', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'x', context: { status: 429 } } })
    await expect(createPublicSupportTicket(baseInput)).rejects.toMatchObject({
      code: 'rate_limited',
    })
  })

  it('maps HTTP 422 to a validation error', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'x', context: { status: 422 } } })
    await expect(createPublicSupportTicket(baseInput)).rejects.toMatchObject({ code: 'validation' })
  })

  it('maps other failures to a generic error', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'x', context: { status: 500 } } })
    await expect(createPublicSupportTicket(baseInput)).rejects.toMatchObject({ code: 'error' })
  })
})
