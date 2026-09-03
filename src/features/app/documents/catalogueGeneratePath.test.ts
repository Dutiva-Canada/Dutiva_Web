import { describe, expect, it } from 'vitest'
import { catalogueGeneratePath } from './catalogueGeneratePath'

describe('catalogueGeneratePath', () => {
  it('resolves tid and tpl id to the generate route', () => {
    expect(catalogueGeneratePath('T01')).toBe('/app/documents/generate/tpl_t01')
    expect(catalogueGeneratePath('tpl_t01')).toBe('/app/documents/generate/tpl_t01')
  })

  it('returns null for unknown keys (overlay / legacy titles)', () => {
    expect(catalogueGeneratePath('Termination Letter')).toBeNull()
    expect(catalogueGeneratePath('not-a-template')).toBeNull()
  })
})
