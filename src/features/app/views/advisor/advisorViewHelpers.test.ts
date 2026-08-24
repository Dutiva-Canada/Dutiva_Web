import { describe, expect, it } from 'vitest'
import {
  bucketFromUpdatedAt,
  isBackendConversationId,
  readNavChatId,
  resolveStartFlowKey,
} from './advisorViewHelpers'

describe('advisorViewHelpers', () => {
  it('buckets updatedAt into today, week, or older', () => {
    const now = new Date()
    expect(bucketFromUpdatedAt(now.toISOString())).toBe('today')

    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 3)
    expect(bucketFromUpdatedAt(weekAgo.toISOString())).toBe('week')

    const old = new Date(now)
    old.setDate(old.getDate() - 30)
    expect(bucketFromUpdatedAt(old.toISOString())).toBe('older')
  })

  it('detects backend UUID conversation ids', () => {
    expect(isBackendConversationId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(true)
    expect(isBackendConversationId('c2')).toBe(false)
  })

  it('reads chatId from router state', () => {
    expect(readNavChatId({ chatId: 'c1' })).toBe('c1')
    expect(readNavChatId({})).toBeNull()
  })

  it('resolveStartFlowKey prefers explicit flowKey', () => {
    expect(
      resolveStartFlowKey({ prompt: 'hello', flowKey: 'termination' }, 'signed-out'),
    ).toBe('termination')
  })
})
