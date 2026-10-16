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
  journalImagesAvailable: vi.fn().mockResolvedValue(false),
  uploadJournalImage: vi.fn(),
  signJournalImage: vi.fn(),
  removeJournalImage: vi.fn(),
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

function renderJournal(state: HealthState | undefined, url = '/wellness/journal') {
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
  afterEach(() => {
    vi.clearAllMocks()
    /* Drafts persist in sessionStorage by design — reset it so one test's
       abandoned words can't seed the next test's composer. */
    sessionStorage.clear()
    vi.useRealTimers()
  })

  it('opens the composer for ?new=1 and consumes the param', async () => {
    renderJournal(stateWith(), '/wellness/journal?new=1')
    expect(await screen.findByPlaceholderText(/Give it a name/)).toBeInTheDocument()
  })

  it('saves a trimmed entry and toasts', async () => {
    vi.mocked(api.addJournalEntry).mockResolvedValue(entry('e1'))
    renderJournal(stateWith(), '/wellness/journal?new=1')
    fireEvent.change(await screen.findByLabelText(/^Entry$/), {
      target: { value: '  A hard day.  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    await screen.findByText(/Entry saved/)
    expect(api.addJournalEntry).toHaveBeenCalledWith({ title: '', body: 'A hard day.' })
  })

  it('guards a written draft behind a second cancel press', async () => {
    renderJournal(stateWith(), '/wellness/journal?new=1')
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

  it('hides on click, offers undo, and commits only when the toast lapses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(api.deleteJournalEntry).mockResolvedValue()
    renderJournal(stateWith({ entries: [entry('e1', { title: 'Hi' }), entry('e2', { title: 'There' })] }))

    const del = await screen.findByRole('button', { name: /Delete “Hi”/ })
    fireEvent.click(del)
    /* Hidden at once — including any copy in the paged `earlier` list —
       while the delete sits behind the undo toast. */
    await vi.waitFor(() => expect(screen.queryByText('Hi')).not.toBeInTheDocument())
    expect(api.deleteJournalEntry).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    expect(screen.getByText('There')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(6400)
    await vi.waitFor(() => expect(api.deleteJournalEntry).toHaveBeenCalledWith('e1'))
  })

  it('undo restores the row untouched — the delete never fires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderJournal(stateWith({ entries: [entry('e1', { title: 'Hi' })] }))
    fireEvent.click(await screen.findByRole('button', { name: /Delete “Hi”/ }))
    expect(screen.queryByText('Hi')).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    expect(screen.getByText('Hi')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(6400)
    expect(api.deleteJournalEntry).not.toHaveBeenCalled()
  })

  it('a failed commit brings the row back and says so', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(api.deleteJournalEntry).mockRejectedValue(new Error('rls'))
    renderJournal(stateWith({ entries: [entry('e1', { title: 'Hi' })] }))
    fireEvent.click(await screen.findByRole('button', { name: /Delete “Hi”/ }))
    expect(screen.queryByText('Hi')).not.toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(6400)
    expect(await screen.findByText(/Couldn’t delete/)).toBeInTheDocument()
    expect(screen.getByText('Hi')).toBeInTheDocument()
  })

  it('keeps a compose draft across close-and-reopen, clears it on save', async () => {
    vi.mocked(api.addJournalEntry).mockResolvedValue(entry('e1'))
    const view = renderJournal(stateWith(), '/wellness/journal?new=1')
    fireEvent.change(await screen.findByLabelText(/^Entry$/), {
      target: { value: 'kept words' },
    })
    view.unmount()
    renderJournal(stateWith(), '/wellness/journal?new=1')
    /* Reopened composer restores the abandoned draft. */
    expect(await screen.findByLabelText(/^Entry$/)).toHaveValue('kept words')
    fireEvent.change(screen.getByLabelText(/^Entry$/), { target: { value: 'final words' } })
    fireEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    await screen.findByText(/Entry saved/)
    view.unmount()
    renderJournal(stateWith(), '/wellness/journal?new=1')
    /* A saved entry leaves no draft residue. */
    expect(await screen.findByLabelText(/^Entry$/)).toHaveValue('')
  })

  it('a confirmed discard clears the stored draft', async () => {
    const view = renderJournal(stateWith(), '/wellness/journal?new=1')
    fireEvent.change(await screen.findByLabelText(/^Entry$/), { target: { value: 'let it go' } })
    const cancel = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancel)
    fireEvent.click(cancel)
    view.unmount()
    renderJournal(stateWith(), '/wellness/journal?new=1')
    expect(await screen.findByLabelText(/^Entry$/)).toHaveValue('')
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

  it('keeps an archived row truthful after an edit — the paged copy syncs', async () => {
    vi.mocked(api.listJournalEntriesBefore).mockResolvedValue([
      entry('old1', {
        title: 'Old title',
        body: 'Old body',
        createdAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2020-01-01T00:00:00.000Z',
      }),
    ])
    vi.mocked(api.updateJournalEntry).mockResolvedValue()
    renderJournal(stateWith({ entries: [entry('fresh')], entriesTotal: 2 }))
    fireEvent.click(await screen.findByRole('button', { name: /Load earlier entries/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Edit “Old title”/ }))
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'New title' } })
    fireEvent.change(screen.getByLabelText(/^Entry$/), { target: { value: 'New body' } })
    fireEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    await screen.findByText(/Entry saved/)
    /* Without the patch-back the row would still read "Old title". */
    expect(screen.getByText('New title')).toBeInTheDocument()
    expect(screen.getByText('New body')).toBeInTheDocument()
  })

  it('keeps the consent state on an archived row after the reply note is dismissed', async () => {
    vi.mocked(api.listJournalEntriesBefore).mockResolvedValue([
      entry('old1', { title: 'Old', createdAt: '2020-01-01T00:00:00.000Z' }),
    ])
    vi.mocked(api.shareEntryWithMira).mockResolvedValue({ reply: 'I hear you.' } as never)
    renderJournal(stateWith({ entries: [entry('fresh')], entriesTotal: 2 }))
    fireEvent.click(await screen.findByRole('button', { name: /Load earlier entries/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Let Mira read “Old”/ }))
    await screen.findByText(/I hear you\./)
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }))
    /* The share was stamped server-side — the row must not fall back to
       offering a consent that was already given. */
    expect(await screen.findByRole('button', { name: /Stop sharing “Old”/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Let Mira read “Old”/ }),
    ).not.toBeInTheDocument()
  })

  it('announces expanded state on the read-more toggle', async () => {
    renderJournal(stateWith({ entries: [entry('e1', { body: 'x'.repeat(300) })] }))
    const btn = await screen.findByRole('button', { name: /Read more/ })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('search ignores accents', async () => {
    renderJournal(
      stateWith({
        entries: [
          entry('e1', { title: 'Walk', body: 'marché longtemps' }),
          entry('e2', { title: 'Work', body: 'busy day' }),
        ],
      }),
    )
    fireEvent.change(await screen.findByLabelText(/Search entries/), {
      target: { value: 'marche' },
    })
    expect(screen.getByText('Walk')).toBeInTheDocument()
    expect(screen.queryByText('Work')).not.toBeInTheDocument()
  })

  it('says a flat no-match when the whole archive is already loaded', async () => {
    renderJournal(stateWith({ entries: [entry('e1', { title: 'Walk' })] }))
    fireEvent.change(await screen.findByLabelText(/Search entries/), {
      target: { value: 'zzz' },
    })
    expect(await screen.findByText(/No entries match that/)).toBeInTheDocument()
    expect(screen.queryByText(/load earlier entries/i)).not.toBeInTheDocument()
  })

  it('copies the whole journal oldest-first, paging the archive back', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: write },
      configurable: true,
    })
    vi.mocked(api.listJournalEntriesBefore).mockResolvedValue([
      entry('old1', {
        title: 'Old',
        body: 'old words',
        createdAt: '2020-01-01T00:00:00.000Z',
      }),
    ])
    renderJournal(
      stateWith({
        entries: [entry('e1', { title: 'New', body: 'new words' })],
        entriesTotal: 2,
      }),
    )
    fireEvent.click(await screen.findByRole('button', { name: /Copy all/ }))
    expect(await screen.findByText(/Entries copied/)).toBeInTheDocument()
    const text = String(write.mock.calls[0]?.[0] ?? '')
    expect(text).toContain('old words')
    expect(text).toContain('new words')
    expect(text.indexOf('old words')).toBeLessThan(text.indexOf('new words'))
  })

  it('hides the photo control until the storage bucket exists', async () => {
    vi.mocked(api.journalImagesAvailable).mockResolvedValue(false)
    renderJournal(stateWith(), '/wellness/journal?new=1')
    await screen.findByLabelText(/^Entry$/)
    await vi.waitFor(() => expect(api.journalImagesAvailable).toHaveBeenCalled())
    expect(
      screen.queryByRole('button', { name: /Add a photo/ }),
    ).not.toBeInTheDocument()
  })

  it('attaches a photo on save — insert, upload, then link', async () => {
    vi.mocked(api.journalImagesAvailable).mockResolvedValue(true)
    vi.mocked(api.addJournalEntry).mockResolvedValue(entry('e1'))
    vi.mocked(api.uploadJournalImage).mockResolvedValue('u1/e1/f.jpg')
    vi.mocked(api.updateJournalEntry).mockResolvedValue()
    const create = vi.fn().mockReturnValue('blob:preview')
    const revoke = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: create, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revoke, configurable: true })

    renderJournal(stateWith(), '/wellness/journal?new=1')
    fireEvent.change(await screen.findByLabelText(/^Entry$/), { target: { value: 'photo day' } })
    fireEvent.change(await screen.findByLabelText(/Add a photo/), {
      target: { files: [new File(['x'], 'walk.jpg', { type: 'image/jpeg' })] },
    })
    expect(screen.getByAltText(/Photo attached/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    await screen.findByText(/Entry saved/)
    expect(api.uploadJournalImage).toHaveBeenCalledWith('e1', expect.any(File))
    expect(api.updateJournalEntry).toHaveBeenCalledWith('e1', { imagePath: 'u1/e1/f.jpg' })
  })

  it('reports a photo upload that fails while the entry itself saves', async () => {
    vi.mocked(api.journalImagesAvailable).mockResolvedValue(true)
    vi.mocked(api.addJournalEntry).mockResolvedValue(entry('e1'))
    vi.mocked(api.uploadJournalImage).mockRejectedValue(new Error('bucket missing'))
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn().mockReturnValue('blob:preview'),
      configurable: true,
    })
    renderJournal(stateWith(), '/wellness/journal?new=1')
    fireEvent.change(await screen.findByLabelText(/^Entry$/), { target: { value: 'x' } })
    fireEvent.change(await screen.findByLabelText(/Add a photo/), {
      target: { files: [new File(['x'], 'p.jpg', { type: 'image/jpeg' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    /* The honest toast — not a silent drop, not a false "saved" alone. */
    expect(
      await screen.findByText(/the photo didn’t upload/i),
    ).toBeInTheDocument()
  })

  it('renders a stored photo as a signed thumbnail', async () => {
    vi.mocked(api.signJournalImage).mockResolvedValue('https://cdn.example/signed.jpg')
    renderJournal(
      stateWith({
        entries: [entry('e1', { title: 'Lake', imagePath: 'u1/e1/lake.jpg' })],
      }),
    )
    const img = await screen.findByAltText(/Photo attached to “Lake”/)
    expect(img).toHaveAttribute('src', 'https://cdn.example/signed.jpg')
  })

  it('marks photo entries in the copy-all transcript', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: write },
      configurable: true,
    })
    renderJournal(
      stateWith({
        entries: [entry('e1', { title: 'New', body: 'new words', imagePath: 'u1/e1/x.jpg' })],
      }),
    )
    fireEvent.click(await screen.findByRole('button', { name: /Copy all/ }))
    expect(await screen.findByText(/Entries copied/)).toBeInTheDocument()
    expect(String(write.mock.calls[0]?.[0] ?? '')).toContain('(photo attached)')
  })

  it('delete cleans up the stored photo before removing the row', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(api.removeJournalImage).mockResolvedValue()
    vi.mocked(api.deleteJournalEntry).mockResolvedValue()
    renderJournal(
      stateWith({ entries: [entry('e1', { title: 'Hi', imagePath: 'u1/e1/x.jpg' })] }),
    )
    fireEvent.click(await screen.findByRole('button', { name: /Delete “Hi”/ }))
    await vi.advanceTimersByTimeAsync(6400)
    await vi.waitFor(() => {
      expect(api.removeJournalImage).toHaveBeenCalledWith('u1/e1/x.jpg')
      expect(api.deleteJournalEntry).toHaveBeenCalledWith('e1')
    })
  })
})
