import { describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import {
  buildAdvisorThreadEntries,
  buildAdvisorThreadGroups,
  bucketFromUpdatedAt,
  isBackendConversationId,
  readNavChatId,
  resolveStartFlowKey,
} from './advisorViewHelpers'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'

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

  it('buildAdvisorThreadGroups omits empty buckets', () => {
    const entries = buildAdvisorThreadEntries('demo', [], [])
    const groups = buildAdvisorThreadGroups(entries, {
      pinned: M.advisorview_group_pinned,
      today: M.advisorview_group_today,
      week: M.advisorview_group_week,
      older: M.advisorview_group_older,
    })
    expect(groups.length).toBeGreaterThan(0)
    expect(groups.every((g) => g.items.length > 0)).toBe(true)
  })

  it('buildAdvisorThreadEntries includes session chats in production mode', () => {
    const title = bi('Draft thread', 'Fil de brouillon')
    const entries = buildAdvisorThreadEntries(
      'production',
      [{ id: 'session-1', title, pinned: false, bucket: 'today', flowKey: 'fallback' }],
      [],
    )
    expect(entries.some((e) => e.id === 'session-1')).toBe(true)
  })
})
