import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import {
  addCheckIn,
  sendHealthReaction,
  shareEntryWithMira,
  unshareEntryFromMira,
} from '@/features/health/data/api'
import { HealthCheckInPage } from './HealthCheckInPage'
import { HealthHomePage } from './HealthHomePage'
import { HealthJournalPage } from './HealthJournalPage'

/* Both pages call the health-ai function for Mira's reaction — the api
   module is the seam; every export each page uses is stubbed here. */
vi.mock('@/features/health/data/api', () => ({
  addCheckIn: vi.fn(),
  deleteCheckIn: vi.fn(),
  sendHealthReaction: vi.fn(),
  addJournalEntry: vi.fn(),
  updateJournalEntry: vi.fn(),
  deleteJournalEntry: vi.fn(),
  healthAiPrompt: vi.fn(),
  shareEntryWithMira: vi.fn(),
  unshareEntryFromMira: vi.fn(),
}))

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

const STATE: HealthState = {
  checkIns: [],
  entries: [
    {
      id: 'j1',
      title: 'Sunday',
      body: 'A quiet, heavy day.',
      sharedAt: null,
      createdAt: '2026-10-04T14:00:00Z',
      updatedAt: '2026-10-04T14:00:00Z',
    },
  ],
  habits: [],
  habitLogs: [],
  lastLoadedAt: new Date().toISOString(),
}

function renderWith(ui: ReactElement, lang: Lang = 'en', state: HealthState = STATE) {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const health: HealthDataContextValue = { state, loading: false, error: undefined, refresh }
  render(
    <LangContext value={langValue(lang)}>
      <HealthDataContext value={health}>
        <ToastsProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ToastsProvider>
      </HealthDataContext>
    </LangContext>,
  )
  return { refresh }
}

describe('check-in → Mira reacts', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('saves the check-in and shows her reaction with the saved values', async () => {
    vi.mocked(addCheckIn).mockResolvedValue({
      id: 'c1',
      mood: 4,
      energy: null,
      note: 'good day',
      createdAt: new Date().toISOString(),
    })
    vi.mocked(sendHealthReaction).mockResolvedValue({
      reply: 'Glad the day was good.',
      assistantId: null,
    })
    renderWith(<HealthCheckInPage />)

    fireEvent.click(screen.getByRole('radio', { name: /Good/ }))
    fireEvent.change(screen.getByPlaceholderText(/A sentence or two/), {
      target: { value: 'good day' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))

    await waitFor(() =>
      expect(addCheckIn).toHaveBeenCalledWith({ mood: 4, energy: null, note: 'good day' }),
    )
    await waitFor(() =>
      expect(sendHealthReaction).toHaveBeenCalledWith(
        { type: 'checkin_saved', mood: 4, energy: null, note: 'good day' },
        'en',
        expect.any(Function),
      ),
    )
    expect(await screen.findByText(/Glad the day was good/)).toBeInTheDocument()
  })

  it('a failed reaction never disturbs the save', async () => {
    vi.mocked(addCheckIn).mockResolvedValue({
      id: 'c1',
      mood: 3,
      energy: null,
      note: '',
      createdAt: new Date().toISOString(),
    })
    vi.mocked(sendHealthReaction).mockRejectedValue(new Error('down'))
    renderWith(<HealthCheckInPage />)

    fireEvent.click(screen.getByRole('radio', { name: /Okay/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))

    await waitFor(() => expect(sendHealthReaction).toHaveBeenCalled())
    /* The save itself landed — the picker reset like a normal submit. */
    expect(screen.getByRole('radio', { name: /Okay/ })).toHaveAttribute('aria-checked', 'false')
  })
})

describe('journal → share with Mira', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shares only the pressed entry and shows her reply under it', async () => {
    vi.mocked(shareEntryWithMira).mockResolvedValue({
      reply: 'Quiet can carry a lot.',
      assistantId: null,
    })
    renderWith(<HealthJournalPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Let Mira read this' }))
    await waitFor(() =>
      expect(shareEntryWithMira).toHaveBeenCalledWith('j1', 'en', expect.any(Function)),
    )
    expect(await screen.findByText(/Quiet can carry a lot/)).toBeInTheDocument()
    /* The share persisted (shared_at) — the row now reads as shared and
       offers revocation instead of the share button. */
    expect(screen.queryByRole('button', { name: 'Let Mira read this' })).not.toBeInTheDocument()
    expect(await screen.findByText('Shared with Mira')).toBeInTheDocument()
  })

  it('revokes a shared entry — shared_at clears and the share button returns', async () => {
    vi.mocked(unshareEntryFromMira).mockResolvedValue(undefined)
    const sharedState: HealthState = {
      ...STATE,
      entries: STATE.entries.map((e) => ({ ...e, sharedAt: '2026-10-04T15:00:00Z' })),
    }
    const { refresh } = renderWith(<HealthJournalPage />, 'en', sharedState)

    expect(screen.queryByRole('button', { name: 'Let Mira read this' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }))
    await waitFor(() => expect(unshareEntryFromMira).toHaveBeenCalledWith('j1'))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('says she reads only this entry, in French too', async () => {
    renderWith(<HealthJournalPage />, 'fr')

    const btn = await screen.findByRole('button', { name: 'Laisser Mira le lire' })
    expect(btn).toHaveAttribute('title', 'Elle lit seulement cette entrée — sa réponse arrive ici et dans votre discussion.')
  })
})

describe('overview — Mira noticed strip', () => {
  const localDay = (ago: number) => {
    const d = new Date()
    d.setDate(d.getDate() - ago)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
  }

  it('shows the strip with a live streak and a chat link', async () => {
    const state: HealthState = {
      ...STATE,
      entries: [],
      habits: [{ id: 'h1', name: 'Walk', createdAt: '2026-09-01T00:00:00Z' }],
      habitLogs: [0, 1].map((ago, i) => ({
        id: `l${i}`,
        habitId: 'h1',
        day: localDay(ago),
        createdAt: new Date().toISOString(),
      })),
    }
    renderWith(<HealthHomePage />, 'en', state)

    expect(await screen.findByText(/Mira noticed/)).toBeInTheDocument()
    expect(screen.getByText(/days running/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chat with Mira' })).toHaveAttribute(
      'href',
      '/health/chat',
    )
  })

  it('stays hidden when there is nothing worth noticing', async () => {
    const empty: HealthState = {
      checkIns: [],
      entries: [],
      habits: [],
      habitLogs: [],
      lastLoadedAt: new Date().toISOString(),
    }
    renderWith(<HealthHomePage />, 'en', empty)

    await screen.findByText(/quiet summary/i)
    expect(screen.queryByText(/Mira noticed/)).not.toBeInTheDocument()
  })
})
