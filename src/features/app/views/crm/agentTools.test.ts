import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { bi } from '@/i18n/core'
import { executeAgentProposal } from '@/features/app/agent/executor'
import { createProposal } from '@/features/app/agent/propose'
import { bindModuleContext, resetModuleContextsForTest } from '@/features/app/agent/runtime'
import type { AgentToolExecution } from '@/features/app/agent/types'
/* Registers the six CRM tools on import — the module under test. */
import './agentTools'
import { useCrmData } from './useCrmData'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }

/**
 * The real seam, end to end: proposals → executor → the mounted
 * `useCrmData` hook → fixture state. The binding re-arms from
 * `result.current` before each execution because the hook's mutators
 * capture state per render — exactly what the workspace's rebind-on-render
 * does live.
 */
function setupCrm() {
  const hook = renderHook(() => useCrmData('demo', undefined))
  const run = async (toolId: string, params: Record<string, unknown>) => {
    bindModuleContext('crm', hook.result.current)
    let result!: Awaited<ReturnType<typeof executeAgentProposal>>
    await act(async () => {
      result = await executeAgentProposal(
        createProposal(toolId, bi('proposal', 'proposition'), params),
        DEMO,
      )
    })
    return result
  }
  return { hook, run }
}

describe('CRM agent tools', () => {
  beforeEach(() => {
    resetModuleContextsForTest()
  })

  it('searches contacts by name through the read tier', async () => {
    const { run } = setupCrm()
    const { outcome } = await run('crm.search_contacts', { query: 'amara' })
    expect(outcome.status).toBe('completed')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Amara Okafor')
  })

  it('filters contacts by status', async () => {
    const { run } = setupCrm()
    const { outcome } = await run('crm.search_contacts', { status: 'customer' })
    expect(outcome.status).toBe('completed')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Sarah Whitmore')
    expect(outcome.status === 'completed' && outcome.message.en).not.toContain('Amara')
  })

  it('lists the open pipeline grouped by stage', async () => {
    const { run } = setupCrm()
    const { outcome } = await run('crm.pipeline', {})
    expect(outcome.status).toBe('completed')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Lakeside Manufacturing')
  })

  it('lists follow-ups inside the 7-day window', async () => {
    const { run } = setupCrm()
    const { outcome } = await run('crm.upcoming_followups', {})
    expect(outcome.status).toBe('completed')
    /* Fixtures carry two follow-ups dated +3d / +5d relative to today. */
    expect(outcome.status === 'completed' && outcome.message.en).toContain('2 follow-ups')
  })

  it('adds a contact and resolves the company by name', async () => {
    const { hook, run } = setupCrm()
    const { outcome } = await run('crm.add_contact', {
      name: 'Priya Nair',
      company: 'Lakeside Manufacturing',
      status: 'lead',
    })
    expect(outcome.status).toBe('completed')
    const contact = hook.result.current.state.contacts.find((c) => c.name === 'Priya Nair')
    expect(contact?.companyId).toBe('company-1')
    expect(contact?.status).toBe('lead')
  })

  it('logs an activity and resolves contact + company links by name', async () => {
    const { hook, run } = setupCrm()
    const { outcome } = await run('crm.log_activity', {
      type: 'call',
      summary: 'Call — renewal terms',
      contact: 'Amara',
    })
    expect(outcome.status).toBe('completed')
    const activity = hook.result.current.state.activities.find(
      (a) => a.summary.en === 'Call — renewal terms',
    )
    expect(activity?.type).toBe('call')
    expect(activity?.contactId).toBe('contact-1')
    /* company falls back to the resolved contact's company. */
    expect(activity?.companyId).toBe('company-1')
    expect(activity?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('moves a deal to a new stage', async () => {
    const { hook, run } = setupCrm()
    const { outcome } = await run('crm.move_deal_stage', {
      deal: 'Lakeside',
      stage: 'negotiation',
    })
    expect(outcome.status).toBe('completed')
    expect(hook.result.current.state.deals.find((d) => d.id === 'deal-1')?.stage).toBe(
      'negotiation',
    )
  })

  it('fails cleanly when the deal name matches nothing', async () => {
    const { run } = setupCrm()
    const { outcome } = await run('crm.move_deal_stage', { deal: 'No such deal', stage: 'won' })
    expect(outcome.status).toBe('failed')
  })

  it('never sends: no tool exists for external comms — the registry has six CRM tools, all record-only', async () => {
    const { outcome } = await executeAgentProposal(
      createProposal('crm.send_email', bi('x', 'x'), { to: 'x@y.ca' }),
      DEMO,
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('unknown_tool')
  })

  it('refuses a commit for a production viewer even though demo allows it', async () => {
    const { hook } = setupCrm()
    bindModuleContext('crm', hook.result.current)
    let result!: Awaited<ReturnType<typeof executeAgentProposal>>
    await act(async () => {
      result = await executeAgentProposal(
        createProposal('crm.add_contact', bi('x', 'x'), { name: 'Blocked User' }),
        { mode: 'production', role: 'viewer', organizationId: 'org-9' },
      )
    })
    expect(result.outcome.status === 'failed' && result.outcome.code).toBe('forbidden')
    expect(hook.result.current.state.contacts.some((c) => c.name === 'Blocked User')).toBe(false)
  })

  it('reports module_unavailable when CRM is not mounted', async () => {
    const { outcome } = await executeAgentProposal(
      createProposal('crm.add_contact', bi('x', 'x'), { name: 'Nobody' }),
      DEMO,
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('module_unavailable')
  })
})
