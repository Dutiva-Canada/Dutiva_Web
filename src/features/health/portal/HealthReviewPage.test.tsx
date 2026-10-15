import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthJournalEntry, HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { HealthReviewPage } from './HealthReviewPage'

vi.mock('@/features/health/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/health/data/api')>()),
  listSharedJournalEntries: vi.fn(),
  unshareEntryFromMira: vi.fn(),
}))

vi.mock('@/lib/agentQueue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/agentQueue')>()),
  loadPendingSuggestions: vi.fn(),
  loadResolvedSuggestions: vi.fn(),
}))

const api = await import('@/features/health/data/api')
const queue = await import('@/lib/agentQueue')

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

function entry(id: string, over: Partial<HealthJournalEntry> = {}): HealthJournalEntry {
  const now = new Date().toISOString()
  return {
    id,
    title: '',
    body: 'Some words',
    sharedAt: null,
    createdAt: now,
    updatedAt: now,
    ...over,
  }
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

function renderReview(state: HealthState | undefined) {
  const health: HealthDataContextValue = {
    state,
    loading: false,
    error: undefined,
    refresh: vi.fn().mockResolvedValue(undefined),
  }
  return render(
    <LangContext value={langValue('en')}>
      <HealthDataContext value={health}>
        <ToastsProvider>
          <MemoryRouter initialEntries={['/health/review']}>
            <HealthReviewPage />
            <ToastHost />
          </MemoryRouter>
        </ToastsProvider>
      </HealthDataContext>
    </LangContext>,
  )
}

describe('HealthReviewPage', () => {
  beforeEach(() => {
    vi.mocked(queue.loadPendingSuggestions).mockResolvedValue([])
    vi.mocked(queue.loadResolvedSuggestions).mockResolvedValue([])
    vi.mocked(api.listSharedJournalEntries).mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /* The consent ledger must not read the capped journal window — an entry
     shared before the newest-100 cutoff still shows here while Mira can
     still read it. */
  it('lists a shared entry that is outside the loaded journal window', async () => {
    vi.mocked(api.listSharedJournalEntries).mockResolvedValue([
      entry('j-old', { title: 'Shared long ago', sharedAt: new Date().toISOString() }),
    ])
    renderReview(stateWith({ entries: [entry('j1', { title: 'Recent, unshared' })] }))
    expect(await screen.findByText('Shared long ago')).toBeInTheDocument()
  })

  it('shows an honest failure with a retry when the shared query fails', async () => {
    vi.mocked(api.listSharedJournalEntries)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([entry('j2', { title: 'Back now', sharedAt: 'x' })])
    renderReview(stateWith())
    expect(await screen.findByText(/load what Mira can read/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Back now')).toBeInTheDocument()
  })

  it('revokes a share and refetches the ledger', async () => {
    vi.mocked(api.listSharedJournalEntries)
      .mockResolvedValueOnce([entry('j2', { title: 'Held words', sharedAt: 'x' })])
      .mockResolvedValueOnce([])
    renderReview(stateWith())
    fireEvent.click(
      await screen.findByRole('button', { name: /Stop sharing “Held words” with Mira/ }),
    )
    await waitFor(() => expect(api.unshareEntryFromMira).toHaveBeenCalledWith('j2'))
    expect(await screen.findByText('Nothing shared right now.')).toBeInTheDocument()
    expect(await screen.findByText('Stopped sharing.')).toBeInTheDocument()
  })
})
