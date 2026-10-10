import { describe, expect, it } from 'vitest'
import { bi } from '@/i18n/core'
import {
  buildAdvisorThreadEntries,
  buildAdvisorThreadGroups,
  bucketFromUpdatedAt,
  conversationTitle,
  isBackendConversationId,
  isFluffThread,
  operationalNextStepChips,
  productionTranscript,
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

  it('productionTranscript carries the server `at` stamp when present', () => {
    const turns = productionTranscript({
      id: 'conv-1',
      updatedAt: '2026-10-10T12:00:00Z',
      lastAdvisorResponse: null,
      messages: [
        { role: 'user' as const, content: 'hi', at: '2026-10-09T20:00:00Z' },
        { role: 'assistant' as const, content: 'hello', at: '2026-10-09T20:00:03Z' },
        { role: 'user' as const, content: 'older — no stamp' },
      ],
    })
    expect(turns[0]?.at).toBe('2026-10-09T20:00:00Z')
    expect(turns[1]?.at).toBe('2026-10-09T20:00:03Z')
    expect(turns[2]?.at).toBeUndefined()
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
    expect(resolveStartFlowKey({ prompt: 'hello', flowKey: 'termination' }, 'signed-out')).toBe(
      'termination',
    )
  })

  it('buildAdvisorThreadGroups omits empty buckets and tags keys', () => {
    const entries = buildAdvisorThreadEntries('demo', [], [])
    const groups = buildAdvisorThreadGroups(entries, {
      pinned: M.advisorview_group_pinned,
      today: M.advisorview_group_today,
      week: M.advisorview_group_week,
      older: M.advisorview_group_older,
    })
    expect(groups.length).toBeGreaterThan(0)
    expect(groups.every((g) => g.items.length > 0)).toBe(true)
    expect(groups.every((g) => ['pinned', 'today', 'week', 'older'].includes(g.key))).toBe(true)
  })

  it('conversationTitle replaces greetings with a stable label', () => {
    expect(conversationTitle([{ role: 'user', content: 'Hello' }]).en).toBe('Advisor conversation')
    expect(isFluffThread([{ role: 'user', content: 'hey' }])).toBe(true)
    expect(
      isFluffThread([
        { role: 'user', content: 'hey' },
        { role: 'user', content: 'Can you add employees?' },
      ]),
    ).toBe(false)
    expect(
      operationalNextStepChips(
        'Can you add employees for me?',
        "I'm a guidance tool, not an operational HR system — I can't add employees.",
      ).map((c) => c.to),
    ).toEqual(['/app/employees?new=1', '/app/documents/studio'])
  })

  it('hides fluff production threads unless active', () => {
    const fluff = {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      updatedAt: new Date().toISOString(),
      messages: [{ role: 'user' as const, content: 'Hello' }],
      lastAdvisorResponse: null,
    }
    const hidden = buildAdvisorThreadEntries('production', [], [fluff], null)
    expect(hidden.some((e) => e.id === fluff.id)).toBe(false)
    const kept = buildAdvisorThreadEntries('production', [], [fluff], fluff.id)
    expect(kept.some((e) => e.id === fluff.id)).toBe(true)
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
