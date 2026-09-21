import { beforeEach, describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import { listAudit, resetAuditForTest } from './audit'
import { executeAgentProposal } from './executor'
import { createProposal } from './propose'
import { defineTool, resetToolsForTest } from './registry'
import { bindModuleContext, resetModuleContextsForTest } from './runtime'
import type { AgentTool, AgentToolExecution } from './types'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }
const VIEWER: AgentToolExecution = { mode: 'production', role: 'viewer', organizationId: 'org-1' }
const MEMBER: AgentToolExecution = { mode: 'production', role: 'member', organizationId: 'org-1' }

interface FakeModule {
  hits: Record<string, unknown>[]
}

function commitTool(id = 'test.commit'): AgentTool<FakeModule> {
  return {
    id,
    module: 'test',
    moduleLabel: bi('the test module', 'le module de test'),
    tier: 'commit',
    label: bi('Commit', 'Écrire'),
    description: bi('Writes a record.', 'Écrit un enregistrement.'),
    params: [
      { name: 'name', type: 'string', required: true, description: bi('Name', 'Nom') },
      { name: 'kind', type: 'enum', enum: ['a', 'b'], description: bi('Kind', 'Genre') },
      { name: 'when', type: 'date', description: bi('When', 'Quand') },
    ],
    run: (ctx, params) => {
      ctx.hits.push(params)
      return { status: 'completed', message: bi('written', 'écrit'), entityId: 'e-1' }
    },
  }
}

function readTool(id = 'test.read'): AgentTool<FakeModule> {
  return {
    id,
    module: 'test',
    moduleLabel: bi('the test module', 'le module de test'),
    tier: 'read',
    label: bi('Read', 'Lire'),
    description: bi('Reads records.', 'Lit des enregistrements.'),
    params: [],
    run: () => ({ status: 'completed', message: bi('3 rows', '3 lignes') }),
  }
}

describe('executeAgentProposal', () => {
  beforeEach(() => {
    resetToolsForTest()
    resetModuleContextsForTest()
    resetAuditForTest()
  })

  it('refuses an unregistered tool id', async () => {
    const { outcome, audit } = await executeAgentProposal(
      createProposal('nope.nothing', bi('x', 'x'), {}),
      DEMO,
    )
    expect(outcome.status).toBe('failed')
    expect(outcome.status === 'failed' && outcome.code).toBe('unknown_tool')
    expect(audit.status).toBe('failed')
    expect(listAudit()).toHaveLength(1)
  })

  it('refuses missing required params', async () => {
    defineTool(commitTool())
    bindModuleContext('test', { hits: [] })
    const { outcome } = await executeAgentProposal(
      createProposal('test.commit', bi('x', 'x'), {}),
      DEMO,
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('invalid_params')
    expect(outcome.status === 'failed' && outcome.detail).toBe('name')
  })

  it('refuses a bad enum value', async () => {
    defineTool(commitTool())
    bindModuleContext('test', { hits: [] })
    const { outcome } = await executeAgentProposal(
      createProposal('test.commit', bi('x', 'x'), { name: 'x', kind: 'zzz' }),
      DEMO,
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('invalid_params')
  })

  it('refuses undeclared params — model-injected fields never reach run()', async () => {
    const ctx: FakeModule = { hits: [] }
    defineTool(commitTool())
    bindModuleContext('test', ctx)
    const { outcome } = await executeAgentProposal(
      createProposal('test.commit', bi('x', 'x'), { name: 'x', send: true }),
      DEMO,
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('invalid_params')
    expect(ctx.hits).toHaveLength(0)
  })

  it('refuses a malformed date param', async () => {
    defineTool(commitTool())
    bindModuleContext('test', { hits: [] })
    const { outcome } = await executeAgentProposal(
      createProposal('test.commit', bi('x', 'x'), { name: 'x', when: 'next friday' }),
      DEMO,
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('invalid_params')
  })

  it('refuses a commit below minRole in production', async () => {
    const ctx: FakeModule = { hits: [] }
    defineTool(commitTool())
    bindModuleContext('test', ctx)
    const { outcome } = await executeAgentProposal(
      createProposal('test.commit', bi('x', 'x'), { name: 'x' }),
      VIEWER,
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('forbidden')
    expect(ctx.hits).toHaveLength(0)
  })

  it('lets a viewer read in production but not commit', async () => {
    const ctx: FakeModule = { hits: [] }
    defineTool(readTool())
    defineTool(commitTool())
    bindModuleContext('test', ctx)
    const read = await executeAgentProposal(createProposal('test.read', bi('x', 'x'), {}), VIEWER)
    expect(read.outcome.status).toBe('completed')
  })

  it('runs a commit for member-or-above in production', async () => {
    const ctx: FakeModule = { hits: [] }
    defineTool(commitTool())
    bindModuleContext('test', ctx)
    const { outcome, audit } = await executeAgentProposal(
      createProposal('test.commit', bi('x', 'x'), { name: 'x', when: '2026-09-30' }),
      MEMBER,
    )
    expect(outcome.status).toBe('completed')
    expect(ctx.hits).toEqual([{ name: 'x', when: '2026-09-30' }])
    expect(audit.organizationId).toBe('org-1')
    expect(audit.role).toBe('member')
  })

  it('runs in demo mode with no role — the simulated workspace owner', async () => {
    const ctx: FakeModule = { hits: [] }
    defineTool(commitTool())
    bindModuleContext('test', ctx)
    const { outcome } = await executeAgentProposal(
      createProposal('test.commit', bi('x', 'x'), { name: 'x' }),
      DEMO,
    )
    expect(outcome.status).toBe('completed')
    expect(ctx.hits).toHaveLength(1)
  })

  it('reports module_unavailable when the module is not bound', async () => {
    defineTool(commitTool())
    const { outcome } = await executeAgentProposal(
      createProposal('test.commit', bi('x', 'x'), { name: 'x' }),
      DEMO,
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('module_unavailable')
    expect(outcome.status === 'failed' && outcome.detail).toEqual(
      bi('the test module', 'le module de test'),
    )
  })

  it('audits both successes and refusals', async () => {
    const ctx: FakeModule = { hits: [] }
    defineTool(commitTool())
    bindModuleContext('test', ctx)
    await executeAgentProposal(createProposal('test.commit', bi('x', 'x'), { name: 'x' }), DEMO)
    await executeAgentProposal(createProposal('test.commit', bi('x', 'x'), {}), DEMO)
    const log = listAudit()
    expect(log).toHaveLength(2)
    expect(log[0]?.status).toBe('completed')
    expect(log[1]?.status).toBe('failed')
    expect(log[1]?.errorCode).toBe('invalid_params')
  })
})
