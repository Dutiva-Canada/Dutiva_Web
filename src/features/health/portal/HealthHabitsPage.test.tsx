import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthHabit, HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { todayDayKey } from '@/features/health/data/healthStats'
import { HealthHabitsPage as Habits } from './HealthHabitsPage'

vi.mock('@/features/health/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/health/data/api')>()),
  addHabit: vi.fn(),
  updateHabit: vi.fn(),
  deleteHabit: vi.fn(),
  setHabitDone: vi.fn(),
  healthAiHabit: vi.fn(),
  sendHealthReaction: vi.fn(),
}))
vi.mock('@/lib/agentQueue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/agentQueue')>()),
  loadPendingSuggestions: vi.fn().mockResolvedValue([]),
  resolveSuggestion: vi.fn(),
}))
vi.mock('@/lib/notifications/notifyPrefs', () => ({
  loadNotifyPref: vi.fn().mockResolvedValue(true),
  setNotifyPref: vi.fn().mockResolvedValue(undefined),
}))

const api = await import('@/features/health/data/api')
const { loadPendingSuggestions, resolveSuggestion } = await import('@/lib/agentQueue')

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

function habit(id: string, name: string): HealthHabit {
  return { id, name, createdAt: new Date().toISOString() }
}

function stateWith(over: Partial<HealthState> = {}): HealthState {
  return {
    checkIns: [],
    entries: [],
    habits: [],
    memories: [],
    habitLogs: [],
    pendingReview: 0,
    lastLoadedAt: new Date().toISOString(),
    ...over,
  }
}

function renderHabits(state: HealthState | undefined) {
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
          <MemoryRouter initialEntries={['/health/habits']}>
            <Habits />
            <ToastHost />
          </MemoryRouter>
        </ToastsProvider>
      </HealthDataContext>
    </LangContext>,
  )
}

describe('HealthHabitsPage', () => {
  afterEach(() => vi.clearAllMocks())

  /* clearAllMocks keeps implementations — reset the queue mock's default
     so a previous test's pending rows can't bleed into this one. */
  beforeEach(() => {
    vi.mocked(loadPendingSuggestions).mockResolvedValue([])
  })

  it('adds a habit and toasts', async () => {
    vi.mocked(api.addHabit).mockResolvedValue(habit('h1', 'Walk'))
    renderHabits(stateWith())
    fireEvent.change(screen.getByLabelText(/New habit/i), { target: { value: 'Walk' } })
    fireEvent.click(screen.getByRole('button', { name: /Add habit/i }))
    await screen.findByText(/Habit added/)
    expect(api.addHabit).toHaveBeenCalledWith('Walk')
  })

  it('rejects a duplicate name instead of writing a twin', async () => {
    renderHabits(stateWith({ habits: [habit('h1', 'Walk')] }))
    fireEvent.change(screen.getByLabelText(/New habit/i), { target: { value: '  walk ' } })
    fireEvent.click(screen.getByRole('button', { name: /Add habit/i }))
    expect(await screen.findByText(/already tracking a habit/)).toBeInTheDocument()
    expect(api.addHabit).not.toHaveBeenCalled()
  })

  it('toggles today and backfills yesterday through the dots', async () => {
    vi.mocked(api.setHabitDone).mockResolvedValue()
    vi.mocked(api.sendHealthReaction).mockResolvedValue({ reply: null } as never)
    renderHabits(stateWith({ habits: [habit('h1', 'Walk')] }))

    fireEvent.click(await screen.findByRole('button', { name: /Mark done — Walk/i }))
    expect(api.setHabitDone).toHaveBeenCalledWith('h1', todayDayKey(), true)

    /* The 7-day dots carry their own day — the second-rightmost is
       yesterday's backfill. */
    const dots = screen.getAllByRole('button', { name: /— not done/ })
    expect(dots.length).toBe(7)
    fireEvent.click(dots[dots.length - 2]!)
    await vi.waitFor(() =>
      expect(api.setHabitDone).toHaveBeenCalledWith('h1', expect.not.stringMatching(todayDayKey()), true),
    )
  })

  it('names the habit and its history in the delete confirm', async () => {
    vi.mocked(api.deleteHabit).mockResolvedValue()
    renderHabits(stateWith({ habits: [habit('h1', 'Walk')] }))

    const del = await screen.findByRole('button', { name: /Delete — Walk/i })
    fireEvent.click(del)
    expect(del).toHaveTextContent(/Delete “Walk” and its history\?/)
    fireEvent.click(del)
    expect(api.deleteHabit).toHaveBeenCalledWith('h1')
  })

  it('renames a habit in place — history survives', async () => {
    vi.mocked(api.updateHabit).mockResolvedValue()
    renderHabits(stateWith({ habits: [habit('h1', 'Wlak')] }))

    fireEvent.click(await screen.findByRole('button', { name: /Rename — Wlak/i }))
    const input = screen.getByRole('textbox', { name: /Rename/ })
    fireEvent.change(input, { target: { value: 'Walk' } })
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }))
    await screen.findByText(/Habit renamed/)
    expect(api.updateHabit).toHaveBeenCalledWith('h1', 'Walk')
  })

  it('reports a failed toggle instead of a dead click', async () => {
    vi.mocked(api.setHabitDone).mockRejectedValue(new Error('rls'))
    renderHabits(stateWith({ habits: [habit('h1', 'Walk')] }))
    fireEvent.click(await screen.findByRole('button', { name: /Mark done — Walk/i }))
    expect(await screen.findByText(/Couldn’t save/)).toBeInTheDocument()
  })

  it('adds a suggested habit and resolves the queue row', async () => {
    vi.mocked(api.addHabit).mockResolvedValue(habit('h2', 'Stretch'))
    vi.mocked(api.sendHealthReaction).mockResolvedValue({ reply: null } as never)
    vi.mocked(loadPendingSuggestions).mockResolvedValue([
      {
        id: 's1',
        kind: 'habit',
        title: 'Stretch',
        payload: { name: 'Stretch', why: 'morning stiffness' },
        status: 'pending',
        created_at: new Date().toISOString(),
      } as never,
    ])
    vi.mocked(resolveSuggestion).mockResolvedValue()
    renderHabits(stateWith())

    const add = await screen.findByRole('button', { name: /Add it — Stretch/i })
    fireEvent.click(add)
    await vi.waitFor(() => expect(api.addHabit).toHaveBeenCalledWith('Stretch'))
    expect(resolveSuggestion).toHaveBeenCalledWith('s1', 'accepted', 'added')
  })

  it('resolves a suggestion naming an existing habit without re-adding it', async () => {
    vi.mocked(loadPendingSuggestions).mockResolvedValue([
      {
        id: 's1',
        kind: 'habit',
        title: 'Walk',
        payload: { name: 'Walk' },
        status: 'pending',
        created_at: new Date().toISOString(),
      } as never,
    ])
    vi.mocked(resolveSuggestion).mockResolvedValue()
    renderHabits(stateWith({ habits: [habit('h1', 'Walk')] }))

    fireEvent.click(await screen.findByRole('button', { name: /Add it — Walk/i }))
    await vi.waitFor(() =>
      expect(resolveSuggestion).toHaveBeenCalledWith('s1', 'accepted', 'already_tracked'),
    )
    expect(api.addHabit).not.toHaveBeenCalled()
    expect(await screen.findByText(/already tracking/)).toBeInTheDocument()
  })

  it('tells the user when the model suggests a habit that already exists', async () => {
    vi.mocked(api.healthAiHabit).mockResolvedValue({ name: 'Walk', why: 'calm', suggestionId: null })
    renderHabits(stateWith({ habits: [habit('h1', 'Walk')] }))

    fireEvent.click(await screen.findByRole('button', { name: /Suggest a habit/i }))
    expect(await screen.findByText(/already tracking that/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add it — Walk/ })).not.toBeInTheDocument()
  })
})
