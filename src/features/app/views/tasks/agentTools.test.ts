import { beforeEach, describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import { executeAgentProposal } from '@/features/app/agent/executor'
import { createProposal } from '@/features/app/agent/propose'
import { bindModuleContext, resetModuleContextsForTest } from '@/features/app/agent/runtime'
import type { AgentToolExecution } from '@/features/app/agent/types'
/* Registers the three tasks tools on import — the module under test. */
import './agentTools'
import type { TasksAgentContext, TasksAgentRow } from './agentTools'
import type { NewTask, ProductionTask } from './productionApi'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }

const ROWS: TasksAgentRow[] = [
  {
    id: 't-1',
    title: 'Review severance policy',
    done: false,
    priority: 'high',
    dueDate: '2026-10-01',
  },
  { id: 't-2', title: 'Call the broker', done: false, priority: 'medium', dueDate: null },
  { id: 't-3', title: 'File last quarter’s report', done: true, priority: 'low', dueDate: null },
]

function fakeTask(fields: NewTask): ProductionTask {
  return {
    id: `new-${fields.title}`,
    title: fields.title,
    priority: fields.priority,
    status: 'open',
    done: false,
    category: 'general',
    dueDate: fields.dueDate || null,
    linkedEmployeeId: null,
    linkedKind: null,
  }
}

function setupTasks(opts?: { noCreate?: boolean }) {
  const created: NewTask[] = []
  const doneCalls: Array<{ id: string; done: boolean }> = []
  const ctx: TasksAgentContext = {
    list: () => ROWS,
    ...(opts?.noCreate
      ? {}
      : {
          create: async (fields: NewTask) => {
            created.push(fields)
            return fakeTask(fields)
          },
        }),
    setDone: async (id: string, done: boolean) => {
      doneCalls.push({ id, done })
    },
  }
  bindModuleContext('tasks', ctx)
  return { created, doneCalls }
}

function run(toolId: string, params: Record<string, unknown>, exec: AgentToolExecution = DEMO) {
  return executeAgentProposal(createProposal(toolId, bi('proposal', 'proposition'), params), exec)
}

describe('tasks agent tools', () => {
  beforeEach(() => {
    resetModuleContextsForTest()
  })

  it('lists open tasks by default, with due dates', async () => {
    setupTasks()
    const { outcome } = await run('tasks.list', {})
    expect(outcome.status === 'completed' && outcome.message.en).toContain('2 tasks')
    expect(outcome.status === 'completed' && outcome.message.en).toContain(
      'Review severance policy (2026-10-01)',
    )
    expect(outcome.status === 'completed' && outcome.message.en).not.toContain('File last')
  })

  it('lists done tasks on request', async () => {
    setupTasks()
    const { outcome } = await run('tasks.list', { status: 'done' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('1 task')
    expect(outcome.status === 'completed' && outcome.message.en).toContain('File last quarter')
  })

  it('lists everything with status all', async () => {
    setupTasks()
    const { outcome } = await run('tasks.list', { status: 'all' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('3 tasks')
  })

  it('creates a task with the checklist defaults when priority and due are unset', async () => {
    const { created } = setupTasks()
    const { outcome } = await run('tasks.create', { title: 'Renew the WSIB registration' })
    expect(outcome.status).toBe('completed')
    expect(created[0]).toEqual({
      title: 'Renew the WSIB registration',
      priority: 'medium',
      dueDate: '',
    })
  })

  it('passes priority and due date through to the seam', async () => {
    const { created } = setupTasks()
    await run('tasks.create', { title: 'Audit', priority: 'critical', dueDate: '2026-10-15' })
    expect(created[0]).toMatchObject({ priority: 'critical', dueDate: '2026-10-15' })
  })

  it('fails cleanly when the checklist cannot accept writes (demo binding)', async () => {
    setupTasks({ noCreate: true })
    const { outcome } = await run('tasks.create', { title: 'Anything' })
    expect(outcome.status === 'failed' && outcome.code).toBe('module_unavailable')
  })

  it('completes an open task by title — set done, never toggle', async () => {
    const { doneCalls } = setupTasks()
    const { outcome } = await run('tasks.complete', { title: 'severance' })
    expect(outcome.status).toBe('completed')
    expect(doneCalls).toEqual([{ id: 't-1', done: true }])
  })

  it('is idempotent — an already-done task completes without calling setDone', async () => {
    const { doneCalls } = setupTasks()
    const { outcome } = await run('tasks.complete', { title: 'File last' })
    expect(outcome.status === 'completed' && outcome.message.en).toContain('Already done')
    expect(doneCalls).toEqual([])
  })

  it('fails cleanly when the title matches nothing', async () => {
    setupTasks()
    const { outcome } = await run('tasks.complete', { title: 'No such task' })
    expect(outcome.status === 'failed' && outcome.code).toBe('invalid_params')
  })

  it('refuses a commit for a production viewer', async () => {
    const { created } = setupTasks()
    const { outcome } = await run(
      'tasks.create',
      { title: 'Blocked' },
      { mode: 'production', role: 'viewer', organizationId: 'org-9' },
    )
    expect(outcome.status === 'failed' && outcome.code).toBe('forbidden')
    expect(created).toEqual([])
  })
})
