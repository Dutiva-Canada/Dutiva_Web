import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import type { PrKeyword, PrMention, PrState } from '@/features/pr/data/types'
import {
  activeCampaigns,
  campaignItemCount,
  mentionsInWindow,
  parseKeywordImport,
  rankDelta,
  upcomingContent,
} from '@/features/pr/data/prStats'

/* useAuth is mocked per-test to drive the signed-out / no-access / granted
   gates; the real AuthContext stays so AuthProvider still mounts. */
vi.mock('@/features/app/auth/authContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/features/app/auth/authContext')>()
  return { ...mod, useAuth: vi.fn() }
})

vi.mock('@/features/pr/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/pr/data/api')>()),
  hasPrAccess: vi.fn(),
  loadPrState: vi.fn(),
  addCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  addContentItem: vi.fn(),
  updateContentItem: vi.fn(),
  deleteContentItem: vi.fn(),
  addMediaContact: vi.fn(),
  deleteMediaContact: vi.fn(),
  addKeyword: vi.fn(),
  bulkAddKeywords: vi.fn(),
  updateKeywordPosition: vi.fn(),
  deleteKeyword: vi.fn(),
  addMention: vi.fn(),
  deleteMention: vi.fn(),
  fetchMentionMeta: vi.fn(),
  addGeoPrompt: vi.fn(),
  recordGeoCheck: vi.fn(),
  deleteGeoPrompt: vi.fn(),
  addPrFeed: vi.fn(),
  deletePrFeed: vi.fn(),
  syncPrFeeds: vi.fn(),
  runGeoChecks: vi.fn(),
  suggestMentionTone: vi.fn(),
  draftPrContent: vi.fn(),
  prReportIntro: vi.fn(),
  prMentionClusters: vi.fn(),
  prSuggestGeoPrompts: vi.fn(),
}))

vi.mock('@/lib/notifications/notifyPrefs', () => ({
  loadNotifyPref: vi.fn().mockResolvedValue(true),
  setNotifyPref: vi.fn().mockResolvedValue(undefined),
}))

const { useAuth } = await import('@/features/app/auth/authContext')
const { hasPrAccess, loadPrState } = await import('@/features/pr/data/api')

function asAuth(status: AuthContextValue['status']): AuthContextValue {
  return {
    status,
    session:
      status === 'signed-in' ? ({ user: { id: 'u1', email: 'c@example.com' } } as never) : null,
    authorized: null,
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    verifyEmailCode: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshAuthorization: vi.fn().mockResolvedValue(undefined),
  }
}

const STATE: PrState = {
  campaigns: [
    {
      id: 'camp1',
      name: 'Fall launch',
      channel: 'social',
      status: 'active',
      objective: '',
      budgetCad: null,
      startsOn: null,
      endsOn: null,
      createdAt: '2026-10-01T14:00:00Z',
      updatedAt: '2026-10-01T14:00:00Z',
    },
    {
      id: 'camp2',
      name: 'Hiring push',
      channel: 'search',
      status: 'paused',
      objective: '',
      budgetCad: 500,
      startsOn: null,
      endsOn: null,
      createdAt: '2026-10-02T14:00:00Z',
      updatedAt: '2026-10-02T14:00:00Z',
    },
  ],
  contentItems: [
    {
      id: 'ct1',
      campaignId: 'camp1',
      kind: 'post',
      title: 'Launch teaser',
      body: '',
      channel: 'LinkedIn',
      status: 'scheduled',
      scheduledFor: new Date(Date.now() + 2 * 86400000).toISOString(),
      publishedUrl: '',
      publishedAt: null,
      createdAt: '2026-10-03T14:00:00Z',
      updatedAt: '2026-10-03T14:00:00Z',
    },
  ],
  contacts: [
    {
      id: 'mc1',
      name: 'Alex Tremblay',
      outlet: 'La Presse',
      beat: 'Tech',
      email: 'alex@lapresse.ca',
      note: '',
      createdAt: '2026-10-03T14:00:00Z',
    },
  ],
  keywords: [],
  mentions: [],
  geoPrompts: [
    {
      id: 'gp1',
      prompt: 'best hr compliance tool canada',
      engine: 'chatgpt',
      result: 'cited',
      note: '',
      checkedAt: '2026-10-02T14:00:00Z',
      checkedVia: 'manual',
      createdAt: '2026-10-01T14:00:00Z',
      updatedAt: '2026-10-02T14:00:00Z',
    },
  ],
  feeds: [],
  connections: [],
  lastLoadedAt: new Date().toISOString(),
}

function renderPortal(ui: ReactElement, route = '/pr') {
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ToastsProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path="/pr" element={ui}>
                  <Route index element={<div>home</div>} />
                </Route>
                <Route path="/pr/campaigns" element={ui} />
                <Route path="/pr/content" element={ui} />
                <Route path="/pr/media" element={ui} />
                <Route path="/pr/seo" element={ui} />
                <Route path="/pr/answers" element={ui} />
                <Route path="/pr/mentions" element={ui} />
              </Routes>
            </MemoryRouter>
          </ToastsProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('PrPortalLayout', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the sign-in panel when signed out', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-out'))
    const { PrPortalLayout } = await import('./PrPortalLayout')
    renderPortal(<PrPortalLayout />)

    expect(await screen.findByText('Sign in to Dutiva PR')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getAllByText(/never posts, sends, or publishes/).length).toBeGreaterThan(0)
  })

  it('shows the access-required card for a signed-in user without a grant', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(hasPrAccess).mockResolvedValue(false)
    const { PrPortalLayout } = await import('./PrPortalLayout')
    renderPortal(<PrPortalLayout />)

    expect(await screen.findByText('Access required')).toBeInTheDocument()
    expect(loadPrState).not.toHaveBeenCalled()
  })

  it('renders the shell + provider for a user with a grant', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(hasPrAccess).mockResolvedValue(true)
    vi.mocked(loadPrState).mockResolvedValue(STATE)
    const { PrPortalLayout } = await import('./PrPortalLayout')
    renderPortal(<PrPortalLayout />)

    // The nav tabs render as soon as the grant resolves (assert via DOM —
    // jsdom can't evaluate the desktop nav's min-width media query).
    await screen.findByText('home')
    expect(screen.getAllByText('Campaigns').length).toBeGreaterThan(0)
    expect(loadPrState).toHaveBeenCalled()
  })
})

describe('PrCampaignsPage', () => {
  it('renders campaigns with status pills and item counts', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(hasPrAccess).mockResolvedValue(true)
    vi.mocked(loadPrState).mockResolvedValue(STATE)
    const { PrDataProvider } = await import('@/features/pr/data/PrDataProvider')
    const { PrCampaignsPage } = await import('./PrCampaignsPage')
    renderPortal(
      <PrDataProvider>
        <PrCampaignsPage />
      </PrDataProvider>,
      '/pr/campaigns',
    )

    expect(await screen.findByText('Fall launch')).toBeInTheDocument()
    expect(screen.getByText('Hiring push')).toBeInTheDocument()
    expect(screen.getByText('1 items')).toBeInTheDocument()
    expect(screen.getByText('0 items')).toBeInTheDocument()
  })
})

describe('prStats', () => {
  const men = (offsetDays: number): PrMention => ({
    id: `m${offsetDays}`,
    source: 'CBC',
    title: `Piece ${offsetDays}`,
    url: '',
    sentiment: 'neutral',
    sentimentAuto: false,
    publishedAt: new Date(Date.now() - offsetDays * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  })
  const kw = (position: number | null, previous: number | null): PrKeyword => ({
    id: 'k1',
    keyword: 'hr compliance',
    targetUrl: '',
    position,
    previousPosition: previous,
    checkedAt: null,
    createdAt: new Date().toISOString(),
  })

  it('counts only active campaigns', () => {
    expect(activeCampaigns(STATE.campaigns).map((c) => c.name)).toEqual(['Fall launch'])
  })

  it('lists only future scheduled content, soonest first', () => {
    const items = upcomingContent(STATE.contentItems)
    expect(items.map((i) => i.id)).toEqual(['ct1'])
    const past = {
      ...STATE.contentItems[0]!,
      id: 'ct-past',
      scheduledFor: new Date(Date.now() - 86400000).toISOString(),
    }
    const draft = { ...STATE.contentItems[0]!, id: 'ct-draft', status: 'draft' as const }
    expect(upcomingContent([past, draft]).map((i) => i.id)).toEqual([])
  })

  it('bounds the mentions window', () => {
    const recent = mentionsInWindow([men(3), men(40)], 30)
    expect(recent.map((m) => m.title)).toEqual(['Piece 3'])
  })

  it('reads rank direction — lower position is a move up', () => {
    expect(rankDelta(kw(8, 15))).toEqual({ dir: 'up', spots: 7 })
    expect(rankDelta(kw(15, 8))).toEqual({ dir: 'down', spots: 7 })
    expect(rankDelta(kw(10, 10))).toEqual({ dir: 'flat', spots: 0 })
    expect(rankDelta(kw(null, 10)).dir).toBeNull()
    expect(rankDelta(kw(10, null)).dir).toBeNull()
  })

  it('counts content items linked to a campaign', () => {
    expect(campaignItemCount(STATE.contentItems, 'camp1')).toBe(1)
    expect(campaignItemCount(STATE.contentItems, 'camp2')).toBe(0)
  })

  it('parses a pasted keyword export — commas, tabs, quotes, headers', () => {
    const rows = parseKeywordImport(
      [
        'keyword,position,url',
        'hr compliance software, 4, https://dutiva.ca/',
        '"onboarding checklist",12,',
        'payroll rules\t27\tdutiva.ca/pricing',
        '',
        '   ',
        'termination notice',
      ].join('\n'),
    )
    expect(rows).toEqual([
      { keyword: 'hr compliance software', position: 4, targetUrl: 'https://dutiva.ca/' },
      { keyword: 'onboarding checklist', position: 12, targetUrl: undefined },
      { keyword: 'payroll rules', position: 27, targetUrl: 'dutiva.ca/pricing' },
      { keyword: 'termination notice', position: undefined, targetUrl: undefined },
    ])
  })

  it('skips Search Console extras and keeps the first plausible rank', () => {
    /* query, clicks, impressions, ctr, position — the rank is column 5. */
    const rows = parseKeywordImport('hr templates,1240,8300,14.9%,7')
    expect(rows).toEqual([
      { keyword: 'hr templates', position: 7, targetUrl: undefined },
    ])
  })

  it('ignores out-of-range numbers and URL-shaped first cells', () => {
    const rows = parseKeywordImport('wrongful dismissal, 450\nhttps://example.com/page')
    expect(rows).toEqual([
      { keyword: 'wrongful dismissal', position: undefined, targetUrl: undefined },
    ])
  })
})
