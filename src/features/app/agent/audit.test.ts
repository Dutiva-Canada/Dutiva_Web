import { beforeEach, describe, expect, it, vi } from 'vitest'

/* The real module builds `supabase` from env at import time — absent in
   tests. The getter lets a case drop the client to null (the no-env path). */
const insert = vi.fn(async (_row: Record<string, unknown>) => ({
  error: null as null | { message: string },
}))
const from = vi.fn(() => ({ insert }))
const state: { client: { from: typeof from } | null } = { client: { from } }

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return state.client
  },
}))

import { appendAudit, listAudit, resetAuditForTest } from './audit'
import type { AgentAuditRecord } from './types'

const PROD: AgentAuditRecord = {
  id: 'audit-1',
  toolId: 'finance.mark_invoice_paid',
  module: 'finance',
  tier: 'commit',
  params: { match: 'INV-2026-0042' },
  mode: 'production',
  role: 'admin',
  organizationId: 'org-1',
  status: 'completed',
  startedAt: '2026-09-18T12:00:00Z',
  finishedAt: '2026-09-18T12:00:01Z',
}

const DEMO_REC: AgentAuditRecord = { ...PROD, mode: 'demo', role: null, organizationId: null }

beforeEach(() => {
  resetAuditForTest()
  vi.clearAllMocks()
  state.client = { from }
})

describe('appendAudit — in-memory log', () => {
  it('keeps every record, persisted or not', () => {
    appendAudit(PROD)
    appendAudit(DEMO_REC)
    expect(listAudit()).toHaveLength(2)
  })
})

describe('appendAudit — durable persist', () => {
  it('inserts a mapped row for a production record', async () => {
    appendAudit(PROD)
    await vi.waitFor(() => expect(insert).toHaveBeenCalled())
    expect(from).toHaveBeenCalledWith('agent_audit')
    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      tool_id: 'finance.mark_invoice_paid',
      module: 'finance',
      tier: 'commit',
      params: { match: 'INV-2026-0042' },
      mode: 'production',
      role: 'admin',
      status: 'completed',
      error_code: null,
      started_at: '2026-09-18T12:00:00Z',
      finished_at: '2026-09-18T12:00:01Z',
    })
  })

  it('carries the error code on a failed attempt', async () => {
    appendAudit({ ...PROD, status: 'failed', errorCode: 'forbidden' })
    await vi.waitFor(() => expect(insert).toHaveBeenCalled())
    expect(insert.mock.calls[0]?.[0]).toMatchObject({
      status: 'failed',
      error_code: 'forbidden',
    })
  })

  it('skips persist for demo records — no org to scope them to', async () => {
    appendAudit(DEMO_REC)
    await Promise.resolve()
    expect(from).not.toHaveBeenCalled()
    expect(listAudit()).toHaveLength(1)
  })

  it('skips persist when the client is absent (no env)', async () => {
    state.client = null
    appendAudit(PROD)
    await Promise.resolve()
    expect(from).not.toHaveBeenCalled()
    expect(listAudit()).toHaveLength(1)
  })

  it('warns and keeps the record when the insert fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    insert.mockResolvedValueOnce({ error: { message: 'table missing' } })
    appendAudit(PROD)
    await vi.waitFor(() => expect(warn).toHaveBeenCalled())
    expect(warn.mock.calls[0]?.[0]).toContain('agent_audit persist failed')
    expect(listAudit()).toHaveLength(1)
    warn.mockRestore()
  })

  it('warns and keeps the record when the insert throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    insert.mockRejectedValueOnce(new Error('network down'))
    appendAudit(PROD)
    await vi.waitFor(() => expect(warn).toHaveBeenCalled())
    expect(warn.mock.calls[0]?.[0]).toContain('agent_audit persist threw')
    expect(listAudit()).toHaveLength(1)
    warn.mockRestore()
  })
})
