import { describe, expect, it } from 'vitest'
import { mergeSegments } from '@/features/app/documents/engine'
import { buildTemplatePreview, demoAnswerDisplay, templateByTid } from './templatePreviewModel'

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

  it('formats T01 demo dates and vacation weeks like the live wizard', () => {
    expect(demoAnswerDisplay('T01', 'start_date', 'en')).toBe('September 15, 2026')
    expect(demoAnswerDisplay('T01', 'vacation_weeks', 'en')).toBe('3 weeks')
    const preview = buildTemplatePreview('T01', 'en')
    expect(preview!.bilingual).toBe(true)
    expect(preview!.valuesByLang?.fr.start_date).toMatch(/15 septembre 2026/)
    const roleClause = preview!.blocks.find(
      (block) => block.heading?.en === 'Role, start date and reporting',
    )
    const body = mergeSegments(roleClause?.text?.en ?? '', preview!.values)
      .map((segment) => segment.text)
      .join('')
    expect(body).toContain('September 15, 2026')
    expect(body).toContain('Director of Operations')
    expect(body).not.toContain('2026-09-15')
  })

  it('fills T03 termination demo values without doubled placeholder words', () => {
    const preview = buildTemplatePreview('T03', 'en')
    const opening = preview!.blocks.find((block) => block.type === 'para')?.text?.en ?? ''
    const body = mergeSegments(opening, preview!.values)
      .map((segment) => segment.text)
      .join('')
    expect(body).toContain('October 3, 2026')
    expect(body).toContain('after 6 years of service')
    expect(body).not.toMatch(/effective effective/i)
    expect(body).not.toMatch(/years years/i)
  })
})
