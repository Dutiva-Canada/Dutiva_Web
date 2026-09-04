import { describe, expect, it } from 'vitest'
import { memoryPathForEntity, memoryPathForFact } from './memoryRoutes'

describe('memoryRoutes', () => {
  it('maps each scope to its Memory surface', () => {
    expect(memoryPathForEntity('person', 'e1')).toBe('/app/settings/memory/people/e1')
    expect(memoryPathForEntity('case', 'c1')).toBe('/app/settings/memory/cases/c1')
    expect(memoryPathForEntity('thread', 't1')).toBe('/app/settings/memory/conversations/t1')
  })

  it('falls back to the manager when scope or entity is missing', () => {
    expect(memoryPathForFact({})).toBe('/app/settings/memory')
    expect(memoryPathForFact({ factId: 'f1' })).toBe('/app/settings/memory')
    expect(memoryPathForFact({ scope: 'person', entityId: 'e1', factId: 'f1' })).toBe(
      '/app/settings/memory/people/e1',
    )
  })
})
