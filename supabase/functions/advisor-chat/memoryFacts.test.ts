import { describe, expect, it } from 'vitest'
import {
  MEMORY_PROMPT_FACT_CAP,
  memoryBlock,
  selectMemoryFactsForPrompt,
} from './memoryFacts'
import type { MemoryFactForPrompt } from './memoryFacts'

function fact(partial: Partial<MemoryFactForPrompt> & Pick<MemoryFactForPrompt, 'id'>): MemoryFactForPrompt {
  return {
    scope: 'person',
    entityId: 'emp-1',
    category: 'note',
    statementEn: 'Prefers email follow-ups',
    statementFr: 'Préfère les suivis par courriel',
    sourceType: 'manual',
    visibility: 'hr',
    sensitive: false,
    confidence: 'confirmed',
    ...partial,
  }
}

describe('selectMemoryFactsForPrompt', () => {
  it('keeps only confirmed, non-sensitive, non-restricted facts', () => {
    const rows = [
      fact({ id: 'ok' }),
      fact({ id: 'inferred', confidence: 'inferred' }),
      fact({ id: 'sensitive', sensitive: true }),
      fact({ id: 'restricted', visibility: 'restricted' }),
      fact({ id: 'empty', statementEn: '   ' }),
    ]
    expect(selectMemoryFactsForPrompt(rows, null).map((f) => f.id)).toEqual(['ok'])
  })

  it('puts matching thread facts first, then caps', () => {
    const rows = [
      fact({ id: 'p1', scope: 'person', entityId: 'e1', statementEn: 'Person A' }),
      fact({ id: 't1', scope: 'thread', entityId: 'conv-1', statementEn: 'Thread A' }),
      fact({ id: 't2', scope: 'thread', entityId: 'conv-other', statementEn: 'Other thread' }),
      fact({ id: 'p2', scope: 'person', entityId: 'e2', statementEn: 'Person B' }),
    ]
    const selected = selectMemoryFactsForPrompt(rows, 'conv-1', 3)
    expect(selected.map((f) => f.id)).toEqual(['t1', 'p1', 't2'])
    expect(selected).toHaveLength(3)
  })

  it('respects the default prompt cap', () => {
    const rows = Array.from({ length: MEMORY_PROMPT_FACT_CAP + 5 }, (_, i) =>
      fact({ id: `f${i}`, statementEn: `Fact ${i}` }),
    )
    expect(selectMemoryFactsForPrompt(rows, null)).toHaveLength(MEMORY_PROMPT_FACT_CAP)
  })
})

describe('memoryBlock', () => {
  it('returns empty string when there are no facts', () => {
    expect(memoryBlock([])).toBe('')
  })

  it('frames facts as organization memory, not statute', () => {
    const block = memoryBlock([
      fact({
        id: '1',
        scope: 'case',
        entityId: 'case-9',
        category: 'matter',
        statementEn: 'Counsel review still outstanding',
        statementFr: 'Révision juridique toujours en attente',
        sourceType: 'case',
      }),
    ])
    expect(block).toContain('Organization memory')
    expect(block).toContain('NOT statutes')
    expect(block).toContain('[case:case-9 · matter · case]')
    expect(block).toContain('Counsel review still outstanding')
    expect(block).toContain('FR: Révision juridique toujours en attente')
  })
})
