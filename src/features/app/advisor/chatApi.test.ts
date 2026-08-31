import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadChatApiWithFakeInvoke(
  invoke: (name: string, opts: { body: unknown }) => Promise<{ data: unknown; error: unknown }>,
) {
  vi.doMock('@/lib/supabaseClient', () => ({ supabase: { functions: { invoke } } }))
  vi.resetModules()
  return import('./chatApi')
}

async function loadChatApiWithNoClient() {
  vi.doMock('@/lib/supabaseClient', () => ({ supabase: null }))
  vi.resetModules()
  return import('./chatApi')
}

describe('sendAdvisorMessage', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('throws when Supabase is not configured', async () => {
    const { sendAdvisorMessage } = await loadChatApiWithNoClient()
    await expect(sendAdvisorMessage('hello', null)).rejects.toThrow('not configured')
  })

  it('invokes advisor-chat with the message and conversation id, and parses the reply', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { data: { reply: 'Here is some guidance.', conversation_id: 'conv-1' } },
      error: null,
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)

    const result = await sendAdvisorMessage('What is ESA notice?', 'conv-0')

    expect(invoke).toHaveBeenCalledWith('advisor-chat', {
      body: {
        message: 'What is ESA notice?',
        conversation_id: 'conv-0',
        organization_id: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })
    expect(result).toEqual({
      reply: 'Here is some guidance.',
      conversationId: 'conv-1',
      response: null,
    })
  })

  it('forwards organization_id so the edge function can inject org memory', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { data: { reply: 'ok', conversation_id: 'conv-org' } },
      error: null,
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)

    await sendAdvisorMessage('Any update on Jordan?', 'conv-0', 'org-1')

    expect(invoke).toHaveBeenCalledWith('advisor-chat', {
      body: expect.objectContaining({
        organization_id: 'org-1',
        conversation_id: 'conv-0',
      }),
    })
  })

  it('parses a structured advisor_response payload against the contract', async () => {
    const advisorResponse = {
      route: {
        responseMode: 'hr',
        workspaceAllowed: true,
        retrievalAllowed: true,
        legalBasisAllowed: true,
        documentsAllowed: true,
        webSearchAllowed: false,
      },
      jurisdiction: { status: 'known', value: 'Ontario · Provincially regulated' },
      risk: { compliance: 'high', safety: 'none' },
      professionalReview: null,
      supportNotice: false,
      legalBasis: { items: [{ label: 'ESA s.57 — Notice of termination', valid: true }] },
      retrieval: { items: ['Termination · ON'] },
      webSearch: null,
      confidence: { label: 'Moderate', pct: 62 },
      warnings: [],
      isCrisis: false,
    }
    const invoke = vi.fn().mockResolvedValue({
      data: {
        data: { reply: 'ok', conversation_id: 'conv-2', advisor_response: advisorResponse },
      },
      error: null,
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)

    const result = await sendAdvisorMessage('hi', null)
    expect(result.response).toEqual(advisorResponse)
  })

  it('records a safety-backstop event when a gate fires (unknown jurisdiction + figure)', async () => {
    const advisorResponse = {
      route: {
        responseMode: 'hr',
        workspaceAllowed: true,
        retrievalAllowed: true,
        legalBasisAllowed: true,
        documentsAllowed: true,
        webSearchAllowed: false,
      },
      jurisdiction: { status: 'unknown', value: '' },
      risk: { compliance: 'high', safety: 'none' },
      professionalReview: null,
      supportNotice: false,
      legalBasis: { items: [] },
      retrieval: { items: [] },
      webSearch: null,
      confidence: null,
      warnings: [],
      isCrisis: false,
    }
    const invoke = vi.fn().mockResolvedValue({
      data: {
        data: {
          reply: "That's about 8 weeks' notice.",
          conversation_id: 'conv-4',
          advisor_response: advisorResponse,
        },
      },
      error: null,
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)

    const result = await sendAdvisorMessage('How much notice do I owe?', null)

    // The gate hardened the response...
    expect(result.response?.route.legalBasisAllowed).toBe(false)
    // ...and a telemetry event was recorded fire-and-forget.
    expect(invoke).toHaveBeenCalledWith('advisor-safety-event', {
      body: { conversation_id: 'conv-4', actions: ['legal-basis-withheld'] },
    })
  })

  it('records no safety-backstop event on a clean, jurisdiction-confirmed turn', async () => {
    const advisorResponse = {
      route: {
        responseMode: 'hr',
        workspaceAllowed: true,
        retrievalAllowed: true,
        legalBasisAllowed: true,
        documentsAllowed: true,
        webSearchAllowed: false,
      },
      jurisdiction: { status: 'known', value: 'Ontario' },
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
    const invoke = vi.fn().mockResolvedValue({
      data: {
        data: {
          reply: 'Here is the process.',
          conversation_id: 'c',
          advisor_response: advisorResponse,
        },
      },
      error: null,
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)

    await sendAdvisorMessage('What is the layoff process?', null)

    expect(invoke).not.toHaveBeenCalledWith('advisor-safety-event', expect.anything())
  })

  it('returns response null (reply intact) when the structured payload is malformed', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        data: { reply: 'ok', conversation_id: 'conv-3', advisor_response: { route: 'nope' } },
      },
      error: null,
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)

    const result = await sendAdvisorMessage('hi', null)
    expect(result.reply).toBe('ok')
    expect(result.response).toBeNull()
  })

  it('propagates an invoke error', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: new Error('network down') })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)
    await expect(sendAdvisorMessage('hi', null)).rejects.toThrow('network down')
  })

  it('throws when the response fails schema validation', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { data: { reply: 'ok' } }, error: null })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)
    await expect(sendAdvisorMessage('hi', null)).rejects.toThrow()
  })
})

/**
 * The beta usage guardrail (supabase/functions/_shared/aiUsage.ts) answers 429.
 * supabase-js reports that as a FunctionsHttpError carrying the raw Response,
 * so these pin the translation into a typed error the view can explain — and,
 * in particular, that a 429 never degrades into the generic outage error.
 */
describe('sendAdvisorMessage — beta usage limit', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  /** Stands in for FunctionsHttpError: an error carrying the raw Response. */
  function httpError(status: number, body?: unknown) {
    return Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: {
        status,
        json: () =>
          body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body),
      },
    })
  }

  it('raises a typed usage-limit error carrying the scope and retry delay', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: httpError(429, {
        error: 'You have reached the beta usage limit for Dutiva AI.',
        code: 'ai_usage_limit',
        scope: 'burst',
        retry_after_seconds: 240,
      }),
    })
    const { sendAdvisorMessage, AdvisorUsageLimitError } = await loadChatApiWithFakeInvoke(invoke)

    await expect(sendAdvisorMessage('hi', null)).rejects.toMatchObject({
      name: 'AdvisorUsageLimitError',
      scope: 'burst',
      retryAfterSeconds: 240,
    })
    await expect(sendAdvisorMessage('hi', null)).rejects.toBeInstanceOf(AdvisorUsageLimitError)
  })

  it('keeps the platform-wide scope distinct from the caller’s own', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: httpError(429, {
        code: 'ai_usage_limit',
        scope: 'platform_daily',
        retry_after_seconds: 3600,
      }),
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)
    await expect(sendAdvisorMessage('hi', null)).rejects.toMatchObject({
      scope: 'platform_daily',
      retryAfterSeconds: 3600,
    })
  })

  it('keeps a commercial limit distinct from a wait-style ceiling', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: httpError(429, {
        code: 'ai_usage_limit',
        scope: 'commercial',
        retry_after_seconds: 86_400,
      }),
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)
    await expect(sendAdvisorMessage('hi', null)).rejects.toMatchObject({
      scope: 'commercial',
    })
  })

  it('still reports a usage limit when the 429 body is unreadable', async () => {
    /* Telling the user the Advisor is down when it is actually metered would
       be false — the status alone carries enough truth to answer honestly. */
    const invoke = vi.fn().mockResolvedValue({ data: null, error: httpError(429) })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)
    await expect(sendAdvisorMessage('hi', null)).rejects.toMatchObject({
      name: 'AdvisorUsageLimitError',
      scope: 'daily',
      retryAfterSeconds: 60,
    })
  })

  it('ignores a scope it does not recognise rather than trusting it', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: httpError(429, { code: 'ai_usage_limit', scope: 'wat', retry_after_seconds: -5 }),
    })
    const { sendAdvisorMessage } = await loadChatApiWithFakeInvoke(invoke)
    await expect(sendAdvisorMessage('hi', null)).rejects.toMatchObject({
      scope: 'daily',
      retryAfterSeconds: 60,
    })
  })

  it('leaves other failures as ordinary errors', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: httpError(503, {}) })
    const { sendAdvisorMessage, AdvisorUsageLimitError } = await loadChatApiWithFakeInvoke(invoke)
    await expect(sendAdvisorMessage('hi', null)).rejects.not.toBeInstanceOf(AdvisorUsageLimitError)
  })
})
