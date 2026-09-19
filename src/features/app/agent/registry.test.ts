import { beforeEach, describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import {
  defineTool,
  describeToolsForModel,
  getTool,
  listTools,
  resetToolsForTest,
} from './registry'
import type { AgentTool } from './types'

function fakeTool(id: string): AgentTool<{ hits: unknown[] }> {
  return {
    id,
    module: 'test',
    moduleLabel: bi('Test', 'Test'),
    tier: 'commit',
    label: bi('Test tool', 'Outil de test'),
    description: bi('A test tool.', 'Un outil de test.'),
    params: [
      { name: 'name', type: 'string', required: true, description: bi('Name', 'Nom') },
      {
        name: 'kind',
        type: 'enum',
        enum: ['a', 'b'],
        description: bi('Kind', 'Genre'),
      },
    ],
    run: (ctx, params) => {
      ctx.hits.push(params)
      return { status: 'completed', message: bi('done', 'fait') }
    },
  }
}

describe('agent registry', () => {
  beforeEach(resetToolsForTest)

  it('registers and resolves a tool by id', () => {
    defineTool(fakeTool('test.echo'))
    expect(getTool('test.echo')?.id).toBe('test.echo')
    expect(listTools()).toHaveLength(1)
  })

  it('throws on a duplicate id — a name collision is a defect', () => {
    defineTool(fakeTool('test.echo'))
    expect(() => defineTool(fakeTool('test.echo'))).toThrow(/already registered/)
  })

  it('describes tools for a proposing model without vendor specifics', () => {
    defineTool(fakeTool('test.echo'))
    const [descriptor] = describeToolsForModel()
    expect(descriptor).toMatchObject({
      name: 'test.echo',
      module: 'test',
      riskTier: 'commit',
      parameters: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          kind: { type: 'string', enum: ['a', 'b'] },
        },
      },
    })
  })
})
