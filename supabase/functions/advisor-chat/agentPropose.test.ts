import { describe, expect, it } from 'vitest'
import {
  agentActionsEnabled,
  buildExtractionMessages,
  looksActionable,
  parseExtraction,
} from './agentPropose'

describe('looksActionable — the cost gate', () => {
  it('catches action phrasing, EN and FR', () => {
    expect(looksActionable('mark the Maple Freight invoice as paid')).toBe(true)
    expect(looksActionable('add a vendor Groupe Alimex')).toBe(true)
    expect(looksActionable('log a call with Amara')).toBe(true)
    expect(looksActionable('marque la livraison comme livrée')).toBe(true)
    expect(looksActionable('approuve la demande pour les portables')).toBe(true)
    expect(looksActionable('consigne une décision')).toBe(true)
  })

  it('skips plain questions — the common case costs nothing', () => {
    expect(looksActionable('what is the notice period in Ontario')).toBe(false)
    expect(looksActionable('how does PIPEDA apply to employee records')).toBe(false)
    expect(looksActionable('quel est le délai de préavis')).toBe(false)
  })
})

describe('buildExtractionMessages', () => {
  it('system prompt carries the catalog; history is capped; user message last', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: 'user' as const,
      content: `turn ${i}`,
    }))
    const messages = buildExtractionMessages('mark it done', history)
    expect(messages[0]?.role).toBe('system')
    expect(messages[0]?.content).toContain('tasks.complete')
    expect(messages[0]?.content).toContain('finance.mark_invoice_paid')
    // system + 6 tail + user
    expect(messages).toHaveLength(8)
    expect(messages.at(-1)?.content).toBe('mark it done')
  })
})

describe('parseExtraction — valid output', () => {
  it('parses a clean {"actions":[…]} payload', () => {
    const out = parseExtraction(
      JSON.stringify({
        actions: [
          {
            toolId: 'tasks.create',
            summary: { en: 'Create a task', fr: 'Créer une tâche' },
            params: { title: 'review the policy' },
          },
        ],
      }),
    )
    expect(out).toHaveLength(1)
    expect(out[0]?.toolId).toBe('tasks.create')
    expect(out[0]?.params).toEqual({ title: 'review the policy' })
    expect(out[0]?.summary.fr).toBe('Créer une tâche')
  })

  it('accepts a bare array', () => {
    const out = parseExtraction(
      JSON.stringify([{ toolId: 'crm.pipeline', summary: 'Show pipeline', params: {} }]),
    )
    expect(out[0]?.toolId).toBe('crm.pipeline')
  })

  it('tolerates a fenced block and prose around the JSON', () => {
    const fenced = parseExtraction(
      'Here are the actions:\n```json\n{"actions":[{"toolId":"operations.logistics","params":{}}]}\n```',
    )
    expect(fenced[0]?.toolId).toBe('operations.logistics')
    const prosey = parseExtraction(
      'I found one. {"actions":[{"toolId":"crm.upcoming_followups","params":{}}]} — done.',
    )
    expect(prosey[0]?.toolId).toBe('crm.upcoming_followups')
  })

  it('caps output at 3 actions', () => {
    const actions = Array.from({ length: 6 }, (_, i) => ({
      toolId: 'tasks.create',
      params: { title: `task ${i}` },
    }))
    expect(parseExtraction(JSON.stringify({ actions }))).toHaveLength(3)
  })
})

describe('parseExtraction — validation', () => {
  it('drops unknown toolIds — the client ingest would drop them anyway', () => {
    const out = parseExtraction(
      JSON.stringify({
        actions: [
          { toolId: 'system.delete_everything', params: {} },
          { toolId: 'tasks.list', params: {} },
        ],
      }),
    )
    expect(out).toHaveLength(1)
    expect(out[0]?.toolId).toBe('tasks.list')
  })

  it('strips undeclared params instead of dropping the action', () => {
    const out = parseExtraction(
      JSON.stringify({
        actions: [
          {
            toolId: 'tasks.create',
            params: { title: 'x', confidence: 'high', invented: 42 },
          },
        ],
      }),
    )
    expect(out[0]?.params).toEqual({ title: 'x' })
  })

  it('drops the action when a required param is missing or ill-typed', () => {
    expect(
      parseExtraction(JSON.stringify({ actions: [{ toolId: 'tasks.create', params: {} }] })),
    ).toHaveLength(0)
    expect(
      parseExtraction(
        JSON.stringify({ actions: [{ toolId: 'tasks.create', params: { title: 42 } }] }),
      ),
    ).toHaveLength(0)
  })

  it('coerces a numeric string for number params', () => {
    const out = parseExtraction(
      JSON.stringify({
        actions: [
          {
            toolId: 'finance.add_spend_request',
            params: { purpose: 'laptops', amount: '3600' },
          },
        ],
      }),
    )
    expect(out[0]?.params).toEqual({ purpose: 'laptops', amount: 3600 })
  })

  it('repairs enum case and word forms — "On Hold" → on_hold', () => {
    const out = parseExtraction(
      JSON.stringify({
        actions: [
          {
            toolId: 'operations.update_project',
            params: { title: 'relocation', status: 'On Hold' },
          },
        ],
      }),
    )
    expect(out[0]?.params).toEqual({ title: 'relocation', status: 'on_hold' })
  })

  it('strips a bad optional enum but drops a bad required one', () => {
    const stripped = parseExtraction(
      JSON.stringify({
        actions: [
          {
            toolId: 'operations.add_vendor',
            params: { name: 'X', vendorType: 'spaceship' },
          },
        ],
      }),
    )
    expect(stripped[0]?.params).toEqual({ name: 'X' })
    expect(
      parseExtraction(
        JSON.stringify({
          actions: [
            {
              toolId: 'operations.update_project',
              params: { title: 'x', status: 'exploded' },
            },
          ],
        }),
      ),
    ).toHaveLength(0)
  })

  it('enforces strict YYYY-MM-DD dates', () => {
    expect(
      parseExtraction(
        JSON.stringify({
          actions: [
            {
              toolId: 'finance.add_obligation',
              params: { type: 'gst_hst', period: 'Q3', dueDate: 'next friday' },
            },
          ],
        }),
      ),
    ).toHaveLength(0)
  })

  it('fills summary fallbacks — string form and catalog purpose', () => {
    const str = parseExtraction(
      JSON.stringify({ actions: [{ toolId: 'tasks.list', summary: 'List tasks', params: {} }] }),
    )
    expect(str[0]?.summary).toEqual({ en: 'List tasks', fr: 'List tasks' })
    const missing = parseExtraction(
      JSON.stringify({ actions: [{ toolId: 'crm.pipeline', params: {} }] }),
    )
    expect(missing[0]?.summary.en.length).toBeGreaterThan(0)
  })

  it('returns [] for junk, wrong shapes, and the empty case', () => {
    expect(parseExtraction('no json here')).toEqual([])
    expect(parseExtraction('{"actions": "not an array"}')).toEqual([])
    expect(parseExtraction('{"actions":[]}')).toEqual([])
    expect(parseExtraction('42')).toEqual([])
    expect(parseExtraction('[{"toolId": 7}]')).toEqual([])
  })
})

describe('agentActionsEnabled — the deploy flag', () => {
  it('reads ADVISOR_AGENT_ACTIONS through a minimal Deno shim', () => {
    const env = { flag: undefined as string | undefined }
    ;(globalThis as Record<string, unknown>).Deno = {
      env: { get: (k: string) => (k === 'ADVISOR_AGENT_ACTIONS' ? env.flag : undefined) },
    }
    expect(agentActionsEnabled()).toBe(false)
    env.flag = 'true'
    expect(agentActionsEnabled()).toBe(true)
    env.flag = '1'
    expect(agentActionsEnabled()).toBe(false)
    delete (globalThis as Record<string, unknown>).Deno
  })
})
