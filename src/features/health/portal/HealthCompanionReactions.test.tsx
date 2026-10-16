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
import { ToastHost } from '@/features/app/toasts/ToastHost'
import {
  addCheckIn,
  addHabit,
  addHealthMemory,
  deleteHealthMemory,
  sendHealthReaction,
  shareEntryWithMira,
  unshareEntryFromMira,
  updateCheckIn,
} from '@/features/health/data/api'
import { HealthCheckInPage } from './HealthCheckInPage'
import { HealthHabitsPage } from './HealthHabitsPage'
import { HealthHomePage } from './HealthHomePage'
import { HealthJournalPage } from './HealthJournalPage'
import { HealthReviewPage } from './HealthReviewPage'

/* Both pages call the health-ai function for Mira's reaction — the api
   module is the seam; every export each page uses is stubbed here. */
vi.mock('@/features/health/data/api', () => ({
  addCheckIn: vi.fn(),
  deleteCheckIn: vi.fn(),
  updateCheckIn: vi.fn(),
  sendHealthReaction: vi.fn(),
  addJournalEntry: vi.fn(),
  updateJournalEntry: vi.fn(),
  deleteJournalEntry: vi.fn(),
  healthAiPrompt: vi.fn(),
  shareEntryWithMira: vi.fn(),
  unshareEntryFromMira: vi.fn(),
  listSharedJournalEntries: vi.fn().mockResolvedValue([]),
  habitTargetsAvailable: vi.fn().mockResolvedValue(false),
  journalImagesAvailable: vi.fn().mockResolvedValue(false),
  signJournalImage: vi.fn(),
  removeJournalImage: vi.fn(),
  uploadJournalImage: vi.fn(),
  addHabit: vi.fn(),
  deleteHabit: vi.fn(),
  setHabitDone: vi.fn(),
  healthAiHabit: vi.fn(),
  addHealthMemory: vi.fn(),
  deleteHealthMemory: vi.fn(),
  updateHealthMemory: vi.fn(),
}))

/* Suggestion queue + notify pref hit Supabase directly — stub the lib
   seams so the Habits mount stays hermetic. */
vi.mock('@/lib/agentQueue', () => ({
  loadPendingSuggestions: vi.fn(async () => []),
  resolveSuggestion: vi.fn(async () => undefined),
}))
vi.mock('@/lib/notifications/notifyPrefs', () => ({
  loadNotifyPref: vi.fn(async () => false),
  setNotifyPref: vi.fn(async () => undefined),
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
  memories: [],
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
          <MemoryRouter>
            {ui}
            <ToastHost />
          </MemoryRouter>
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

    /* Share buttons carry the entry's title in their accessible name —
       "Let Mira read "Sunday"" — so the match is a prefix. */
    fireEvent.click(screen.getByRole('button', { name: /Let Mira read/ }))
    await waitFor(() =>
      expect(shareEntryWithMira).toHaveBeenCalledWith('j1', 'en', expect.any(Function)),
    )
    expect(await screen.findByText(/Quiet can carry a lot/)).toBeInTheDocument()
    /* The share persisted (shared_at) — the row now reads as shared and
       offers revocation instead of the share button. The revoke button is
       the signal ("Shared with Mira" text also matches the list filter). */
    expect(screen.queryByRole('button', { name: /Let Mira read/ })).not.toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /Stop sharing/ }),
    ).toBeInTheDocument()
  })

  it('revokes a shared entry — shared_at clears and the share button returns', async () => {
    vi.mocked(unshareEntryFromMira).mockResolvedValue(undefined)
    const sharedState: HealthState = {
      ...STATE,
      entries: STATE.entries.map((e) => ({ ...e, sharedAt: '2026-10-04T15:00:00Z' })),
    }
    const { refresh } = renderWith(<HealthJournalPage />, 'en', sharedState)

    expect(screen.queryByRole('button', { name: /Let Mira read/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Stop sharing/ }))
    await waitFor(() => expect(unshareEntryFromMira).toHaveBeenCalledWith('j1'))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('says she reads only this entry, in French too', async () => {
    renderWith(<HealthJournalPage />, 'fr')

    const btn = await screen.findByRole('button', { name: /Laisser Mira lire/ })
    expect(btn).toHaveAttribute('title', 'Elle lit seulement cette entrée — sa réponse arrive ici et dans votre discussion.')
  })
})

describe('habits → Mira reacts to a new habit', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('adding a habit sends habit_added and shows her line', async () => {
    vi.mocked(addHabit).mockResolvedValue({
      id: 'h9',
      name: 'Stretch',
      createdAt: new Date().toISOString(),
    })
    vi.mocked(sendHealthReaction).mockImplementation(async (_e, _l, onDelta) => {
      onDelta?.('Something small to keep.')
      return { reply: 'Something small to keep.', assistantId: null }
    })
    renderWith(<HealthHabitsPage />)

    fireEvent.change(screen.getByPlaceholderText(/ten-minute walk/), {
      target: { value: 'Stretch' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add habit' }))

    await waitFor(() => expect(addHabit).toHaveBeenCalledWith('Stretch', undefined))
    await waitFor(() =>
      expect(sendHealthReaction).toHaveBeenCalledWith(
        { type: 'habit_added', habit: 'Stretch' },
        'en',
        expect.any(Function),
      ),
    )
    expect(await screen.findByText(/Something small to keep/)).toBeInTheDocument()
  })
})

describe('check-in → edit sends checkin_edited', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  const withOne: HealthState = {
    ...STATE,
    checkIns: [
      {
        id: 'c1',
        mood: 3,
        energy: 2,
        note: 'meh',
        createdAt: new Date().toISOString(),
      },
    ],
  }

  it('revising a check-in saves the patch and tells Mira it changed', async () => {
    vi.mocked(updateCheckIn).mockResolvedValue(undefined)
    vi.mocked(sendHealthReaction).mockResolvedValue({
      reply: 'Noted — the revision stands.',
      assistantId: null,
    })
    renderWith(<HealthCheckInPage />, 'en', withOne)

    /* Row controls name their row — "Edit check-in from Today, 10:52 a.m." */
    fireEvent.click(screen.getByRole('button', { name: /Edit check-in/ }))
    /* The entry form's scale renders before the editor's — the last
       'Great' radio on the page is the one inside the row editor. */
    const great = screen.getAllByRole('radio', { name: 'Great' }).at(-1)!
    fireEvent.click(great)
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(updateCheckIn).toHaveBeenCalledWith('c1', { mood: 5, energy: 2, note: 'meh' }),
    )
    await waitFor(() =>
      expect(sendHealthReaction).toHaveBeenCalledWith(
        { type: 'checkin_edited', mood: 5, energy: 2, note: 'meh' },
        'en',
        expect.any(Function),
      ),
    )
    expect(await screen.findByText(/Noted — the revision stands/)).toBeInTheDocument()
  })

  it('cancel closes the editor without a write', async () => {
    renderWith(<HealthCheckInPage />, 'en', withOne)
    fireEvent.click(screen.getByRole('button', { name: /Edit check-in/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(updateCheckIn).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Edit check-in/ })).toBeInTheDocument()
  })
})

describe('home — What Mira remembers', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  const remembered: HealthState = {
    ...STATE,
    memories: [
      {
        id: 'm1',
        text: 'Prefers mornings for anything hard',
        source: 'manual',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'm2',
        text: 'Sundays are family days',
        source: 'mira',
        createdAt: new Date().toISOString(),
      },
    ],
  }

  it('lists memories, labels a Mira-proposed one, adds by hand', async () => {
    vi.mocked(addHealthMemory).mockResolvedValue({
      id: 'm3',
      text: 'Walks help me think',
      source: 'manual',
      createdAt: new Date().toISOString(),
    })
    const { refresh } = renderWith(<HealthHomePage />, 'en', remembered)

    expect(await screen.findByText('Prefers mornings for anything hard')).toBeInTheDocument()
    expect(screen.getByText(/proposed by Mira/)).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/want Mira to remember/), {
      target: { value: 'Walks help me think' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remember this' }))
    await waitFor(() => expect(addHealthMemory).toHaveBeenCalledWith('Walks help me think'))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('remove hides the row behind an undo toast — the delete commits when it lapses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(deleteHealthMemory).mockResolvedValue(undefined)
      renderWith(<HealthHomePage />, 'en', remembered)

      const remove = await screen.findAllByRole('button', { name: /Remove / })
      fireEvent.click(remove[0]!)
      expect(deleteHealthMemory).not.toHaveBeenCalled()
      expect(screen.queryByText('Prefers mornings for anything hard')).not.toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(6400)
      await waitFor(() => expect(deleteHealthMemory).toHaveBeenCalledWith('m1'))
    } finally {
      vi.useRealTimers()
    }
  })

  it('undo brings the memory back before the delete commits', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(deleteHealthMemory).mockResolvedValue(undefined)
      renderWith(<HealthHomePage />, 'en', remembered)

      const remove = await screen.findAllByRole('button', { name: /Remove / })
      fireEvent.click(remove[0]!)
      fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
      expect(screen.getByText('Prefers mornings for anything hard')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(6400)
      expect(deleteHealthMemory).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('edits a memory inline — Enter saves, Escape cancels', async () => {
    const { updateHealthMemory } = await import('@/features/health/data/api')
    vi.mocked(updateHealthMemory).mockResolvedValue(undefined)
    renderWith(<HealthHomePage />, 'en', remembered)

    fireEvent.click((await screen.findAllByRole('button', { name: /Edit / }))[0]!)
    const input = screen.getByLabelText('Edit memory')
    fireEvent.change(input, { target: { value: 'Prefers early calls' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() =>
      expect(updateHealthMemory).toHaveBeenCalledWith('m1', 'Prefers early calls'),
    )
  })

  it('a failed save keeps the text instead of clearing it like a success', async () => {
    vi.mocked(addHealthMemory).mockRejectedValue(new Error('rls'))
    renderWith(<HealthHomePage />, 'en', remembered)

    const input = screen.getByPlaceholderText(/want Mira to remember/)
    fireEvent.change(input, { target: { value: 'Walks help me think' } })
    fireEvent.click(screen.getByRole('button', { name: 'Remember this' }))
    await waitFor(() => expect(addHealthMemory).toHaveBeenCalled())
    /* Success clears the field; failure leaves the draft in place. */
    expect(input).toHaveValue('Walks help me think')
  })
})

describe('review — accepting a proposed memory writes it', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('accept writes health_memories with source mira', async () => {
    const { loadPendingSuggestions, resolveSuggestion } = await import('@/lib/agentQueue')
    vi.mocked(loadPendingSuggestions).mockResolvedValue([
      {
        id: 's1',
        user_id: 'u1',
        surface: 'health',
        kind: 'memory',
        title: 'Walks help me think',
        payload: { text: 'Walks help me think' },
        status: 'pending',
        source: 'model',
        dedupe_key: 'walks help me think',
        resolved_at: null,
        resolved_action: null,
        created_at: new Date().toISOString(),
      } as never,
    ])
    vi.mocked(addHealthMemory).mockResolvedValue({
      id: 'm9',
      text: 'Walks help me think',
      source: 'mira',
      createdAt: new Date().toISOString(),
    })
    vi.mocked(resolveSuggestion).mockResolvedValue(undefined)
    renderWith(<HealthReviewPage />)

    /* The accept button's accessible name carries the row title —
       "Remember it — Walks help me think". */
    fireEvent.click(await screen.findByRole('button', { name: /Remember it/ }))
    await waitFor(() =>
      expect(addHealthMemory).toHaveBeenCalledWith('Walks help me think', 'mira'),
    )
    await waitFor(() => expect(resolveSuggestion).toHaveBeenCalledWith('s1', 'accepted', 'remembered'))
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
      memories: [],
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
      memories: [],
      habitLogs: [],
      lastLoadedAt: new Date().toISOString(),
    }
    renderWith(<HealthHomePage />, 'en', empty)

    /* Empty account renders the first-run subtitle, not the "quiet
       summary" one — that's the render-settled marker. */
    await screen.findByText(/one-minute check-in/i)
    expect(screen.queryByText(/Mira noticed/)).not.toBeInTheDocument()
  })
})
