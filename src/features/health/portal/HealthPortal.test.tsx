import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import type { HealthHabit, HealthHabitLog, HealthState } from '@/features/health/data/types'
import {
  avgMood,
  checkInStreak,
  dailyMoods,
  habitStreak,
  habitsDoneToday,
  hasCheckInToday,
  moodRange,
  recentDayKeys,
} from '@/features/health/data/healthStats'

/* useAuth is mocked per-test to drive the signed-out / no-access / granted
   gates; the real AuthContext stays so AuthProvider still mounts. */
vi.mock('@/features/app/auth/authContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/features/app/auth/authContext')>()
  return { ...mod, useAuth: vi.fn() }
})

vi.mock('@/features/health/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/health/data/api')>()),
  hasHealthAccess: vi.fn(),
  loadHealthState: vi.fn(),
  addCheckIn: vi.fn(),
  deleteCheckIn: vi.fn(),
  addJournalEntry: vi.fn(),
  updateJournalEntry: vi.fn(),
  deleteJournalEntry: vi.fn(),
  addHabit: vi.fn(),
  deleteHabit: vi.fn(),
  setHabitDone: vi.fn(),
  healthAiPrompt: vi.fn(),
  healthAiRecap: vi.fn(),
}))

vi.mock('@/lib/notifications/notifyPrefs', () => ({
  loadNotifyPref: vi.fn().mockResolvedValue(true),
  setNotifyPref: vi.fn().mockResolvedValue(undefined),
}))

const { useAuth } = await import('@/features/app/auth/authContext')
const { hasHealthAccess, loadHealthState } = await import('@/features/health/data/api')

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

const STATE: HealthState = {
  checkIns: [
    {
      id: 'c1',
      mood: 4,
      energy: 3,
      note: 'Walked at lunch.',
      createdAt: new Date().toISOString(),
    },
  ],
  entries: [
    {
      id: 'j1',
      title: 'First entry',
      body: 'A quiet Saturday.',
      createdAt: '2026-10-03T14:00:00Z',
      updatedAt: '2026-10-03T14:00:00Z',
    },
  ],
  habits: [],
  habitLogs: [],
  lastLoadedAt: new Date().toISOString(),
}

function renderPortal(ui: ReactElement, route = '/health') {
  return render(
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ToastsProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path="/health" element={ui}>
                  <Route index element={<div>home</div>} />
                </Route>
                <Route path="/health/check-in" element={ui} />
                <Route path="/health/journal" element={ui} />
                <Route path="/health/insights" element={ui} />
                <Route path="/health/resources" element={ui} />
              </Routes>
            </MemoryRouter>
          </ToastsProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('HealthPortalLayout', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the sign-in panel and crisis note when signed out', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-out'))
    const { HealthPortalLayout } = await import('./HealthPortalLayout')
    renderPortal(<HealthPortalLayout />)

    expect(await screen.findByText('Sign in to Dutiva Health')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByText(/9-8-8/)).toBeInTheDocument()
  })

  it('shows the access-required card for a signed-in user without a grant', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(hasHealthAccess).mockResolvedValue(false)
    const { HealthPortalLayout } = await import('./HealthPortalLayout')
    renderPortal(<HealthPortalLayout />)

    expect(await screen.findByText('Access required')).toBeInTheDocument()
    expect(loadHealthState).not.toHaveBeenCalled()
  })

  it('renders the shell + provider for a user with a grant', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(hasHealthAccess).mockResolvedValue(true)
    vi.mocked(loadHealthState).mockResolvedValue(STATE)
    const { HealthPortalLayout } = await import('./HealthPortalLayout')
    renderPortal(<HealthPortalLayout />)

    // The nav tabs render as soon as the grant resolves.
    await screen.findByText('home')
    expect(screen.getByText('Check-in')).toBeTruthy()
    expect(loadHealthState).toHaveBeenCalled()
  })
})

describe('HealthResourcesPage', () => {
  it('lists real crisis services first', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('signed-in'))
    vi.mocked(hasHealthAccess).mockResolvedValue(true)
    vi.mocked(loadHealthState).mockResolvedValue(STATE)
    const { HealthResourcesPage } = await import('./HealthResourcesPage')
    renderPortal(<HealthResourcesPage />, '/health/resources')

    expect(await screen.findByText('9-8-8: Suicide Crisis Helpline')).toBeInTheDocument()
    expect(screen.getByText('911 — immediate danger')).toBeInTheDocument()
    expect(screen.getByText(/Kids Help Phone/)).toBeInTheDocument()
  })
})

describe('healthStats', () => {
  const at = (h: number, dayOffset = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - dayOffset)
    d.setHours(h, 0, 0, 0)
    return d.toISOString()
  }
  const ci = (mood: number, dayOffset: number) => ({
    id: `c${dayOffset}-${mood}`,
    mood,
    energy: null,
    note: '',
    createdAt: at(12, dayOffset),
  })

  it('counts a streak of consecutive days ending today', () => {
    const streak = checkInStreak([ci(4, 0), ci(3, 1), ci(5, 2)])
    expect(streak).toBe(3)
    // A gap breaks the streak.
    expect(checkInStreak([ci(4, 0), ci(5, 2)])).toBe(1)
    // Yesterday's check-in still counts as a live streak.
    expect(checkInStreak([ci(4, 1), ci(3, 2)])).toBe(2)
    expect(checkInStreak([])).toBe(0)
  })

  it('detects whether today has a check-in', () => {
    expect(hasCheckInToday([ci(4, 0)])).toBe(true)
    expect(hasCheckInToday([ci(4, 1)])).toBe(false)
  })

  it('averages mood over a bounded window', () => {
    const avg = avgMood([ci(4, 0), ci(2, 1)], 7)
    expect(avg).toBe(3)
    expect(avgMood([], 7)).toBeNull()
  })

  it('produces one slot per day, null where no check-in exists', () => {
    const days = dailyMoods([ci(4, 0)], 3)
    expect(days).toHaveLength(3)
    expect(days[2]?.mood).toBe(4)
    expect(days[0]?.mood).toBeNull()
  })

  it('finds best and toughest days', () => {
    const { best, toughest } = moodRange([ci(5, 0), ci(1, 1)], 7)
    expect(best?.mood).toBe(5)
    expect(toughest?.mood).toBe(1)
    expect(moodRange([], 7).best).toBeNull()
  })

  /* Habits — done-days are stored as local YYYY-MM-DD keys. */
  const dayKey = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const log = (habitId: string, offset: number): HealthHabitLog => ({
    id: `l-${habitId}-${offset}`,
    habitId,
    day: dayKey(offset),
    createdAt: at(12, offset),
  })
  const habit = (id: string): HealthHabit => ({
    id,
    name: `Habit ${id}`,
    createdAt: at(9, 30),
  })

  it('tracks a habit streak with the same leniency as check-ins', () => {
    const logs = [log('h1', 0), log('h1', 1), log('h1', 2)]
    expect(habitStreak(logs, 'h1')).toBe(3)
    expect(habitStreak([log('h1', 1), log('h1', 2)], 'h1')).toBe(2)
    expect(habitStreak([log('h1', 0), log('h1', 2)], 'h1')).toBe(1)
    expect(habitStreak([], 'h1')).toBe(0)
    /* A different habit's days never bleed into the count. */
    expect(habitStreak([log('h2', 0), log('h2', 1)], 'h1')).toBe(0)
  })

  it('counts habits done today out of the total', () => {
    const logs = [log('h1', 0), log('h2', 1)]
    const habits = [habit('h1'), habit('h2'), habit('h3')]
    expect(habitsDoneToday(logs, habits)).toEqual({ done: 1, total: 3 })
    expect(habitsDoneToday([], habits)).toEqual({ done: 0, total: 3 })
    expect(habitsDoneToday([], [])).toEqual({ done: 0, total: 0 })
  })

  it('builds the last-N day keys oldest first', () => {
    const keys = recentDayKeys(3)
    expect(keys).toHaveLength(3)
    expect(keys[2]).toBe(dayKey(0))
    expect(keys[0]).toBe(dayKey(2))
  })
})
