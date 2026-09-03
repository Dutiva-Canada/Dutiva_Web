import { describe, expect, it, vi } from 'vitest'
import {
  AI_USAGE_LIMIT_CODE,
  COMMERCIAL_OPERATIONS,
  METERED_OPERATIONS,
  advisorChatPolicy,
  claimAiUsage,
  decisionFromRpc,
  finalizeAiUsage,
  supportFirstLinePolicy,
  usageLimitBody,
} from './aiUsage'
import type { UsageDbClient } from './aiUsage'

/**
 * The guardrail's TS half. The ceilings themselves are enforced in SQL
 * (0027_ai_usage_guardrails.sql), so what these tests pin is the part that
 * could fail *open*: verdict parsing, the parameters handed to the RPC, and
 * the fail-closed behaviour when the guardrail cannot be evaluated at all.
 */

function rpcClient(result: { data: unknown; error: { message: string } | null }) {
  const calls: { fn: string; params: Record<string, unknown> }[] = []
  const client: UsageDbClient = {
    rpc(fn, params) {
      calls.push({ fn, params })
      return Promise.resolve(result)
    },
    from() {
      throw new Error('not used')
    },
  }
  return { client, calls }
}

describe('decisionFromRpc', () => {
  it('allows a verdict carrying a claim id', () => {
    expect(decisionFromRpc({ allowed: true, claim_id: 'claim-1' })).toEqual({
      kind: 'allowed',
      claimId: 'claim-1',
    })
  })

  it('carries the commercial source when the RPC names one', () => {
    expect(decisionFromRpc({ allowed: true, claim_id: 'claim-2', commercial: 'pack' })).toEqual({
      kind: 'allowed',
      claimId: 'claim-2',
      commercialSource: 'pack',
    })
    expect(decisionFromRpc({ allowed: true, claim_id: 'claim-3', commercial: 'rollover' })).toEqual(
      {
        kind: 'allowed',
        claimId: 'claim-3',
        commercialSource: 'rollover',
      },
    )
  })

  it('maps a denial to its scope, counts and retry delay', () => {
    expect(
      decisionFromRpc({
        allowed: false,
        scope: 'burst',
        limit: 10,
        used: 10,
        retry_after_seconds: 42,
      }),
    ).toEqual({ kind: 'denied', scope: 'burst', limit: 10, used: 10, retryAfterSeconds: 42 })
  })

  it('coerces a bigint sum that arrives as a string', () => {
    /* sum(total_tokens) is bigint; PostgREST serialises it as a JSON string. */
    const decision = decisionFromRpc({
      allowed: false,
      scope: 'daily_tokens',
      limit: '250000',
      used: '250311',
      retry_after_seconds: '3600',
    })
    expect(decision).toEqual({
      kind: 'denied',
      scope: 'daily_tokens',
      limit: 250000,
      used: 250311,
      retryAfterSeconds: 3600,
    })
  })

  it('never returns a zero retry delay', () => {
    const decision = decisionFromRpc({ allowed: false, scope: 'burst', retry_after_seconds: 0 })
    expect(decision).toMatchObject({ kind: 'denied', retryAfterSeconds: 1 })
  })

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['a verdict with no allowed flag', { scope: 'burst' }],
    ['an allowed verdict with no claim id', { allowed: true }],
  ])('fails closed on %s rather than allowing the call', (_label, payload) => {
    expect(decisionFromRpc(payload)).toMatchObject({ kind: 'unavailable' })
  })
})

describe('claimAiUsage', () => {
  it('hands the policy and the metered operation set to the RPC', async () => {
    const { client, calls } = rpcClient({
      data: { allowed: true, claim_id: 'claim-9' },
      error: null,
    })
    const policy = advisorChatPolicy()
    const decision = await claimAiUsage(client, policy, {
      userId: 'user-1',
      organizationId: null,
      provider: 'digitalocean',
      model: 'deepseek-3.2',
    })

    expect(decision).toEqual({ kind: 'allowed', claimId: 'claim-9' })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.fn).toBe('claim_ai_usage')
    expect(calls[0]?.params).toMatchObject({
      p_user_id: 'user-1',
      p_operation: 'chat',
      p_organization_id: null,
      p_provider: 'digitalocean',
      p_model: 'deepseek-3.2',
      p_burst_limit: policy.burstLimit,
      p_burst_window_seconds: policy.burstWindowSeconds,
      p_daily_request_limit: policy.dailyRequestLimit,
      p_daily_token_limit: policy.dailyTokenLimit,
      p_platform_daily_limit: policy.platformDailyLimit,
      p_metered_operations: METERED_OPERATIONS,
      p_monthly_chat_limit: 80,
      p_commercial_operations: ['chat'],
      p_overage_monthly_cap: 0,
    })
  })

  it('fails closed when the RPC errors', async () => {
    const { client } = rpcClient({ data: null, error: { message: 'permission denied' } })
    const decision = await claimAiUsage(client, advisorChatPolicy(), {
      userId: 'user-1',
      organizationId: null,
      provider: 'p',
      model: 'm',
    })
    expect(decision).toEqual({ kind: 'unavailable', reason: 'permission denied' })
  })

  it('fails closed when the call throws', async () => {
    const client: UsageDbClient = {
      rpc() {
        throw new Error('network down')
      },
      from() {
        throw new Error('not used')
      },
    }
    const decision = await claimAiUsage(client, advisorChatPolicy(), {
      userId: 'user-1',
      organizationId: null,
      provider: 'p',
      model: 'm',
    })
    expect(decision).toEqual({ kind: 'unavailable', reason: 'network down' })
  })
})

describe('the beta policies', () => {
  it('gives both AI surfaces one shared daily budget', () => {
    /* Per-surface daily budgets would just add up to their sum — the point of
       the shared ceiling is that moving between surfaces cannot double it. */
    const chat = advisorChatPolicy()
    const support = supportFirstLinePolicy()
    expect(support.dailyRequestLimit).toBe(chat.dailyRequestLimit)
    expect(support.dailyTokenLimit).toBe(chat.dailyTokenLimit)
    expect(support.platformDailyLimit).toBe(chat.platformDailyLimit)
  })

  it('meters only the operations that actually call a model', () => {
    expect(METERED_OPERATIONS).toEqual(['chat', 'support_firstline'])
    /* safety_backstop records that a deterministic gate fired — being kept
       safe must never spend a user's AI budget. */
    expect(METERED_OPERATIONS).not.toContain('safety_backstop')
  })

  it('does not sell the support helper as a pack SKU', () => {
    expect(COMMERCIAL_OPERATIONS).toEqual(['chat'])
    expect(COMMERCIAL_OPERATIONS).not.toContain('support_firstline')
  })
})

describe('finalizeAiUsage', () => {
  function updateClient(error: { message: string } | null = null) {
    const updates: { values: Record<string, unknown>; id: string }[] = []
    const client: UsageDbClient = {
      rpc() {
        throw new Error('not used')
      },
      from(table: string) {
        expect(table).toBe('ai_telemetry_events')
        return {
          update(values: Record<string, unknown>) {
            return {
              eq(column: string, value: string) {
                expect(column).toBe('id')
                updates.push({ values, id: value })
                return Promise.resolve({ error })
              },
            }
          },
        }
      },
    }
    return { client, updates }
  }

  it('stamps the claimed row with the outcome', async () => {
    const { client, updates } = updateClient()
    await finalizeAiUsage(client, 'claim-3', {
      status: 'completed',
      latencyMs: 1234,
      promptTokens: 800,
      completionTokens: 120,
      totalTokens: 920,
      metadata: { retrieved_chunks: 2 },
    })
    expect(updates).toEqual([
      {
        id: 'claim-3',
        values: {
          status: 'completed',
          latency_ms: 1234,
          prompt_tokens: 800,
          completion_tokens: 120,
          total_tokens: 920,
          metadata: { retrieved_chunks: 2 },
        },
      },
    ])
  })

  it('nulls absent token counts instead of dropping the columns', async () => {
    const { client, updates } = updateClient()
    await finalizeAiUsage(client, 'claim-4', { status: 'failed', latencyMs: 10 })
    expect(updates[0]?.values).toMatchObject({
      status: 'failed',
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
    })
  })

  it('swallows a telemetry failure — the reply is already paid for', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client } = updateClient({ message: 'row disappeared' })
    await expect(
      finalizeAiUsage(client, 'claim-5', { status: 'completed', latencyMs: 5 }),
    ).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('usageLimitBody', () => {
  it('tags every denial with the code the client matches on', () => {
    const body = usageLimitBody({
      kind: 'denied',
      scope: 'daily',
      limit: 120,
      used: 120,
      retryAfterSeconds: 900,
    })
    expect(body).toMatchObject({
      code: AI_USAGE_LIMIT_CODE,
      scope: 'daily',
      retry_after_seconds: 900,
    })
  })

  it('distinguishes a beta-wide ceiling from the caller’s own', () => {
    const mine = usageLimitBody({
      kind: 'denied',
      scope: 'burst',
      limit: 10,
      used: 10,
      retryAfterSeconds: 30,
    })
    const platform = usageLimitBody({
      kind: 'denied',
      scope: 'platform_daily',
      limit: 2000,
      used: 2000,
      retryAfterSeconds: 600,
    })
    expect(mine.error).toContain('You have reached')
    expect(platform.error).toContain('beta-wide')
  })

  it('names a prepaid pack on a commercial denial — not a wait', () => {
    const body = usageLimitBody({
      kind: 'denied',
      scope: 'commercial',
      limit: 80,
      used: 80,
      retryAfterSeconds: 86_400,
    })
    expect(body.error).toContain('prepaid pack')
    expect(body.scope).toBe('commercial')
  })
})
