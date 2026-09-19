import { describe, expect, it } from 'vitest'
import { proposeTasksAction } from './agentIntent'

/** Deterministic tasks parser — every match must land a clean proposal. */
describe('proposeTasksAction', () => {
  it('creates a task from "create a task to X"', () => {
    const proposal = proposeTasksAction('create a task to review the severance policy')
    expect(proposal?.toolId).toBe('tasks.create')
    expect(proposal?.params).toEqual({ title: 'review the severance policy' })
  })

  it('creates a task from "remind me to X"', () => {
    const proposal = proposeTasksAction('remind me to call the broker')
    expect(proposal?.toolId).toBe('tasks.create')
    expect(proposal?.params).toEqual({ title: 'call the broker' })
  })

  it('creates a task from French phrasing', () => {
    const proposal = proposeTasksAction('ajoute une tâche de relire la politique')
    expect(proposal?.toolId).toBe('tasks.create')
    expect(proposal?.params).toEqual({ title: 'relire la politique' })
  })

  it('does not steal "task with X" phrasing — that is a CRM activity', () => {
    expect(proposeTasksAction('add a task with Amara')).toBeNull()
    expect(proposeTasksAction('create a task with the client')).toBeNull()
  })

  it('completes a task from "mark X as done"', () => {
    const proposal = proposeTasksAction('mark the policy review as done')
    expect(proposal?.toolId).toBe('tasks.complete')
    expect(proposal?.params).toEqual({ title: 'policy review' })
  })

  it('completes a task from "complete the task X"', () => {
    const proposal = proposeTasksAction('complete the task onboarding checklist')
    expect(proposal?.toolId).toBe('tasks.complete')
    expect(proposal?.params).toEqual({ title: 'onboarding checklist' })
  })

  it('completes a task from French phrasing', () => {
    const proposal = proposeTasksAction('termine la tâche intégration')
    expect(proposal?.toolId).toBe('tasks.complete')
    expect(proposal?.params).toEqual({ title: 'intégration' })
  })

  it('returns null for unrelated text', () => {
    expect(proposeTasksAction('what is the notice period in Ontario')).toBeNull()
    expect(proposeTasksAction('mark the letter as sent')).toBeNull()
  })
})
