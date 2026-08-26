import { afterEach, describe, expect, it, vi } from 'vitest'

describe('memory conversationsApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('getOwnConversation returns parsed turns or null', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'c1',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
        updated_at: '2026-08-23T12:00:00Z',
        last_advisor_response: null,
      },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./conversationsApi')

    const row = await api.getOwnConversation('c1')
    expect(eq).toHaveBeenCalledWith('id', 'c1')
    expect(row?.messages).toHaveLength(2)
    expect(row?.messages[0]).toEqual({ role: 'user', content: 'Hello' })
    expect(row?.lastAdvisorResponse).toBeNull()
  })

  it('getOwnConversation keeps a valid last_advisor_response', async () => {
    const payload = {
      route: {
        responseMode: 'hr',
        workspaceAllowed: true,
        retrievalAllowed: false,
        legalBasisAllowed: false,
        documentsAllowed: false,
        webSearchAllowed: false,
      },
      jurisdiction: { status: 'unknown', value: { en: 'Not confirmed', fr: 'Non confirmée' } },
      risk: { compliance: 'low', safety: 'none' },
      professionalReview: null,
      supportNotice: false,
      legalBasis: { items: [] },
      retrieval: { items: [] },
      webSearch: null,
      confidence: null,
      warnings: [],
      isCrisis: false,
    }
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'c1',
        messages: [],
        updated_at: '2026-08-23T12:00:00Z',
        last_advisor_response: payload,
      },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./conversationsApi')

    const row = await api.getOwnConversation('c1')
    expect(row?.lastAdvisorResponse?.route.responseMode).toBe('hr')
    expect(row?.lastAdvisorResponse?.jurisdiction.status).toBe('unknown')
  })

  it('listOwnConversations orders by updated_at', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'c2',
          messages: [],
          updated_at: '2026-08-23T12:00:00Z',
          last_advisor_response: null,
        },
      ],
      error: null,
    })
    const order = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ order })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./conversationsApi')

    const rows = await api.listOwnConversations(5)
    expect(order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(limit).toHaveBeenCalledWith(5)
    expect(rows[0]?.id).toBe('c2')
    expect(rows[0]?.lastAdvisorResponse).toBeNull()
  })

  it('deleteOwnConversation deletes by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./conversationsApi')

    await api.deleteOwnConversation('c1')
    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 'c1')
  })
})
