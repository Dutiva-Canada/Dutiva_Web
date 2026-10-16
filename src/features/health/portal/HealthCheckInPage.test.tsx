import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthCheckIn, HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { HealthCheckInPage as CheckIn } from './HealthCheckInPage'

vi.mock('@/features/health/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/health/data/api')>()),
  addCheckIn: vi.fn(),
  updateCheckIn: vi.fn(),
  deleteCheckIn: vi.fn(),
  sendHealthReaction: vi.fn(),
}))

const { addCheckIn, deleteCheckIn, sendHealthReaction } = await import(
  '@/features/health/data/api'
)

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

function ci(id: string, mood: number, daysAgo = 0): HealthCheckIn {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return { id, mood, energy: null, note: '', createdAt: d.toISOString() }
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

function renderCheckIn(state: HealthState | undefined, loading = false, refresh = vi.fn().mockResolvedValue(undefined)) {
  const health: HealthDataContextValue = { state, loading, error: undefined, refresh }
  const view = render(
    <LangContext value={langValue('en')}>
      <HealthDataContext value={health}>
        <ToastsProvider>
          <MemoryRouter initialEntries={['/wellness/check-in']}>
            <CheckIn />
            <ToastHost />
          </MemoryRouter>
        </ToastsProvider>
      </HealthDataContext>
    </LangContext>,
  )
  return { refresh, unmount: () => view.unmount() }
}

describe('HealthCheckInPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.useRealTimers()
  })

  it('shows the error state with retry when the first load produced nothing', async () => {
    const { refresh } = renderCheckIn(undefined)
    expect(await screen.findByText(/Couldn’t load your data/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }))
    expect(refresh).toHaveBeenCalled()
  })

  it('saves a check-in, clears the fields, toasts, and lets Mira react', async () => {
    vi.mocked(addCheckIn).mockResolvedValue({ id: 'new1' } as never)
    vi.mocked(sendHealthReaction).mockResolvedValue({ reply: 'Noted.' } as never)
    renderCheckIn(stateWith())

    fireEvent.click(screen.getByRole('radio', { name: /Good/ }))
    fireEvent.click(screen.getByRole('button', { name: /Save check-in/i }))

    await screen.findByText(/Check-in saved/)
    expect(addCheckIn).toHaveBeenCalledWith({ mood: 4, energy: null, note: '' })
    expect(screen.getByRole('radio', { name: /Good/ })).toHaveAttribute('aria-checked', 'false')
    /* The reaction lands inline (announced by role="status") and dismisses. */
    expect(await screen.findByText(/Noted\./)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Noted.')).not.toBeInTheDocument()
  })

  it('reports a failed save instead of silently clearing', async () => {
    vi.mocked(addCheckIn).mockRejectedValue(new Error('offline'))
    renderCheckIn(stateWith())

    fireEvent.click(screen.getByRole('radio', { name: /Good/ }))
    fireEvent.click(screen.getByRole('button', { name: /Save check-in/i }))

    expect(await screen.findByText(/Couldn’t save the check-in/)).toBeInTheDocument()
    /* The picked mood stays — nothing was saved, nothing was discarded. */
    expect(screen.getByRole('radio', { name: /Good/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('moves radio selection with arrow keys (roving tabindex)', () => {
    renderCheckIn(stateWith())
    const okay = screen.getByRole('radio', { name: /Okay/ })
    fireEvent.click(okay)
    expect(okay).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(okay, { key: 'ArrowRight' })
    const good = screen.getByRole('radio', { name: /Good/ })
    expect(good).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(good, { key: 'Home' })
    expect(screen.getByRole('radio', { name: /Rough/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('hides the row behind an undo toast and commits when it lapses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(deleteCheckIn).mockResolvedValue()
    renderCheckIn(stateWith({ checkIns: [ci('c1', 4)] }))

    fireEvent.click(await screen.findByRole('button', { name: /Delete check-in from/i }))
    expect(
      screen.queryByRole('button', { name: /Delete check-in from/i }),
    ).not.toBeInTheDocument()
    expect(deleteCheckIn).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(6400)
    await vi.waitFor(() => expect(deleteCheckIn).toHaveBeenCalledWith('c1'))
  })

  it('undo keeps the row — the delete never fires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderCheckIn(stateWith({ checkIns: [ci('c1', 4)] }))

    fireEvent.click(await screen.findByRole('button', { name: /Delete check-in from/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('button', { name: /Delete check-in from/i })).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(6400)
    expect(deleteCheckIn).not.toHaveBeenCalled()
  })

  it('a failed commit brings the row back and says so', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(deleteCheckIn).mockRejectedValue(new Error('rls'))
    renderCheckIn(stateWith({ checkIns: [ci('c1', 4)] }))

    fireEvent.click(await screen.findByRole('button', { name: /Delete check-in from/i }))
    await vi.advanceTimersByTimeAsync(6400)
    expect(await screen.findByText(/Couldn’t delete/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete check-in from/i })).toBeInTheDocument()
  })

  it('keeps the note draft across a remount and clears it on save', async () => {
    vi.mocked(addCheckIn).mockResolvedValue({ id: 'n1' } as never)
    vi.mocked(sendHealthReaction).mockResolvedValue({ reply: null } as never)
    const view = renderCheckIn(stateWith())
    fireEvent.change(await screen.findByLabelText(/on your mind/i), { target: { value: 'long day' } })
    view.unmount() /* remounts below re-read the stored draft */

    renderCheckIn(stateWith())
    expect(await screen.findByLabelText(/on your mind/i)).toHaveValue('long day')
    fireEvent.click(screen.getByRole('radio', { name: /Good/ }))
    fireEvent.click(screen.getByRole('button', { name: /Save check-in/i }))
    await screen.findByText(/Check-in saved/)
    expect(screen.getByLabelText(/on your mind/i)).toHaveValue('')
  })

  it('flags when today is already logged', () => {
    renderCheckIn(stateWith({ checkIns: [ci('c1', 4)] }))
    expect(screen.getByText(/Already logged today/)).toBeInTheDocument()
  })
})
