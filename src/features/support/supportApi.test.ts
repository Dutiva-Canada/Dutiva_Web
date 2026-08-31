import { beforeEach, describe, expect, it, vi } from 'vitest'

const invoke = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabaseClient', () => ({ supabase: { functions: { invoke } } }))

import { createSupportTicket } from './supportApi'

beforeEach(() => {
  invoke.mockReset()
})

describe('createSupportTicket', () => {
  it('maps the input to the function payload and returns the parsed ticket', async () => {
    invoke.mockResolvedValue({
      data: {
        data: {
          id: 't1',
          public_reference: 'DUT-2026-000001',
          status: 'new',
          priority: 'standard',
        },
      },
      error: null,
    })

    const result = await createSupportTicket({
      category: 'technical',
      subject: 'Cannot generate',
      description: 'Button does nothing',
      impact: 'minor',
      urgency: 'soon',
      language: 'en',
      preferredResponseMethod: 'email',
      diagnostics: { route: '/app/home', browser: 'Chrome' },
    })

    expect(invoke).toHaveBeenCalledWith(
      'create-support-ticket',
      expect.objectContaining({
        body: expect.objectContaining({
          category: 'technical',
          subject: 'Cannot generate',
          preferred_response_method: 'email',
          diagnostics: { route: '/app/home', browser: 'Chrome' },
        }),
      }),
    )
    expect(result).toEqual({
      id: 't1',
      publicReference: 'DUT-2026-000001',
      status: 'new',
      priority: 'standard',
    })
  })

  it('throws when the function returns an error', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await expect(
      createSupportTicket({
        category: 'other',
        subject: 'S',
        description: 'D',
        impact: 'none',
        urgency: 'whenever',
        language: 'en',
        preferredResponseMethod: 'email',
      }),
    ).rejects.toBeTruthy()
  })
})
