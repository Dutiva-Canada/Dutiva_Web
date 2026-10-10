import { describe, expect, it } from 'vitest'
import { advisorSystemPrompt, SYSTEM_PROMPT } from './completion.ts'

describe('advisorSystemPrompt tiering', () => {
  it('external accounts get the standing not-a-lawyer opening', () => {
    const prompt = advisorSystemPrompt(false)
    expect(prompt).toBe(SYSTEM_PROMPT)
    expect(prompt).toContain('You are not a lawyer')
    expect(prompt).toContain('do not provide legal')
    expect(prompt).toContain('qualified legal counsel')
    expect(prompt).not.toContain('@dutiva.ca')
  })

  it('internal @dutiva.ca accounts get the direct-advice register', () => {
    const prompt = advisorSystemPrompt(true)
    expect(prompt).toContain('@dutiva.ca')
    expect(prompt).toContain('give your recommendation')
  })

  it('internal register keeps the legal boundary and statutory precision', () => {
    const prompt = advisorSystemPrompt(true)
    expect(prompt).toContain('You are not a lawyer')
    expect(prompt).toContain('qualified legal counsel')
    expect(prompt).toContain('never cite bill numbers')
    expect(prompt).toContain('Ontario Employment Standards Act')
    expect(prompt).toContain('Never emit raw HTML')
  })

  it('both tiers share the grounding and formatting body', () => {
    for (const advice of [false, true]) {
      const prompt = advisorSystemPrompt(advice)
      expect(prompt).toContain('Be factual and grounded at all times')
      expect(prompt).toContain('Use a Markdown table')
      expect(prompt).toContain('```chart')
    }
  })
})
