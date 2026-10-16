import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type { HealthState } from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
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

function renderTools(lang: Lang = 'en', entry = '/wellness/tools') {
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
          <MemoryRouter initialEntries={[entry]}>
            <Routes>
              <Route path="/wellness/tools" element={<Tools />} />
              <Route path="/wellness/chat" element={<div>chat surface</div>} />
            </Routes>
            <ToastHost />
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
    const user = userEvent.setup()
    renderTools()
    await openPractices(user)
    /* Every catalog entry renders its name; spot-check across the tiers. */
    for (const m of healthModalities) {
      expect(await screen.findByText(m.name.en)).toBeInTheDocument()
    }
    expect(screen.getByText('Cognitive behavioral therapy (CBT)')).toBeInTheDocument()
    expect(screen.getByText('EMDR')).toBeInTheDocument()
    /* The two groups carry their own headers — no per-row tag needed. */
    expect(screen.getByText('Mira can guide these')).toBeInTheDocument()
    expect(
      screen.getByText('Clinician-led — she explains, never conducts'),
    ).toBeInTheDocument()
  })

  it('internal accounts get a practice button on guided cards, never on clinician-led ones', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    const user = userEvent.setup()
    renderTools()
    await openPractices(user)
    const practice = screen.getAllByRole('button', { name: /^Practice .+ with Mira$/ })
    expect(practice).toHaveLength(healthModalities.filter((m) => m.guided).length)
    /* "Ask Mira" is safe for every tier — every card carries it, labelled
       with the modality so the names stay distinct to assistive tech. */
    expect(screen.getAllByRole('button', { name: /^Ask Mira about / })).toHaveLength(
      healthModalities.length,
    )
    /* No "internal accounts" note when you're on one. */
    expect(screen.queryByText(/Guided practice is limited/)).not.toBeInTheDocument()
  })

  it('external accounts see the library, the explain button, and the honest gate note', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    const user = userEvent.setup()
    renderTools()
    await openPractices(user)
    expect(screen.queryByRole('button', { name: /^Practice .+ with Mira$/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Ask Mira about / })).toHaveLength(
      healthModalities.length,
    )
    /* The gate is stated once under the section header — not per row. */
    expect(
      screen.getByText(/Guided practice is limited to Dutiva staff accounts/),
    ).toBeInTheDocument()
  })

  it('a practice click seeds the composer draft and lands on the chat surface', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    const user = userEvent.setup()
    renderTools()
    await openPractices(user)
    await user.click(screen.getAllByRole('button', { name: /^Practice .+ with Mira$/ }).at(0)!)
    expect(await screen.findByText('chat surface')).toBeInTheDocument()
    expect(sessionStorage.getItem('dutiva:health-chat:main')).toBe('Walk me through a thought record')
  })

  it('a seed appends to an unsent draft instead of overwriting it', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    sessionStorage.setItem('dutiva:health-chat:main', 'half-typed thought')
    const user = userEvent.setup()
    renderTools()
    await openPractices(user)
    const emdrRow = screen.getByText('EMDR').closest('.hb-row')!
    await user.click(emdrRow.querySelector('button')!)
    expect(await screen.findByText('chat surface')).toBeInTheDocument()
    const draft = sessionStorage.getItem('dutiva:health-chat:main') ?? ''
    expect(draft).toContain('half-typed thought')
    expect(draft).toContain('EMDR')
  })

  it('an explain click on a clinician-led card seeds the composer too', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    const user = userEvent.setup()
    renderTools()
    await openPractices(user)
    const emdrRow = screen.getByText('EMDR').closest('.hb-row')!
    const ask = emdrRow.querySelector('button')!
    await user.click(ask)
    expect(await screen.findByText('chat surface')).toBeInTheDocument()
    expect(sessionStorage.getItem('dutiva:health-chat:main')).toContain('EMDR')
  })

  it('renders the section bilingually', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    const user = userEvent.setup()
    renderTools('fr')
    await user.click(screen.getByRole('tab', { name: 'Pratiques avec Mira' }))
    expect(
      await screen.findByRole('heading', { name: 'Pratiques avec Mira' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Thérapie cognitivo-comportementale (TCC)')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /^Pratiquer .+ avec Mira$/ }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText('Sous guidance clinique — elle explique, sans jamais les pratiquer'),
    ).toBeInTheDocument()
  })
})

const { addJournalEntry } = await import('@/features/health/data/api')

/** The modality library lives behind the second tab — open it. */
async function openPractices(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Practices with Mira' }))
}

describe('HealthToolsPage — tools', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('the footer note links to the Resources page', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    renderTools()
    const link = await screen.findByRole('link', {
      name: 'If you’re struggling, the Resources page lists real people to reach.',
    })
    expect(link).toHaveAttribute('href', '/wellness/resources')
  })

  it('grounding offers a back step once past the first item', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    const user = userEvent.setup()
    renderTools()
    await screen.findByText('Grounding: 5–4–3–2–1')
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('gratitude save failure keeps the note and says so', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    vi.mocked(addJournalEntry).mockRejectedValueOnce(new Error('offline'))
    const user = userEvent.setup()
    renderTools()
    const box = await screen.findByRole('textbox')
    await user.type(box, 'a good thing')
    await user.click(screen.getByRole('button', { name: 'Save to journal' }))
    expect(await screen.findByText(/Couldn’t save/)).toBeInTheDocument()
    expect(box).toHaveValue('a good thing')
  })

  it('gratitude save success carries a journal link and clears the note', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('friend@example.com'))
    vi.mocked(addJournalEntry).mockResolvedValueOnce({ id: 'e1' } as never)
    const user = userEvent.setup()
    renderTools()
    const box = await screen.findByRole('textbox')
    await user.type(box, 'a good thing')
    await user.click(screen.getByRole('button', { name: 'Save to journal' }))
    expect(await screen.findByRole('link', { name: 'View journal' })).toBeInTheDocument()
    expect(box).toHaveValue('')
  })
})

describe('HealthToolsPage — tabs', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.location.hash = ''
  })

  it('defaults to the exercises tab; the library stays unmounted', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    renderTools()
    expect(await screen.findByRole('heading', { name: 'Box breathing' })).toBeInTheDocument()
    expect(screen.queryByText('Cognitive behavioral therapy (CBT)')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Exercises' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Practices with Mira' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('#practices lands on the library tab', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    renderTools('en', '/wellness/tools#practices')
    expect(
      await screen.findByRole('heading', { name: 'Practices with Mira' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Box breathing' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Practices with Mira' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('arrow keys move between tabs and select follows focus', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    const user = userEvent.setup()
    renderTools()
    const exercises = await screen.findByRole('tab', { name: 'Exercises' })
    const practices = screen.getByRole('tab', { name: 'Practices with Mira' })
    await user.click(exercises)
    fireEvent.keyDown(exercises, { key: 'ArrowRight' })
    expect(practices).toHaveFocus()
    expect(practices).toHaveAttribute('aria-selected', 'true')
    expect(
      await screen.findByRole('heading', { name: 'Practices with Mira' }),
    ).toBeInTheDocument()
    fireEvent.keyDown(practices, { key: 'ArrowLeft' })
    expect(exercises).toHaveFocus()
    expect(await screen.findByRole('heading', { name: 'Box breathing' })).toBeInTheDocument()
  })

  it('the chime toggle persists and survives jsdom having no audio stack', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    const user = userEvent.setup()
    renderTools()
    const cues = await screen.findByRole('button', { name: /Chime/ })
    /* Opt-in — nothing sounds or buzzes until the person asks for it. */
    expect(cues).toHaveAttribute('aria-pressed', 'false')
    await user.click(cues)
    expect(cues).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('dutiva:health:breath-cues')).toBe('on')
    await user.click(cues)
    expect(cues).toHaveAttribute('aria-pressed', 'false')
    expect(localStorage.getItem('dutiva:health:breath-cues')).toBe('off')
    /* Start must work with no AudioContext and no vibrate — the tool is
       visual first, cues are the nicety. Asserting "Stop" (not a phase
       label) — the first phase may already have ticked past. */
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeInTheDocument()
    localStorage.removeItem('dutiva:health:breath-cues')
  })

  it('switching back to exercises keeps the exercises cards', async () => {
    vi.mocked(useAuth).mockReturnValue(asAuth('me@dutiva.ca'))
    const user = userEvent.setup()
    renderTools()
    await openPractices(user)
    await user.click(screen.getByRole('tab', { name: 'Exercises' }))
    expect(await screen.findByRole('heading', { name: 'Box breathing' })).toBeInTheDocument()
    expect(screen.queryByText('Cognitive behavioral therapy (CBT)')).not.toBeInTheDocument()
  })
})
