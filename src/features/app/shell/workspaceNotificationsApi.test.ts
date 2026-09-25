import { describe, expect, it, vi } from 'vitest'
import { relativeTimeLabel } from './workspaceNotificationsApi'

const limit = vi.fn()
const order = vi.fn(() => ({ limit }))
const select = vi.fn(() => ({ order }))

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({ select })),
  },
}))

describe('listWorkspaceNotifications', () => {
  it('maps a finance_call row', async () => {
    limit.mockResolvedValueOnce({
      data: [
        {
          id: 'n-1',
          kind: 'finance_call',
          title_en: 'Capital call notified',
          title_fr: 'Appel de fonds notifié',
          body_en: 'Laurentian Growth Partners — CAD 600000.00 · due 2025-10-10',
          body_fr: 'Laurentian Growth Partners — CAD 600000.00 · échéance le 2025-10-10',
          href: '/app/finance/deals',
          document_id: null,
          read_at: null,
          created_at: '2025-09-01T12:00:00.000Z',
        },
      ],
      error: null,
    })
    const { listWorkspaceNotifications } = await import('./workspaceNotificationsApi')
    const rows = await listWorkspaceNotifications()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.kind).toBe('finance_call')
    expect(rows[0]?.title.fr).toBe('Appel de fonds notifié')
    expect(rows[0]?.body?.en).toContain('due 2025-10-10')
    expect(rows[0]?.href).toBe('/app/finance/deals')
    expect(rows[0]?.unread).toBe(true)
  })
})

describe('relativeTimeLabel', () => {
  const now = Date.parse('2026-08-23T15:00:00.000Z')

  it('formats just-now and minute buckets', () => {
    expect(relativeTimeLabel('2026-08-23T14:59:45.000Z', now).en).toBe('Just now')
    expect(relativeTimeLabel('2026-08-23T14:50:00.000Z', now).en).toBe('10m ago')
    expect(relativeTimeLabel('2026-08-23T14:50:00.000Z', now).fr).toBe('Il y a 10 min')
  })

  it('formats hour and day buckets', () => {
    expect(relativeTimeLabel('2026-08-23T12:00:00.000Z', now).en).toBe('3h ago')
    expect(relativeTimeLabel('2026-08-22T15:00:00.000Z', now).en).toBe('Yesterday')
    expect(relativeTimeLabel('2026-08-20T15:00:00.000Z', now).fr).toBe('Il y a 3 jours')
  })
})
