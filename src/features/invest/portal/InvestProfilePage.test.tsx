/**
 * /invest/profile — the "knows you" surface. Renders the declared profile
 * readout + mandate editor, the confirmed-memory list with its add /
 * review / delete controls, the observed-pattern lines, and the pending
 * strip where Tally's memory candidates only become memories on accept.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { InvestDataContext, EMPTY_INVEST_STATE } from '../data/InvestDataContext'
import type { InvestState } from '../data/api'
import type { InvestMemory } from '../data/types'
import { InvestProfilePage } from './InvestProfilePage'

const saveMemory = vi.fn().mockResolvedValue(undefined)
const deleteMemory = vi.fn().mockResolvedValue(undefined)
const reviewMemories = vi.fn().mockResolvedValue({ proposed: 2, suggestionIds: ['a', 'b'] })
const loadPendingSuggestions = vi.fn().mockResolvedValue([])
const loadResolvedSuggestions = vi.fn().mockResolvedValue([])
const resolveSuggestion = vi.fn().mockResolvedValue(undefined)
const upsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/features/app/auth/authContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/features/app/auth/authContext')>()
  return { ...mod, useAuth: vi.fn() }
})
const { useAuth } = await import('@/features/app/auth/authContext')

vi.mock('../data/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../data/api')>()
  return {
    ...mod,
    saveMemory: (...a: unknown[]) => saveMemory(...a),
    deleteMemory: (...a: unknown[]) => deleteMemory(...a),
    reviewMemories: (...a: unknown[]) => reviewMemories(...a),
  }
})
vi.mock('@/lib/agentQueue', () => ({
  loadPendingSuggestions: (...a: unknown[]) => loadPendingSuggestions(...a),
  loadResolvedSuggestions: (...a: unknown[]) => loadResolvedSuggestions(...a),
  resolveSuggestion: (...a: unknown[]) => resolveSuggestion(...a),
}))
/* The profile row read/write — one `from()` chain covers the select and
   the upsert; each spec overrides the row through the mock's data. */
const PROFILE_ROW = {
  risk_tolerance: 'balanced',
  horizon: 'long',
  goal: 'growth',
  experience: null,
  answer_style: null,
  sectors: ['technology'],
  exclusions: [],
  mandate: 'Long-term compounding.',
}
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: PROFILE_ROW }),
        }),
      }),
      upsert: (...a: unknown[]) => upsert(...a),
    }),
  },
}))

const auth: AuthContextValue = {
  status: 'signed-in',
  session: { user: { id: 'u1', email: 'c@example.com' } } as never,
  authorized: null,
  signInWithEmail: vi.fn(),
  verifyEmailCode: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  refreshAuthorization: vi.fn(),
}

function memory(over: Partial<InvestMemory> = {}): InvestMemory {
  return {
    id: 'm1',
    kind: 'fact',
    text: 'Holds ARM for the edge-AI story',
    symbol: 'ARM',
    source: 'tally',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    ...over,
  }
}

function mount(state: Partial<InvestState> = {}) {
  const refresh = vi.fn().mockResolvedValue(undefined)
  render(
    <LangProvider>
      <ToastsProvider>
        <MemoryRouter>
          <InvestDataContext.Provider
            value={{ state: { ...EMPTY_INVEST_STATE, ...state }, loading: false, refresh }}
          >
            <InvestProfilePage />
          </InvestDataContext.Provider>
        </MemoryRouter>
      </ToastsProvider>
    </LangProvider>,
  )
  return { refresh }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(auth)
  loadPendingSuggestions.mockResolvedValue([])
  loadResolvedSuggestions.mockResolvedValue([])
})

describe('InvestProfilePage — declared', () => {
  it('renders the Settings profile as the readout Tally sees', async () => {
    mount()
    await waitFor(() => expect(screen.getByText('How Tally reads you')).toBeInTheDocument())
    expect(screen.getByText('Balanced')).toBeInTheDocument()
    expect(screen.getByText(/10\+ years|Long term/i)).toBeInTheDocument()
    expect(screen.getByText('technology')).toBeInTheDocument()
    /* Unset dims say so rather than hiding. */
    expect(screen.getAllByText('Not set').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Edit in Settings/i })).toHaveAttribute(
      'href',
      '/invest/settings',
    )
  })

  it('loads the mandate into the editor and saves it on the row', async () => {
    const user = userEvent.setup()
    mount()
    const area = await screen.findByLabelText('Your mandate')
    expect(area).toHaveValue('Long-term compounding.')
    await user.clear(area)
    await user.type(area, 'Never sell inside a year.')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(upsert).toHaveBeenCalled())
    /* The upsert writes only the mandate — the rest of the row is
       untouched so a concurrent Settings edit can't be reverted. */
    expect(upsert.mock.calls[0]![0]).toMatchObject({
      user_id: 'u1',
      mandate: 'Never sell inside a year.',
    })
    expect(upsert.mock.calls[0]![0]).not.toHaveProperty('risk_tolerance')
  })
})

describe('InvestProfilePage — memories', () => {
  it('renders confirmed memories with kind pill, symbol, and provenance', () => {
    mount({ memories: [memory()] })
    expect(screen.getByText('Holds ARM for the edge-AI story')).toBeInTheDocument()
    expect(screen.getByText('Fact')).toBeInTheDocument()
    expect(screen.getByText('ARM')).toBeInTheDocument()
    expect(screen.getByText('From chat')).toBeInTheDocument()
  })

  it('shows the empty state and adds a manual memory', async () => {
    const user = userEvent.setup()
    const { refresh } = mount()
    expect(screen.getByText(/No memories yet/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Add a memory/i }))
    const input = screen.getByLabelText(/Something Tally should keep in mind/)
    await user.type(input, 'I trim winners past 40%.')
    const card = input.closest('.sb-card') as HTMLElement
    await user.click(within(card).getByRole('button', { name: /^Remember it$/i }))
    await waitFor(() => expect(saveMemory).toHaveBeenCalled())
    expect(saveMemory.mock.calls[0]![0]).toMatchObject({
      kind: 'fact',
      source: 'manual',
      text: 'I trim winners past 40%.',
    })
    expect(refresh).toHaveBeenCalled()
  })

  it('deletes a memory behind the two-tap confirm', async () => {
    const user = userEvent.setup()
    const { refresh } = mount({ memories: [memory()] })
    await user.click(screen.getByRole('button', { name: /Delete/i }))
    expect(deleteMemory).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Delete/i }))
    await waitFor(() => expect(deleteMemory).toHaveBeenCalledWith('m1'))
    expect(refresh).toHaveBeenCalled()
  })

  it('asks Tally to review and reports how many candidates were filed', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: /Ask Tally to review/i }))
    await waitFor(() => expect(reviewMemories).toHaveBeenCalledWith({ lang: 'en' }))
    /* The pass files suggestions — the pending strip's loader re-runs so
       the fresh candidates surface for review. */
    expect(loadPendingSuggestions).toHaveBeenCalledTimes(2)
  })
})

describe('InvestProfilePage — pending + observed', () => {
  const pendingMemory = {
    id: 'sug-m1',
    user_id: 'u1',
    surface: 'invest',
    kind: 'memory',
    title: 'plans to hold ARM through the edge-AI cycle',
    payload: { kind: 'plan', symbol: 'ARM', text: 'plans to hold ARM through the edge-AI cycle' },
    source: 'rule',
    dedupe_key: 'memory:plan-arm',
    status: 'pending',
    resolved_at: null,
    resolved_action: null,
    created_at: '2026-02-01T00:00:00Z',
  }

  it('turns a Tally memory candidate into a memory only on accept', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([pendingMemory])
    const { refresh } = mount()
    const title = await screen.findByText(/plans to hold ARM/)
    const row = title.closest('.sb-notify-row') as HTMLElement
    expect(saveMemory).not.toHaveBeenCalled()
    await user.click(within(row).getByRole('button', { name: /Remember it/i }))
    await waitFor(() => expect(saveMemory).toHaveBeenCalled())
    /* Provenance is 'tally' — the candidate was hers, the accept was yours. */
    expect(saveMemory.mock.calls[0]![0]).toMatchObject({ source: 'tally', kind: 'plan' })
    expect(resolveSuggestion).toHaveBeenCalledWith('sug-m1', 'accepted', 'added')
    expect(refresh).toHaveBeenCalled()
  })

  it('resolves a profile nudge as opened without writing anything', async () => {
    const user = userEvent.setup()
    loadPendingSuggestions.mockResolvedValue([
      { ...pendingMemory, id: 'sug-p1', kind: 'profile', payload: { section: 'mandate' } },
    ])
    mount()
    await waitFor(() => expect(screen.getByText(/plans to hold ARM/)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Open profile/i }))
    await waitFor(() =>
      expect(resolveSuggestion).toHaveBeenCalledWith('sug-p1', 'accepted', 'opened'),
    )
    expect(saveMemory).not.toHaveBeenCalled()
  })

  it('reads outcomes back as pattern lines, not judgments', async () => {
    loadResolvedSuggestions.mockResolvedValue([
      { id: 'r1', kind: 'goal', status: 'accepted' },
      { id: 'r2', kind: 'goal', status: 'dismissed' },
      { id: 'r3', kind: 'thesis', status: 'dismissed' },
    ])
    mount({ memories: [memory()] })
    await waitFor(() => expect(screen.getByText(/act on 33%/)).toBeInTheDocument())
    expect(screen.getByText(/Tally remembers 1 fact/)).toBeInTheDocument()
  })
})
