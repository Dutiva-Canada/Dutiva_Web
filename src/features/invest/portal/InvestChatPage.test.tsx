import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangContext } from '@/i18n/context'
import type { LangContextValue } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { InvestDataContext } from '@/features/invest/data/InvestDataContext'
import { EMPTY_INVEST_STATE } from '@/features/invest/data/InvestDataContext'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import {
  clearInvestChat,
  loadInvestChatHistory,
  rateInvestChatTurn,
  sendInvestChat,
  undoInvestChatAction,
} from '@/features/invest/data/chatApi'
import { InvestChatPage } from './InvestChatPage'

/* The page never reads the table directly — history, sending, undo and
   clearing all go through the invest-ai function, so the api module is
   the seam. */
vi.mock('@/features/invest/data/chatApi', () => ({
  sendInvestChat: vi.fn(),
  loadInvestChatHistory: vi.fn(),
  clearInvestChat: vi.fn(),
  rateInvestChatTurn: vi.fn(),
  undoInvestChatAction: vi.fn(),
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
        <InvestDataContext
          value={{ state: EMPTY_INVEST_STATE, loading: false, refresh }}
        >
          <ToastsProvider>
            <MemoryRouter initialEntries={['/invest/chat']}>
              <InvestChatPage />
            </MemoryRouter>
          </ToastsProvider>
        </InvestDataContext>
      </AuthContext.Provider>
    </LangContext>,
  )
  return { refresh }
}

const ASSISTANT_ID = 'a1b2c3d4-0000-4000-8000-000000000001'

describe('InvestChatPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('greets on an empty conversation — Tally speaks first', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/Hi — I’m Tally/)).toBeInTheDocument()
    expect(screen.getByText(/What should the book record today\?/)).toBeInTheDocument()
  })

  it('shows the generic subtitle to external accounts and the internal one to @dutiva.ca', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([])
    const { unmount } = render(
      <LangContext value={langValue('en')}>
        <AuthContext.Provider
          value={{
            status: 'signed-in',
            session: { user: { id: 'u1', email: 'client@acme.ca' } } as AuthContextValue['session'],
            authorized: true,
            signInWithEmail: vi.fn(async () => undefined),
            verifyEmailCode: vi.fn(async () => undefined),
            signOut: vi.fn(async () => {}),
            refreshAuthorization: vi.fn(async () => {}),
          }}
        >
          <InvestDataContext
            value={{ state: EMPTY_INVEST_STATE, loading: false, refresh: vi.fn() }}
          >
            <ToastsProvider>
              <MemoryRouter initialEntries={['/invest/chat']}>
                <InvestChatPage />
              </MemoryRouter>
            </ToastsProvider>
          </InvestDataContext>
        </AuthContext.Provider>
      </LangContext>,
    )
    expect(await screen.findByText(/never investment advice/)).toBeInTheDocument()
    expect(screen.queryByText(/Internal staff account/)).not.toBeInTheDocument()
    unmount()

    renderPage('en', {
      session: { user: { id: 'u9', email: 'martin@dutiva.ca' } } as AuthContextValue['session'],
    })
    expect(await screen.findByText(/Internal staff account: she also advises/)).toBeInTheDocument()
    expect(screen.queryByText(/never investment advice/)).not.toBeInTheDocument()
  })

  it('sends a message, renders the reply, and confirms the executed action', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([])
    vi.mocked(sendInvestChat).mockResolvedValue({
      reply: 'Queued a draft order for review.',
      action: { type: 'create_order', detail: 'buy 5 XEQT', ok: true, refId: 'o1' },
      assistantId: ASSISTANT_ID,
    })
    const { refresh } = renderPage()
    await screen.findByPlaceholderText(/Ask Tally/)

    fireEvent.change(screen.getByPlaceholderText(/Ask Tally/), {
      target: { value: 'queue a buy of 5 XEQT' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(sendInvestChat).toHaveBeenCalledWith(
        'queue a buy of 5 XEQT',
        'en',
        expect.any(Function),
      ),
    )
    expect(await screen.findByText('Queued a draft order for review.')).toBeInTheDocument()
    expect(screen.getByText('Draft order queued — buy 5 XEQT')).toBeInTheDocument()
    /* A completed action writes to the invest_* tables — the shared provider
       must refresh so Orders/Signals/Watchlist reflect it. */
    expect(refresh).toHaveBeenCalled()
  })

  it('renders stored history including a stored action', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'watch XEQT',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'Watching it.',
        action: { type: 'add_watch_symbol', detail: 'XEQT', ok: true },
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    renderPage()

    expect(await screen.findByText('watch XEQT')).toBeInTheDocument()
    expect(screen.getByText('Watching it.')).toBeInTheDocument()
    expect(screen.getByText('Now watching “XEQT”')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear conversation' })).toBeInTheDocument()
  })

  it('offers undo on a successful action chip and marks it undone', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'Queued.',
        action: { type: 'create_order', detail: 'buy 5 XEQT', ok: true, refId: 'o1' },
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(undoInvestChatAction).mockResolvedValue(undefined)
    const { refresh } = renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(undoInvestChatAction).toHaveBeenCalledWith(ASSISTANT_ID))
    expect(await screen.findByText('Undone')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(refresh).toHaveBeenCalled()
  })

  it('toggles a thumbs rating on an assistant turn', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([
      {
        id: ASSISTANT_ID,
        role: 'assistant',
        content: 'On the books.',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:01Z',
      },
    ])
    vi.mocked(rateInvestChatTurn).mockResolvedValue(undefined)
    renderPage()

    const up = await screen.findByRole('button', { name: 'Helpful' })
    expect(up).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(up)
    await waitFor(() => expect(rateInvestChatTurn).toHaveBeenCalledWith(ASSISTANT_ID, 1))
    expect(up).toHaveAttribute('aria-pressed', 'true')
  })

  it('clears the conversation via the function', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([
      {
        id: 'u1',
        role: 'user',
        content: 'hi',
        action: null,
        feedback: null,
        createdAt: '2026-10-05T12:00:00Z',
      },
    ])
    vi.mocked(clearInvestChat).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('hi')

    fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }))
    await waitFor(() => expect(clearInvestChat).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('hi')).not.toBeInTheDocument())
  })

  it('renders the French chrome and greeting under lang fr', async () => {
    vi.mocked(loadInvestChatHistory).mockResolvedValue([])
    renderPage('fr')

    expect(await screen.findByText(/Bonjour — je suis Tally/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })
})
