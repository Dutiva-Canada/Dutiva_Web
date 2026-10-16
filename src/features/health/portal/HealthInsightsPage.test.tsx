import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import type { HealthCheckIn, HealthJournalEntry, HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { HealthInsightsPage as Insights } from './HealthInsightsPage'

vi.mock('@/features/health/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/health/data/api')>()),
  healthAiRecap: vi.fn(),
}))

const { healthAiRecap } = await import('@/features/health/data/api')

function langValue(lang: Lang): LangContextValue {
  return {
    lang,
    setLang: vi.fn(),
    catalogue: {},
    t: ((key: string) => key) as LangContextValue['t'],
    L: (en: string, fr: string) => (lang === 'fr' ? fr : en),
    x: (m: { en: string; fr: string }) => (lang === 'fr' ? m.fr : m.en),
  }
}

function ci(id: string, mood: number, daysAgo = 0, energy: number | null = null): HealthCheckIn {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return { id, mood, energy, note: '', createdAt: d.toISOString() }
}

function je(id: string): HealthJournalEntry {
  const now = new Date().toISOString()
  return { id, title: '', body: 'b', sharedAt: null, createdAt: now, updatedAt: now }
}

function stateWith(over: Partial<HealthState> = {}): HealthState {
  return {
    checkIns: [],
    entries: [],
    habits: [],
    memories: [],
    habitLogs: [],
    lastLoadedAt: new Date().toISOString(),
    ...over,
  }
}

/* Reports the live query string — ?recap=1 must be consumed after firing. */
function LocationProbe() {
  return <div data-testid="loc">{useLocation().search}</div>
}

function renderInsights(
  state: HealthState | undefined,
  url = '/health/insights',
  loading = false,
  auth?: AuthContextValue,
) {
  const health: HealthDataContextValue = {
    state,
    loading,
    error: undefined,
    refresh: vi.fn().mockResolvedValue(undefined),
  }
  render(
    <LangContext value={langValue('en')}>
      <AuthContext value={auth ?? null}>
        <HealthDataContext value={health}>
          <ToastsProvider>
            <MemoryRouter initialEntries={[url]}>
              <Insights />
              <LocationProbe />
              <ToastHost />
            </MemoryRouter>
          </ToastsProvider>
        </HealthDataContext>
      </AuthContext>
    </LangContext>,
  )
}

/* Minimal signed-in stub — the page only reads session.user.email. */
function authAs(email: string): AuthContextValue {
  return { session: { user: { email } } } as AuthContextValue
}

describe('HealthInsightsPage', () => {
  afterEach(() => vi.clearAllMocks())

  it('shows the error state with retry on a failed first load', async () => {
    renderInsights(undefined)
    expect(await screen.findByText(/Couldn’t load your data/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()
  })

  it('labels the chart with a data summary, not a repeated heading', () => {
    renderInsights(stateWith({ checkIns: [ci('c1', 4), ci('c2', 2, 1)] }))
    const chart = screen.getByRole('img', { name: /days logged/ })
    expect(chart.getAttribute('aria-label')).toMatch(/2 of 14 days logged · average mood 3/)
  })

  it('shows a single logged day once — not as both best and toughest', () => {
    renderInsights(stateWith({ checkIns: [ci('c1', 4)] }))
    expect(screen.getByText(/Best day this week/)).toBeInTheDocument()
    expect(screen.queryByText(/Toughest day this week/)).not.toBeInTheDocument()
  })

  it('fires ?recap=1 once and consumes the param', async () => {
    vi.mocked(healthAiRecap).mockResolvedValue('A steady week.')
    renderInsights(stateWith({ checkIns: [ci('c1', 4)] }), '/health/insights?recap=1')
    expect(await screen.findByText('A steady week.')).toBeInTheDocument()
    expect(healthAiRecap).toHaveBeenCalledTimes(1)
    await vi.waitFor(() =>
      expect(screen.getByTestId('loc')).not.toHaveTextContent('recap'),
    )
    /* Dismissable — the card doesn't sit forever. */
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('A steady week.')).not.toBeInTheDocument()
  })

  it('lets journal-only users reach the recap', () => {
    renderInsights(stateWith({ entries: [je('e1')] }))
    expect(
      screen.getByRole('button', { name: /Summarize my last two weeks/ }),
    ).toBeInTheDocument()
  })

  it('names the note by tier — reflection for external, suggestions for internal', async () => {
    vi.mocked(healthAiRecap).mockResolvedValue('A steady stretch.')
    renderInsights(
      stateWith({ checkIns: [ci('c1', 4)] }),
      '/health/insights?recap=1',
      false,
      authAs('staff@dutiva.ca'),
    )
    expect(await screen.findByText('A steady stretch.')).toBeInTheDocument()
    expect(screen.getByText(/Everyday suggestions, never medical advice/)).toBeInTheDocument()
    expect(screen.queryByText(/A reflection, not advice/)).not.toBeInTheDocument()
  })

  it('keeps the reflection note when there is no internal session', async () => {
    vi.mocked(healthAiRecap).mockResolvedValue('A steady stretch.')
    renderInsights(stateWith({ checkIns: [ci('c1', 4)] }), '/health/insights?recap=1')
    expect(await screen.findByText('A steady stretch.')).toBeInTheDocument()
    expect(screen.getByText(/A reflection, not advice/)).toBeInTheDocument()
  })

  it('links the check-in and journal stat cards to their surfaces', () => {
    renderInsights(stateWith({ checkIns: [ci('c1', 4)] }))
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs.filter((h) => h === '/health/check-in').length).toBeGreaterThanOrEqual(2)
    expect(hrefs).toContain('/health/journal')
  })

  it('flags a streak whose today is still pending', () => {
    renderInsights(stateWith({ checkIns: [ci('c1', 4, 1), ci('c2', 3, 2)] }))
    expect(screen.getByText(/Today pending/)).toBeInTheDocument()
    /* And logs today → the qualifier drops. */
  })

  it('leads the empty state to the check-in', () => {
    renderInsights(stateWith())
    const cta = screen.getByRole('link', { name: /Check in now/ })
    expect(cta).toHaveAttribute('href', '/health/check-in')
  })

  it('drops the pending qualifier once today is logged', () => {
    renderInsights(
      stateWith({ checkIns: [ci('c0', 4), ci('c1', 4, 1), ci('c2', 3, 2)] }),
    )
    expect(screen.queryByText(/Today pending/)).not.toBeInTheDocument()
  })

  it('shows the empty state — not a blank chart — on a journal-only account', () => {
    /* The gate used to be "any data" — a journal entry let the chart
       render fourteen invisible empty slivers. Now the gate is the
       chart's own data. */
    renderInsights(stateWith({ entries: [je('e1')] }))
    expect(screen.getByText(/Nothing to chart yet/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /days logged/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Check in now/ })).toBeInTheDocument()
  })

  it('names a thin window as the starting point instead of implying a trend', () => {
    renderInsights(stateWith({ checkIns: [ci('c1', 4)] }))
    expect(screen.getByText(/Your starting point — /)).toBeInTheDocument()
  })

  it('drops the starting-point frame once four days are logged', () => {
    renderInsights(
      stateWith({
        checkIns: [ci('c1', 4), ci('c2', 3, 1), ci('c3', 4, 2), ci('c4', 5, 3)],
      }),
    )
    expect(screen.queryByText(/Your starting point/)).not.toBeInTheDocument()
  })

  it('names the window, not "nothing yet", when check-ins all predate it', () => {
    renderInsights(stateWith({ checkIns: [ci('old', 3, 40)] }))
    expect(screen.getByText(/No check-ins in the last 14 days/)).toBeInTheDocument()
    expect(screen.queryByText(/Nothing to chart yet/)).not.toBeInTheDocument()
  })

  it('charts energy beside mood only where it was recorded', () => {
    renderInsights(stateWith({ checkIns: [ci('c1', 4, 0, 2), ci('c2', 3, 1, 5)] }))
    expect(screen.getByText('Energy over the last 14 days')).toBeInTheDocument()
    const charts = screen.getAllByRole('img')
    expect(charts).toHaveLength(2)
    expect(charts[1]!.getAttribute('aria-label')).toMatch(/average energy 3\.5/)
  })

  it('skips the energy chart entirely when nobody answered it', () => {
    renderInsights(stateWith({ checkIns: [ci('c1', 4)] }))
    expect(screen.queryByText('Energy over the last 14 days')).not.toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })
})
