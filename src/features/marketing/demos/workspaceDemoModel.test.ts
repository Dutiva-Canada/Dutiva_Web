import { describe, expect, it } from 'vitest'
import { landingAttentionPreview, landingScorePreview } from './workspaceDemoModel'

describe('workspaceDemoModel', () => {
  it('returns a stable score preview from marketing fixtures', () => {
    const { score, delta } = landingScorePreview()
    expect(score).toBe(82)
    expect(delta?.delta).toBe(8)
  })

  it('returns two attention rows for the landing analytics card', () => {
    const rows = landingAttentionPreview()
    expect(rows).toHaveLength(2)
    expect(rows[0]?.title.en.length).toBeGreaterThan(0)
  })
})
