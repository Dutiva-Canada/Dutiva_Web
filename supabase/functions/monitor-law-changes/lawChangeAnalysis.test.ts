import { describe, expect, it } from 'vitest'
import {
  buildLawAnalysisMessages,
  LAW_ANALYSIS_MAX_CHARS,
  parseLawAnalysis,
} from './lawChangeAnalysis.ts'

describe('buildLawAnalysisMessages', () => {
  it('embeds the law, jurisdiction and facts in the user turn', () => {
    const msgs = buildLawAnalysisMessages(
      'Act respecting labour standards',
      'Quebec',
      's. 81.1 — in force 2025-10-28',
    )
    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('system')
    expect(msgs[0].content).toContain('ONLY the supplied facts')
    expect(msgs[0].content).toContain('"en"')
    expect(msgs[0].content).toContain('"fr"')
    expect(msgs[1].role).toBe('user')
    expect(msgs[1].content).toContain('Act respecting labour standards')
    expect(msgs[1].content).toContain('Quebec')
    expect(msgs[1].content).toContain('s. 81.1')
  })

  it('caps oversized fact blocks', () => {
    const msgs = buildLawAnalysisMessages('L', 'ON', 'x'.repeat(10_000))
    expect(msgs[1].content.length).toBeLessThan(7000)
  })
})

describe('parseLawAnalysis', () => {
  it('parses a clean JSON reply', () => {
    expect(
      parseLawAnalysis('{"en":"Two provisions moved.","fr":"Deux dispositions ont bougé."}'),
    ).toEqual({ en: 'Two provisions moved.', fr: 'Deux dispositions ont bougé.' })
  })

  it('parses a fenced reply', () => {
    expect(parseLawAnalysis('```json\n{"en":"A.","fr":"B."}\n```')).toEqual({ en: 'A.', fr: 'B.' })
  })

  it('parses JSON surrounded by chatter', () => {
    expect(parseLawAnalysis('Here you go:\n{"en":"A.","fr":"B."}\nHope this helps.')).toEqual({
      en: 'A.',
      fr: 'B.',
    })
  })

  it('rejects one-sided replies', () => {
    expect(parseLawAnalysis('{"en":"English only."}')).toBeNull()
    expect(parseLawAnalysis('{"fr":"Français seul."}')).toBeNull()
  })

  it('rejects non-JSON, empty and missing input', () => {
    expect(parseLawAnalysis('not json')).toBeNull()
    expect(parseLawAnalysis('')).toBeNull()
    expect(parseLawAnalysis(null)).toBeNull()
    expect(parseLawAnalysis(undefined)).toBeNull()
  })

  it('caps each locale at the analysis budget', () => {
    const long = 'a'.repeat(LAW_ANALYSIS_MAX_CHARS + 50)
    const parsed = parseLawAnalysis(JSON.stringify({ en: long, fr: 'ok' }))
    expect(parsed?.en.length).toBe(LAW_ANALYSIS_MAX_CHARS)
    expect(parsed?.fr).toBe('ok')
  })
})
