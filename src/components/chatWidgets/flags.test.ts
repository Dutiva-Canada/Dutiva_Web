import { beforeEach, describe, expect, it } from 'vitest'
import { CHAT_WIDGET_FLAG_KEY, interactiveChatWidgetsEnabled } from './flags'

describe('interactiveChatWidgetsEnabled', () => {
  beforeEach(() => {
    localStorage.removeItem(CHAT_WIDGET_FLAG_KEY)
  })

  it('is off by default — every surface renders exactly as before', () => {
    for (const surface of ['advisor', 'invest', 'health', 'pr'] as const) {
      expect(interactiveChatWidgetsEnabled(surface)).toBe(false)
    }
  })

  it('"all" (and synonyms) enables every surface', () => {
    for (const value of ['all', 'true', '1']) {
      localStorage.setItem(CHAT_WIDGET_FLAG_KEY, value)
      expect(interactiveChatWidgetsEnabled('advisor')).toBe(true)
      expect(interactiveChatWidgetsEnabled('invest')).toBe(true)
    }
  })

  it('a comma list opts surfaces in independently', () => {
    localStorage.setItem(CHAT_WIDGET_FLAG_KEY, 'invest,health')
    expect(interactiveChatWidgetsEnabled('invest')).toBe(true)
    expect(interactiveChatWidgetsEnabled('health')).toBe(true)
    expect(interactiveChatWidgetsEnabled('advisor')).toBe(false)
    expect(interactiveChatWidgetsEnabled('pr')).toBe(false)
  })

  it('ignores stray whitespace and case in the value', () => {
    localStorage.setItem(CHAT_WIDGET_FLAG_KEY, ' Invest , PR ')
    expect(interactiveChatWidgetsEnabled('invest')).toBe(true)
    expect(interactiveChatWidgetsEnabled('pr')).toBe(true)
    expect(interactiveChatWidgetsEnabled('health')).toBe(false)
  })

  it('an empty override falls back to the env value', () => {
    localStorage.setItem(CHAT_WIDGET_FLAG_KEY, '')
    expect(interactiveChatWidgetsEnabled('advisor')).toBe(false)
  })
})
