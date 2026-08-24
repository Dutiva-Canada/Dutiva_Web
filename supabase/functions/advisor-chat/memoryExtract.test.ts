import { describe, expect, it } from 'vitest'
import {
  MEMORY_EXTRACT_CAP,
  memoryExtractionPromptAppendix,
  parseMemoryExtract,
} from './memoryExtract'

describe('parseMemoryExtract', () => {
  it('returns the reply unchanged when no fence is present', () => {
    const reply = 'Here is some guidance about ESA notice.'
    expect(parseMemoryExtract(reply, 'conv-1')).toEqual({
      cleanReply: reply,
      candidates: [],
    })
  })

  it('strips the fence and parses valid candidates', () => {
    const reply =
      'Got it — I will keep that in mind.\n\n```dutiva-memory\n' +
      JSON.stringify([
        {
          scope: 'thread',
          category: 'note',
          statement_en: 'Jordan prefers email follow-ups',
          statement_fr: 'Jordan préfère les suivis par courriel',
          sensitive: false,
        },
      ]) +
      '\n```'
    const parsed = parseMemoryExtract(reply, 'conv-9')
    expect(parsed.cleanReply).toBe('Got it — I will keep that in mind.')
    expect(parsed.candidates).toHaveLength(1)
    expect(parsed.candidates[0]).toMatchObject({
      scope: 'thread',
      entityId: 'conv-9',
      statementEn: 'Jordan prefers email follow-ups',
      sensitive: false,
    })
  })

  it('drops malformed JSON and still cleans the fence', () => {
    const reply = 'Ok.\n```dutiva-memory\n{not-json}\n```'
    const parsed = parseMemoryExtract(reply, 'conv-1')
    expect(parsed.cleanReply).toBe('Ok.')
    expect(parsed.candidates).toHaveLength(0)
  })

  it('caps candidates and skips short statements', () => {
    const many = Array.from({ length: MEMORY_EXTRACT_CAP + 2 }, (_, i) => ({
      scope: 'thread',
      statement_en: i === 0 ? 'short' : `Durable workplace preference number ${i}`,
      statement_fr: `Fait ${i}`,
    }))
    const reply = `Hi\n\`\`\`dutiva-memory\n${JSON.stringify(many)}\n\`\`\``
    const parsed = parseMemoryExtract(reply, 'conv-1')
    expect(parsed.candidates.length).toBeLessThanOrEqual(MEMORY_EXTRACT_CAP)
    expect(parsed.candidates.every((c) => c.statementEn.length >= 8)).toBe(true)
  })
})

describe('memoryExtractionPromptAppendix', () => {
  it('names the fence language and inferred-only rule', () => {
    const text = memoryExtractionPromptAppendix()
    expect(text).toContain('dutiva-memory')
    expect(text).toContain('omit the fence')
  })
})
