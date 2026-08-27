import { describe, expect, it } from 'vitest'
import { buildTemplatePreview, templateByTid } from './templatePreviewModel'

describe('templatePreviewModel', () => {
  it('resolves preview blocks for featured templates', () => {
    for (const tid of ['T01', 'T03', 'T21'] as const) {
      const template = templateByTid(tid)
      expect(template).toBeDefined()
      const preview = buildTemplatePreview(tid, 'en')
      expect(preview).not.toBeNull()
      expect(preview!.blocks.length).toBeGreaterThan(0)
      expect(preview!.values.employee_name).toBe('Jordan Mensah')
    }
  })
})
