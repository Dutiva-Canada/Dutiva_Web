import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthJournalEntry, HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { HealthJournalPage as Journal } from './HealthJournalPage'

vi.mock('@/features/health/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/health/data/api')>()),
  addJournalEntry: vi.fn(),
  updateJournalEntry: vi.fn(),
  deleteJournalEntry: vi.fn(),
  listJournalEntriesBefore: vi.fn(),
  shareEntryWithMira: vi.fn(),
  unshareEntryFromMira: vi.fn(),
  healthAiPrompt: vi.fn(),
}))

const api = await import('@/features/health/data/api')

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

function renderJournal(state: HealthState | undefined, url = '/health/journal') {
  const health: HealthDataContextValue = {
    state,
    loading: false,
    error: undefined,
    refresh: vi.fn().mockResolvedValue(undefined),
  }
  render(
    <LangContext value={langValue('en')}>
      <HealthDataContext value={health}>
        <ToastsProvider>
          <MemoryRouter initialEntries={[url]}>
            <Journal />
            <ToastHost />
          </MemoryRouter>
        </ToastsProvider>
      </HealthDataContext>
    </LangContext>,
  )
}

describe('HealthJournalPage', () => {
  afterEach(() => vi.clearAllMocks())

  it('opens the composer for ?new=1 and consumes the param', async () => {
    renderJournal(stateWith(), '/health/journal?new=1')
    expect(await screen.findByPlaceholderText(/Give it a name/)).toBeInTheDocument()
  })

  it('saves a trimmed entry and toasts', async () => {
    vi.mocked(api.addJournalEntry).mockResolvedValue(entry('e1'))
    renderJournal(stateWith(), '/health/journal?new=1')
    fireEvent.change(await screen.findByLabelText(/^Entry$/), {
      target: { value: '  A hard day.  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    await screen.findByText(/Entry saved/)
    expect(api.addJournalEntry).toHaveBeenCalledWith({ title: '', body: 'A hard day.' })
  })

  it('guards a written draft behind a second cancel press', async () => {
    renderJournal(stateWith(), '/health/journal?new=1')
    fireEvent.change(await screen.findByLabelText(/^Entry$/), { target: { value: 'draft words' } })
    const cancel = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancel)
    expect(cancel).toHaveTextContent(/Discard what you wrote/)
    expect(screen.getByLabelText(/^Entry$/)).toBeInTheDocument()
    fireEvent.click(cancel)
    expect(screen.queryByLabelText(/^Entry$/)).not.toBeInTheDocument()
  })

  it('does not write when an edit changes nothing', async () => {
    renderJournal(stateWith({ entries: [entry('e1', { title: 'Hi', body: 'Body' })] }))
    fireEvent.click(await screen.findByRole('button', { name: /Edit “Hi”/ }))
    fireEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    await vi.waitFor(() =>
      expect(screen.queryByRole('button', { name: /Save entry/i })).not.toBeInTheDocument(),
    )
    expect(api.updateJournalEntry).not.toHaveBeenCalled()
  })

  it('shares an entry with Mira and revokes it', async () => {
    vi.mocked(api.shareEntryWithMira).mockResolvedValue({ reply: 'I hear you.' } as never)
    vi.mocked(api.unshareEntryFromMira).mockResolvedValue()
    renderJournal(stateWith({ entries: [entry('e1', { title: 'Hi', body: 'Body' })] }))

    fireEvent.click(await screen.findByRole('button', { name: /Let Mira read “Hi”/ }))
    expect(api.shareEntryWithMira).toHaveBeenCalledWith('e1', 'en', expect.any(Function))
    expect(await screen.findByText(/I hear you\./)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /Stop sharing “Hi” with Mira/ }))
    expect(api.unshareEntryFromMira).toHaveBeenCalledWith('e1')
  })

  it('confirms deletes and purges the row locally', async () => {
    vi.mocked(api.deleteJournalEntry).mockResolvedValue()
    renderJournal(stateWith({ entries: [entry('e1', { title: 'Hi' }), entry('e2', { title: 'There' })] }))

    const del = await screen.findByRole('button', { name: /Delete “Hi”/ })
    fireEvent.click(del)
    expect(del).toHaveTextContent(/Click again to confirm/)
    fireEvent.click(del)
    await vi.waitFor(() => expect(screen.queryByText('Hi')).not.toBeInTheDocument())
    expect(api.deleteJournalEntry).toHaveBeenCalledWith('e1')
    expect(screen.getByText('There')).toBeInTheDocument()
  })

  it('reports a failed delete and keeps the row', async () => {
    vi.mocked(api.deleteJournalEntry).mockRejectedValue(new Error('rls'))
    renderJournal(stateWith({ entries: [entry('e1', { title: 'Hi' })] }))
    const del = await screen.findByRole('button', { name: /Delete “Hi”/ })
    fireEvent.click(del)
    fireEvent.click(del)
    expect(await screen.findByText(/Couldn’t delete/)).toBeInTheDocument()
    expect(screen.getByText('Hi')).toBeInTheDocument()
  })

  it('filters rows by search text and by the shared-with-Mira filter', async () => {
    renderJournal(
      stateWith({
        entries: [
          entry('e1', { title: 'Sleep', body: 'rough night' }),
          entry('e2', { title: 'Work', body: 'busy', sharedAt: new Date().toISOString() }),
        ],
      }),
    )
    fireEvent.change(await screen.findByLabelText(/Search entries/), { target: { value: 'sleep' } })
    expect(screen.getByText('Sleep')).toBeInTheDocument()
    expect(screen.queryByText('Work')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Search entries/), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Shared with Mira/ }))
    expect(screen.queryByText('Sleep')).not.toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('offers the compose CTA inside the empty state', async () => {
    renderJournal(stateWith())
    fireEvent.click(await screen.findByRole('button', { name: /Write your first entry/ }))
    expect(screen.getByLabelText(/^Entry$/)).toBeInTheDocument()
  })

  it('reports a failed load-more', async () => {
    vi.mocked(api.listJournalEntriesBefore).mockRejectedValue(new Error('offline'))
    renderJournal(stateWith({ entries: [entry('e1')], entriesTotal: 5 }))
    fireEvent.click(await screen.findByRole('button', { name: /Load earlier entries/ }))
    expect(await screen.findByText(/Couldn’t load earlier entries/)).toBeInTheDocument()
  })
})
