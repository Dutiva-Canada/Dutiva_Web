import { describe, expect, it } from 'vitest'
import { readNavNewChat, readNavStartFlow } from './advisorNav'

describe('advisorNav', () => {
  describe('readNavStartFlow', () => {
    it('accepts a bilingual prompt with an explicit flow key', () => {
      expect(
        readNavStartFlow({
          prompt: { en: 'Start termination', fr: 'Commencer la cessation' },
          flowKey: 'termination',
        }),
      ).toEqual({
        prompt: { en: 'Start termination', fr: 'Commencer la cessation' },
        flowKey: 'termination',
      })
    })

    it('accepts a string prompt without a flow key', () => {
      expect(readNavStartFlow({ prompt: 'What notice applies?' })).toEqual({
        prompt: 'What notice applies?',
        flowKey: undefined,
      })
    })

    it('rejects malformed router state', () => {
      expect(readNavNewChat(null)).toBe(false)
      expect(readNavStartFlow(null)).toBeNull()
      expect(readNavStartFlow({ prompt: '' })).toBeNull()
      expect(readNavStartFlow({ prompt: 'x', flowKey: 'not-a-flow' })).toEqual({
        prompt: 'x',
        flowKey: undefined,
      })
    })
  })

  describe('readNavNewChat', () => {
    it('detects the new-conversation contract', () => {
      expect(readNavNewChat({ newConversation: true })).toBe(true)
      expect(readNavNewChat({ newConversation: false })).toBe(false)
      expect(readNavNewChat({ prompt: 'hello' })).toBe(false)
    })
  })
})
