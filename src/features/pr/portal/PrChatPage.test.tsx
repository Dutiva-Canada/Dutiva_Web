import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { PrDataContext } from '@/features/pr/data/PrDataContext'
import type { PrDataContextValue } from '@/features/pr/data/PrDataContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import {
  clearPrChat,
  loadPrChatHistory,
  ratePrChatTurn,
  sendPrChat,
  undoPrChatAction,
} from '@/features/pr/data/chatApi'
import { PrChatPage } from './PrChatPage'

/* The page never reads the table directly — history, sending, undo and
   clearing all go through the pr-ai function, so the api module is the
   seam to mock. */
vi.mock('@/features/pr/data/chatApi', () => ({
  sendPrChat: vi.fn(),
  loadPrChatHistory: vi.fn(),
  clearPrChat: vi.fn(),
  ratePrChatTurn: vi.fn(),
  undoPrChatAction: vi.fn(),
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

function renderPage(lang: Lang = 'en', auth: Partial<AuthContextValue> = {}) {
  const refresh = vi.fn().mockResolvedValue(undefined)
  const pr: PrDataContextValue = {
    state: undefined,
    loading: false,
    error: undefined,
    refresh,
  }
  const authValue: AuthContextValue = {
    status: 'signed-in',
    session: { user: { id: 'u1', email: 'client@acme.ca' } } as AuthContextValue['session'],
    authorized: true,
    signInWithEmail: vi.fn(async () => undefined),
    verifyEmailCode: vi.fn(async () => undefined),
    signOut: vi.fn(async () => {}),
    refreshAuthorization: vi.fn(async () => {}),
    ...auth,
  }
  render(
    <LangContext value={langValue(lang)}>
      <AuthContext.Provider value={authValue}>
        <PrDataContext value={pr}>
          <ToastsProvider>
            <MemoryRouter initialEntries={['/pr/chat']}>
              <PrChatPage />
            </MemoryRouter>
          </ToastsProvider>
        </PrDataContext>
      </AuthContext.Provider>
    </LangContext>,
  )
  return { refresh }
}

const ASSISTANT_ID = 'a1b2c3d4-0000-4000-8000-000000000001'

describe('PrChatPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('greets on an empty conversation — Paige speaks first', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/Hi — I’m Paige/)).toBeInTheDocument()
    expect(screen.getByText(/What are we working on today\?/)).toBeInTheDocument()
  })

  it('swaps the subtitle and shows the Internal badge for @dutiva.ca', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    renderPage('en', {
      session: { user: { id: 'u9', email: 'staff@dutiva.ca' } } as AuthContextValue['session'],
    })
    expect(await screen.findByText(/Internal staff account: she also advises/)).toBeInTheDocument()
    expect(screen.getByText('Internal')).toBeInTheDocument()
  })

  it('sends a message, renders the reply, and confirms the executed action', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    vi.mocked(sendPrChat).mockResolvedValue({
      reply: 'Draft filed.',
      action: { type: 'add_media_contact', detail: 'Jo at CBC', ok: true, refId: 'c1' },
      assistantId: ASSISTANT_ID,
    })
    const { refresh } = renderPage()
    await screen.findByPlaceholderText(/Ask Paige/)

    fireEvent.change(screen.getByPlaceholderText(/Ask Paige/), {
      target: { value: 'add Jo at CBC to my contacts' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(sendPrChat).toHaveBeenCalledWith(
        'add Jo at CBC to my contacts',
        'en',
        expect.any(Function),
      ),
    )
    expect(await screen.findByText('Draft filed.')).toBeInTheDocument()
    expect(screen.getByText('Contact “Jo at CBC” added')).toBeInTheDocument()
    /* A completed action writes to the pr_* tables — the shared provider
       must refresh so the other tabs reflect it. */
    expect(refresh).toHaveBeenCalled()
  })

  it('renders stored history including a stored action', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'track the keyword hr compliance',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'Tracking it now.',
        action: { type: 'add_keyword', detail: 'hr compliance', ok: true, refId: 'k1' },
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()

    expect(await screen.findByText('track the keyword hr compliance')).toBeInTheDocument()
    expect(screen.getByText('Tracking it now.')).toBeInTheDocument()
    expect(screen.getByText('Now tracking “hr compliance”')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear conversation' })).toBeInTheDocument()
  })

  it('offers undo on a successful action chip and marks it undone', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'Tracking it now.',
        action: { type: 'add_keyword', detail: 'hr compliance', ok: true, refId: 'k1' },
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(undoPrChatAction).mockResolvedValue(undefined)
    const { refresh } = renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(undoPrChatAction).toHaveBeenCalledWith(ASSISTANT_ID))
    expect(await screen.findByText('Undone')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(refresh).toHaveBeenCalled()
  })

  it('toggles a thumbs rating on an assistant turn', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'On it.',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(ratePrChatTurn).mockResolvedValue(undefined)
    renderPage()

    const up = await screen.findByRole('button', { name: 'Helpful' })
    expect(up).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(up)
    await waitFor(() => expect(ratePrChatTurn).toHaveBeenCalledWith(ASSISTANT_ID, 1))
    expect(up).toHaveAttribute('aria-pressed', 'true')
  })

  it('clears the conversation via the function', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'hi',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(clearPrChat).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('hi')

    fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }))
    await waitFor(() => expect(clearPrChat).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('hi')).not.toBeInTheDocument())
  })

  it('renders the French chrome and greeting under lang fr', async () => {
    vi.mocked(loadPrChatHistory).mockResolvedValue([])
    renderPage('fr')

    expect(await screen.findByText(/Bonjour — je suis Paige/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })
})
