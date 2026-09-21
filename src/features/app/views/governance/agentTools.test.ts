import { beforeEach, describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import { executeAgentProposal } from '@/features/app/agent/executor'
import { createProposal } from '@/features/app/agent/propose'
import { bindModuleContext, resetModuleContextsForTest } from '@/features/app/agent/runtime'
import type { AgentToolExecution } from '@/features/app/agent/types'
/* Registers the six governance tools on import — the module under test. */
import './agentTools'
import type { GovernanceAgentContext } from './agentTools'
import type { GovernanceDecision, GovernanceOfficer, GovernanceRecord } from './data/types'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }

const NOW = '2026-09-18T12:00:00Z'

const RECORDS: GovernanceRecord[] = [
  {
    id: 'rec-1',
    organization_id: 'org-x',
    title: 'Articles of Incorporation',
    record_type: 'articles',
    jurisdiction: 'Ontario',
    effective_date: '2019-03-15',
    review_due_date: '2029-03-15',
    status: 'active',
    viewer_visible: true,
    document_id: null,
    created_by: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'rec-2',
    organization_id: 'org-x',
    title: 'By-law No. 1 — Corporate Governance',
    record_type: 'bylaw',
    jurisdiction: 'Ontario',
    effective_date: '2021-06-10',
    review_due_date: '2026-06-10',
    status: 'active',
    viewer_visible: true,
    document_id: null,
    created_by: null,
    created_at: NOW,
    updated_at: NOW,
  },
]

const DECISIONS: GovernanceDecision[] = [
  {
    id: 'dec-1',
    organization_id: 'org-x',
    title: 'Adopt 2024 fiscal year-end of December 31',
    decision_date: '2024-01-15',
    decided_by: 'Board of Directors',
    rationale: null,
    status: 'adopted',
    viewer_visible: true,
    related_record_id: 'rec-2',
    created_by: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'dec-2',
    organization_id: 'org-x',
    title: 'Approve the new office lease',
    decision_date: null,
    decided_by: null,
    rationale: null,
    status: 'proposed',
    viewer_visible: true,
    related_record_id: null,
    created_by: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'dec-3',
    organization_id: 'org-x',
    title: 'Merge with Orbit Freight',
    decision_date: '2025-02-01',
    decided_by: 'Board of Directors',
    rationale: null,
    status: 'rescinded',
    viewer_visible: true,
    related_record_id: null,
    created_by: null,
    created_at: NOW,
    updated_at: NOW,
  },
]

const OFFICERS: GovernanceOfficer[] = [
  {
    id: 'off-1',
    organization_id: 'org-x',
    name: 'Riley Summers',
    role: 'officer_secretary',
    appointed_date: '2022-04-01',
    resigned_date: null,
    contact_email: null,
    is_active: true,
    viewer_visible: true,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'off-2',
    organization_id: 'org-x',
    name: 'Jordan Mensah',
    role: 'director',
    appointed_date: '2020-09-12',
    resigned_date: null,
    contact_email: null,
    is_active: false,
    viewer_visible: true,
    created_at: NOW,
    updated_at: NOW,
  },
]

function setupGovernance() {
  const addedRecords: GovernanceRecord[] = []
  const addedDecisions: GovernanceDecision[] = []
  const updatedDecisions: GovernanceDecision[] = []
  const ctx: GovernanceAgentContext = {
    records: () => RECORDS,
    decisions: () => DECISIONS.map((d) => updatedDecisions.find((u) => u.id === d.id) ?? d),
    officers: () => OFFICERS,
    addRecord: async (record) => {
      addedRecords.push(record)
    },
    addDecision: async (decision) => {
      addedDecisions.push(decision)
    },
    updateDecision: async (decision) => {
      updatedDecisions.push(decision)
    },
  }
  bindModuleContext('governance', ctx)
  return { addedRecords, addedDecisions, updatedDecisions }
}

function run(toolId: string, params: Record<string, unknown>, exec: AgentToolExecution = DEMO) {
  return executeAgentProposal(createProposal(toolId, bi('proposal', 'proposition'), params), exec)
}

describe('governance agent tools', () => {
  beforeEach(() => {
    resetModuleContextsForTest()
  })

  it('lists records, flagging a review date that has passed', async () => {
    setupGovernance()
    const { outcome } = await run('governance.records', {})
    expect(outcome.status === 'completed' && outcome.message.en).toContain('2 records')
    expect(outcome.status === 'completed' && outcome.message.en).toContain(
      'Corporate Governance (active) ⚠',
    )
  })

  it('filters records by type', async () => {
    setupGovernance()
    const { outcome } = await run('governance.records', { recordType: 'bylaw' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('1 record')
    expect(outcome.status === 'completed' && outcome.message.en).not.toContain('Articles')
  })

  it('lists decisions with a status filter', async () => {
    setupGovernance()
    const { outcome } = await run('governance.decisions', { status: 'proposed' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('1 decision')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('office lease')
  })

  it('reports an empty decision filter without failing', async () => {
    setupGovernance()
    const { outcome } = await run('governance.decisions', { status: 'rescinded' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('1 decision')
  })

  it('lists only active officers', async () => {
    setupGovernance()
    const { outcome } = await run('governance.officers', {})
    expect(outcome.status === 'completed' && outcome.message.en).toContain('1 active officer')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Riley Summers')
    expect(outcome.status === 'completed' && outcome.message.en).not.toContain('Jordan')
  })

  it('records a decision as proposed by default, dated today', async () => {
    const { addedDecisions } = setupGovernance()
    const { outcome } = await run('governance.add_decision', { title: 'Hire a fractional CFO' })
    expect(outcome.status).toBe('completed')
    expect(addedDecisions[0]).toMatchObject({
      title: 'Hire a fractional CFO',
      status: 'proposed',
      viewer_visible: false,
    })
    expect(addedDecisions[0]?.decision_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('passes decided-by, rationale and an adopted status through to the seam', async () => {
    const { addedDecisions } = setupGovernance()
    await run('governance.add_decision', {
      title: 'Approve the 2026 budget',
      decidedBy: 'Board of Directors',
      rationale: 'Annual cycle',
      status: 'adopted',
      date: '2026-09-01',
    })
    expect(addedDecisions[0]).toMatchObject({
      status: 'adopted',
      decided_by: 'Board of Directors',
      rationale: 'Annual cycle',
      decision_date: '2026-09-01',
    })
  })

  it('adopts a proposed decision by title', async () => {
    const { updatedDecisions } = setupGovernance()
    const { outcome } = await run('governance.adopt_decision', { title: 'office lease' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Adopted')
    expect(updatedDecisions[0]).toMatchObject({ id: 'dec-2', status: 'adopted' })
    expect(updatedDecisions[0]?.decision_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('is idempotent on an already-adopted decision', async () => {
    const { updatedDecisions } = setupGovernance()
    const { outcome } = await run('governance.adopt_decision', { title: 'fiscal year-end' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Already adopted')
    expect(updatedDecisions).toEqual([])
  })

  it('refuses to adopt a rescinded decision', async () => {
    const { updatedDecisions } = setupGovernance()
    const { outcome } = await run('governance.adopt_decision', { title: 'Orbit Freight' })
    expect(outcome.status).toBe('failed')
    expect(updatedDecisions).toEqual([])
  })

  it('files a governance record as active', async () => {
    const { addedRecords } = setupGovernance()
    const { outcome } = await run('governance.add_record', {
      title: 'Board minutes — September meeting',
      recordType: 'minutes',
      jurisdiction: 'Ontario',
    })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Filed')
    expect(addedRecords[0]).toMatchObject({
      title: 'Board minutes — September meeting',
      record_type: 'minutes',
      status: 'active',
      jurisdiction: 'Ontario',
    })
  })

  it('fails cleanly when a decision title matches nothing', async () => {
    setupGovernance()
    const { outcome } = await run('governance.adopt_decision', { title: 'No such decision' })
    expect(outcome.status === 'failed' && outcome.code).toBe('invalid_params')
  })

  it('refuses a commit for a production viewer', async () => {
    const { addedDecisions } = setupGovernance()
    const { outcome } = await run(
      'governance.add_decision',
      { title: 'Blocked' },
      { mode: 'production', role: 'viewer', organizationId: 'org-9' },
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('forbidden')
    expect(addedDecisions).toEqual([])
  })
})
