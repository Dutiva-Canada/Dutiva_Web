import { beforeEach, describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import { executeAgentProposal } from '@/features/app/agent/executor'
import { createProposal } from '@/features/app/agent/propose'
import { bindModuleContext, resetModuleContextsForTest } from '@/features/app/agent/runtime'
import type { AgentToolExecution } from '@/features/app/agent/types'
/* Registers the three communications tools on import — the module under test. */
import './agentTools'
import type { CommunicationsAgentContext, CommsAgentNew, CommsAgentRow } from './agentTools'
import type { ProductionCommunication } from './productionApi'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }

const ROWS: CommsAgentRow[] = [
  {
    id: 'cm-1',
    title: 'RTO policy update',
    status: 'draft',
    audience: 'All staff',
    channel: 'email',
  },
  { id: 'cm-2', title: 'Harassment policy reminder', status: 'scheduled', channel: 'intranet' },
  { id: 'cm-3', title: 'Termination letter — J. Doe', status: 'sent', channel: 'letter' },
]

function fakeRow(fields: CommsAgentNew): ProductionCommunication {
  return {
    id: `new-${fields.title}`,
    title: fields.title,
    audience: fields.audience || null,
    channel: fields.channel,
    status: fields.status,
    scheduledFor: fields.scheduledFor || null,
    sentOn: null,
    templateTid: null,
    note: fields.note || null,
  }
}

function setupComms(opts?: { noAdd?: boolean }) {
  const added: CommsAgentNew[] = []
  const marked: string[] = []
  const ctx: CommunicationsAgentContext = {
    list: () => ROWS,
    ...(opts?.noAdd
      ? {}
      : {
          add: async (fields: CommsAgentNew) => {
            added.push(fields)
            return fakeRow(fields)
          },
        }),
    markSent: async (id: string) => {
      marked.push(id)
    },
  }
  bindModuleContext('communications', ctx)
  return { added, marked }
}

function run(toolId: string, params: Record<string, unknown>, exec: AgentToolExecution = DEMO) {
  return executeAgentProposal(createProposal(toolId, bi('proposal', 'proposition'), params), exec)
}

describe('communications agent tools', () => {
  beforeEach(() => {
    resetModuleContextsForTest()
  })

  it('lists the register, newest first, with status suffixes', async () => {
    setupComms()
    const { outcome } = await run('communications.list', {})
    expect(outcome.status).toBe('completed')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('3 communications')
    expect(outcome.status === 'completed' && outcome.message.en).toContain(
      'RTO policy update (draft)',
    )
  })

  it('filters the list by status', async () => {
    setupComms()
    const { outcome } = await run('communications.list', { status: 'sent' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('1 communication')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Termination letter')
    expect(outcome.status === 'completed' && outcome.message.en).not.toContain('RTO')
  })

  it('reports an empty register without failing', async () => {
    bindModuleContext('communications', { list: () => [] } satisfies CommunicationsAgentContext)
    const { outcome } = await run('communications.list', {})
    expect(outcome.status).toBe('completed')
  })

  it('logs a register entry, defaulting channel to other rather than asserting email', async () => {
    const { added } = setupComms()
    const { outcome } = await run('communications.log', {
      title: 'Policy acknowledgement request',
      audience: 'Warehouse team',
      status: 'draft',
    })
    expect(outcome.status).toBe('completed')
    expect(added[0]).toMatchObject({
      title: 'Policy acknowledgement request',
      audience: 'Warehouse team',
      channel: 'other',
      status: 'draft',
    })
  })

  it('logs a sent communication when the user says it already went out', async () => {
    const { added } = setupComms()
    const { outcome } = await run('communications.log', {
      title: 'RTO policy update',
      channel: 'email',
      status: 'sent',
    })
    expect(outcome.status).toBe('completed')
    expect(added[0]).toMatchObject({ status: 'sent', channel: 'email' })
  })

  it('fails cleanly when the register cannot accept writes (demo binding)', async () => {
    setupComms({ noAdd: true })
    const { outcome } = await run('communications.log', { title: 'Anything' })
    expect(outcome.status === 'failed' && outcome.code).toBe('module_unavailable')
    expect(outcome.status === 'failed' && outcome.message.en).toContain('production workspace')
  })

  it('marks a logged entry as sent by title — a record, never a send', async () => {
    const { marked } = setupComms()
    const { outcome } = await run('communications.mark_sent', { title: 'RTO policy' })
    expect(outcome.status).toBe('completed')
    expect(marked).toEqual(['cm-1'])
  })

  it('is idempotent — an already-sent entry completes without calling markSent', async () => {
    const { marked } = setupComms()
    const { outcome } = await run('communications.mark_sent', { title: 'Termination letter' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Already recorded')
    expect(marked).toEqual([])
  })

  it('fails cleanly when the title matches nothing', async () => {
    setupComms()
    const { outcome } = await run('communications.mark_sent', { title: 'No such memo' })
    expect(outcome.status === 'failed' && outcome.code).toBe('invalid_params')
  })

  it('has no send tool — external delivery is never defined, so the registry refuses it', async () => {
    setupComms()
    const { outcome } = await run('communications.send', { to: 'staff' })
    expect(outcome.status === 'failed' && outcome.code).toBe('unknown_tool')
  })

  it('refuses a commit for a production viewer', async () => {
    const { added } = setupComms()
    const { outcome } = await run(
      'communications.log',
      { title: 'Blocked' },
      { mode: 'production', role: 'viewer', organizationId: 'org-9' },
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('forbidden')
    expect(added).toEqual([])
  })
})
