import { beforeEach, describe, expect, it } from 'vitest'
import { executeAgentProposal } from '@/features/app/agent/executor'
import { createProposal } from '@/features/app/agent/propose'
import { bindModuleContext, resetModuleContextsForTest } from '@/features/app/agent/runtime'
import type { AgentToolExecution } from '@/features/app/agent/types'
/* Registers the six operations tools on import — the module under test. */
import './agentTools'
import type { OperationsAgentContext } from './agentTools'
import type { OperationsLogistics, OperationsProject, OperationsVendor } from './data/types'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }

const NOW = '2026-09-18T12:00:00Z'

const PROJECTS: OperationsProject[] = [
  {
    id: 'op-1',
    organization_id: 'org-x',
    title: 'Office relocation — Q1 2026',
    owner_id: null,
    status: 'active',
    start_date: '2026-01-05',
    target_date: '2026-03-31',
    description: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'op-2',
    organization_id: 'org-x',
    title: 'Warehouse racking audit',
    owner_id: null,
    status: 'planning',
    start_date: null,
    target_date: null,
    description: null,
    created_at: NOW,
    updated_at: NOW,
  },
]

const VENDORS: OperationsVendor[] = [
  {
    id: 'ov-1',
    organization_id: 'org-x',
    finance_party_id: null,
    name: 'Staples Business Advantage',
    vendor_type: 'supplier',
    status: 'active',
    contract_expiry: '2027-01-31',
    notes: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'ov-2',
    organization_id: 'org-x',
    finance_party_id: null,
    name: 'Lapsed Courier Co',
    vendor_type: 'logistics',
    status: 'active',
    contract_expiry: '2020-01-01',
    notes: null,
    created_at: NOW,
    updated_at: NOW,
  },
]

const SHIPMENTS: OperationsLogistics[] = [
  {
    id: 'ol-1',
    organization_id: 'org-x',
    title: 'New workstation shipment',
    owner_id: null,
    assigned_to: null,
    status: 'in_transit',
    expected_date: '2020-01-01',
    delivered_date: null,
    notes: null,
    created_by: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'ol-2',
    organization_id: 'org-x',
    title: 'Returned printer',
    owner_id: null,
    assigned_to: null,
    status: 'returned',
    expected_date: null,
    delivered_date: null,
    notes: null,
    created_by: null,
    created_at: NOW,
    updated_at: NOW,
  },
]

function bind(overrides: Partial<OperationsAgentContext> = {}) {
  const ctx: OperationsAgentContext = {
    projects: () => PROJECTS,
    vendors: () => VENDORS,
    logistics: () => SHIPMENTS,
    addVendor: () => {},
    updateLogistics: () => {},
    updateProject: () => {},
    ...overrides,
  }
  bindModuleContext('operations', ctx)
  return ctx
}

beforeEach(() => {
  resetModuleContextsForTest()
})

describe('operations agent tools — reads', () => {
  it('lists projects with a status filter', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.projects', { en: 'x', fr: 'x' }, { status: 'active' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Office relocation')
    expect(out.message.en).not.toContain('racking')
  })

  it('lists vendors and flags a lapsed contract', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.vendors', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Staples')
    expect(out.message.en).toContain('Lapsed Courier Co (active) ⚠')
  })

  it('lists only open shipments — returned ones are excluded', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.logistics', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('New workstation shipment')
    expect(out.message.en).toContain('⚠')
    expect(out.message.en).not.toContain('Returned printer')
  })

  it('returns the empty message when no projects match the filter', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.projects', { en: 'x', fr: 'x' }, { status: 'cancelled' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toBe('No projects match.')
  })
})

describe('operations agent tools — commits', () => {
  it('adds a vendor as active', async () => {
    const added: OperationsVendor[] = []
    bind({ addVendor: (v) => void added.push(v) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'operations.add_vendor',
        { en: 'x', fr: 'x' },
        { name: 'Groupe Alimex', vendorType: 'supplier', contractExpiry: '2027-06-30' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(added).toHaveLength(1)
    expect(added[0]?.name).toBe('Groupe Alimex')
    expect(added[0]?.status).toBe('active')
    expect(added[0]?.contract_expiry).toBe('2027-06-30')
    expect(added[0]?.id).toMatch(/^ov-/)
  })

  it('marks a shipment delivered by title, with today’s date', async () => {
    const updated: OperationsLogistics[] = []
    bind({ updateLogistics: (l) => void updated.push(l) })
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.deliver_shipment', { en: 'x', fr: 'x' }, { title: 'workstation' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('New workstation shipment')
    expect(updated[0]?.status).toBe('delivered')
    expect(updated[0]?.delivered_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('is idempotent on an already-delivered shipment', async () => {
    const updated: OperationsLogistics[] = []
    bind({
      logistics: () => [{ ...SHIPMENTS[0]!, status: 'delivered' }],
      updateLogistics: (l) => void updated.push(l),
    })
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.deliver_shipment', { en: 'x', fr: 'x' }, { title: 'workstation' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Already delivered')
    expect(updated).toHaveLength(0)
  })

  it('refuses a returned shipment', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.deliver_shipment', { en: 'x', fr: 'x' }, { title: 'printer' }),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.message.en).toContain('returned')
  })

  it('fails a delivery for a shipment title that doesn’t exist', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.deliver_shipment', { en: 'x', fr: 'x' }, { title: 'nope' }),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
  })

  it('moves a project to a new status', async () => {
    const updated: OperationsProject[] = []
    bind({ updateProject: (p) => void updated.push(p) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'operations.update_project',
        { en: 'x', fr: 'x' },
        { title: 'relocation', status: 'on_hold' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(updated[0]?.status).toBe('on_hold')
    expect(updated[0]?.id).toBe('op-1')
  })

  it('is idempotent when the project is already at that status', async () => {
    const updated: OperationsProject[] = []
    bind({ updateProject: (p) => void updated.push(p) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'operations.update_project',
        { en: 'x', fr: 'x' },
        { title: 'relocation', status: 'active' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Already active')
    expect(updated).toHaveLength(0)
  })

  it('fails when the project title doesn’t match', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'operations.update_project',
        { en: 'x', fr: 'x' },
        { title: 'no such project', status: 'completed' },
      ),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
  })
})

describe('operations agent tools — gates', () => {
  it('fails commits when the module context isn’t bound', async () => {
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.add_vendor', { en: 'x', fr: 'x' }, { name: 'X' }),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('module_unavailable')
  })

  it('rejects a param value outside the status enum before running', async () => {
    let ran = false
    bind({ updateProject: () => void (ran = true) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'operations.update_project',
        { en: 'x', fr: 'x' },
        { title: 'relocation', status: 'exploded' },
      ),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
    expect(ran).toBe(false)
  })

  it('refuses a commit for a viewer role in production', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('operations.add_vendor', { en: 'x', fr: 'x' }, { name: 'X' }),
      { mode: 'production', role: 'viewer', organizationId: 'org-x' },
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('forbidden')
  })
})
