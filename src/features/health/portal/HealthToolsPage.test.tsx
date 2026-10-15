import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { healthModalities } from '@/features/health/data/healthModalities'
import { HealthToolsPage as Tools } from './HealthToolsPage'

/* useAuth is mocked per-test to drive the internal/external tier on the
   practice buttons; the api seam is stubbed for the gratitude save path. */
vi.mock('@/features/app/auth/authContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/features/app/auth/authContext')>()
  return { ...mod, useAuth: vi.fn() }
})
vi.mock('@/features/health/data/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/health/data/api')>()),
  addJournalEntry: vi.fn(),
}))

const { useAuth } = await import('@/features/app/auth/authContext')

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

function asAuth(email: string | null): AuthContextValue {
  return {
    status: email ? 'signed-in' : 'signed-out',
    session: email ? ({ user: { id: 'u1', email } } as never) : null,
    authorized: null,
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    verifyEmailCode: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshAuthorization: vi.fn().mockResolvedValue(undefined),
  }
}

const STATE: HealthState = {
  checkIns: [],
  entries: [],
  habits: [],
  memories: [],
  habitLogs: [],
  lastLoadedAt: new Date().toISOString(),
}

function renderTools(lang: Lang = 'en') {
  const health: HealthDataContextValue = {
    state: STATE,
    loading: false,
    error: undefined,
    refresh: vi.fn().mockResolvedValue(undefined),
  }
  render(
    <LangContext value={langValue(lang)}>
      <HealthDataContext value={health}>
        <ToastsProvider>
          <MemoryRouter initialEntries={['/health/tools']}>
            <Routes>
              <Route path="/health/tools" element={<Tools />} />
              <Route path="/health/chat" element={<div>chat surface</div>} />
            </Routes>
          </MemoryRouter>
        </ToastsProvider>
      </HealthDataContext>
    </LangContext>,
  )
}

describe('HealthToolsPage — Practices with Mira', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('lists every modality in the catalog, both tiers marked', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    renderTools()
    /* Every catalog entry renders its name; spot-check across the tiers. */
    for (const m of healthModalities) {
      expect(await screen.findByText(m.name.en)).toBeInTheDocument()
    }
    expect(screen.getByText('Cognitive behavioral therapy (CBT)')).toBeInTheDocument()
    expect(screen.getByText('EMDR')).toBeInTheDocument()
    /* Exactly the clinician-led cards carry the tag. */
    const tags = screen.getAllByText('Clinician-led')
    expect(tags).toHaveLength(healthModalities.filter((m) => !m.guided).length)
  })

  it('internal accounts get a practice button on guided cards, never on clinician-led ones', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    renderTools()
    await screen.findByText('Practices with Mira')
    const practice = screen.getAllByRole('button', { name: 'Practice with Mira' })
    expect(practice).toHaveLength(healthModalities.filter((m) => m.guided).length)
    /* "Ask Mira" is safe for every tier — every card carries it. */
    expect(screen.getAllByRole('button', { name: 'Ask Mira' })).toHaveLength(healthModalities.length)
    /* No "internal accounts" note when you're on one. */
    expect(screen.queryByText(/Guided practice is on internal/)).not.toBeInTheDocument()
  })

  it('external accounts see the library, the explain button, and the honest gate note', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    renderTools()
    await screen.findByText('Practices with Mira')
    expect(screen.queryByRole('button', { name: 'Practice with Mira' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Ask Mira' })).toHaveLength(healthModalities.length)
    /* The gate is stated, not silently missing — one note per guided card. */
    const notes = screen.getAllByText('Guided practice is on internal staff accounts.')
    expect(notes).toHaveLength(healthModalities.filter((m) => m.guided).length)
  })

  it('a practice click seeds the composer draft and lands on the chat surface', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    const user = userEvent.setup()
    renderTools()
    await screen.findByText('Practices with Mira')
    await user.click(screen.getAllByRole('button', { name: 'Practice with Mira' })[0]!)
    expect(await screen.findByText('chat surface')).toBeInTheDocument()
    expect(sessionStorage.getItem('dutiva:health-chat:main')).toBe('Walk me through a thought record')
  })

  it('an explain click on a clinician-led card seeds the composer too', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    const user = userEvent.setup()
    renderTools()
    await screen.findByText('EMDR')
    const emdrRow = screen.getByText('EMDR').closest('.hb-row')!
    const ask = emdrRow.querySelector('button')!
    await user.click(ask)
    expect(await screen.findByText('chat surface')).toBeInTheDocument()
    expect(sessionStorage.getItem('dutiva:health-chat:main')).toContain('EMDR')
  })

  it('renders the section bilingually', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    renderTools('fr')
    expect(await screen.findByText('Pratiques avec Mira')).toBeInTheDocument()
    expect(screen.getByText('Thérapie cognitivo-comportementale (TCC)')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Pratiquer avec Mira' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sous guidance clinique')).toHaveLength(
      healthModalities.filter((m) => !m.guided).length,
    )
  })
})
